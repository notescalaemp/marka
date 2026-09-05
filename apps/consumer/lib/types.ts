import type {
  ApiEstablishment,
  ApiProfessional,
  ApiService,
  BookingStatus,
  ConsumerCategory,
  PaymentOption,
} from "./api";

export type CategoryId = ConsumerCategory;
export type { PaymentOption, BookingStatus };

/** UI model — location flattened for existing components. */
export interface Establishment {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  photos: string[];
  rating: number | null;
  reviewsCount: number;
  location: string;
  distanceKm: number | null;
  priceRange: string | null;
  hours: string | null;
  nextSlotsLabel?: string | null;
  description: string | null;
  services: Service[];
  professionals: Professional[];
  paymentOptions: PaymentOption[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number;
  category: string;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  photo: string;
  rating: number | null;
  specialties: string[];
  services: string[];
  serviceIds?: string[];
  nextSlot?: string | null;
  establishmentId?: string;
  establishmentSlug?: string;
  establishmentName?: string;
}

export interface Appointment {
  id: string;
  establishmentId: string;
  establishmentName?: string;
  establishmentSlug?: string;
  serviceId: string;
  serviceName?: string;
  professionalId: string;
  professionalName?: string;
  date: string;
  time: string;
  durationMin: number;
  price: number;
  status: BookingStatus;
  paymentOption: PaymentOption | null;
}

export interface FilterState {
  category: CategoryId | "all";
  location: string;
  price: string;
  rating: string;
  availability: string;
  distance: string;
  service: string;
}

export interface BookingState {
  serviceId?: string;
  professionalId?: string;
  establishmentId?: string;
  date?: string;
  time?: string;
  paymentOption?: PaymentOption;
}

export function formatLocation(loc: ApiEstablishment["location"]): string {
  return [loc.address, loc.city, loc.state].filter(Boolean).join(" — ") || "Localização não informada";
}

export function toUiService(s: ApiService): Service {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? "",
    durationMin: s.durationMin,
    price: s.price,
    category: s.category ?? "",
  };
}

export function toUiProfessional(p: ApiProfessional): Professional {
  return {
    id: p.id,
    name: p.name,
    specialty: p.specialty ?? p.specialties[0] ?? "",
    photo: p.photo ?? "",
    rating: p.rating,
    specialties: p.specialties,
    services: p.services,
    serviceIds: p.serviceIds,
    nextSlot: p.nextSlot,
    establishmentId: p.establishmentId,
    establishmentSlug: p.establishmentSlug,
    establishmentName: p.establishmentName,
  };
}

export function toUiEstablishment(e: ApiEstablishment): Establishment {
  return {
    id: e.id,
    slug: e.slug,
    name: e.name,
    category: e.category,
    photos: e.photos,
    rating: e.rating,
    reviewsCount: e.reviewsCount,
    location: formatLocation(e.location),
    distanceKm: e.distanceKm,
    priceRange: e.priceRange,
    hours: e.hours,
    nextSlotsLabel: e.nextSlotsLabel,
    description: e.description,
    services: (e.services ?? []).map(toUiService),
    professionals: (e.professionals ?? []).map(toUiProfessional),
    paymentOptions: e.paymentOptions,
  };
}

export const categories: { id: CategoryId; label: string }[] = [
  { id: "nails", label: "Nails" },
  { id: "barbearia", label: "Barbearia" },
  { id: "lash-designer", label: "Lash Designer" },
];
