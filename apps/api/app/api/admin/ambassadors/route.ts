import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { computeAvailableBalance, syncAmbassadorConversions } from "@/lib/ambassador";

const filterSchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "SUSPENDED", "REMOVED"]).optional(),
});

// GET: the "Embaixadores" table (seção 5) — one row per ambassador, with the
// aggregates the table needs already computed server-side.
export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");

  await syncAmbassadorConversions();

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
  });
  const { skip, take, page, pageSize } = parsePagination(sp);

  const where = {
    status: filters.status,
    establishment: filters.search
      ? { name: { contains: filters.search, mode: "insensitive" as const } }
      : undefined,
  };

  const [rows, total] = await Promise.all([
    db.ambassadorProfile.findMany({
      where,
      include: { establishment: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.ambassadorProfile.count({ where }),
  ]);

  const items = await Promise.all(
    rows.map(async (profile) => {
      const [referrals, conversions, activeCustomers, commissionGenerated, availableBalance] = await Promise.all([
        db.referral.count({ where: { ambassadorId: profile.id, referredEstablishmentId: { not: null } } }),
        db.referral.count({ where: { ambassadorId: profile.id, convertedAt: { not: null } } }),
        db.referral.count({ where: { ambassadorId: profile.id, status: "ACTIVE" } }),
        db.commission.aggregate({
          where: { ambassadorId: profile.id, status: { not: "CANCELED" } },
          _sum: { amount: true },
        }),
        computeAvailableBalance(profile.id),
      ]);

      return {
        id: profile.id,
        establishmentId: profile.establishmentId,
        establishmentName: profile.establishment.name,
        code: profile.code,
        status: profile.status,
        createdAt: profile.createdAt.toISOString(),
        referrals,
        conversions,
        activeCustomers,
        commissionGenerated: Number(commissionGenerated._sum.amount ?? 0),
        availableBalance,
      };
    })
  );

  return ok(items, { page, pageSize, total });
});
