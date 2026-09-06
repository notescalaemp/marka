import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";
import { requireAmbassador, computeAvailableBalance, syncAmbassadorConversions } from "@/lib/ambassador";

const OWNER_ADMIN = ["OWNER", "ADMIN"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...OWNER_ADMIN]);
  const profile = await requireAmbassador(establishmentId);

  await syncAmbassadorConversions(profile.id);

  const [
    linkAccessedEvents,
    signedUp,
    converted,
    activeCustomers,
    commissionTotal,
    availableBalance,
    referralsWithCommissions,
    activatedEstablishments,
  ] = await Promise.all([
    db.referralEvent.count({ where: { ambassadorId: profile.id, type: "LINK_ACCESSED" } }),
    db.referral.count({ where: { ambassadorId: profile.id, referredEstablishmentId: { not: null } } }),
    db.referral.count({ where: { ambassadorId: profile.id, convertedAt: { not: null } } }),
    db.referral.count({ where: { ambassadorId: profile.id, status: "ACTIVE" } }),
    db.commission.aggregate({
      where: { ambassadorId: profile.id, status: { not: "CANCELED" } },
      _sum: { amount: true },
    }),
    computeAvailableBalance(profile.id),
    db.referral.count({ where: { ambassadorId: profile.id, commissions: { some: {} } } }),
    db.referral.count({
      where: {
        ambassadorId: profile.id,
        referredEstablishment: { status: { not: "trial" } },
      },
    }),
  ]);

  return ok({
    metrics: {
      referrals: linkAccessedEvents,
      signups: signedUp,
      activeCustomers,
      conversions: converted,
      commissions: Number(commissionTotal._sum.amount ?? 0),
      availableBalance,
    },
    funnel: [
      { step: "link_shared", label: "Link compartilhado", count: linkAccessedEvents },
      { step: "accessed", label: "Acessou", count: linkAccessedEvents },
      { step: "signed_up", label: "Cadastrou", count: signedUp },
      { step: "activated", label: "Ativou", count: activatedEstablishments },
      { step: "became_customer", label: "Virou cliente", count: activeCustomers },
      { step: "commission_generated", label: "Comissão gerada", count: referralsWithCommissions },
    ],
  });
});
