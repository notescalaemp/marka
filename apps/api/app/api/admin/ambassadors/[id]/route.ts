import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { computeAvailableBalance, syncAmbassadorConversions } from "@/lib/ambassador";

// GET: ambassador detail page (seção 21) — profile, metrics, full referral
// history and full financial history (never truncated: this is the one
// place an admin reconciles a specific ambassador's numbers).
export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");

  await syncAmbassadorConversions(id);

  const profile = await db.ambassadorProfile.findUnique({
    where: { id },
    include: { establishment: { select: { id: true, name: true } } },
  });
  if (!profile) throw new NotFoundError("Embaixador não encontrado");

  const [referrals, commissions, withdrawals, availableBalance] = await Promise.all([
    db.referral.findMany({
      where: { ambassadorId: id },
      include: { referredEstablishment: { include: { subscription: { include: { plan: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    db.commission.findMany({
      where: { ambassadorId: id },
      include: { referral: { include: { referredEstablishment: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.ambassadorWithdrawal.findMany({ where: { ambassadorId: id }, orderBy: { requestedAt: "desc" } }),
    computeAvailableBalance(id),
  ]);

  const converted = referrals.filter((r) => r.convertedAt);
  const revenueGenerated = converted.reduce(
    (sum, r) => sum + Number(r.referredEstablishment?.subscription?.plan.priceMonthly ?? 0),
    0
  );
  const commissionGenerated = commissions
    .filter((c) => c.status !== "CANCELED")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return ok({
    id: profile.id,
    establishmentId: profile.establishmentId,
    establishmentName: profile.establishment.name,
    code: profile.code,
    status: profile.status,
    createdAt: profile.createdAt.toISOString(),
    metrics: {
      referrals: referrals.filter((r) => r.referredEstablishmentId).length,
      conversions: converted.length,
      activeCustomers: referrals.filter((r) => r.status === "ACTIVE").length,
      revenueGenerated,
      commissionGenerated,
      availableBalance,
    },
    referralHistory: referrals.map((r) => ({
      id: r.id,
      establishmentName: r.referredEstablishment?.name ?? null,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      convertedAt: r.convertedAt ? r.convertedAt.toISOString() : null,
    })),
    financialHistory: [
      ...commissions.map((c) => ({
        id: c.id,
        kind: "commission" as const,
        label: `Comissão — ${c.referral.referredEstablishment?.name ?? "indicação"}`,
        amount: Number(c.amount),
        status: c.status,
        date: c.createdAt.toISOString(),
      })),
      ...withdrawals.map((w) => ({
        id: w.id,
        kind: "withdrawal" as const,
        label: "Saque",
        amount: -Number(w.amount),
        status: w.status,
        date: w.requestedAt.toISOString(),
      })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1)),
  });
});
