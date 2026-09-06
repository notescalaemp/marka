import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";
import { requireAmbassador, computeAvailableBalance, syncAmbassadorConversions } from "@/lib/ambassador";

const OWNER_ADMIN = ["OWNER", "ADMIN"] as const;

// "Minhas comissões" — totals by status + the movement history (commissions
// earned and withdrawals taken out), newest first.
export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...OWNER_ADMIN]);
  const profile = await requireAmbassador(establishmentId);
  await syncAmbassadorConversions(profile.id);

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams);

  const [totals, availableBalance, commissions, withdrawals, total] = await Promise.all([
    db.commission.groupBy({
      by: ["status"],
      where: { ambassadorId: profile.id },
      _sum: { amount: true },
    }),
    computeAvailableBalance(profile.id),
    db.commission.findMany({
      where: { ambassadorId: profile.id },
      include: { referral: { include: { referredEstablishment: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.ambassadorWithdrawal.findMany({
      where: { ambassadorId: profile.id },
      orderBy: { requestedAt: "desc" },
      take: 20,
    }),
    db.commission.count({ where: { ambassadorId: profile.id } }),
  ]);

  const byStatus = Object.fromEntries(totals.map((t) => [t.status, Number(t._sum.amount ?? 0)]));

  const movements = [
    ...commissions.map((c) => ({
      id: c.id,
      kind: "commission" as const,
      label: `Indicação — ${c.referral.referredEstablishment?.name ?? "estabelecimento"}`,
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
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return ok(
    {
      totals: {
        total: Number(totals.reduce((sum, t) => sum + Number(t._sum.amount ?? 0), 0)),
        pending: byStatus.PENDING ?? 0,
        approved: byStatus.APPROVED ?? 0,
        paid: byStatus.PAID ?? 0,
        availableBalance,
      },
      movements,
    },
    { page, pageSize, total }
  );
});
