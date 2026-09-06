import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";
import { requireAmbassador, computeAvailableBalance, syncAmbassadorConversions } from "@/lib/ambassador";

const OWNER_ADMIN = ["OWNER", "ADMIN"] as const;

// GET: the ambassador's own profile — code, status and link. Every
// /ambassador/* route re-checks requireAmbassador itself (never trusts a
// cached frontend flag), so an establishment demoted mid-session loses
// access on its very next request.
export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...OWNER_ADMIN]);
  const profile = await requireAmbassador(establishmentId);

  await syncAmbassadorConversions(profile.id);

  const [referralCount, activeCount, availableBalance] = await Promise.all([
    db.referral.count({ where: { ambassadorId: profile.id, status: { not: "PENDING" } } }),
    db.referral.count({ where: { ambassadorId: profile.id, status: "ACTIVE" } }),
    computeAvailableBalance(profile.id),
  ]);

  return ok({
    code: profile.code,
    status: profile.status,
    createdAt: profile.createdAt.toISOString(),
    referrals: referralCount,
    activeCustomers: activeCount,
    availableBalance,
  });
});
