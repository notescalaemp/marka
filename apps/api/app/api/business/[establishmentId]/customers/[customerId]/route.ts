import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, noContent, NotFoundError, ConflictError, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, customerId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  // Scoping the lookup by establishmentId in the same query (not fetch-then-
  // compare) is what turns a cross-tenant id into a plain 404.
  const customer = await db.customer.findFirst({ where: { id: customerId, establishmentId } });
  if (!customer) throw new NotFoundError("Cliente não encontrado");

  const recentAppointments = await db.appointment.findMany({
    where: { customerId: customer.id },
    orderBy: { startAt: "desc" },
    take: 10,
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      price: true,
      service: { select: { name: true } },
      professional: { select: { id: true, member: { select: { user: { select: { name: true } } } } } },
    },
  });

  return ok({ ...customer, recentAppointments });
});

const bodySchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, customerId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const existing = await db.customer.findFirst({ where: { id: customerId, establishmentId } });
  if (!existing) throw new NotFoundError("Cliente não encontrado");

  const body = bodySchema.parse(await req.json());
  const customer = await db.customer.update({ where: { id: customerId }, data: body });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "customer.update",
    targetType: "Customer",
    targetId: customer.id,
    metadata: body,
  });

  return ok(customer);
});

export const DELETE = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, customerId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, ["OWNER", "ADMIN", "MANAGER"]);

  const existing = await db.customer.findFirst({ where: { id: customerId, establishmentId } });
  if (!existing) throw new NotFoundError("Cliente não encontrado");

  const appointmentCount = await db.appointment.count({ where: { customerId } });
  if (appointmentCount > 0) {
    throw new ConflictError("Não é possível excluir um cliente com agendamentos");
  }

  await db.customer.delete({ where: { id: customerId } });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "customer.delete",
    targetType: "Customer",
    targetId: customerId,
  });

  return noContent();
});
