import type { NextRequest } from "next/server";
import { z } from "zod";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryUsersList, getUsersKpis, mapUserRow } from "@/lib/admin-resources";

const filterSchema = z.object({
  search: z.string().trim().min(1).optional(),
  type: z
    .enum(["OWNER", "ADMIN", "MANAGER", "PROFESSIONAL", "STAFF", "CUSTOMER", "all"])
    .optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
});

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "users");

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({
    search: sp.get("search") ?? undefined,
    type: sp.get("type") ?? undefined,
    status: sp.get("status") ?? undefined,
  });

  const { skip, take, page, pageSize } = parsePagination(sp);
  const [{ items, total }, kpis] = await Promise.all([
    queryUsersList(filters, skip, take),
    getUsersKpis(),
  ]);

  return ok({ kpis, items: items.map(mapUserRow) }, { page, pageSize, total });
});
