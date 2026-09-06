import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";
import { requireAmbassador, syncAmbassadorConversions } from "@/lib/ambassador";

const OWNER_ADMIN = ["OWNER", "ADMIN"] as const;

// "Minhas indicações" — one row per establishment that came through the
// ambassador's link, plan + latest commission included for the table.
export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...OWNER_ADMIN]);
  const profile = await requireAmbassador(establishmentId);
  await syncAmbassadorConversions(profile.id);

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams);

  const [rows, total] = await Promise.all([
    db.referral.findMany({
      where: { ambassadorId: profile.id, referredEstablishmentId: { not: null } },
      include: {
        referredEstablishment: { include: { subscription: { include: { plan: true } } } },
        commissions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.referral.count({ where: { ambassadorId: profile.id, referredEstablishmentId: { not: null } } }),
  ]);

  return ok(
    rows.map((r) => ({
      id: r.id,
      establishmentName: r.referredEstablishment?.name ?? null,
      createdAt: r.createdAt.toISOString(),
      status: r.status,
      plan: r.referredEstablishment?.subscription?.plan.name ?? null,
      commission: r.commissions[0] ? Number(r.commissions[0].amount) : 0,
    })),
    { page, pageSize, total }
  );
});
