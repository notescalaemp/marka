import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { syncAmbassadorConversions } from "@/lib/ambassador";

// GET: "Indicações" tab — every referral across every ambassador.
export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");

  await syncAmbassadorConversions();

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams);

  const [rows, total] = await Promise.all([
    db.referral.findMany({
      where: { referredEstablishmentId: { not: null } },
      include: {
        ambassador: { include: { establishment: { select: { name: true } } } },
        referredEstablishment: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.referral.count({ where: { referredEstablishmentId: { not: null } } }),
  ]);

  return ok(
    rows.map((r) => ({
      id: r.id,
      ambassadorName: r.ambassador.establishment.name,
      establishmentName: r.referredEstablishment?.name ?? null,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      convertedAt: r.convertedAt ? r.convertedAt.toISOString() : null,
    })),
    { page, pageSize, total }
  );
});
