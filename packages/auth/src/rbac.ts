// Mirrors apps/estabelecimento/lib/types.ts + permissions.ts exactly, so the
// contract between apps/api and the Business frontend never drifts. If that
// file's Role/Permission unions change, update this alongside it.

export type BusinessRole = "OWNER" | "ADMIN" | "MANAGER" | "PROFESSIONAL" | "STAFF";

export type BusinessPermission =
  | "dashboard"
  | "agenda"
  | "clients"
  | "professionals"
  | "services"
  | "finance"
  | "crm"
  | "marketing"
  | "products"
  | "stock"
  | "reports"
  | "settings"
  | "ai"
  | "onboarding";

const BUSINESS_ROLE_PERMISSIONS: Record<BusinessRole, ReadonlySet<BusinessPermission | "*">> = {
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
  PROFESSIONAL: new Set(["dashboard", "agenda", "clients", "services", "crm", "ai"]),
  STAFF: new Set(["dashboard", "agenda", "clients"]),
};

export function canBusiness(role: BusinessRole, permission: BusinessPermission): boolean {
  if (role === "OWNER" || role === "ADMIN") return true;
  const allowed = BUSINESS_ROLE_PERMISSIONS[role];
  return allowed.has(permission) || allowed.has("*");
}

// Mirrors apps/backoffice/lib/types.ts + permissions.ts exactly.

export type AdminRole = "super_admin" | "finance" | "support" | "operations" | "product" | "read_only";

export type AdminPermission =
  | "overview"
  | "establishments"
  | "establishment_detail"
  | "users"
  | "plans"
  | "subscriptions"
  | "payments"
  | "finance"
  | "customers"
  | "product_usage"
  | "acquisition"
  | "retention"
  | "churn"
  | "churn_risk"
  | "alerts"
  | "support"
  | "audit_logs"
  | "administrators"
  | "settings"
  | "impersonate"
  | "ambassadors";

const ADMIN_ALL: AdminPermission[] = [
  "overview",
  "establishments",
  "establishment_detail",
  "users",
  "plans",
  "subscriptions",
  "payments",
  "finance",
  "customers",
  "product_usage",
  "acquisition",
  "retention",
  "churn",
  "churn_risk",
  "alerts",
  "support",
  "audit_logs",
  "administrators",
  "settings",
  "impersonate",
  "ambassadors",
];

const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: ADMIN_ALL,
  finance: [
    "overview",
    "establishments",
    "establishment_detail",
    "plans",
    "subscriptions",
    "payments",
    "finance",
    "churn",
    "alerts",
    "audit_logs",
    "settings",
    "ambassadors",
  ],
  support: [
    "overview",
    "establishments",
    "establishment_detail",
    "users",
    "customers",
    "churn_risk",
    "alerts",
    "support",
    "audit_logs",
    "impersonate",
  ],
  operations: [
    "overview",
    "establishments",
    "establishment_detail",
    "users",
    "plans",
    "subscriptions",
    "payments",
    "finance",
    "product_usage",
    "churn",
    "churn_risk",
    "alerts",
    "support",
    "audit_logs",
    "ambassadors",
  ],
  product: [
    "overview",
    "establishments",
    "establishment_detail",
    "product_usage",
    "acquisition",
    "retention",
    "churn",
    "alerts",
    "audit_logs",
    "settings",
  ],
  read_only: [
    "overview",
    "establishments",
    "establishment_detail",
    "users",
    "plans",
    "subscriptions",
    "payments",
    "finance",
    "customers",
    "product_usage",
    "acquisition",
    "retention",
    "churn",
    "churn_risk",
    "alerts",
    "support",
    "audit_logs",
  ],
};

export function canAdmin(role: AdminRole, permission: AdminPermission): boolean {
  return Boolean(ADMIN_ROLE_PERMISSIONS[role]?.includes(permission));
}
