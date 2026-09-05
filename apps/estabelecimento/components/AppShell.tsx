"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { ToastProvider } from "./ToastProvider";
import { canAccess } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { Permission, Role } from "@/lib/types";
import { ErrorState } from "./ErrorState";

const PUBLIC_ROUTES = ["/login", "/register", "/convite"];

const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/dashboard": "dashboard",
  "/agenda": "agenda",
  "/clientes": "clients",
  "/profissionais": "professionals",
  "/servicos": "services",
  "/financeiro": "finance",
  "/crm": "crm",
  "/marketing": "marketing",
  "/produtos": "products",
  "/estoque": "stock",
  "/relatorios": "reports",
  "/marka-ai": "ai",
  "/configuracoes": "settings",
  "/onboarding": "onboarding",
};

function resolvePermission(pathname: string): Permission | null {
  if (pathname.startsWith("/clientes/") && pathname !== "/clientes") {
    return "clients";
  }
  if (pathname.startsWith("/profissionais/") && pathname !== "/profissionais") {
    return "professionals";
  }
  if (pathname.startsWith("/convite")) return null;
  for (const [prefix, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return permission;
    }
  }
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    role,
    authStatus,
    establishmentId,
    memberships,
    dataError,
    refreshAll,
  } = useStore();
  const [ready, setReady] = useState(false);
  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  const permission = resolvePermission(pathname);
  const allowed = !permission || canAccess(role as Role, permission);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || authStatus === "loading") return;
    if (authStatus === "unauthenticated" && !isPublic) {
      router.replace("/login");
      return;
    }
    if (
      authStatus === "authenticated" &&
      !establishmentId &&
      memberships.length === 0 &&
      pathname !== "/onboarding" &&
      !isPublic
    ) {
      router.replace("/onboarding");
    }
  }, [
    authStatus,
    establishmentId,
    isPublic,
    memberships.length,
    pathname,
    ready,
    router,
  ]);

  if (!ready || authStatus === "loading") {
    return (
      <ToastProvider>
        <div className="flex min-h-screen items-center justify-center bg-marka-off text-sm text-marka-gray">
          Carregando sessão...
        </div>
      </ToastProvider>
    );
  }

  if (isPublic) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  if (authStatus !== "authenticated") {
    return (
      <ToastProvider>
        <div className="flex min-h-screen items-center justify-center text-sm text-marka-gray">
          Redirecionando...
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen pb-16 lg:pb-0">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-6 lg:px-6">
            {dataError ? (
              <div className="mb-4">
                <ErrorState description={dataError} onRetry={() => void refreshAll()} />
              </div>
            ) : null}
            {allowed ? (
              children
            ) : (
              <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-6">
                <h2 className="text-lg font-semibold">Acesso restrito</h2>
                <p className="mt-1 text-sm text-marka-gray">
                  Seu papel neste estabelecimento não permite acessar esta área.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
      <MobileNav />
    </ToastProvider>
  );
}
