// DTOs returned by apps/api Business + Auth endpoints.
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type BusinessRole =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "PROFESSIONAL"
  | "STAFF";

export type AppointmentStatusApi =
  | "AGUARDANDO"
  | "CONFIRMADO"
  | "CONCLUIDO"
  | "CANCELADO"
  | "NO_SHOW"
  | "BLOQUEADO";

export type PaymentMethodApi = "PIX" | "CARD" | "CASH" | "OTHER";
export type PaymentStatusApi =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "CANCELED";

export type StockMoveTypeApi = "IN" | "OUT" | "ADJUSTMENT";

export type CampaignChannelApi = "EMAIL" | "WHATSAPP" | "PUSH";
export type CampaignStatusApi =
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "CANCELED";

export interface MeMembershipDto {
  establishmentId: string;
  role: BusinessRole;
  name: string;
  slug: string;
}

export interface MeDto {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  emailVerifiedAt: string | null;
  memberships: MeMembershipDto[];
}

export interface EstablishmentDto {
  id: string;
  name: string;
  slug: string;
  category: "nails" | "barbearia" | "lash_designer";
  status: string;
  timezone: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  description: string | null;
  hoursText: string | null;
  slotStartHour: number;
  slotEndHour: number;
  acceptsLocalPayment: boolean;
  acceptsOnlinePayment: boolean;
  photoUrls: string[];
  role?: BusinessRole;
}

export interface ServiceDto {
  id: string;
  establishmentId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | string;
  category: string | null;
  active: boolean;
}

export interface ProfessionalDto {
  id: string;
  establishmentId: string;
  memberId: string;
  bio: string | null;
  photoUrl: string | null;
  specialties: string[];
  commissionPercent: number | string;
  active: boolean;
  member?: {
    role: BusinessRole;
    user: { id: string; name: string; email: string };
  };
  _count?: { services: number };
  services?: Array<{ serviceId: string; service?: { id: string; name: string } }>;
}

export interface CustomerDto {
  id: string;
  establishmentId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  tags: string[];
  createdAt?: string;
  recentAppointments?: Array<{
    id: string;
    startAt: string;
    status: AppointmentStatusApi;
    price: number | string;
    service?: { id: string; name: string };
    professional?: { id: string };
  }>;
}

export interface AppointmentDto {
  id: string;
  establishmentId: string;
  customerId: string;
  professionalId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatusApi;
  price: number | string;
  notes: string | null;
  customer?: { id: string; name: string; phone: string | null };
  professional?: {
    id: string;
    member?: { user?: { name: string } };
  };
  service?: { id: string; name: string; durationMinutes: number };
}

export interface ProductDto {
  id: string;
  establishmentId: string;
  name: string;
  sku: string | null;
  unit: string;
  costPrice: number | string;
  price: number | string;
  minStock: number;
  currentStock: number;
  active: boolean;
  lowStock?: boolean;
}

export interface PaymentDto {
  id: string;
  establishmentId: string;
  amount: number | string;
  currency: string;
  method: PaymentMethodApi;
  status: PaymentStatusApi;
  appointmentId: string | null;
  customerId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface MemberDto {
  id: string;
  role: BusinessRole;
  status: "INVITED" | "ACTIVE" | "SUSPENDED";
  invitedAt: string;
  joinedAt: string | null;
  user: { id: string; name: string; email: string };
  professional: { id: string; active: boolean } | null;
}

export interface CampaignDto {
  id: string;
  establishmentId: string;
  name: string;
  channel: CampaignChannelApi;
  status: CampaignStatusApi;
  audience: unknown;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface SlotsDto {
  date: string;
  slots: Array<{ time: string; available: boolean }>;
}

export interface OverviewDto {
  period: { from: string; to: string };
  appointments: {
    total: number;
    byStatus: Record<string, number>;
    confirmed: number;
    completed: number;
    cancellations: number;
    noShows: number;
  };
  customers: { total: number };
  revenue: {
    total: number;
    paidCount: number;
    ticketAverage: number | null;
  };
  occupancy: number | null;
}

export interface CrmSegmentsDto {
  generatedAt: string;
  counts: Record<string, number>;
  segments: Record<
    string,
    Array<{
      id: string;
      name: string;
      phone: string | null;
      lastVisit: string | null;
      visitCount: number;
      ticketAvg: number;
    }>
  >;
}

export interface ReportsDto {
  period: { from: string; to: string };
  revenue: {
    total: number;
    paidCount: number;
    ticketAverage: number | null;
  };
  appointments: {
    total: number;
    byStatus: Record<string, number>;
    uniqueCustomers: number;
  };
  services: {
    catalogActive: number;
    byService: Array<{
      serviceId: string;
      name: string;
      count: number;
      revenue: number;
    }>;
  };
  professionals: {
    active: number;
    byProfessional: Array<{
      professionalId: string;
      name: string;
      count: number;
      revenue: number;
    }>;
  };
  customers: { total: number; activeInPeriod: number };
}

export interface SubscriptionDto {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
  plan: {
    id: string;
    code: string;
    name: string;
    priceMonthly: number | string;
  };
}

export interface InvitePreviewDto {
  email: string;
  role: BusinessRole;
  establishment: { id: string; name: string; slug: string };
  expiresAt: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}
