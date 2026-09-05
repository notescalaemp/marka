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
import type { Role } from "./types";
import { adminLogin, adminLogout, getAdminMe, ApiError, startAdminImpersonation, endAdminImpersonation, type Administrator } from "./api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type StoreValue = {
  administrator: Administrator | null;
  // Kept for backward-compat with existing permission checks throughout the
  // app (canAccess(role, ...)) — now always derived from the real session,
  // never settable by the frontend.
  role: Role;
  authStatus: AuthStatus;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Impersonation calls POST/DELETE /api/admin/impersonate when establishment id is available.
  impersonating: boolean;
  impersonatedName: string | null;
  startImpersonation: (target: { id: string; name: string }) => Promise<void>;
  exitImpersonation: () => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);
const FALLBACK_ROLE: Role = "read_only";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [administrator, setAdministrator] = useState<Administrator | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [authError, setAuthError] = useState<string | null>(null);
  const [impersonating, setImpersonating] = useState(false);
  const [impersonatedName, setImpersonatedName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminMe()
      .then((admin) => {
        if (cancelled) return;
        setAdministrator(admin);
        setAuthStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setAdministrator(null);
        setAuthStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      const admin = await adminLogin(email, password);
      setAdministrator(admin);
      setAuthStatus("authenticated");
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : "Não foi possível entrar");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminLogout();
    } finally {
      setAdministrator(null);
      setAuthStatus("unauthenticated");
      setImpersonating(false);
      setImpersonatedName(null);
    }
  }, []);

  const startImpersonation = useCallback(async (target: { id: string; name: string }) => {
    await startAdminImpersonation(target.id);
    setImpersonatedName(target.name);
    setImpersonating(true);
  }, []);

  const exitImpersonation = useCallback(async () => {
    try {
      await endAdminImpersonation();
    } finally {
      setImpersonating(false);
      setImpersonatedName(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      administrator,
      role: administrator?.role ?? FALLBACK_ROLE,
      authStatus,
      authError,
      login,
      logout,
      impersonating,
      impersonatedName,
      startImpersonation,
      exitImpersonation,
    }),
    [
      administrator,
      authStatus,
      authError,
      login,
      logout,
      impersonating,
      impersonatedName,
      startImpersonation,
      exitImpersonation,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
