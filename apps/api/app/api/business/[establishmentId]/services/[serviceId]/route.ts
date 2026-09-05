import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import {
  withHandler,
  ok,
  NotFoundError,
  writeAuditLog,
} from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  durationMinutes: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  category: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, serviceId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const service = await db.service.findFirst({
    where: { id: serviceId, establishmentId },
  });
  if (!service) throw new NotFoundError("Serviço não encontrado");

  return ok(service);
});

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, serviceId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const body = patchSchema.parse(await req.json());

  const existing = await db.service.findFirst({
    where: { id: serviceId, establishmentId },
  });
  if (!existing) throw new NotFoundError("Serviço não encontrado");

  const service = await db.service.update({
    where: { id: serviceId },
    data: body,
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "service.update",
    targetType: "Service",
    targetId: serviceId,
    metadata: { fields: Object.keys(body) },
  });

  return ok(service);
});

// Soft-delete: deactivate so historical appointments keep the service name.
export const DELETE = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, serviceId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const existing = await db.service.findFirst({
    where: { id: serviceId, establishmentId },
  });
  if (!existing) throw new NotFoundError("Serviço não encontrado");

  const service = await db.service.update({
    where: { id: serviceId },
    data: { active: false },
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "service.deactivate",
    targetType: "Service",
    targetId: serviceId,
  });

  return ok(service);
});
