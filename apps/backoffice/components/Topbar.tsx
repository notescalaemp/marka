"use client";

import { useState } from "react";
import { Menu, X, ArrowLeftRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { canAccess } from "@/lib/permissions";
import { MarkaMark } from "./MarkaMark";
import { Button } from "./Button";
import type { Role } from "@/lib/types";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  finance: "Finance",
  support: "Support",
  operations: "Operations",
  product: "Product",
  read_only: "Read Only",
};

const PAGE_TITLES: Record<string, string> = {
  "/overview": "Central de operação",
  "/establishments": "Establishments",
  "/users": "Users",
  "/customers": "Customers",
  "/plans": "Plans",
  "/subscriptions": "Subscriptions",
  "/payments": "Payments",
  "/finance": "Finance",
  "/alerts": "Alerts",
  "/support": "Support",
  "/audit-logs": "Audit Logs",
  "/administrators": "Administrators",
  "/settings": "Settings",
};

function initials(name?: string) {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase() || "AD";
}

export function Topbar() {
  const pathname = usePathname();
  const {
    role,
    administrator,
    logout,
    impersonating,
    impersonatedName,
    exitImpersonation,
  } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 glass-panel border-b border-black/[0.06]">
      <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 text-marka-graphite transition-colors hover:bg-marka-off lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="lg:hidden">
            <MarkaMark className="text-marka-black" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold text-marka-black">
              {PAGE_TITLES[pathname] ?? "Backoffice"}
            </p>
            <p className="text-xs text-marka-gray">Painel administrativo marka.ia</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {impersonating ? (
            <div className="hidden items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 md:flex">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>{impersonatedName}</span>
              <button type="button" className="underline underline-offset-2" onClick={exitImpersonation}>
                Sair
              </button>
            </div>
          ) : null}
          <div className="hidden items-center gap-2.5 rounded-full border border-black/[0.06] bg-white/70 py-1 pl-1 pr-3 md:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-marka-gradient text-[11px] font-semibold text-white">
              {initials(administrator?.name)}
            </span>
            <div className="text-left leading-tight">
              <p className="text-xs font-semibold text-marka-black">{administrator?.name}</p>
              <p className="text-[11px] text-marka-gray">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => void logout()}>
            Sair
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "grid overflow-hidden border-black/[0.06] bg-white/95 backdrop-blur-xl transition-all duration-200 lg:hidden",
          open ? "grid-rows-[1fr] border-t opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden px-4 py-1">
          <a href="/overview" className="block rounded-lg px-2 py-2.5 text-sm text-marka-graphite hover:bg-marka-off">
            Overview
          </a>
          <a href="/establishments" className="block rounded-lg px-2 py-2.5 text-sm text-marka-graphite hover:bg-marka-off">
            Establishments
          </a>
          <a href="/alerts" className="block rounded-lg px-2 py-2.5 text-sm text-marka-graphite hover:bg-marka-off">
            Alerts
          </a>
          {canAccess(role, "impersonate") ? (
            <p className="px-2 pb-2 pt-1 text-xs text-marka-gray">
              Impersonation disponível para Support/Operations.
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
