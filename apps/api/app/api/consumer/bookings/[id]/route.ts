import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError, ForbiddenError } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import {
  formatDateYYYYMMDD,
  formatTimeHHMM,
  mapAppointmentStatus,
} from "@/lib/consumer";

const bookingInclude = {
  establishment: { select: { timezone: true, name: true, slug: true } },
  service: { select: { name: true, durationMinutes: true } },
  professional: {
    select: { member: { select: { user: { select: { name: true } } } } },
  },
  customer: { select: { userId: true } },
} as const;

async function loadOwnedBooking(userId: string, id: string) {
  const appointment = await db.appointment.findUnique({
    where: { id },
    include: bookingInclude,
  });
  if (!appointment) throw new NotFoundError("Agendamento não encontrado");
  if (appointment.customer.userId !== userId) {
    throw new ForbiddenError("Agendamento não pertence a este usuário");
  }
  return appointment;
}

function serialize(appointment: Awaited<ReturnType<typeof loadOwnedBooking>>) {
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

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const session = await requireUserAuth(req);
  const { id } = await params;
  const appointment = await loadOwnedBooking(session.userId, id);
  return ok(serialize(appointment));
});
