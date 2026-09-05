import type { NextRequest } from "next/server";
import { z } from "zod";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryAuditLogsList } from "@/lib/admin-resources";

const filterSchema = z.object({
  action: z.string().trim().min(1).optional(),
  result: z.string().trim().min(1).optional(),
  admin: z.string().trim().min(1).optional(),
});

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "audit_logs");

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({
    action: sp.get("action") ?? undefined,
    result: sp.get("result") ?? undefined,
    admin: sp.get("admin") ?? undefined,
  });

  const { skip, take, page, pageSize } = parsePagination(sp);
  const { items, total } = await queryAuditLogsList(filters, skip, take);

  return ok(items, { page, pageSize, total });
});
