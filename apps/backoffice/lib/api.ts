// Centralized API client for the Backoffice. Every call goes through here so
// auth handling (cookie-based session, 401s, error shape) lives in one
// place instead of being duplicated per component.
import type {
  AdminEstablishmentDetailDto,
  AdminEstablishmentListItemDto,
  AdminEstablishmentListMeta,
  AdminOverviewDto,
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
