import type { AdminRole, AdminPermission } from "@marka/auth";
import { canAdmin } from "@marka/auth";
import { ForbiddenError } from "@marka/shared";

// The one place every /api/admin/* route must call after requireAdminAuth.
// These endpoints are global (not tenant-scoped) — requireMembership()
// simply doesn't apply here, this is the RBAC gate that replaces it.
export function requireAdminPermission(role: AdminRole, permission: AdminPermission) {
  if (!canAdmin(role, permission)) {
    throw new ForbiddenError("Sua role não tem permissão para esta ação");
  }
}
