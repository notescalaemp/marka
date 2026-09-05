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
import { adminLogin, adminLogout, getAdminMe, ApiError, type Administrator } from "./api";

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
  // Impersonation stays local-only: POST/DELETE /api/admin/impersonate
  // doesn't exist on the backend yet, so there is nothing real to call here.
  // See STATUS report for this gap.
  impersonating: boolean;
  impersonatedName: string | null;
  startImpersonation: (name: string) => void;
  exitImpersonation: () => void;
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

  const startImpersonation = useCallback((name: string) => {
    setImpersonatedName(name);
    setImpersonating(true);
  }, []);

  const exitImpersonation = useCallback(() => {
    setImpersonating(false);
    setImpersonatedName(null);
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
