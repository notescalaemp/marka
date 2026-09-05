import type { NextRequest } from "next/server";
import { withHandler, ok, AppError } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { querySettings } from "@/lib/admin-resources";

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "settings");

  return ok(querySettings());
});

export const PATCH = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "settings");
  throw new AppError("Persistência de settings ainda não existe", 501, "not_implemented");
});
