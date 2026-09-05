import type { NextRequest } from "next/server";
import { z } from "zod";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryPaymentsList, getPaymentsKpis, mapPaymentRow } from "@/lib/admin-resources";

const filterSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELED"]).optional(),
  method: z.enum(["PIX", "CARD", "CASH", "OTHER"]).optional(),
});

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "payments");

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({
    status: sp.get("status") ?? undefined,
    method: sp.get("method") ?? undefined,
  });

  const { skip, take, page, pageSize } = parsePagination(sp);
  const [{ items, total }, kpis] = await Promise.all([
    queryPaymentsList(filters, skip, take),
    getPaymentsKpis(),
  ]);

  return ok({ kpis, items: items.map(mapPaymentRow) }, { page, pageSize, total });
});
