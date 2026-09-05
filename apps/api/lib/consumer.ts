import type {
  AppointmentStatus,
  Establishment,
  EstablishmentCategory,
  Professional,
  Service,
} from "@marka/db";

// Consumer-facing category strings match apps/consumer CategoryId.
export type ConsumerCategory = "nails" | "barbearia" | "lash-designer";

export type ConsumerPaymentOption = "local" | "online";

export type ConsumerBookingStatus =
  | "confirmed"
  | "completed"
  | "cancelled"
  | "reschedule"
  | "pending"
  | "no_show";

/** Establishments visible in the Consumer marketplace. */
export const PUBLIC_ESTABLISHMENT_STATUSES = ["trial", "active"] as const;

export function toConsumerCategory(category: EstablishmentCategory): ConsumerCategory {
  if (category === "lash_designer") return "lash-designer";
  return category;
}

export function fromConsumerCategory(category: string): EstablishmentCategory | null {
  if (category === "nails" || category === "barbearia") return category;
  if (category === "lash-designer" || category === "lash_designer") return "lash_designer";
  return null;
}

export function paymentOptionsOf(est: {
  acceptsLocalPayment: boolean;
  acceptsOnlinePayment: boolean;
}): ConsumerPaymentOption[] {
  const opts: ConsumerPaymentOption[] = [];
  if (est.acceptsLocalPayment) opts.push("local");
  if (est.acceptsOnlinePayment) opts.push("online");
  return opts;
}

export function mapAppointmentStatus(status: AppointmentStatus): ConsumerBookingStatus {
  switch (status) {
    case "AGUARDANDO":
      return "pending";
    case "CONFIRMADO":
      return "confirmed";
    case "CONCLUIDO":
      return "completed";
    case "CANCELADO":
      return "cancelled";
    case "NO_SHOW":
      return "no_show";
    case "BLOQUEADO":
      return "reschedule";
    default:
      return "pending";
  }
}

export function formatPriceRange(prices: number[]): string | null {
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  if (min === max) return fmt(min);
  return `${fmt(min)}–${fmt(max)}`;
}

type ServiceRow = Pick<
  Service,
  "id" | "name" | "description" | "durationMinutes" | "price" | "category" | "active"
>;

type ProfessionalRow = Professional & {
  member: { user: { name: string } };
  services: { service: { id: string; name: string } }[];
};

export function serializeService(s: ServiceRow) {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    durationMin: s.durationMinutes,
    price: Number(s.price),
    category: s.category,
  };
}

export function serializeProfessional(p: ProfessionalRow) {
  return {
    id: p.id,
    name: p.member.user.name,
    specialty: p.specialties[0] ?? null,
    photo: p.photoUrl,
    rating: null as number | null,
    specialties: p.specialties,
    services: p.services.map((ps) => ps.service.name),
    serviceIds: p.services.map((ps) => ps.service.id),
    nextSlot: null as string | null,
  };
}

export function serializeEstablishment(
  est: Establishment & {
    services?: ServiceRow[];
    professionals?: ProfessionalRow[];
  },
  opts?: { includeCatalog?: boolean }
) {
  const activeServices = (est.services ?? []).filter((s) => s.active);
  const activeProfessionals = (est.professionals ?? []).filter((p) => p.active);

  return {
    id: est.id,
    slug: est.slug,
    name: est.name,
    category: toConsumerCategory(est.category),
    photos: est.photoUrls,
    rating: null as number | null,
    reviewsCount: 0,
    location: {
      city: est.city,
      state: est.state,
      address: est.address,
    },
    distanceKm: null as number | null,
    priceRange: formatPriceRange(activeServices.map((s) => Number(s.price))),
    hours: est.hoursText,
    nextSlotsLabel: null as string | null,
    description: est.description,
    paymentOptions: paymentOptionsOf(est),
    ...(opts?.includeCatalog !== false
      ? {
          services: activeServices.map(serializeService),
          professionals: activeProfessionals.map(serializeProfessional),
        }
      : {}),
  };
}

/** YYYY-MM-DD + HH:mm wall-clock in `timeZone` → UTC Date. */
export function combineDateTime(date: string, time: string, timeZone: string): Date {
  const targetUtcMs = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    Number(time.slice(0, 2)),
    Number(time.slice(3, 5)),
    0
  );

  let guess = new Date(`${date}T${time}:00.000Z`);
  for (let i = 0; i < 3; i += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(guess);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
    const hourRaw = get("hour");
    const asLocalMs = Date.UTC(
      Number(get("year")),
      Number(get("month")) - 1,
      Number(get("day")),
      Number(hourRaw === "24" ? "0" : hourRaw),
      Number(get("minute")),
      Number(get("second"))
    );
    guess = new Date(guess.getTime() + (targetUtcMs - asLocalMs));
  }
  return guess;
}

export function formatTimeHHMM(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function formatDateYYYYMMDD(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
