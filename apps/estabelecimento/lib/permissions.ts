import type { Permission, Role } from "./types";

const ROLE_PERMISSIONS: Record<Role, Set<Permission | "*">> = {
  OWNER: new Set(["*"]),
  ADMIN: new Set(["*"]),
  MANAGER: new Set([
    "dashboard",
    "agenda",
    "clients",
    "professionals",
    "services",
    "finance",
    "crm",
    "marketing",
    "products",
    "stock",
    "reports",
    "ai",
  ]),
  PROFESSIONAL: new Set([
    "dashboard",
    "agenda",
    "clients",
    "services",
    "crm",
    "ai",
  ]),
  STAFF: new Set(["dashboard", "agenda", "clients"]),
};

export function canAccess(role: Role, permission: Permission): boolean {
  if (role === "OWNER" || role === "ADMIN") return true;
  const allowed = ROLE_PERMISSIONS[role];
  return allowed.has(permission) || allowed.has("*");
}
