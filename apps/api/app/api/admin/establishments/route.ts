import type { NextRequest } from "next/server";
import { z } from "zod";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryEstablishmentsList, type ScoredEstablishmentRow } from "@/lib/admin-establishments";

const filterSchema = z.object({
  search: z.string().trim().min(1).optional(),
  status: z.enum(["trial", "active", "inactive", "suspended", "canceled"]).optional(),
  plan: z.string().trim().min(1).optional(),
  risk: z.enum(["low", "medium", "high"]).optional(),
});

function mapRow(row: ScoredEstablishmentRow) {
  return {
    id: row.id,
    name: row.name,
    owner: { id: row.owner_id, name: row.owner_name, email: row.owner_email },
    plan: row.plan_name,
    status: row.establishment_status,
    mrr: row.mrr,
    createdAt: row.createdAt.toISOString(),
    lastAccess: row.last_access ? row.last_access.toISOString() : null,
    professionals: row.professionals_count,
    customers: row.customers_count,
    // No real capacity/availability model exists yet to compute a true
    // utilization rate — see STATUS report. null, not a fabricated 0%.
    utilization: null,
    churnRisk: row.churn_risk,
  };
}

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "establishments");

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({
    search: sp.get("search") ?? undefined,
    status: sp.get("status") ?? undefined,
    plan: sp.get("plan") ?? undefined,
    risk: sp.get("risk") ?? undefined,
  });

  const { skip, take, page, pageSize } = parsePagination(sp);
  const { items, total } = await queryEstablishmentsList(filters, skip, take);

  return ok(items.map(mapRow), { page, pageSize, total });
});
