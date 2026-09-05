import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, created, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryPlansList } from "@/lib/admin-resources";

const createSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  priceMonthly: z.number().nonnegative(),
  active: z.boolean().optional(),
});

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "plans");

  const items = await queryPlansList();
  return ok(items);
});

export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "plans");

  const body = createSchema.parse(await req.json());
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");

  const plan = await db.plan.create({
    data: {
      code: body.code,
      name: body.name,
      priceMonthly: body.priceMonthly,
      active: body.active ?? true,
    },
  });

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: "admin.plan.create",
    targetType: "plan",
    targetId: plan.id,
    ip,
    userAgent,
  });

  return created({
    id: plan.id,
    code: plan.code,
    name: plan.name,
    priceMonthly: Number(plan.priceMonthly),
    active: plan.active,
  });
});
