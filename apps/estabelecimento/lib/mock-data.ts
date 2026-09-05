import type {
  Appointment,
  Client,
  Campaign,
  Establishment,
  Member,
  Product,
  Professional,
  Service,
} from "./types";

export const establishment: Establishment = {
  id: "est-1",
  name: "Studio Vela",
  category: "nails",
  phone: "(11) 99999-0000",
  city: "São Paulo",
  address: "Av. Paulista, 1200",
  hours: "Ter–Dom · 10h–20h",
  niche: "Nails",
};

export const professionals: Professional[] = [
  {
    id: "prof-1",
    name: "Mariana",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    specialties: ["Alongamento em Gel", "Nail Art"],
    services: ["Alongamento em Gel", "Banho de Gel", "Nail Art"],
    role: "PROFESSIONAL",
    active: true,
    commissionPercent: 20,
  },
  {
    id: "prof-2",
    name: "Lucas",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    specialties: ["Corte", "Barba"],
    services: ["Corte", "Corte + Barba", "Barba"],
    role: "PROFESSIONAL",
    active: true,
    commissionPercent: 25,
  },
  {
    id: "prof-3",
    name: "Camila",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    specialties: ["Volume Russo", "Fio a Fio"],
    services: ["Extensão de Cílios", "Volume Russo", "Fio a Fio"],
    role: "PROFESSIONAL",
    active: true,
    commissionPercent: 20,
  },
];

export const services: Service[] = [
  {
    id: "svc-1",
    name: "Alongamento em Gel",
    description: "Alongamento com gel para unhas longas e reforço.",
    price: 160,
    durationMin: 90,
    category: "Nails",
    professionals: ["prof-1"],
    active: true,
  },
  {
    id: "svc-2",
    name: "Banho de Gel",
    description: "Manutenção de esmaltação em gel.",
    price: 80,
    durationMin: 45,
    category: "Nails",
    professionals: ["prof-1"],
    active: true,
  },
  {
    id: "svc-3",
    name: "Nail Art",
    description: "Desenho e nail art personalizado.",
    price: 120,
    durationMin: 60,
    category: "Nails",
    professionals: ["prof-1"],
    active: true,
  },
  {
    id: "svc-4",
    name: "Corte",
    description: "Corte clássico e fade.",
    price: 50,
    durationMin: 40,
    category: "Barbearia",
    professionals: ["prof-2"],
    active: true,
  },
  {
    id: "svc-5",
    name: "Corte + Barba",
    description: "Corte e barba em um atendimento.",
    price: 85,
    durationMin: 70,
    category: "Barbearia",
    professionals: ["prof-2"],
    active: true,
  },
  {
    id: "svc-7",
    name: "Extensão de Cílios",
    description: "Extensão natural com volume.",
    price: 220,
    durationMin: 90,
    category: "Lash",
    professionals: ["prof-3"],
    active: true,
  },
  {
    id: "svc-8",
    name: "Volume Russo",
    description: "Volume Russo com técnica de fio.",
    price: 250,
    durationMin: 120,
    category: "Lash",
    professionals: ["prof-3"],
    active: true,
  },
];

export const clients: Client[] = [
  {
    id: "cli-1",
    name: "Ana Souza",
    phone: "(11) 98888-1122",
    lastVisit: "2026-08-12",
    frequencyDays: 21,
    ticketAvg: 185,
    professionalId: "prof-1",
    segment: "vip",
    nextOpportunity: "2026-09-10",
    preferences: {
      format: "Almond",
      color: "Nude",
      note: "Prefere acabamento natural.",
    },
    notes: "VIP · retorna com frequência.",
  },
  {
    id: "cli-2",
    name: "Bruno Lima",
    phone: "(11) 97777-3344",
    lastVisit: "2026-08-28",
    frequencyDays: 14,
    ticketAvg: 140,
    professionalId: "prof-1",
    segment: "frequentes",
    nextOpportunity: "2026-09-11",
    preferences: {
      format: "Square",
      color: "Nude",
    },
  },
  {
    id: "cli-3",
    name: "Carla Mendes",
    phone: "(11) 96666-5566",
    lastVisit: "2026-07-01",
    frequencyDays: 45,
    ticketAvg: 210,
    professionalId: "prof-3",
    segment: "risco",
    nextOpportunity: "2026-09-08",
    preferences: {
      format: "Round",
      color: "Black",
      note: "Evita produto de contato.",
    },
  },
  {
    id: "cli-4",
    name: "Diego Alves",
    phone: "(11) 95555-7788",
    lastVisit: "2026-09-01",
    frequencyDays: 7,
    ticketAvg: 95,
    professionalId: "prof-2",
    segment: "novos",
    nextOpportunity: "2026-09-15",
  },
  {
    id: "cli-5",
    name: "Fernanda Costa",
    phone: "(11) 94444-9900",
    lastVisit: "2026-08-20",
    frequencyDays: 30,
    ticketAvg: 175,
    professionalId: "prof-3",
    segment: "aniversariantes",
    nextOpportunity: "2026-09-20",
  },
  {
    id: "cli-6",
    name: "Helena Prado",
    phone: "(11) 93333-1212",
    lastVisit: "2026-06-15",
    frequencyDays: 60,
    ticketAvg: 160,
    professionalId: "prof-1",
    segment: "inativos",
    nextOpportunity: "2026-09-12",
  },
];

export const appointments: Appointment[] = [
  {
    id: "appt-1",
    clientId: "cli-1",
    serviceId: "svc-1",
    professionalId: "prof-1",
    date: "2026-09-05",
    time: "10:00",
    status: "confirmado",
  },
  {
    id: "appt-2",
    clientId: "cli-2",
    serviceId: "svc-2",
    professionalId: "prof-1",
    date: "2026-09-05",
    time: "11:00",
    status: "aguardando",
  },
  {
    id: "appt-3",
    clientId: "cli-3",
    serviceId: "svc-7",
    professionalId: "prof-3",
    date: "2026-09-06",
    time: "14:00",
    status: "confirmado",
  },
  {
    id: "appt-4",
    clientId: "cli-4",
    serviceId: "svc-4",
    professionalId: "prof-2",
    date: "2026-09-04",
    time: "16:00",
    status: "concluido",
  },
  {
    id: "appt-5",
    clientId: "cli-1",
    serviceId: "svc-3",
    professionalId: "prof-1",
    date: "2026-09-12",
    time: "18:30",
    status: "bloqueado",
  },
];

export const products: Product[] = [
  {
    id: "prd-1",
    name: "Gel X",
    stock: 8,
    minStock: 10,
    cost: 25,
    price: 45,
    unit: "frasco",
  },
  {
    id: "prd-2",
    name: "Lâmina de lixa",
    stock: 40,
    minStock: 20,
    cost: 3,
    price: 12,
    unit: "un",
  },
  {
    id: "prd-3",
    name: "Pó de pigmento",
    stock: 3,
    minStock: 5,
    cost: 18,
    price: 40,
    unit: "pct",
  },
];

export const campaigns: Campaign[] = [
  {
    id: "camp-1",
    name: "Retorno de aniversário",
    type: "aniversário",
    status: "em andamento",
    audience: 18,
    delivered: 14,
    conversions: 3,
    revenue: 540,
  },
  {
    id: "camp-2",
    name: "Promo VIP",
    type: "VIP",
    status: "rascunho",
    audience: 0,
    delivered: 0,
    conversions: 0,
    revenue: 0,
  },
];

export const members: Member[] = [
  {
    id: "mem-1",
    name: "Rafael Owner",
    email: "rafael@studiovela.com",
    role: "OWNER",
    status: "ativo",
  },
  {
    id: "mem-2",
    name: "Mariana",
    email: "mariana@studiovela.com",
    role: "PROFESSIONAL",
    status: "ativo",
  },
  {
    id: "mem-3",
    name: "Ana Gestora",
    email: "ana@studiovela.com",
    role: "MANAGER",
    status: "ativo",
  },
  {
    id: "mem-4",
    name: "João Staff",
    email: "joao@studiovela.com",
    role: "STAFF",
    status: "convite_pendente",
  },
];

export function getService(id: string) {
  return services.find((s) => s.id === id);
}

export function getProfessional(id: string) {
  return professionals.find((p) => p.id === id);
}

export function getClient(id: string) {
  return clients.find((c) => c.id === id);
}

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function formatClientLabel(clientId: string) {
  return clients.find((c) => c.id === clientId)?.name ?? "—";
}
