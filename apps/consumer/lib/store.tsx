"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Appointment, Establishment, Professional } from "./types";
import { toUiEstablishment, toUiProfessional } from "./types";
import {
  getMe,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getFavorites,
  favoriteEstablishment,
  unfavoriteEstablishment,
  favoriteProfessional,
  unfavoriteProfessional,
  listBookings,
  createBooking,
  cancelBooking,
  ApiError,
  type Me,
  type PaymentOption,
} from "./api";

type Favorites = {
  establishments: Establishment[];
  professionals: Professional[];
};

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type StoreValue = {
  favorites: Favorites;
  favoriteEstablishmentIds: string[];
  favoriteProfessionalIds: string[];
  toggleEstablishmentFavorite: (id: string) => Promise<void>;
  toggleProfessionalFavorite: (id: string) => Promise<void>;
  isFavoriteEst: (id: string) => boolean;
  isFavoriteProf: (id: string) => boolean;
  refreshFavorites: () => Promise<void>;
  appointments: Appointment[];
  refreshAppointments: (scope?: "upcoming" | "history") => Promise<void>;
  bookAppointment: (data: {
    establishmentId: string;
    serviceId: string;
    professionalId?: string;
    date: string;
    time: string;
    paymentOption: PaymentOption;
  }) => Promise<Appointment>;
  cancelAppointment: (id: string) => Promise<void>;
  user: Me | null;
  authStatus: AuthStatus;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

function mapBooking(b: {
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
  status: Appointment["status"];
  paymentOption: PaymentOption | null;
}): Appointment {
  return {
    id: b.id,
    establishmentId: b.establishmentId,
    establishmentName: b.establishmentName,
    establishmentSlug: b.establishmentSlug,
    serviceId: b.serviceId,
    serviceName: b.serviceName,
    professionalId: b.professionalId,
    professionalName: b.professionalName,
    date: b.date,
    time: b.time,
    durationMin: b.durationMin,
    price: b.price,
    status: b.status,
    paymentOption: b.paymentOption,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorites>({
    establishments: [],
    professionals: [],
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [user, setUser] = useState<Me | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshFavorites = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setFavorites({ establishments: [], professionals: [] });
      return;
    }
    const data = await getFavorites();
    setFavorites({
      establishments: data.establishments.map(toUiEstablishment),
      professionals: data.professionals.map(toUiProfessional),
    });
  }, [authStatus]);

  const refreshAppointments = useCallback(
    async (scope: "upcoming" | "history" = "upcoming") => {
      if (authStatus !== "authenticated") {
        setAppointments([]);
        return;
      }
      const data = await listBookings(scope);
      setAppointments(data.items.map(mapBooking));
    },
    [authStatus]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        setUser(me);
        setAuthStatus("authenticated");
      } catch {
        if (cancelled) return;
        setUser(null);
        setAuthStatus("unauthenticated");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      void refreshFavorites().catch(() => {
        setFavorites({ establishments: [], professionals: [] });
      });
      void refreshAppointments("upcoming").catch(() => setAppointments([]));
    } else if (authStatus === "unauthenticated") {
      setFavorites({ establishments: [], professionals: [] });
      setAppointments([]);
    }
  }, [authStatus, refreshFavorites, refreshAppointments]);

  const favoriteEstablishmentIds = useMemo(
    () => favorites.establishments.map((e) => e.id),
    [favorites.establishments]
  );
  const favoriteProfessionalIds = useMemo(
    () => favorites.professionals.map((p) => p.id),
    [favorites.professionals]
  );

  const isFavoriteEst = useCallback(
    (id: string) => favoriteEstablishmentIds.includes(id),
    [favoriteEstablishmentIds]
  );
  const isFavoriteProf = useCallback(
    (id: string) => favoriteProfessionalIds.includes(id),
    [favoriteProfessionalIds]
  );

  const toggleEstablishmentFavorite = useCallback(
    async (id: string) => {
      if (authStatus !== "authenticated") {
        throw new ApiError("Faça login para favoritar", 401);
      }
      if (isFavoriteEst(id)) {
        await unfavoriteEstablishment(id);
      } else {
        await favoriteEstablishment(id);
      }
      await refreshFavorites();
    },
    [authStatus, isFavoriteEst, refreshFavorites]
  );

  const toggleProfessionalFavorite = useCallback(
    async (id: string) => {
      if (authStatus !== "authenticated") {
        throw new ApiError("Faça login para favoritar", 401);
      }
      if (isFavoriteProf(id)) {
        await unfavoriteProfessional(id);
      } else {
        await favoriteProfessional(id);
      }
      await refreshFavorites();
    },
    [authStatus, isFavoriteProf, refreshFavorites]
  );

  const bookAppointment = useCallback(
    async (data: {
      establishmentId: string;
      serviceId: string;
      professionalId?: string;
      date: string;
      time: string;
      paymentOption: PaymentOption;
    }) => {
      if (authStatus !== "authenticated") {
        throw new ApiError("Faça login para agendar", 401);
      }
      const booking = await createBooking(data);
      const mapped = mapBooking(booking);
      setAppointments((prev) => [mapped, ...prev.filter((a) => a.id !== mapped.id)]);
      return mapped;
    },
    [authStatus]
  );

  const cancelAppointment = useCallback(async (id: string) => {
    const updated = await cancelBooking(id);
    const mapped = mapBooking(updated);
    setAppointments((prev) => prev.map((a) => (a.id === id ? mapped : a)));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      await apiLogin(email, password);
      const me = await getMe();
      setUser(me);
      setAuthStatus("authenticated");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Falha no login";
      setAuthError(message);
      throw err;
    }
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; name: string; phone?: string }) => {
      setAuthError(null);
      try {
        await apiRegister(input);
        const me = await getMe();
        setUser(me);
        setAuthStatus("authenticated");
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Falha no cadastro";
        setAuthError(message);
        throw err;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setAuthStatus("unauthenticated");
    setFavorites({ establishments: [], professionals: [] });
    setAppointments([]);
  }, []);

  const value = useMemo(
    () => ({
      favorites,
      favoriteEstablishmentIds,
      favoriteProfessionalIds,
      toggleEstablishmentFavorite,
      toggleProfessionalFavorite,
      isFavoriteEst,
      isFavoriteProf,
      refreshFavorites,
      appointments,
      refreshAppointments,
      bookAppointment,
      cancelAppointment,
      user,
      authStatus,
      authError,
      login,
      register,
      logout,
    }),
    [
      favorites,
      favoriteEstablishmentIds,
      favoriteProfessionalIds,
      toggleEstablishmentFavorite,
      toggleProfessionalFavorite,
      isFavoriteEst,
      isFavoriteProf,
      refreshFavorites,
      appointments,
      refreshAppointments,
      bookAppointment,
      cancelAppointment,
      user,
      authStatus,
      authError,
      login,
      register,
      logout,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
