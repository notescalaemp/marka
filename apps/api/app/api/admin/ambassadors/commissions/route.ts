import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";

const filterSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "PAID", "CANCELED"]).optional(),
});

// GET: "Comissões" tab — every commission across every ambassador.
export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({ status: sp.get("status") ?? undefined });
  const { skip, take, page, pageSize } = parsePagination(sp);

  const [rows, total] = await Promise.all([
    db.commission.findMany({
      where: { status: filters.status },
      include: {
        ambassador: { include: { establishment: { select: { name: true } } } },
        referral: { include: { referredEstablishment: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.commission.count({ where: { status: filters.status } }),
  ]);

  return ok(
    rows.map((c) => ({
      id: c.id,
      ambassadorName: c.ambassador.establishment.name,
      referralEstablishment: c.referral.referredEstablishment?.name ?? null,
      kind: c.kind,
      amount: Number(c.amount),
      status: c.status,
      createdAt: c.createdAt.toISOString(),
    })),
    { page, pageSize, total }
  );
});
