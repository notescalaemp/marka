import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  priceMonthly: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
});

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "plans");

  const body = patchSchema.parse(await req.json());
  const existing = await db.plan.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Plano não encontrado");

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");

  const plan = await db.plan.update({
    where: { id },
    data: body,
  });

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: "admin.plan.update",
    targetType: "plan",
    targetId: plan.id,
    metadata: body,
    ip,
    userAgent,
  });

  return ok({
    id: plan.id,
    code: plan.code,
    name: plan.name,
    priceMonthly: Number(plan.priceMonthly),
    active: plan.active,
  });
});
