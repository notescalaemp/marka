import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { ensureAmbassadorProgramSettings } from "@/lib/ambassador";

function toDto(row: Awaited<ReturnType<typeof ensureAmbassadorProgramSettings>>) {
  return {
    active: row.active,
    commissionModel: row.commissionModel,
    commissionType: row.commissionType,
    bonusAmount: row.bonusAmount ? Number(row.bonusAmount) : null,
    recurringPercent: row.recurringPercent ? Number(row.recurringPercent) : null,
    recurringFixed: row.recurringFixed ? Number(row.recurringFixed) : null,
    minWithdrawalAmount: Number(row.minWithdrawalAmount),
    approvalPeriodDays: row.approvalPeriodDays,
    cancellationRules: row.cancellationRules,
  };
}

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");
  return ok(toDto(await ensureAmbassadorProgramSettings()));
});

const patchSchema = z.object({
  active: z.boolean().optional(),
  commissionModel: z.enum(["ONE_TIME", "RECURRING", "HYBRID"]).optional(),
  commissionType: z.enum(["PERCENT", "FIXED"]).optional(),
  bonusAmount: z.number().min(0).nullable().optional(),
  recurringPercent: z.number().min(0).max(100).nullable().optional(),
  recurringFixed: z.number().min(0).nullable().optional(),
  minWithdrawalAmount: z.number().min(0).optional(),
  approvalPeriodDays: z.number().int().min(0).optional(),
  cancellationRules: z.string().trim().max(2000).nullable().optional(),
});

// PATCH: "Indique e Ganhe → Configurações" (seção 16). Every field the
// commission engine (packages/shared/src/ambassador-commission.ts) reads
// lives here — changing the program's rules never requires a migration.
export const PATCH = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");
  requireAdminPermission(session.administrator.role, "settings");

  const body = patchSchema.parse(await req.json());
  await ensureAmbassadorProgramSettings();

  const row = await db.ambassadorProgramSettings.update({
    where: { id: "default" },
    data: { ...body, updatedByAdminId: session.administrator.id },
  });

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: "ambassador.settings.update",
    targetType: "ambassador_program_settings",
    targetId: "default",
    metadata: body,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return ok(toDto(row));
});
