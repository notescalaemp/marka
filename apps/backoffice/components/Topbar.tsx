"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { canAccess } from "@/lib/permissions";
import { MarkaMark } from "./MarkaMark";
import { Button } from "./Button";
import type { Role } from "@/lib/types";
import { usePathname } from "next/navigation";

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  finance: "Finance",
  support: "Support",
  operations: "Operations",
  product: "Product",
  read_only: "Read Only",
};

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
    <header className="sticky top-0 z-30 border-b border-marka-graphite/10 bg-marka-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border border-marka-graphite/10 p-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menu"
          >
            <span className="text-sm">☰</span>
          </button>
          <MarkaMark className="text-marka-black" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-marka-black">
              marka.ia · Gestão
            </p>
            <p className="text-xs text-marka-gray">
              {pathname === "/overview"
                ? "Central de operação"
                : "Backoffice"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden text-right md:block">
            <p className="text-xs font-medium text-marka-black">{administrator?.name}</p>
            <p className="text-[11px] text-marka-gray">{ROLE_LABELS[role]}</p>
          </div>
          {impersonating ? (
            <div className="hidden items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900 md:flex">
              <span className="font-medium">Impersonation</span>
              <span>{impersonatedName}</span>
              <button
                type="button"
                className="underline"
                onClick={exitImpersonation}
              >
                Sair do modo
              </button>
            </div>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => logout()}>
            Sair
          </Button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-marka-graphite/10 bg-marka-white px-4 py-3 lg:hidden">
          <a href="/overview" className="block py-2 text-sm">
            Overview
          </a>
          <a href="/establishments" className="block py-2 text-sm">
            Establishments
          </a>
          <a href="/alerts" className="block py-2 text-sm">
            Alerts
          </a>
          {canAccess(role, "impersonate") ? (
            <p className="mt-2 text-xs text-marka-gray">
              Impersonation disponível para Support/Operations.
            </p>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
