import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";

const ACTIONS = {
  pause: "PAUSED",
  suspend: "SUSPENDED",
  reactivate: "ACTIVE",
  remove: "REMOVED",
} as const;

const bodySchema = z.object({
  action: z.enum(["pause", "suspend", "reactivate", "remove"]),
  reason: z.string().trim().max(500).optional(),
});

// PATCH: Suspender / Pausar / Remover / Reativar (seção 5 e 7). "remove"
// never deletes the row — referrals, commissions and withdrawals must
// survive intact (seção 7). Dashboard access is re-checked on every request
// via requireAmbassador, so this alone is enough to revoke access.
export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");

  const body = bodySchema.parse(await req.json());
  const existing = await db.ambassadorProfile.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Embaixador não encontrado");

  const status = ACTIONS[body.action];
  const profile = await db.ambassadorProfile.update({
    where: { id },
    data: {
      status,
      removedAt: body.action === "remove" ? new Date() : body.action === "reactivate" ? null : existing.removedAt,
    },
  });

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    establishmentId: profile.establishmentId,
    action: `ambassador.${body.action}`,
    targetType: "ambassador_profile",
    targetId: profile.id,
    metadata: body.reason ? { reason: body.reason } : undefined,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return ok({ id: profile.id, status: profile.status });
});
