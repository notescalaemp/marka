import type { NextRequest } from "next/server";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryChurnRiskList, getChurnRiskKpis } from "@/lib/admin-resources";

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "churn_risk");

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams);
  const [{ items, total }, kpis] = await Promise.all([
    queryChurnRiskList(skip, take),
    getChurnRiskKpis(),
  ]);

  return ok({ kpis, items }, { page, pageSize, total });
});
