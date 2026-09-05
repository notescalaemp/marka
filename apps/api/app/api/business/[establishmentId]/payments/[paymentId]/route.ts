import type { NextRequest } from "next/server";
import { z } from "zod";
import { db, PaymentStatus } from "@marka/db";
import { withHandler, ok, NotFoundError, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, paymentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const payment = await db.payment.findFirst({ where: { id: paymentId, establishmentId } });
  if (!payment) throw new NotFoundError("Pagamento não encontrado");

  return ok(payment);
});

const bodySchema = z.object({ status: z.nativeEnum(PaymentStatus) });

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, paymentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const existing = await db.payment.findFirst({ where: { id: paymentId, establishmentId } });
  if (!existing) throw new NotFoundError("Pagamento não encontrado");

  const { status } = bodySchema.parse(await req.json());
  const payment = await db.payment.update({
    where: { id: paymentId },
    data: { status, paidAt: status === "PAID" ? new Date() : existing.paidAt },
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "payment.status_change",
    targetType: "Payment",
    targetId: payment.id,
    metadata: { from: existing.status, to: status },
  });

  return ok(payment);
});
