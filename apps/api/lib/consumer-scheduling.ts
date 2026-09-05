import { db } from "@marka/db";
import { ConflictError, NotFoundError, ValidationError } from "@marka/shared";
import { assertNoConflict, BLOCKING_STATUSES } from "@/lib/appointments";
import {
  combineDateTime,
  formatTimeHHMM,
  PUBLIC_ESTABLISHMENT_STATUSES,
} from "@/lib/consumer";

// Re-export blocking list for slots query — appointments.ts keeps the source of truth.
export { BLOCKING_STATUSES };

const SLOT_STEP_MINUTES = 30;

export async function requirePublicEstablishment(idOrSlug: {
  id?: string;
  slug?: string;
}) {
  const where = idOrSlug.id
    ? { id: idOrSlug.id }
    : idOrSlug.slug
      ? { slug: idOrSlug.slug }
      : null;
  if (!where) throw new ValidationError("establishmentId ou slug é obrigatório");

  const est = await db.establishment.findFirst({
    where: {
      ...where,
      status: { in: [...PUBLIC_ESTABLISHMENT_STATUSES] },
    },
  });
  if (!est) throw new NotFoundError("Estabelecimento não encontrado");
  return est;
}

/**
 * Resolve or create the CRM Customer row for this User inside the establishment.
 * One profile per (establishment, user) — never a global customer.
 */
export async function resolveCustomerForUser(
  establishmentId: string,
  user: { id: string; name: string; email: string; phone: string | null }
) {
  const existing = await db.customer.findUnique({
    where: {
      establishmentId_userId: { establishmentId, userId: user.id },
    },
  });
  if (existing) return existing;

  return db.customer.create({
    data: {
      establishmentId,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  });
}

export async function computeSlots(input: {
  establishmentId: string;
  serviceId: string;
  professionalId?: string;
  date: string; // YYYY-MM-DD
}) {
  const est = await requirePublicEstablishment({ id: input.establishmentId });
  return computeSlotsForEstablishment(est, input);
}

/** Slot generation for a known establishment record (business or public). */
export async function computeSlotsForEstablishment(
  est: {
    id: string;
    timezone: string;
    slotStartHour: number;
    slotEndHour: number;
  },
  input: {
    serviceId: string;
    professionalId?: string;
    date: string;
  }
) {
  const service = await db.service.findFirst({
    where: { id: input.serviceId, establishmentId: est.id, active: true },
  });
  if (!service) throw new NotFoundError("Serviço não encontrado");

  let professionalIds: string[];
  if (input.professionalId) {
    const professional = await db.professional.findFirst({
      where: { id: input.professionalId, establishmentId: est.id, active: true },
    });
    if (!professional) throw new NotFoundError("Profissional não encontrado");

    const configuredCount = await db.professionalService.count({
      where: { professionalId: professional.id },
    });
    if (configuredCount > 0) {
      const link = await db.professionalService.findUnique({
        where: {
          professionalId_serviceId: {
            professionalId: professional.id,
            serviceId: service.id,
          },
        },
      });
      if (!link) {
        throw new ValidationError("Este profissional não realiza este serviço");
      }
    }
    professionalIds = [professional.id];
  } else {
    const linked = await db.professionalService.findMany({
      where: { serviceId: service.id, professional: { establishmentId: est.id, active: true } },
      select: { professionalId: true },
    });
    if (linked.length > 0) {
      professionalIds = linked.map((l) => l.professionalId);
    } else {
      const all = await db.professional.findMany({
        where: { establishmentId: est.id, active: true },
        select: { id: true },
      });
      professionalIds = all.map((p) => p.id);
    }
  }

  if (professionalIds.length === 0) {
    return { date: input.date, slots: [] as { time: string; available: boolean }[] };
  }

  const durationMs = service.durationMinutes * 60_000;
  const dayStart = combineDateTime(input.date, "00:00", est.timezone);
  const dayEnd = combineDateTime(input.date, "23:59", est.timezone);

  const appointments = await db.appointment.findMany({
    where: {
      professionalId: { in: professionalIds },
      status: { in: [...BLOCKING_STATUSES] },
      startAt: { lt: new Date(dayEnd.getTime() + durationMs) },
      endAt: { gt: dayStart },
    },
    select: { professionalId: true, startAt: true, endAt: true },
  });

  const startHour = est.slotStartHour;
  const endHour = est.slotEndHour;
  if (endHour <= startHour) {
    throw new ValidationError("Horário de funcionamento inválido no estabelecimento");
  }

  const slots: { time: string; available: boolean }[] = [];
  const now = new Date();

  for (let hour = startHour; hour < endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += SLOT_STEP_MINUTES) {
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const slotStart = combineDateTime(input.date, time, est.timezone);
      const slotEnd = new Date(slotStart.getTime() + durationMs);

      const closeAt = combineDateTime(
        input.date,
        `${String(endHour).padStart(2, "0")}:00`,
        est.timezone
      );
      if (slotEnd > closeAt) continue;
      if (slotStart <= now) {
        slots.push({ time, available: false });
        continue;
      }

      const free = professionalIds.some((pid) => {
        return !appointments.some(
          (a) =>
            a.professionalId === pid &&
            a.startAt < slotEnd &&
            a.endAt > slotStart
        );
      });
      slots.push({ time, available: free });
    }
  }

  return { date: input.date, slots };
}

export async function assertSlotStillAvailable(input: {
  professionalId: string;
  startAt: Date;
  endAt: Date;
}) {
  await assertNoConflict(input.professionalId, input.startAt, input.endAt);
}

export async function pickProfessionalForService(input: {
  establishmentId: string;
  serviceId: string;
  professionalId?: string;
  startAt: Date;
  endAt: Date;
}) {
  if (input.professionalId) {
    const professional = await db.professional.findFirst({
      where: {
        id: input.professionalId,
        establishmentId: input.establishmentId,
        active: true,
      },
    });
    if (!professional) throw new NotFoundError("Profissional não encontrado");

    const configuredCount = await db.professionalService.count({
      where: { professionalId: professional.id },
    });
    if (configuredCount > 0) {
      const link = await db.professionalService.findUnique({
        where: {
          professionalId_serviceId: {
            professionalId: professional.id,
            serviceId: input.serviceId,
          },
        },
      });
      if (!link) throw new ValidationError("Este profissional não realiza este serviço");
    }

    await assertSlotStillAvailable({
      professionalId: professional.id,
      startAt: input.startAt,
      endAt: input.endAt,
    });
    return professional;
  }

  const linked = await db.professionalService.findMany({
    where: {
      serviceId: input.serviceId,
      professional: { establishmentId: input.establishmentId, active: true },
    },
    select: { professionalId: true },
  });

  let candidates =
    linked.length > 0
      ? linked.map((l) => l.professionalId)
      : (
          await db.professional.findMany({
            where: { establishmentId: input.establishmentId, active: true },
            select: { id: true },
          })
        ).map((p) => p.id);

  for (const pid of candidates) {
    try {
      await assertSlotStillAvailable({
        professionalId: pid,
        startAt: input.startAt,
        endAt: input.endAt,
      });
      const professional = await db.professional.findUniqueOrThrow({ where: { id: pid } });
      return professional;
    } catch (err) {
      if (err instanceof ConflictError) continue;
      throw err;
    }
  }

  throw new ConflictError("Nenhum profissional disponível neste horário");
}
