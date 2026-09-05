import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import {
  withHandler,
  ok,
  writeAuditLog,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import {
  formatDateYYYYMMDD,
  formatTimeHHMM,
  mapAppointmentStatus,
} from "@/lib/consumer";

export const POST = withHandler(async (req: NextRequest, { params }) => {
  const session = await requireUserAuth(req);
  const { id } = await params;

  const appointment = await db.appointment.findUnique({
    where: { id },
    include: {
      customer: { select: { userId: true } },
      establishment: { select: { timezone: true, name: true, slug: true } },
      service: { select: { name: true, durationMinutes: true } },
      professional: {
        select: { member: { select: { user: { select: { name: true } } } } },
      },
    },
  });

  if (!appointment) throw new NotFoundError("Agendamento não encontrado");
  if (appointment.customer.userId !== session.userId) {
    throw new ForbiddenError("Agendamento não pertence a este usuário");
  }

  if (appointment.status === "CANCELADO") {
    throw new ValidationError("Agendamento já está cancelado");
  }
  if (appointment.status === "CONCLUIDO") {
    throw new ValidationError("Não é possível cancelar um atendimento concluído");
  }
  if (appointment.status === "NO_SHOW") {
    throw new ValidationError("Não é possível cancelar este agendamento");
  }

  const updated = await db.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELADO" },
    include: {
      establishment: { select: { timezone: true, name: true, slug: true } },
      service: { select: { name: true, durationMinutes: true } },
      professional: {
        select: { member: { select: { user: { select: { name: true } } } } },
      },
    },
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId: appointment.establishmentId,
    action: "consumer.booking.cancel",
    targetType: "Appointment",
    targetId: appointment.id,
  });

  const tz = updated.establishment.timezone;
  const paymentMatch = appointment.notes?.match(/^payment:(local|online)$/);

  return ok({
    id: updated.id,
    establishmentId: updated.establishmentId,
    establishmentName: updated.establishment.name,
    establishmentSlug: updated.establishment.slug,
    serviceId: updated.serviceId,
    serviceName: updated.service.name,
    professionalId: updated.professionalId,
    professionalName: updated.professional.member.user.name,
    date: formatDateYYYYMMDD(updated.startAt, tz),
    time: formatTimeHHMM(updated.startAt, tz),
    durationMin: updated.service.durationMinutes,
    price: Number(updated.price),
    status: mapAppointmentStatus(updated.status),
    paymentOption: (paymentMatch?.[1] as "local" | "online" | undefined) ?? null,
  });
});
