// Centralized API client for the Backoffice. Every call goes through here so
// auth handling (cookie-based session, 401s, error shape) lives in one
// place instead of being duplicated per component.
import type {
  AdminAcquisitionDto,
  AdminAdministratorListItemDto,
  AdminAlertDto,
  AdminAuditLogDto,
  AdminChurnAnalyticsDto,
  AdminChurnRiskListDto,
  AdminCustomerListItemDto,
  AdminCustomersListDto,
  AdminEstablishmentDetailDto,
  AdminEstablishmentListItemDto,
  AdminEstablishmentListMeta,
  AdminFinanceDto,
  AdminImpersonateResponseDto,
  AdminListMeta,
  AdminOverviewDto,
  AdminPaymentListItemDto,
  AdminPaymentsListDto,
  AdminPlanDetailDto,
  AdminPlanListItemDto,
  AdminProductUsageDto,
  AdminRetentionCohortDto,
  AdminSettingsDto,
  AdminSubscriptionListItemDto,
  AdminSubscriptionsListDto,
  AdminSupportTicketDto,
  AdminSupportTicketsDto,
  AdminUserListItemDto,
  AdminUsersListDto,
} from "./api-types";
import type { Role } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type EnvelopeBody = {
  data?: unknown;
  meta?: Record<string, unknown>;
  error?: { message?: string; code?: string };
};

async function requestEnvelope(
  path: string,
  init?: RequestInit
): Promise<{ data: unknown; meta?: Record<string, unknown> }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    // The admin session lives in an httpOnly cookie (mk_admin_session) set
    // by apps/api — never a token this app reads or stores itself.
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (res.status === 204) return { data: undefined };

  const body = (await res.json().catch(() => null)) as EnvelopeBody | null;

  if (!res.ok) {
    throw new ApiError(
      body?.error?.message ?? "Erro inesperado",
      res.status,
      body?.error?.code
    );
  }

  return {
    data: body && "data" in body ? body.data : body,
    meta: body?.meta,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await requestEnvelope(path, init);
  return data as T;
}

async function requestWithMeta<T, M = Record<string, unknown>>(
  path: string,
  init?: RequestInit
): Promise<{ data: T; meta: M }> {
  const { data, meta } = await requestEnvelope(path, init);
  return { data: data as T, meta: (meta ?? {}) as M };
}

export const apiGet = <T>(path: string) => request<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, data?: unknown) =>
  request<T>(path, {
    method: "POST",
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
export const apiPatch = <T>(path: string, data?: unknown) =>
  request<T>(path, {
    method: "PATCH",
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });
export const apiDelete = <T>(path: string) =>
  request<T>(path, { method: "DELETE" });

export interface Administrator {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export function getAdminMe() {
  return apiGet<Administrator>("/api/auth/admin/me");
}

export function adminLogin(email: string, password: string) {
  return apiPost<Administrator>("/api/auth/admin/login", { email, password });
}

export function adminLogout() {
  return apiPost<void>("/api/auth/admin/logout");
}

export function getAdminOverview() {
  return apiGet<AdminOverviewDto>("/api/admin/overview");
}

export interface AdminEstablishmentsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  plan?: string;
  status?: string;
  risk?: string;
}

export function getAdminEstablishments(query: AdminEstablishmentsQuery = {}) {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.pageSize != null) params.set("pageSize", String(query.pageSize));
  if (query.search) params.set("search", query.search);
  if (query.plan) params.set("plan", query.plan);
  if (query.status) params.set("status", query.status);
  if (query.risk) params.set("risk", query.risk);

  const qs = params.toString();
  return requestWithMeta<AdminEstablishmentListItemDto[], AdminEstablishmentListMeta>(
    `/api/admin/establishments${qs ? `?${qs}` : ""}`
  );
}

export function getAdminEstablishment(id: string) {
  return apiGet<AdminEstablishmentDetailDto>(`/api/admin/establishments/${id}`);
}

function buildQuery(params: object) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export interface AdminUsersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  status?: string;
}

export function getAdminUsers(query: AdminUsersQuery = {}) {
  return requestWithMeta<AdminUsersListDto, AdminListMeta>(
    `/api/admin/users${buildQuery(query)}`
  );
}

export function getAdminPlans() {
  return apiGet<AdminPlanListItemDto[]>("/api/admin/plans");
}

export interface CreatePlanInput {
  code: string;
  name: string;
  priceMonthly: number;
  active?: boolean;
}

export function createAdminPlan(data: CreatePlanInput) {
  return apiPost<AdminPlanDetailDto>("/api/admin/plans", data);
}

export interface PatchPlanInput {
  name?: string;
  priceMonthly?: number;
  active?: boolean;
}

export function patchAdminPlan(id: string, data: PatchPlanInput) {
  return apiPatch<AdminPlanDetailDto>(`/api/admin/plans/${id}`, data);
}

export interface AdminSubscriptionsQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  plan?: string;
}

export function getAdminSubscriptions(query: AdminSubscriptionsQuery = {}) {
  return requestWithMeta<AdminSubscriptionsListDto, AdminListMeta>(
    `/api/admin/subscriptions${buildQuery(query)}`
  );
}

export interface AdminPaymentsQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  method?: string;
}

export function getAdminPayments(query: AdminPaymentsQuery = {}) {
  return requestWithMeta<AdminPaymentsListDto, AdminListMeta>(
    `/api/admin/payments${buildQuery(query)}`
  );
}

export type FinancePeriod = "7d" | "30d" | "90d";

export function getAdminFinance(period: FinancePeriod = "30d") {
  return apiGet<AdminFinanceDto>(`/api/admin/finance?period=${period}`);
}

export interface AdminCustomersQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export function getAdminCustomers(query: AdminCustomersQuery = {}) {
  return requestWithMeta<AdminCustomersListDto, AdminListMeta>(
    `/api/admin/customers${buildQuery(query)}`
  );
}

export interface AdminChurnRiskQuery {
  page?: number;
  pageSize?: number;
}

export function getAdminChurnRisk(query: AdminChurnRiskQuery = {}) {
  return requestWithMeta<AdminChurnRiskListDto, AdminListMeta>(
    `/api/admin/churn-risk${buildQuery(query)}`
  );
}

export function getAdminAlerts() {
  return apiGet<AdminAlertDto[]>("/api/admin/alerts");
}

export function getAdminSupportTickets(query: {
  search?: string;
  type?: string;
  status?: string;
  priority?: string;
} = {}) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.type && query.type !== "all") params.set("type", query.type);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.priority && query.priority !== "all") params.set("priority", query.priority);
  const qs = params.toString();
  return apiGet<AdminSupportTicketsDto>(
    `/api/admin/support/tickets${qs ? `?${qs}` : ""}`
  );
}

export function createAdminSupportTicket(input: {
  subject: string;
  description?: string;
  type: string;
  priority: string;
  customerName: string;
  establishmentId?: string;
}) {
  return apiPost<AdminSupportTicketDto>("/api/admin/support/tickets", input);
}

export function updateAdminSupportTicket(
  id: string,
  input: { status?: string; priority?: string; assigneeId?: string | null }
) {
  return apiPatch<AdminSupportTicketDto>(`/api/admin/support/tickets/${id}`, input);
}

export function getAdminAdministrators() {
  return apiGet<AdminAdministratorListItemDto[]>("/api/admin/administrators");
}

export interface CreateAdministratorInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export function createAdminAdministrator(data: CreateAdministratorInput) {
  return apiPost<AdminAdministratorListItemDto>(
    "/api/admin/administrators",
    data
  );
}

export interface PatchAdministratorInput {
  status?: "ACTIVE" | "SUSPENDED";
  role?: Role;
}

export function patchAdminAdministrator(id: string, data: PatchAdministratorInput) {
  return apiPatch<AdminAdministratorListItemDto>(
    `/api/admin/administrators/${id}`,
    data
  );
}

export interface AdminAuditLogsQuery {
  page?: number;
  pageSize?: number;
  action?: string;
  admin?: string;
}

export function getAdminAuditLogs(query: AdminAuditLogsQuery = {}) {
  return requestWithMeta<AdminAuditLogDto[], AdminListMeta>(
    `/api/admin/audit-logs${buildQuery(query)}`
  );
}

export type AnalyticsPeriod = "7d" | "30d" | "90d";

export function getAdminAcquisitionAnalytics(period?: AnalyticsPeriod) {
  const qs = period ? `?period=${period}` : "";
  return apiGet<AdminAcquisitionDto>(`/api/admin/analytics/acquisition${qs}`);
}

export function getAdminRetentionAnalytics() {
  return apiGet<{ cohorts: AdminRetentionCohortDto[] }>(
    "/api/admin/analytics/retention"
  );
}

export function getAdminProductUsageAnalytics() {
  return apiGet<AdminProductUsageDto>("/api/admin/analytics/product-usage");
}

export function getAdminChurnAnalytics() {
  return apiGet<AdminChurnAnalyticsDto>("/api/admin/analytics/churn");
}

export function getAdminSettings() {
  return apiGet<AdminSettingsDto>("/api/admin/settings");
}

export function updateAdminSettings(input: {
  brandName?: string;
  locale?: string;
  features?: Partial<AdminSettingsDto["features"]>;
}) {
  return apiPatch<AdminSettingsDto>("/api/admin/settings", input);
}

export function startAdminImpersonation(establishmentId: string) {
  return apiPost<AdminImpersonateResponseDto>("/api/admin/impersonate", {
    establishmentId,
  });
}

export function endAdminImpersonation() {
  return apiDelete<void>("/api/admin/impersonate");
}
