import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError, ValidationError, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";

const bodySchema = z.object({
  action: z.enum(["process", "pay", "reject"]),
  rejectionReason: z.string().trim().max(500).optional(),
});

const NEXT_STATUS = { process: "PROCESSING", pay: "PAID", reject: "REJECTED" } as const;

// PATCH: aprovar (marcar em processamento), marcar pago, ou rejeitar um
// saque. Exige "finance" além de "ambassadors" — é a mesma trava que já
// protege /api/admin/payments.
export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");
  requireAdminPermission(session.administrator.role, "finance");

  const body = bodySchema.parse(await req.json());
  const existing = await db.ambassadorWithdrawal.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Saque não encontrado");
  if (existing.status === "PAID" || existing.status === "REJECTED") {
    throw new ValidationError("Este saque já foi finalizado");
  }

  const withdrawal = await db.ambassadorWithdrawal.update({
    where: { id },
    data: {
      status: NEXT_STATUS[body.action],
      processedAt: body.action === "process" ? existing.processedAt : new Date(),
      processedByAdminId: session.administrator.id,
      rejectionReason: body.action === "reject" ? body.rejectionReason ?? null : existing.rejectionReason,
    },
  });

  await db.referralEvent.create({
    data: {
      ambassadorId: withdrawal.ambassadorId,
      type: body.action === "pay" ? "WITHDRAWAL_PAID" : "WITHDRAWAL_REQUESTED",
      metadata: { withdrawalId: withdrawal.id, action: body.action },
    },
  });
  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: `ambassador.withdrawal.${body.action}`,
    targetType: "ambassador_withdrawal",
    targetId: withdrawal.id,
    metadata: body.rejectionReason ? { reason: body.rejectionReason } : undefined,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return ok({ id: withdrawal.id, status: withdrawal.status });
});
