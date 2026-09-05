import type { NextRequest } from "next/server";
import { z } from "zod";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import {
  querySubscriptionsList,
  getSubscriptionsKpis,
  mapSubscriptionRow,
} from "@/lib/admin-resources";

const filterSchema = z.object({
  status: z.enum(["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "INCOMPLETE"]).optional(),
  plan: z.string().trim().min(1).optional(),
});

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "subscriptions");

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({
    status: sp.get("status") ?? undefined,
    plan: sp.get("plan") ?? undefined,
  });

  const { skip, take, page, pageSize } = parsePagination(sp);
  const [{ items, total }, kpis] = await Promise.all([
    querySubscriptionsList(filters, skip, take),
    getSubscriptionsKpis(),
  ]);

  return ok({ kpis, items: items.map(mapSubscriptionRow) }, { page, pageSize, total });
});
