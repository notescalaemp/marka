import type { NextRequest } from "next/server";
import { z } from "zod";
import { db, AppointmentStatus } from "@marka/db";
import {
  withHandler,
  ok,
  created,
  parsePagination,
  writeAuditLog,
  NotFoundError,
  ValidationError,
} from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";
import { assertNoConflict } from "@/lib/appointments";

const DAY_MS = 24 * 60 * 60 * 1000;

const filterSchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  professionalId: z.string().optional(),
  customerId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// GET: listing is by period — defaults to today..+30d when no range is
// given, so this can never silently become an unbounded full-table scan.
export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({
    status: sp.get("status") ?? undefined,
    professionalId: sp.get("professionalId") ?? undefined,
    customerId: sp.get("customerId") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
  });

  const from = filters.from ?? new Date(new Date().setHours(0, 0, 0, 0));
  const to = filters.to ?? new Date(from.getTime() + 30 * DAY_MS);

  const { skip, take, page, pageSize } = parsePagination(sp);
  const where = {
    establishmentId,
    startAt: { gte: from, lte: to },
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.professionalId ? { professionalId: filters.professionalId } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
  };

  const [items, total] = await db.$transaction([
    db.appointment.findMany({
      where,
      skip,
      take,
      orderBy: { startAt: "asc" },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        professional: { select: { id: true, member: { select: { user: { select: { name: true } } } } } },
        service: { select: { id: true, name: true, durationMinutes: true } },
      },
    }),
    db.appointment.count({ where }),
  ]);

  return ok(items, { page, pageSize, total });
});

// Only non-terminal, "held" statuses are valid at creation time — the rest
// are reached later via PATCH.
const createSchema = z.object({
  customerId: z.string().min(1),
  professionalId: z.string().min(1),
  serviceId: z.string().min(1),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional(),
  notes: z.string().optional(),
  price: z.number().nonnegative().optional(),
  status: z.enum(["AGUARDANDO", "CONFIRMADO", "BLOQUEADO"]).optional(),
});

export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const body = createSchema.parse(await req.json());

  // Every referenced id is re-validated against establishmentId here — the
  // client cannot smuggle in a customer/professional/service from another
  // tenant by simply guessing an id.
  const [customer, professional, service] = await Promise.all([
    db.customer.findFirst({ where: { id: body.customerId, establishmentId } }),
    db.professional.findFirst({ where: { id: body.professionalId, establishmentId } }),
    db.service.findFirst({ where: { id: body.serviceId, establishmentId } }),
  ]);
  if (!customer) throw new NotFoundError("Cliente não encontrado neste estabelecimento");
  if (!professional) throw new NotFoundError("Profissional não encontrado neste estabelecimento");
  if (!service) throw new NotFoundError("Serviço não encontrado neste estabelecimento");

  // Only enforced once the establishment has actually configured which
  // services a professional performs — an unconfigured professional isn't
  // blocked from taking any service yet.
  const configuredCount = await db.professionalService.count({ where: { professionalId: professional.id } });
  if (configuredCount > 0) {
    const canPerform = await db.professionalService.findUnique({
      where: { professionalId_serviceId: { professionalId: professional.id, serviceId: service.id } },
    });
    if (!canPerform) throw new ValidationError("Este profissional não realiza este serviço");
  }

  const startAt = body.startAt;
  const endAt = body.endAt ?? new Date(startAt.getTime() + service.durationMinutes * 60_000);
  if (endAt <= startAt) throw new ValidationError("Horário de término deve ser depois do início");

  await assertNoConflict(professional.id, startAt, endAt);

  const appointment = await db.appointment.create({
    data: {
      establishmentId,
      customerId: customer.id,
      professionalId: professional.id,
      serviceId: service.id,
      startAt,
      endAt,
      status: body.status ?? "AGUARDANDO",
      price: body.price ?? service.price,
      notes: body.notes,
      createdByUserId: session.userId,
    },
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "appointment.create",
    targetType: "Appointment",
    targetId: appointment.id,
  });

  return created(appointment);
});
