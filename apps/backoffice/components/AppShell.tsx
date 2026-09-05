"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { LoginScreen } from "./LoginScreen";
import { Skeleton } from "./Skeleton";
import { canAccess } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { Permission, Role } from "@/lib/types";

const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/overview": "overview",
  "/establishments": "establishments",
  "/users": "users",
  "/customers": "customers",
  "/plans": "plans",
  "/subscriptions": "subscriptions",
  "/payments": "payments",
  "/finance": "finance",
  "/analytics/product-usage": "product_usage",
  "/analytics/acquisition": "acquisition",
  "/analytics/retention": "retention",
  "/analytics/churn": "churn",
  "/analytics/churn-risk": "churn_risk",
  "/alerts": "alerts",
  "/support": "support",
  "/audit-logs": "audit_logs",
  "/administrators": "administrators",
  "/settings": "settings",
};

function resolvePermission(pathname: string): Permission | null {
  if (pathname.startsWith("/establishments/") && pathname !== "/establishments") {
    return "establishment_detail";
  }
  for (const [prefix, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return permission;
    }
  }
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, authStatus } = useStore();
  const permission = resolvePermission(pathname);
  const allowed = !permission || canAccess(role as Role, permission);

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-marka-off">
        <div className="w-full max-w-sm space-y-3 px-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return <LoginScreen />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <ImpersonationBanner />
        <main className="flex-1 px-4 py-6 lg:px-6">
          {allowed ? (
            children
          ) : (
            <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-6">
              <h2 className="text-lg font-semibold">Acesso restrito</h2>
              <p className="mt-1 text-sm text-marka-gray">
                Sua role atual ({role}) não tem permissão para acessar esta
                área.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
