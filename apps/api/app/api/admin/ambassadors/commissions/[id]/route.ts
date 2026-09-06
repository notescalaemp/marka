import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError, ValidationError, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";

const bodySchema = z.object({ action: z.enum(["approve", "cancel"]) });

// PATCH: aprovar/cancelar uma comissão pontual (seção 28 exige registro de
// auditoria para as duas ações). Exige também "finance" — é dinheiro.
export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");
  requireAdminPermission(session.administrator.role, "finance");

  const body = bodySchema.parse(await req.json());
  const existing = await db.commission.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Comissão não encontrada");
  if (existing.status === "PAID") throw new ValidationError("Comissão já paga não pode ser alterada");

  const now = new Date();
  const commission = await db.commission.update({
    where: { id },
    data:
      body.action === "approve"
        ? { status: "APPROVED", approvedAt: now }
        : { status: "CANCELED", canceledAt: now },
  });

  await db.referralEvent.create({
    data: {
      ambassadorId: commission.ambassadorId,
      referralId: commission.referralId,
      type: body.action === "approve" ? "COMMISSION_APPROVED" : "COMMISSION_CANCELED",
      metadata: { commissionId: commission.id },
    },
  });
  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: `ambassador.commission.${body.action}`,
    targetType: "commission",
    targetId: commission.id,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return ok({ id: commission.id, status: commission.status });
});
