import type { NextRequest } from "next/server";
import { z } from "zod";
import { withHandler, ok } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryFinanceMetrics } from "@/lib/admin-resources";

const periodSchema = z.enum(["7d", "30d", "90d"]).default("30d");

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "finance");

  const period = periodSchema.parse(req.nextUrl.searchParams.get("period") ?? "30d");
  const data = await queryFinanceMetrics(period);

  return ok(data);
});
