export type Role =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "PROFESSIONAL"
  | "STAFF";

export type Permission =
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

export type AppointmentStatus =
  | "confirmado"
  | "aguardando"
  | "concluido"
  | "cancelado"
  | "no-show"
  | "bloqueado";

export type ClientSegment =
  | "novos"
  | "frequentes"
  | "vip"
  | "inativos"
  | "risco"
  | "aniversariantes";

export type OnboardingStep =
  | "estabelecimento"
  | "basicos"
  | "horarios"
  | "servicos"
  | "profissionais"
  | "agenda"
  | "finalizar";

export interface Establishment {
  id: string;
  name: string;
  category: "nails" | "barbearia" | "lash-designer";
  phone: string;
  city: string;
  address: string;
  hours: string;
  niche: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number;
  category: string;
  professionals: string[];
  active: boolean;
}

export interface Professional {
  id: string;
  name: string;
  photo: string;
  specialties: string[];
  services: string[];
  role: Role;
  active: boolean;
  commissionPercent: number;
  phone?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  frequencyDays: number;
  ticketAvg: number;
  professionalId: string;
  segment: ClientSegment;
  nextOpportunity: string;
  preferences?: {
    format?: string;
    color?: string;
    note?: string;
  };
  notes?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  payment?: string;
}

export interface Product {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  cost: number;
  price: number;
  unit: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  audience: number;
  delivered: number;
  conversions: number;
  revenue: number;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ativo" | "convite_pendente";
}
