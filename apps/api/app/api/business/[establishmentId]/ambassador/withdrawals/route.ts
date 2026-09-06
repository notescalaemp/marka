import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, created, ValidationError, writeAuditLog, clientIp } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";
import { requireAmbassador, computeAvailableBalance, ensureAmbassadorProgramSettings } from "@/lib/ambassador";

const OWNER_ADMIN = ["OWNER", "ADMIN"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...OWNER_ADMIN]);
  const profile = await requireAmbassador(establishmentId);

  const [withdrawals, availableBalance, settings] = await Promise.all([
    db.ambassadorWithdrawal.findMany({
      where: { ambassadorId: profile.id },
      orderBy: { requestedAt: "desc" },
    }),
    computeAvailableBalance(profile.id),
    ensureAmbassadorProgramSettings(),
  ]);

  return ok({
    availableBalance,
    minWithdrawalAmount: Number(settings.minWithdrawalAmount),
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      status: w.status,
      requestedAt: w.requestedAt.toISOString(),
      processedAt: w.processedAt ? w.processedAt.toISOString() : null,
    })),
  });
});

// POST: the ambassador requests a payout of their full available balance.
// The minimum is read from AmbassadorProgramSettings — never hardcoded here.
export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...OWNER_ADMIN]);
  const profile = await requireAmbassador(establishmentId);

  const [availableBalance, settings] = await Promise.all([
    computeAvailableBalance(profile.id),
    ensureAmbassadorProgramSettings(),
  ]);

  const minAmount = Number(settings.minWithdrawalAmount);
  if (availableBalance < minAmount) {
    throw new ValidationError(
      `Saques disponíveis a partir de R$ ${minAmount.toFixed(2)}. Seu saldo atual é R$ ${availableBalance.toFixed(2)}.`
    );
  }

  const withdrawal = await db.ambassadorWithdrawal.create({
    data: { ambassadorId: profile.id, amount: availableBalance },
  });

  await db.referralEvent.create({
    data: { ambassadorId: profile.id, type: "WITHDRAWAL_REQUESTED", metadata: { withdrawalId: withdrawal.id } },
  });
  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "ambassador.withdrawal.requested",
    targetType: "ambassador_withdrawal",
    targetId: withdrawal.id,
    metadata: { amount: availableBalance },
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return created({
    id: withdrawal.id,
    amount: Number(withdrawal.amount),
    status: withdrawal.status,
    requestedAt: withdrawal.requestedAt.toISOString(),
  });
});
