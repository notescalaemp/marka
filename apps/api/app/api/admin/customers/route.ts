import type { NextRequest } from "next/server";
import { z } from "zod";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryCustomersList, getCustomersKpis } from "@/lib/admin-resources";

const filterSchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
});

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "customers");

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
  });

  const { skip, take, page, pageSize } = parsePagination(sp);
  const [{ items, total }, kpis] = await Promise.all([
    queryCustomersList(filters, skip, take),
    getCustomersKpis(),
  ]);

  return ok({ kpis, items }, { page, pageSize, total });
});
