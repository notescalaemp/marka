export type Role =
  | "super_admin"
  | "finance"
  | "support"
  | "operations"
  | "product"
  | "read_only";

export type Permission =
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
  | "audit_logs"
  | "support"
  | "administrators"
  | "settings"
  | "impersonate";

export type AdminRole =
  | "Super Admin"
  | "Finance"
  | "Support"
  | "Operations"
  | "Product"
  | "Read Only";

export type EstablishmentStatus =
  | "active"
  | "trial"
  | "inactive"
  | "suspended"
  | "canceled";

export type ChurnRisk = "high" | "medium" | "low" | "unknown";

export type ActivityType =
  | "establishment"
  | "subscription"
  | "payment"
  | "admin"
  | "system";

export type ActivityStatus = "success" | "warning" | "danger" | "info";

export interface KPI {
  label: string;
  value: string;
  delta: number;
  trend: "up" | "down" | "flat";
  context: string;
}

export interface MetricPoint {
  period: string;
  mrr: number;
  arr: number;
  users: number;
  activeBusinesses: number;
}

export interface SecondaryMetric {
  label: string;
  value: string;
  delta?: number;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  entity: string;
  at: string;
  status: ActivityStatus;
}

export interface PlanRow {
  id: string;
  name: string;
  subscribers: number;
  mrr: number;
  growth: number;
  churn: number;
  revenueShare: number;
}

export interface EstablishmentRow {
  id: string;
  name: string;
  owner: string;
  plan: string;
  status: EstablishmentStatus;
  mrr: number;
  createdAt: string;
  lastAccess: string;
  professionals: number;
  customers: number;
  utilization: number;
  churnRisk: ChurnRisk;
}

export interface EstablishmentDetail extends EstablishmentRow {
  ltv: number;
  nextBilling: string;
  activeDays: number;
  dau: number;
  wau: number;
  mau: number;
  totalPaid: number;
  failedPayments: number;
  refunds: number;
  riskScore: number;
  mrrAtRisk: number;
  riskReasons: string[];
  usage: {
    appointments: number;
    clients: number;
    professionals: number;
    services: number;
    products: number;
    campaigns: number;
    markaAiSessions: number;
    sessions: number;
  };
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    activeDays: number;
    sessions: number;
  };
}

export interface UserRow {
  id: string;
  name: string;
  establishment: string;
  type: string;
  status: string;
  lastLogin: string;
  createdAt: string;
  activity: string;
}

export interface AdminRow {
  id: string;
  name: string;
  role: AdminRole;
  status: string;
  lastLogin: string;
  recentActions: number;
}

export type SubscriptionStatus =
  | "active"
  | "trial"
  | "past_due"
  | "canceled"
  | "paused"
  | "upgraded"
  | "downgraded"
  | "expansion"
  | "contraction";

export interface SubscriptionRow {
  id: string;
  customer: string;
  establishment: string;
  plan: string;
  status: SubscriptionStatus;
  mrr: number;
  createdAt: string;
  nextBilling: string;
}

export type PaymentMethod = "PIX" | "card" | "boleto";

export interface PaymentRow {
  id: string;
  customer: string;
  establishment: string;
  value: number;
  method: PaymentMethod;
  status: "approved" | "pending" | "failed" | "refunded";
  date: string;
}

export interface FinanceMetric {
  label: string;
  value: string;
  delta?: number;
}

export interface ChurnRiskRow {
  id: string;
  establishment: string;
  plan: string;
  mrr: number;
  riskScore: number;
  lastLogin: string;
  utilization: number;
  utilizationDelta: number;
  reasons: string[];
}

export interface CustomerRow {
  id: string;
  name: string;
  total: number;
  status: string;
  bookings: number;
  ticket: number;
}

export type PermissionMap = Record<Permission, boolean>;
