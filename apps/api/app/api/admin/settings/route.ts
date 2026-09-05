import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { querySettings, updateSettings } from "@/lib/admin-resources";

const patchSchema = z.object({
  brandName: z.string().trim().min(1).max(120).optional(),
  locale: z.enum(["pt-BR", "en-US"]).optional(),
  features: z
    .object({
      impersonation: z.boolean().optional(),
      auditLogs: z.boolean().optional(),
      marketingCampaigns: z.boolean().optional(),
      onlinePayments: z.boolean().optional(),
    })
    .optional(),
});

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "settings");
  return ok(await querySettings());
});

export const PATCH = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "settings");

  const body = patchSchema.parse(await req.json());
  const settings = await updateSettings(body, session.administrator.id);

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: "admin.settings.update",
    targetType: "platform_settings",
    targetId: "default",
    metadata: body,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return ok(settings);
});
