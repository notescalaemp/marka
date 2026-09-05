"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as api from "./api";
import { ApiError } from "./api";
import type { AuthStatus, MeDto, OverviewDto, PaymentDto } from "./api-types";
import {
  appointmentStatusToApi,
  categoryToApi,
  mapAppointment,
  mapCampaign,
  mapCustomer,
  mapEstablishment,
  mapMember,
  mapProduct,
  mapProfessional,
  mapService,
  toStartAtIso,
} from "./mappers";
import type {
  Appointment,
  AppointmentStatus,
  Campaign,
  Client,
  Establishment,
  Member,
  OnboardingStep,
  Product,
  Professional,
  Role,
  Service,
} from "./types";

const UI_PREFS_KEY = "marka-est-ui-v1";

type UiPrefs = {
  establishmentId?: string;
  agendaView?: "day" | "week";
};

function readPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    return raw ? (JSON.parse(raw) as UiPrefs) : {};
  } catch {
    return {};
  }
}

function writePrefs(partial: UiPrefs) {
  try {
    const next = { ...readPrefs(), ...partial };
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

type StoreValue = {
  authStatus: AuthStatus;
  authError: string | null;
  user: MeDto | null;
  role: Role;
  establishmentId: string | null;
  establishment: Establishment | null;
  memberships: MeDto["memberships"];
  clients: Client[];
  appointments: Appointment[];
  professionals: Professional[];
  services: Service[];
  products: Product[];
  campaigns: Campaign[];
  members: Member[];
  payments: PaymentDto[];
  overview: OverviewDto | null;
  dataLoading: boolean;
  dataError: string | null;
  onboardingStep: OnboardingStep;
  onboardingComplete: boolean;
  freeSlots: string[];
  blockedSlots: string[];
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  selectEstablishment: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  updateEstablishment: (
    partial: Partial<Establishment> & {
      hoursText?: string;
      slotStartHour?: number;
      slotEndHour?: number;
    }
  ) => Promise<void>;
  completeOnboarding: (step: OnboardingStep) => void;
  createEstablishment: (input: {
    name: string;
    slug: string;
    category: Establishment["category"];
  }) => Promise<void>;
  addAppointment: (a: Omit<Appointment, "id">) => Promise<void>;
  updateAppointment: (
    id: string,
    patch: Partial<Appointment>
  ) => Promise<void>;
  addClient: (c: Omit<Client, "id">) => Promise<void>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  addService: (
    s: Omit<Service, "id" | "active"> & { active?: boolean }
  ) => Promise<void>;
  deactivateService: (id: string) => Promise<void>;
  addProduct: (p: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  moveStock: (
    productId: string,
    type: "IN" | "OUT" | "ADJUSTMENT",
    quantity: number
  ) => Promise<void>;
  addProfessional: (p: {
    memberId: string;
    specialties?: string[];
    commissionPercent?: number;
  }) => Promise<void>;
  addCampaign: (c: { name: string; type: string }) => Promise<void>;
  inviteMember: (m: {
    name?: string;
    email: string;
    role: Role;
  }) => Promise<void>;
  updateMember: (id: string, patch: Partial<Member>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  loadSlots: (opts: {
    date: string;
    serviceId: string;
    professionalId?: string;
  }) => Promise<string[]>;
  setRole: (role: Role) => void;
  toggleBlockedSlot: (slotKey: string) => void;
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

let state: Omit<
  StoreValue,
  | "login"
  | "register"
  | "logout"
  | "refreshSession"
  | "selectEstablishment"
  | "refreshAll"
  | "updateEstablishment"
  | "completeOnboarding"
  | "createEstablishment"
  | "addAppointment"
  | "updateAppointment"
  | "addClient"
  | "updateClient"
  | "addService"
  | "deactivateService"
  | "addProduct"
  | "updateProduct"
  | "moveStock"
  | "addProfessional"
  | "addCampaign"
  | "inviteMember"
  | "updateMember"
  | "removeMember"
  | "loadSlots"
  | "setRole"
  | "toggleBlockedSlot"
> = {
  authStatus: "loading",
  authError: null,
  user: null,
  role: "OWNER",
  establishmentId: null,
  establishment: null,
  memberships: [],
  clients: [],
  appointments: [],
  professionals: [],
  services: [],
  products: [],
  campaigns: [],
  members: [],
  payments: [],
  overview: null,
  dataLoading: false,
  dataError: null,
  onboardingStep: "estabelecimento",
  onboardingComplete: false,
  freeSlots: [],
  blockedSlots: [],
};

function patchState(
  partial: Partial<typeof state>
) {
  state = { ...state, ...partial };
  emit();
}

function requireEstId(): string {
  if (!state.establishmentId) {
    throw new ApiError("Nenhum estabelecimento selecionado", 400);
  }
  return state.establishmentId;
}

async function loadOperationalData(establishmentId: string) {
  patchState({ dataLoading: true, dataError: null });
  try {
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 7);
    const to = new Date(today);
    to.setDate(to.getDate() + 30);

    const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(state.role);

    const [
      est,
      servicesRes,
      prosRes,
      customersRes,
      apptsRes,
      productsRes,
      membersRes,
      campaignsRes,
      paymentsRes,
      overview,
    ] = await Promise.all([
      api.getEstablishment(establishmentId),
      api.listServices(establishmentId),
      api.listProfessionals(establishmentId),
      api.listCustomers(establishmentId),
      api.listAppointments(establishmentId, {
        from: from.toISOString(),
        to: to.toISOString(),
        pageSize: 100,
      }),
      canManage
        ? api.listProducts(establishmentId)
        : Promise.resolve({ data: [] as Awaited<ReturnType<typeof api.listProducts>>["data"] }),
      canManage
        ? api.listMembers(establishmentId)
        : Promise.resolve([] as Awaited<ReturnType<typeof api.listMembers>>),
      canManage
        ? api.listCampaigns(establishmentId)
        : Promise.resolve({ data: [] as Awaited<ReturnType<typeof api.listCampaigns>>["data"] }),
      canManage
        ? api.listPayments(establishmentId)
        : Promise.resolve({ data: [] as Awaited<ReturnType<typeof api.listPayments>>["data"] }),
      api.getOverview(establishmentId).catch(() => null),
    ]);

    const services = servicesRes.data.map(mapService);
    const professionals = await Promise.all(
      prosRes.data.map(async (p) => {
        try {
          const detail = await api.getProfessional(establishmentId, p.id);
          return mapProfessional(detail);
        } catch {
          return mapProfessional(p);
        }
      })
    );

    // Enrich service.professionals names from links
    const servicesEnriched = services.map((s) => ({
      ...s,
      professionals: professionals
        .filter((p) => p.services.includes(s.name) || p.services.includes(s.id))
        .map((p) => p.id),
    }));

    patchState({
      establishment: mapEstablishment(est),
      services: servicesEnriched,
      professionals,
      clients: customersRes.data.map(mapCustomer),
      appointments: apptsRes.data.map(mapAppointment),
      products: productsRes.data.map(mapProduct),
      members: Array.isArray(membersRes)
        ? membersRes.map(mapMember)
        : [],
      campaigns: campaignsRes.data.map(mapCampaign),
      payments: paymentsRes.data,
      overview,
      dataLoading: false,
      dataError: null,
      onboardingComplete: true,
    });
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "Falha ao carregar dados";
    patchState({ dataLoading: false, dataError: message });
    throw err;
  }
}

async function applySession(me: MeDto) {
  const prefs = typeof window !== "undefined" ? readPrefs() : {};
  const memberships = me.memberships;
  let establishmentId =
    prefs.establishmentId &&
    memberships.some((m) => m.establishmentId === prefs.establishmentId)
      ? prefs.establishmentId
      : memberships[0]?.establishmentId ?? null;

  const membership = memberships.find(
    (m) => m.establishmentId === establishmentId
  );

  patchState({
    authStatus: "authenticated",
    authError: null,
    user: me,
    memberships,
    establishmentId,
    role: (membership?.role as Role) ?? "OWNER",
    onboardingComplete: memberships.length > 0,
  });

  if (establishmentId) {
    writePrefs({ establishmentId });
    await loadOperationalData(establishmentId);
  } else {
    patchState({
      establishment: null,
      clients: [],
      appointments: [],
      professionals: [],
      services: [],
      products: [],
      campaigns: [],
      members: [],
      payments: [],
      overview: null,
    });
  }
}

function bind(): Pick<
  StoreValue,
  | "login"
  | "register"
  | "logout"
  | "refreshSession"
  | "selectEstablishment"
  | "refreshAll"
  | "updateEstablishment"
  | "completeOnboarding"
  | "createEstablishment"
  | "addAppointment"
  | "updateAppointment"
  | "addClient"
  | "updateClient"
  | "addService"
  | "deactivateService"
  | "addProduct"
  | "updateProduct"
  | "moveStock"
  | "addProfessional"
  | "addCampaign"
  | "inviteMember"
  | "updateMember"
  | "removeMember"
  | "loadSlots"
  | "setRole"
  | "toggleBlockedSlot"
> {
  return {
    setRole: (role) => {
      // Role is server-authoritative; keep no-op for UI safety (topbar selector removed later).
      patchState({ role });
    },
    toggleBlockedSlot: () => {
      // Blocking is done via appointment status BLOQUEADO through updateAppointment/addAppointment.
    },
    completeOnboarding: (step) => {
      patchState({
        onboardingStep: step,
        onboardingComplete: step === "finalizar",
      });
    },
    refreshSession: async () => {
      try {
        const me = await api.getMe();
        await applySession(me);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          patchState({
            authStatus: "unauthenticated",
            user: null,
            establishmentId: null,
            memberships: [],
          });
          return;
        }
        patchState({
          authStatus: "unauthenticated",
          authError:
            err instanceof ApiError ? err.message : "Sessão indisponível",
        });
      }
    },
    login: async (email, password) => {
      patchState({ authError: null });
      try {
        const me = await api.login(email, password);
        await applySession(me);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Falha no login";
        patchState({ authError: message, authStatus: "unauthenticated" });
        throw err;
      }
    },
    register: async ({ name, email, password }) => {
      patchState({ authError: null });
      try {
        const me = await api.register({ name, email, password });
        await applySession(me);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Falha no registro";
        patchState({ authError: message, authStatus: "unauthenticated" });
        throw err;
      }
    },
    logout: async () => {
      try {
        await api.logout();
      } finally {
        patchState({
          authStatus: "unauthenticated",
          user: null,
          establishmentId: null,
          establishment: null,
          memberships: [],
          clients: [],
          appointments: [],
          professionals: [],
          services: [],
          products: [],
          campaigns: [],
          members: [],
          payments: [],
          overview: null,
          authError: null,
        });
      }
    },
    selectEstablishment: async (id) => {
      const membership = state.memberships.find((m) => m.establishmentId === id);
      if (!membership) throw new ApiError("Sem acesso a este estabelecimento", 403);
      writePrefs({ establishmentId: id });
      patchState({
        establishmentId: id,
        role: membership.role as Role,
      });
      await loadOperationalData(id);
    },
    refreshAll: async () => {
      const id = requireEstId();
      await loadOperationalData(id);
    },
    createEstablishment: async ({ name, slug, category }) => {
      const est = await api.createEstablishment({
        name,
        slug,
        category: categoryToApi(category),
      });
      const me = await api.getMe();
      await applySession(me);
      if (est.id) {
        await bind().selectEstablishment(est.id);
      }
    },
    updateEstablishment: async (partial) => {
      const id = requireEstId();
      const dto = await api.updateEstablishment(id, {
        name: partial.name,
        phone: partial.phone,
        city: partial.city,
        address: partial.address,
        hoursText: partial.hoursText ?? partial.hours,
        category: partial.category
          ? categoryToApi(partial.category)
          : undefined,
        slotStartHour: partial.slotStartHour,
        slotEndHour: partial.slotEndHour,
      });
      patchState({ establishment: mapEstablishment(dto) });
    },
    addAppointment: async (a) => {
      const id = requireEstId();
      await api.createAppointment(id, {
        customerId: a.clientId,
        professionalId: a.professionalId,
        serviceId: a.serviceId,
        startAt: toStartAtIso(a.date, a.time),
        notes: a.notes,
        status:
          a.status === "bloqueado"
            ? "BLOQUEADO"
            : a.status === "confirmado"
              ? "CONFIRMADO"
              : "AGUARDANDO",
      });
      await loadOperationalData(id);
    },
    updateAppointment: async (appointmentId, patch) => {
      const id = requireEstId();
      const body: Parameters<typeof api.updateAppointment>[2] = {};
      if (patch.status) body.status = appointmentStatusToApi(patch.status);
      if (patch.notes !== undefined) body.notes = patch.notes;
      if (patch.date && patch.time) {
        body.startAt = toStartAtIso(patch.date, patch.time);
      }
      await api.updateAppointment(id, appointmentId, body);
      await loadOperationalData(id);
    },
    addClient: async (c) => {
      const id = requireEstId();
      await api.createCustomer(id, {
        name: c.name,
        phone: c.phone || undefined,
        notes: c.notes,
      });
      await loadOperationalData(id);
    },
    updateClient: async (customerId, patch) => {
      const id = requireEstId();
      await api.updateCustomer(id, customerId, {
        name: patch.name,
        phone: patch.phone,
        notes: patch.notes,
      });
      await loadOperationalData(id);
    },
    addService: async (s) => {
      const id = requireEstId();
      await api.createService(id, {
        name: s.name,
        description: s.description || undefined,
        durationMinutes: s.durationMin,
        price: s.price,
        category: s.category || undefined,
      });
      await loadOperationalData(id);
    },
    deactivateService: async (serviceId) => {
      const id = requireEstId();
      await api.deactivateService(id, serviceId);
      await loadOperationalData(id);
    },
    addProduct: async (p) => {
      const id = requireEstId();
      await api.createProduct(id, {
        name: p.name,
        unit: p.unit,
        costPrice: p.cost,
        price: p.price,
        minStock: p.minStock,
      });
      await loadOperationalData(id);
    },
    updateProduct: async (productId, patch) => {
      const id = requireEstId();
      await api.updateProduct(id, productId, {
        name: patch.name,
        unit: patch.unit,
        costPrice: patch.cost,
        price: patch.price,
        minStock: patch.minStock,
      });
      await loadOperationalData(id);
    },
    moveStock: async (productId, type, quantity) => {
      const id = requireEstId();
      await api.postStockMovement(id, productId, { type, quantity });
      await loadOperationalData(id);
    },
    addProfessional: async (p) => {
      const id = requireEstId();
      await api.createProfessional(id, {
        memberId: p.memberId,
        specialties: p.specialties,
        commissionPercent: p.commissionPercent,
      });
      await loadOperationalData(id);
    },
    addCampaign: async (c) => {
      const id = requireEstId();
      const channelMap: Record<string, "EMAIL" | "WHATSAPP" | "PUSH"> = {
        retorno: "WHATSAPP",
        aniversario: "WHATSAPP",
        promocao: "EMAIL",
        vip: "EMAIL",
        reativacao: "WHATSAPP",
        email: "EMAIL",
        whatsapp: "WHATSAPP",
        push: "PUSH",
      };
      await api.createCampaign(id, {
        name: c.name,
        channel: channelMap[c.type] ?? "WHATSAPP",
      });
      await loadOperationalData(id);
    },
    inviteMember: async (m) => {
      const id = requireEstId();
      const role = m.role === "OWNER" ? "STAFF" : m.role;
      await api.inviteMember(id, {
        email: m.email,
        role: role as "ADMIN" | "MANAGER" | "PROFESSIONAL" | "STAFF",
      });
      await loadOperationalData(id);
    },
    updateMember: async (memberId, patch) => {
      const id = requireEstId();
      if (patch.role && patch.role !== "OWNER") {
        await api.updateMemberRole(
          id,
          memberId,
          patch.role as "ADMIN" | "MANAGER" | "PROFESSIONAL" | "STAFF"
        );
      }
      await loadOperationalData(id);
    },
    removeMember: async (memberId) => {
      const id = requireEstId();
      await api.removeMember(id, memberId);
      await loadOperationalData(id);
    },
    loadSlots: async (opts) => {
      const id = requireEstId();
      const result = await api.getSlots(id, opts);
      const free = result.slots.filter((s) => s.available).map((s) => `${result.date}:${s.time}`);
      patchState({ freeSlots: free });
      return free;
    },
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void bind().refreshSession();
  }, []);

  return <>{children}</>;
}

export function useStore(): StoreValue {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const methods = bind();

  return {
    ...state,
    ...methods,
  };
}

export function useAuthGate() {
  const store = useStore();
  return {
    authStatus: store.authStatus,
    authenticated: store.authStatus === "authenticated",
    ready: store.authStatus !== "loading",
  };
}
