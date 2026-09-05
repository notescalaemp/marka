import type { NextRequest } from "next/server";
import { z } from "zod";
import { db, AppointmentStatus } from "@marka/db";
import { withHandler, ok, NotFoundError, ValidationError, ConflictError, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";
import { assertNoConflict } from "@/lib/appointments";

const TERMINAL_STATUSES: AppointmentStatus[] = ["CONCLUIDO", "CANCELADO"];
const SENSITIVE_STATUSES: AppointmentStatus[] = ["CANCELADO", "CONCLUIDO", "NO_SHOW"];

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, appointmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, establishmentId },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      professional: { select: { id: true, member: { select: { user: { select: { name: true } } } } } },
      service: { select: { id: true, name: true, durationMinutes: true } },
      payments: true,
    },
  });
  if (!appointment) throw new NotFoundError("Agendamento não encontrado");

  return ok(appointment);
});

const updateSchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  notes: z.string().optional(),
  price: z.number().nonnegative().optional(),
});

// Handles reschedule, cancel, complete and any other status change through
// one endpoint — all are just a validated field on the same Appointment.
export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, appointmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const existing = await db.appointment.findFirst({ where: { id: appointmentId, establishmentId } });
  if (!existing) throw new NotFoundError("Agendamento não encontrado");

  if (TERMINAL_STATUSES.includes(existing.status)) {
    throw new ConflictError("Este agendamento já foi finalizado/cancelado e não pode ser alterado");
  }

  const body = updateSchema.parse(await req.json());

  const startAt = body.startAt ?? existing.startAt;
  const endAt = body.endAt ?? existing.endAt;
  if (endAt <= startAt) throw new ValidationError("Horário de término deve ser depois do início");

  if (body.startAt || body.endAt) {
    await assertNoConflict(existing.professionalId, startAt, endAt, existing.id);
  }

  const appointment = await db.appointment.update({
    where: { id: appointmentId },
    data: {
      status: body.status,
      startAt: body.startAt,
      endAt: body.endAt,
      notes: body.notes,
      price: body.price,
    },
  });

  const action =
    body.status && SENSITIVE_STATUSES.includes(body.status)
      ? `appointment.${body.status.toLowerCase()}`
      : "appointment.update";

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action,
    targetType: "Appointment",
    targetId: appointment.id,
    metadata: body,
  });

  return ok(appointment);
});
