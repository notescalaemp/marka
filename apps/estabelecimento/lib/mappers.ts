import type {
  AppointmentDto,
  AppointmentStatusApi,
  CampaignDto,
  CustomerDto,
  EstablishmentDto,
  MemberDto,
  PaymentDto,
  ProductDto,
  ProfessionalDto,
  ServiceDto,
} from "./api-types";
import type {
  Appointment,
  AppointmentStatus,
  Campaign,
  Client,
  ClientSegment,
  Establishment,
  Member,
  Product,
  Professional,
  Role,
  Service,
} from "./types";

export function num(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}

const STATUS_TO_UI: Record<AppointmentStatusApi, AppointmentStatus> = {
  AGUARDANDO: "aguardando",
  CONFIRMADO: "confirmado",
  CONCLUIDO: "concluido",
  CANCELADO: "cancelado",
  NO_SHOW: "no-show",
  BLOQUEADO: "bloqueado",
};

const STATUS_TO_API: Record<AppointmentStatus, AppointmentStatusApi> = {
  aguardando: "AGUARDANDO",
  confirmado: "CONFIRMADO",
  concluido: "CONCLUIDO",
  cancelado: "CANCELADO",
  "no-show": "NO_SHOW",
  bloqueado: "BLOQUEADO",
};

export function appointmentStatusToUi(
  status: AppointmentStatusApi
): AppointmentStatus {
  return STATUS_TO_UI[status];
}

export function appointmentStatusToApi(
  status: AppointmentStatus
): AppointmentStatusApi {
  return STATUS_TO_API[status];
}

export function categoryToUi(
  category: EstablishmentDto["category"]
): Establishment["category"] {
  if (category === "lash_designer") return "lash-designer";
  return category;
}

export function categoryToApi(
  category: Establishment["category"]
): EstablishmentDto["category"] {
  if (category === "lash-designer") return "lash_designer";
  return category;
}

export function mapEstablishment(dto: EstablishmentDto): Establishment {
  return {
    id: dto.id,
    name: dto.name,
    category: categoryToUi(dto.category),
    phone: dto.phone ?? "",
    city: dto.city ?? "",
    address: dto.address ?? "",
    hours: dto.hoursText ?? "",
    niche: dto.category,
  };
}

export function mapService(dto: ServiceDto): Service {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? "",
    price: num(dto.price),
    durationMin: dto.durationMinutes,
    category: dto.category ?? "",
    professionals: [],
    active: dto.active,
  };
}

export function mapProfessional(dto: ProfessionalDto): Professional {
  const linked =
    dto.services?.map((s) => s.service?.name ?? s.serviceId).filter(Boolean) ??
    [];
  return {
    id: dto.id,
    name: dto.member?.user.name ?? "Profissional",
    photo: dto.photoUrl ?? "",
    specialties: dto.specialties ?? [],
    services: linked,
    role: (dto.member?.role as Role) ?? "PROFESSIONAL",
    active: dto.active,
    commissionPercent: num(dto.commissionPercent),
    phone: undefined,
  };
}

function inferSegment(tags: string[], visitCount: number): ClientSegment {
  const lower = tags.map((t) => t.toLowerCase());
  if (lower.includes("vip")) return "vip";
  if (lower.includes("aniversario") || lower.includes("aniversariante")) {
    return "aniversariantes";
  }
  if (lower.includes("risco")) return "risco";
  if (lower.includes("inativo") || lower.includes("inativos")) return "inativos";
  if (lower.includes("frequente") || visitCount >= 4) return "frequentes";
  if (visitCount <= 1) return "novos";
  return "frequentes";
}

export function mapCustomer(dto: CustomerDto): Client {
  const recent = dto.recentAppointments ?? [];
  const last = recent[0];
  const ticketAvg =
    recent.length > 0
      ? recent.reduce((s, a) => s + num(a.price), 0) / recent.length
      : 0;
  return {
    id: dto.id,
    name: dto.name,
    phone: dto.phone ?? "",
    lastVisit: last?.startAt?.slice(0, 10) ?? "",
    frequencyDays: 0,
    ticketAvg,
    professionalId: last?.professional?.id ?? "",
    segment: inferSegment(dto.tags ?? [], recent.length),
    nextOpportunity: "",
    notes: dto.notes ?? undefined,
    preferences: undefined,
  };
}

export function mapAppointment(dto: AppointmentDto): Appointment {
  const start = new Date(dto.startAt);
  const date = start.toISOString().slice(0, 10);
  const time = start.toISOString().slice(11, 16);
  return {
    id: dto.id,
    clientId: dto.customerId,
    serviceId: dto.serviceId,
    professionalId: dto.professionalId,
    date,
    time,
    status: appointmentStatusToUi(dto.status),
    notes: dto.notes ?? undefined,
  };
}

export function mapProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    stock: dto.currentStock,
    minStock: dto.minStock,
    cost: num(dto.costPrice),
    price: num(dto.price),
    unit: dto.unit,
  };
}

export function mapMember(dto: MemberDto): Member {
  return {
    id: dto.id,
    name: dto.user.name,
    email: dto.user.email,
    role: dto.role as Role,
    status: dto.status === "ACTIVE" ? "ativo" : "convite_pendente",
  };
}

export function mapCampaign(dto: CampaignDto): Campaign {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.channel.toLowerCase(),
    status: dto.status.toLowerCase(),
    audience: 0,
    delivered: 0,
    conversions: 0,
    revenue: 0,
  };
}

export function mapPayment(dto: PaymentDto) {
  return {
    id: dto.id,
    amount: num(dto.amount),
    method: dto.method,
    status: dto.status,
    appointmentId: dto.appointmentId,
    customerId: dto.customerId,
    paidAt: dto.paidAt,
    createdAt: dto.createdAt,
  };
}

/** Build ISO startAt from local date + HH:mm in establishment timezone approximation (local). */
export function toStartAtIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}
