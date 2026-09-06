import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";

const filterSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "PAID", "REJECTED"]).optional(),
});

// GET: "Saques" tab — every withdrawal request across every ambassador.
export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({ status: sp.get("status") ?? undefined });
  const { skip, take, page, pageSize } = parsePagination(sp);

  const [rows, total] = await Promise.all([
    db.ambassadorWithdrawal.findMany({
      where: { status: filters.status },
      include: { ambassador: { include: { establishment: { select: { name: true } } } } },
      orderBy: { requestedAt: "desc" },
      skip,
      take,
    }),
    db.ambassadorWithdrawal.count({ where: { status: filters.status } }),
  ]);

  return ok(
    rows.map((w) => ({
      id: w.id,
      ambassadorName: w.ambassador.establishment.name,
      amount: Number(w.amount),
      status: w.status,
      requestedAt: w.requestedAt.toISOString(),
      processedAt: w.processedAt ? w.processedAt.toISOString() : null,
    })),
    { page, pageSize, total }
  );
});
