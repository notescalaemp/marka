// Centralized API client for the Consumer app. Every call goes through here
// so auth handling (cookie-based session, 401s, error shape) lives in one
// place instead of being duplicated per component.

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(body?.error?.message ?? "Erro inesperado", res.status, body?.error?.code);
  }

  return (body?.data ?? body) as T;
}

export const apiGet = <T>(path: string) => request<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined });
export const apiPatch = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "PATCH", body: data !== undefined ? JSON.stringify(data) : undefined });
export const apiDelete = <T>(path: string) => request<T>(path, { method: "DELETE" });

export interface MeMembership {
  establishmentId: string;
  role: string;
  name: string;
  slug: string;
}

export interface Me {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  emailVerifiedAt: string | null;
  memberships: MeMembership[];
}

export type ConsumerCategory = "nails" | "barbearia" | "lash-designer";
export type PaymentOption = "local" | "online";
export type BookingStatus =
  | "confirmed"
  | "completed"
  | "cancelled"
  | "reschedule"
  | "pending"
  | "no_show";

export interface ApiService {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
  category: string | null;
}

export interface ApiProfessional {
  id: string;
  name: string;
  specialty: string | null;
  photo: string | null;
  rating: number | null;
  specialties: string[];
  services: string[];
  serviceIds?: string[];
  nextSlot: string | null;
  establishmentId?: string;
  establishmentSlug?: string;
  establishmentName?: string;
}

export interface ApiEstablishment {
  id: string;
  slug: string;
  name: string;
  category: ConsumerCategory;
  photos: string[];
  rating: number | null;
  reviewsCount: number;
  location: {
    city: string | null;
    state: string | null;
    address: string | null;
  };
  distanceKm: number | null;
  priceRange: string | null;
  hours: string | null;
  nextSlotsLabel: string | null;
  description: string | null;
  services: ApiService[];
  professionals: ApiProfessional[];
  paymentOptions: PaymentOption[];
}

export interface ApiBooking {
  id: string;
  establishmentId: string;
  establishmentName: string;
  establishmentSlug: string;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  date: string;
  time: string;
  durationMin: number;
  price: number;
  status: BookingStatus;
  paymentOption: PaymentOption | null;
}

export interface PaginatedEstablishments {
  items: ApiEstablishment[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginatedBookings {
  items: ApiBooking[];
  total: number;
  page: number;
  pageSize: number;
  scope: string;
}

export interface SlotsResponse {
  date: string;
  slots: { time: string; available: boolean }[];
}

export interface FavoritesResponse {
  establishments: ApiEstablishment[];
  professionals: ApiProfessional[];
}

export interface MemoryResponse {
  lastVisitAt: string | null;
  lastServiceName: string | null;
  visitCount: number;
  topServices: { name: string; count: number }[];
  topProfessionals: { id: string; name: string; count: number }[];
}

export function getMe() {
  return apiGet<Me>("/api/auth/me");
}

export function register(input: { email: string; password: string; name: string; phone?: string }) {
  return apiPost<Me>("/api/auth/register", input);
}

export function login(email: string, password: string) {
  return apiPost<Me>("/api/auth/login", { email, password });
}

export function logout() {
  return apiPost<void>("/api/auth/logout");
}

export function requestEmailVerification() {
  return apiPost<{ message: string }>("/api/auth/email/verify/request");
}

export function confirmEmailVerification(token: string) {
  return apiPost<{ message: string }>("/api/auth/email/verify/confirm", { token });
}

export function listEstablishments(params: Record<string, string | number | undefined | null> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).length > 0) qs.set(k, String(v));
  }
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiGet<PaginatedEstablishments>(`/api/consumer/establishments${suffix}`);
}

export function getEstablishmentBySlug(slug: string) {
  return apiGet<ApiEstablishment>(`/api/consumer/establishments/${encodeURIComponent(slug)}`);
}

export function getEstablishmentServices(slugOrId: string) {
  return apiGet<ApiService[]>(
    `/api/consumer/establishments/${encodeURIComponent(slugOrId)}/services`
  );
}

export function getEstablishmentProfessionals(slugOrId: string) {
  return apiGet<ApiProfessional[]>(
    `/api/consumer/establishments/${encodeURIComponent(slugOrId)}/professionals`
  );
}

export function getSlots(input: {
  establishmentId: string;
  serviceId: string;
  professionalId?: string;
  date: string;
}) {
  const qs = new URLSearchParams({
    establishmentId: input.establishmentId,
    serviceId: input.serviceId,
    date: input.date,
  });
  if (input.professionalId) qs.set("professionalId", input.professionalId);
  return apiGet<SlotsResponse>(`/api/consumer/slots?${qs}`);
}

export function createBooking(input: {
  establishmentId: string;
  serviceId: string;
  professionalId?: string;
  date: string;
  time: string;
  paymentOption: PaymentOption;
}) {
  return apiPost<ApiBooking>("/api/consumer/bookings", input);
}

export function listBookings(scope: "upcoming" | "history" = "upcoming") {
  return apiGet<PaginatedBookings>(`/api/consumer/bookings?scope=${scope}`);
}

export function getBooking(id: string) {
  return apiGet<ApiBooking>(`/api/consumer/bookings/${encodeURIComponent(id)}`);
}

export function cancelBooking(id: string) {
  return apiPost<ApiBooking>(`/api/consumer/bookings/${encodeURIComponent(id)}/cancel`);
}

export function getFavorites() {
  return apiGet<FavoritesResponse>("/api/consumer/favorites");
}

export function favoriteEstablishment(establishmentId: string) {
  return apiPost<{ establishmentId: string }>("/api/consumer/favorites/establishments", {
    establishmentId,
  });
}

export function unfavoriteEstablishment(establishmentId: string) {
  return apiDelete<void>(
    `/api/consumer/favorites/establishments/${encodeURIComponent(establishmentId)}`
  );
}

export function favoriteProfessional(professionalId: string) {
  return apiPost<{ professionalId: string }>("/api/consumer/favorites/professionals", {
    professionalId,
  });
}

export function unfavoriteProfessional(professionalId: string) {
  return apiDelete<void>(
    `/api/consumer/favorites/professionals/${encodeURIComponent(professionalId)}`
  );
}

export function getProfile() {
  return apiGet<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    emailVerifiedAt: string | null;
  }>("/api/consumer/profile");
}

export function updateProfile(input: { name?: string; phone?: string | null }) {
  return apiPatch<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    emailVerifiedAt: string | null;
  }>("/api/consumer/profile", input);
}

export function getMemory() {
  return apiGet<MemoryResponse>("/api/consumer/profile/memory");
}
