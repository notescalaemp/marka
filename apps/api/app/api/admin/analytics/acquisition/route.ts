import type { NextRequest } from "next/server";
import { z } from "zod";
import { withHandler, ok } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryAcquisitionAnalytics } from "@/lib/admin-resources";

const periodSchema = z.enum(["7d", "30d", "90d"]).optional();

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "acquisition");

  const period = periodSchema.parse(req.nextUrl.searchParams.get("period") ?? undefined);
  const data = await queryAcquisitionAnalytics(period);
  return ok(data);
});
