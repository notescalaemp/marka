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
  "/ambassadors": "ambassadors",
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
      <div className="flex min-h-screen items-center justify-center bg-marka-off bg-marka-mesh bg-no-repeat">
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
    <div className="flex min-h-screen bg-marka-off bg-marka-mesh bg-no-repeat">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <ImpersonationBanner />
        <main className="mx-auto w-full max-w-[1600px] flex-1 overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8">
          {allowed ? (
            children
          ) : (
            <div className="card mx-auto max-w-lg p-8 text-center">
              <h2 className="text-lg font-semibold text-marka-black">Acesso restrito</h2>
              <p className="mt-1.5 text-sm text-marka-gray">
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
