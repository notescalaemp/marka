import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import {
  withHandler,
  ok,
  created,
  parsePagination,
  writeAuditLog,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import {
  combineDateTime,
  formatDateYYYYMMDD,
  formatTimeHHMM,
  mapAppointmentStatus,
  paymentOptionsOf,
} from "@/lib/consumer";
import {
  pickProfessionalForService,
  requirePublicEstablishment,
  resolveCustomerForUser,
} from "@/lib/consumer-scheduling";

const createSchema = z.object({
  establishmentId: z.string().min(1),
  serviceId: z.string().min(1),
  professionalId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  paymentOption: z.enum(["local", "online"]),
});

const BANNED_FIELDS = [
  "price",
  "duration",
  "durationMin",
  "status",
  "customerId",
  "endAt",
  "startAt",
] as const;

function serializeBooking(
  appointment: {
    id: string;
    establishmentId: string;
    serviceId: string;
    professionalId: string;
    startAt: Date;
    endAt: Date;
    status: Parameters<typeof mapAppointmentStatus>[0];
    price: { toString(): string } | number;
    notes: string | null;
    establishment: { timezone: string; name: string; slug: string };
    service: { name: string; durationMinutes: number };
    professional: { member: { user: { name: string } } };
  }
) {
  const tz = appointment.establishment.timezone;
  const paymentMatch = appointment.notes?.match(/^payment:(local|online)$/);
  return {
    id: appointment.id,
    establishmentId: appointment.establishmentId,
    establishmentName: appointment.establishment.name,
    establishmentSlug: appointment.establishment.slug,
    serviceId: appointment.serviceId,
    serviceName: appointment.service.name,
    professionalId: appointment.professionalId,
    professionalName: appointment.professional.member.user.name,
    date: formatDateYYYYMMDD(appointment.startAt, tz),
    time: formatTimeHHMM(appointment.startAt, tz),
    durationMin: appointment.service.durationMinutes,
    price: Number(appointment.price),
    status: mapAppointmentStatus(appointment.status),
    paymentOption: (paymentMatch?.[1] as "local" | "online" | undefined) ?? null,
  };
}

const bookingInclude = {
  establishment: { select: { timezone: true, name: true, slug: true } },
  service: { select: { name: true, durationMinutes: true } },
  professional: {
    select: { member: { select: { user: { select: { name: true } } } } },
  },
} as const;

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);
  const sp = req.nextUrl.searchParams;
  const scope = sp.get("scope") === "history" ? "history" : "upcoming";
  const { skip, take, page, pageSize } = parsePagination(sp);

  const now = new Date();
  const where = {
    customer: { userId: session.userId },
    ...(scope === "history"
      ? {
          OR: [
            { status: { in: ["CONCLUIDO" as const, "CANCELADO" as const, "NO_SHOW" as const] } },
            { AND: [{ startAt: { lt: now } }, { status: { notIn: ["AGUARDANDO" as const, "CONFIRMADO" as const] } }] },
          ],
        }
      : {
          status: { in: ["AGUARDANDO" as const, "CONFIRMADO" as const] },
          startAt: { gte: now },
        }),
  };

  const [items, total] = await db.$transaction([
    db.appointment.findMany({
      where,
      skip,
      take,
      orderBy: { startAt: scope === "history" ? "desc" : "asc" },
      include: bookingInclude,
    }),
    db.appointment.count({ where }),
  ]);

  return ok(
    {
      items: items.map((a) => serializeBooking(a)),
      total,
      page,
      pageSize,
      scope,
    },
    { page, pageSize, total }
  );
});

export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);
  if (session.user.status !== "ACTIVE") {
    throw new ForbiddenError("Conta suspensa");
  }

  const raw = (await req.json()) as Record<string, unknown>;
  for (const banned of BANNED_FIELDS) {
    if (banned in raw) {
      throw new ValidationError(`Campo não permitido: ${banned}`);
    }
  }

  const body = createSchema.parse(raw);
  const est = await requirePublicEstablishment({ id: body.establishmentId });
  const options = paymentOptionsOf(est);
  if (!options.includes(body.paymentOption)) {
    throw new ValidationError("Forma de pagamento não aceita por este estabelecimento");
  }

  const service = await db.service.findFirst({
    where: { id: body.serviceId, establishmentId: est.id, active: true },
  });
  if (!service) throw new ValidationError("Serviço inválido para este estabelecimento");

  const startAt = combineDateTime(body.date, body.time, est.timezone);
  if (Number.isNaN(startAt.getTime())) throw new ValidationError("Data/horário inválidos");
  if (startAt.getTime() <= Date.now()) {
    throw new ValidationError("Não é possível agendar no passado");
  }

  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);
  const closeAt = combineDateTime(
    body.date,
    `${String(est.slotEndHour).padStart(2, "0")}:00`,
    est.timezone
  );
  const openAt = combineDateTime(
    body.date,
    `${String(est.slotStartHour).padStart(2, "0")}:00`,
    est.timezone
  );
  if (startAt < openAt || endAt > closeAt) {
    throw new ValidationError("Horário fora do funcionamento do estabelecimento");
  }

  const professional = await pickProfessionalForService({
    establishmentId: est.id,
    serviceId: service.id,
    professionalId: body.professionalId,
    startAt,
    endAt,
  });

  const customer = await resolveCustomerForUser(est.id, session.user);

  const appointment = await db.$transaction(async (tx) => {
    const conflict = await tx.appointment.findFirst({
      where: {
        professionalId: professional.id,
        status: { in: ["AGUARDANDO", "CONFIRMADO", "CONCLUIDO", "NO_SHOW", "BLOQUEADO"] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true },
    });
    if (conflict) {
      throw new ConflictError("Horário acabou de ser ocupado. Escolha outro.");
    }

    return tx.appointment.create({
      data: {
        establishmentId: est.id,
        customerId: customer.id,
        professionalId: professional.id,
        serviceId: service.id,
        startAt,
        endAt,
        status: "CONFIRMADO",
        price: service.price,
        notes: `payment:${body.paymentOption}`,
        createdByUserId: session.userId,
      },
      include: bookingInclude,
    });
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId: est.id,
    action: "consumer.booking.create",
    targetType: "Appointment",
    targetId: appointment.id,
  });

  return created(serializeBooking(appointment));
});
