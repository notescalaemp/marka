import { db, type AppointmentStatus } from "@marka/db";
import { ConflictError } from "@marka/shared";

// Every status except CANCELADO still occupies the professional's calendar
// (including BLOQUEADO, which exists precisely to hold a slot).
export const BLOCKING_STATUSES: AppointmentStatus[] = [
  "AGUARDANDO",
  "CONFIRMADO",
  "CONCLUIDO",
  "NO_SHOW",
  "BLOQUEADO",
];

export async function assertNoConflict(
  professionalId: string,
  startAt: Date,
  endAt: Date,
  excludeAppointmentId?: string
) {
  const conflict = await db.appointment.findFirst({
    where: {
      professionalId,
      status: { in: BLOCKING_STATUSES },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { id: true },
  });
  if (conflict) throw new ConflictError("Conflito de horário para este profissional");
}
