import type { NextRequest } from "next/server";
import { withHandler, ok } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryAlerts } from "@/lib/admin-resources";

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "alerts");

  const items = await queryAlerts();
  return ok(items);
});
