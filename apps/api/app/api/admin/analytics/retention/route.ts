import type { NextRequest } from "next/server";
import { withHandler, ok } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryRetentionCohorts } from "@/lib/admin-resources";

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "retention");

  const cohorts = await queryRetentionCohorts();
  return ok({ cohorts });
});
