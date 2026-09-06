import type {
  AppointmentDto,
  AppointmentStatusApi,
  CampaignChannelApi,
  CampaignDto,
  CampaignStatusApi,
  CrmSegmentsDto,
  CustomerDto,
  EstablishmentDto,
  InvitePreviewDto,
  MeDto,
  MemberDto,
  OverviewDto,
  PageMeta,
  PaymentDto,
  PaymentMethodApi,
  PaymentStatusApi,
  ProductDto,
  ProfessionalDto,
  ReportsDto,
  ServiceDto,
  SlotsDto,
  StockMoveTypeApi,
  SubscriptionDto,
} from "./api-types";

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
  meta?: PageMeta;
  error?: { message?: string; code?: string };
};

async function requestEnvelope(
  path: string,
  init?: RequestInit
): Promise<{ data: unknown; meta?: PageMeta }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
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

async function requestWithMeta<T>(
  path: string,
  init?: RequestInit
): Promise<{ data: T; meta: PageMeta }> {
  const { data, meta } = await requestEnvelope(path, init);
  return {
    data: data as T,
    meta: meta ?? { page: 1, pageSize: 20, total: 0 },
  };
}

export const apiGet = <T>(path: string) => request<T>(path, { method: "GET" });
export const apiPost = <T>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
export const apiPatch = <T>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
export const apiDelete = <T>(path: string) =>
  request<T>(path, { method: "DELETE" });

function qs(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// --- Auth ---
export function getMe() {
  return apiGet<MeDto>("/api/auth/me");
}
export function login(email: string, password: string) {
  return apiPost<MeDto>("/api/auth/login", { email, password });
}
export function register(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) {
  return apiPost<MeDto>("/api/auth/register", input);
}
export function logout() {
  return apiPost<void>("/api/auth/logout");
}
export function requestPasswordReset(email: string) {
  return apiPost<{ message: string }>("/api/auth/password/forgot", { email });
}
export function confirmPasswordReset(token: string, password: string) {
  return apiPost<{ message: string }>("/api/auth/password/reset", {
    token,
    password,
  });
}
export function getInvite(token: string) {
  return apiGet<InvitePreviewDto>(`/api/auth/invite/${token}`);
}
export function acceptInvite(token: string) {
  return apiPost<unknown>("/api/auth/invite/accept", { token });
}
export function acceptOwnershipTransfer(token: string) {
  return apiPost<{
    establishmentId: string;
    newOwnerMemberId: string;
    newAdminMemberId: string;
  }>("/api/auth/ownership/transfer/accept", { token });
}

// --- Establishments ---
export function listEstablishments() {
  return apiGet<EstablishmentDto[]>("/api/business/establishments");
}
export function createEstablishment(input: {
  name: string;
  slug: string;
  category: "nails" | "barbearia" | "lash_designer";
  timezone?: string;
}) {
  return apiPost<EstablishmentDto>("/api/business/establishments", input);
}
export function getEstablishment(establishmentId: string) {
  return apiGet<EstablishmentDto>(`/api/business/${establishmentId}`);
}
export function updateEstablishment(
  establishmentId: string,
  input: Partial<{
    name: string;
    phone: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    description: string | null;
    hoursText: string | null;
    category: "nails" | "barbearia" | "lash_designer";
    timezone: string;
    slotStartHour: number;
    slotEndHour: number;
    acceptsLocalPayment: boolean;
    acceptsOnlinePayment: boolean;
  }>
) {
  return apiPatch<EstablishmentDto>(
    `/api/business/${establishmentId}`,
    input
  );
}

// --- Services ---
export function listServices(establishmentId: string, pageSize = 100) {
  return requestWithMeta<ServiceDto[]>(
    `/api/business/${establishmentId}/services${qs({ pageSize })}`
  );
}
export function createService(
  establishmentId: string,
  input: {
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    category?: string;
  }
) {
  return apiPost<ServiceDto>(
    `/api/business/${establishmentId}/services`,
    input
  );
}
export function updateService(
  establishmentId: string,
  serviceId: string,
  input: Partial<{
    name: string;
    description: string | null;
    durationMinutes: number;
    price: number;
    category: string | null;
    active: boolean;
  }>
) {
  return apiPatch<ServiceDto>(
    `/api/business/${establishmentId}/services/${serviceId}`,
    input
  );
}
export function deactivateService(establishmentId: string, serviceId: string) {
  return apiDelete<ServiceDto>(
    `/api/business/${establishmentId}/services/${serviceId}`
  );
}

// --- Professionals ---
export function listProfessionals(
  establishmentId: string,
  opts?: { active?: boolean; pageSize?: number }
) {
  return requestWithMeta<ProfessionalDto[]>(
    `/api/business/${establishmentId}/professionals${qs({
      pageSize: opts?.pageSize ?? 100,
      active: opts?.active === undefined ? undefined : String(opts.active),
    })}`
  );
}
export function getProfessional(
  establishmentId: string,
  professionalId: string
) {
  return apiGet<ProfessionalDto>(
    `/api/business/${establishmentId}/professionals/${professionalId}`
  );
}
export function createProfessional(
  establishmentId: string,
  input: {
    memberId: string;
    bio?: string;
    photoUrl?: string;
    specialties?: string[];
    commissionPercent?: number;
  }
) {
  return apiPost<ProfessionalDto>(
    `/api/business/${establishmentId}/professionals`,
    input
  );
}
export function updateProfessional(
  establishmentId: string,
  professionalId: string,
  input: Partial<{
    bio: string;
    photoUrl: string;
    specialties: string[];
    commissionPercent: number;
    active: boolean;
  }>
) {
  return apiPatch<ProfessionalDto>(
    `/api/business/${establishmentId}/professionals/${professionalId}`,
    input
  );
}
export function attachProfessionalService(
  establishmentId: string,
  professionalId: string,
  serviceId: string
) {
  return apiPost(
    `/api/business/${establishmentId}/professionals/${professionalId}/services`,
    { serviceId }
  );
}
export function detachProfessionalService(
  establishmentId: string,
  professionalId: string,
  serviceId: string
) {
  return apiDelete(
    `/api/business/${establishmentId}/professionals/${professionalId}/services/${serviceId}`
  );
}

// --- Customers ---
export function listCustomers(
  establishmentId: string,
  opts?: { q?: string; pageSize?: number }
) {
  return requestWithMeta<CustomerDto[]>(
    `/api/business/${establishmentId}/customers${qs({
      pageSize: opts?.pageSize ?? 100,
      q: opts?.q,
    })}`
  );
}
export function getCustomer(establishmentId: string, customerId: string) {
  return apiGet<CustomerDto>(
    `/api/business/${establishmentId}/customers/${customerId}`
  );
}
export function createCustomer(
  establishmentId: string,
  input: {
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
    tags?: string[];
  }
) {
  return apiPost<CustomerDto>(
    `/api/business/${establishmentId}/customers`,
    input
  );
}
export function updateCustomer(
  establishmentId: string,
  customerId: string,
  input: Partial<{
    name: string;
    phone: string;
    email: string;
    notes: string;
    tags: string[];
  }>
) {
  return apiPatch<CustomerDto>(
    `/api/business/${establishmentId}/customers/${customerId}`,
    input
  );
}

// --- Appointments ---
export function listAppointments(
  establishmentId: string,
  opts?: {
    from?: string;
    to?: string;
    status?: AppointmentStatusApi;
    professionalId?: string;
    customerId?: string;
    pageSize?: number;
  }
) {
  return requestWithMeta<AppointmentDto[]>(
    `/api/business/${establishmentId}/appointments${qs({
      from: opts?.from,
      to: opts?.to,
      status: opts?.status,
      professionalId: opts?.professionalId,
      customerId: opts?.customerId,
      pageSize: opts?.pageSize ?? 100,
    })}`
  );
}
export function createAppointment(
  establishmentId: string,
  input: {
    customerId: string;
    professionalId: string;
    serviceId: string;
    startAt: string;
    endAt?: string;
    notes?: string;
    price?: number;
    status?: "AGUARDANDO" | "CONFIRMADO" | "BLOQUEADO";
  }
) {
  return apiPost<AppointmentDto>(
    `/api/business/${establishmentId}/appointments`,
    input
  );
}
export function updateAppointment(
  establishmentId: string,
  appointmentId: string,
  input: Partial<{
    status: AppointmentStatusApi;
    startAt: string;
    endAt: string;
    notes: string;
    price: number;
  }>
) {
  return apiPatch<AppointmentDto>(
    `/api/business/${establishmentId}/appointments/${appointmentId}`,
    input
  );
}

// --- Slots ---
export function getSlots(
  establishmentId: string,
  opts: { date: string; serviceId: string; professionalId?: string }
) {
  return apiGet<SlotsDto>(
    `/api/business/${establishmentId}/slots${qs(opts)}`
  );
}

// --- Products / stock ---
export function listProducts(
  establishmentId: string,
  opts?: { q?: string; active?: boolean; pageSize?: number }
) {
  return requestWithMeta<ProductDto[]>(
    `/api/business/${establishmentId}/products${qs({
      pageSize: opts?.pageSize ?? 100,
      q: opts?.q,
      active: opts?.active === undefined ? undefined : String(opts.active),
    })}`
  );
}
export function createProduct(
  establishmentId: string,
  input: {
    name: string;
    sku?: string;
    unit?: string;
    costPrice?: number;
    price?: number;
    minStock?: number;
  }
) {
  return apiPost<ProductDto>(
    `/api/business/${establishmentId}/products`,
    input
  );
}
export function updateProduct(
  establishmentId: string,
  productId: string,
  input: Partial<{
    name: string;
    sku: string;
    unit: string;
    costPrice: number;
    price: number;
    minStock: number;
    active: boolean;
  }>
) {
  return apiPatch<ProductDto>(
    `/api/business/${establishmentId}/products/${productId}`,
    input
  );
}
export function postStockMovement(
  establishmentId: string,
  productId: string,
  input: { type: StockMoveTypeApi; quantity: number; reason?: string }
) {
  return apiPost<{ currentStock: number; lowStock: boolean }>(
    `/api/business/${establishmentId}/products/${productId}/stock`,
    input
  );
}

// --- Payments ---
export function listPayments(
  establishmentId: string,
  opts?: {
    status?: PaymentStatusApi;
    method?: PaymentMethodApi;
    pageSize?: number;
  }
) {
  return requestWithMeta<PaymentDto[]>(
    `/api/business/${establishmentId}/payments${qs({
      status: opts?.status,
      method: opts?.method,
      pageSize: opts?.pageSize ?? 100,
    })}`
  );
}
export function createPayment(
  establishmentId: string,
  input: {
    amount: number;
    method: PaymentMethodApi;
    appointmentId?: string;
    customerId?: string;
  }
) {
  return apiPost<PaymentDto>(
    `/api/business/${establishmentId}/payments`,
    input
  );
}

// --- Members ---
export function listMembers(establishmentId: string) {
  return apiGet<MemberDto[]>(`/api/business/${establishmentId}/members`);
}
export function inviteMember(
  establishmentId: string,
  input: {
    email: string;
    role: "ADMIN" | "MANAGER" | "PROFESSIONAL" | "STAFF";
  }
) {
  return apiPost<{ id: string; email: string; role: string; expiresAt: string }>(
    `/api/business/${establishmentId}/members/invite`,
    input
  );
}
export function updateMemberRole(
  establishmentId: string,
  memberId: string,
  role: "ADMIN" | "MANAGER" | "PROFESSIONAL" | "STAFF"
) {
  return apiPatch<MemberDto>(
    `/api/business/${establishmentId}/members/${memberId}`,
    { role }
  );
}
export function removeMember(establishmentId: string, memberId: string) {
  return apiDelete(`/api/business/${establishmentId}/members/${memberId}`);
}
export function initiateOwnershipTransfer(
  establishmentId: string,
  memberId: string
) {
  return apiPost<{ id: string; expiresAt: string }>(
    `/api/business/${establishmentId}/ownership/transfer`,
    { memberId }
  );
}

// --- Campaigns ---
export function listCampaigns(establishmentId: string, pageSize = 100) {
  return requestWithMeta<CampaignDto[]>(
    `/api/business/${establishmentId}/campaigns${qs({ pageSize })}`
  );
}
export function createCampaign(
  establishmentId: string,
  input: {
    name: string;
    channel: CampaignChannelApi;
    status?: CampaignStatusApi;
    audience?: unknown;
  }
) {
  return apiPost<CampaignDto>(
    `/api/business/${establishmentId}/campaigns`,
    input
  );
}

// --- Overview / CRM / Reports / Subscription ---
export function getOverview(
  establishmentId: string,
  opts?: { from?: string; to?: string }
) {
  return apiGet<OverviewDto>(
    `/api/business/${establishmentId}/overview${qs({
      from: opts?.from,
      to: opts?.to,
    })}`
  );
}
export function getCrmSegments(establishmentId: string) {
  return apiGet<CrmSegmentsDto>(
    `/api/business/${establishmentId}/crm/segments`
  );
}
export function getReports(
  establishmentId: string,
  opts?: { from?: string; to?: string }
) {
  return apiGet<ReportsDto>(
    `/api/business/${establishmentId}/reports${qs({
      from: opts?.from,
      to: opts?.to,
    })}`
  );
}
export function getSubscription(establishmentId: string) {
  return apiGet<SubscriptionDto | null>(
    `/api/business/${establishmentId}/subscription`
  );
}
