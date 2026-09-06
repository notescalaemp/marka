"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { Button } from "@marka/ui/button";
import { MarkaMark } from "./MarkaMark";
import { useStore } from "@/lib/store";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Dono",
  ADMIN: "Admin",
  MANAGER: "Gestor",
  PROFESSIONAL: "Profissional",
  STAFF: "Staff",
};

function initials(name?: string) {
  if (!name) return "ES";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase() || "ES";
}

export function Topbar() {
  const {
    establishment,
    role,
    logout,
    user,
    memberships,
    establishmentId,
    selectEstablishment,
  } = useStore();
  const router = useRouter();
  const roleLabel = ROLE_LABELS[role] ?? "Staff";

  return (
    <header className="sticky top-0 z-30 h-16 glass-panel border-b border-black/[0.06]">
      <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <MarkaMark className="text-marka-black" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-marka-black">
              {establishment?.name ?? "Sem estabelecimento"}
            </p>
            <p className="truncate text-xs text-marka-gray">
              {user?.email ?? roleLabel} · {roleLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {memberships.length > 1 ? (
            <select
              value={establishmentId ?? ""}
              onChange={(e) => void selectEstablishment(e.target.value)}
              className="field-sm hidden max-w-[10rem] md:block"
              aria-label="Estabelecimento"
            >
              {memberships.map((m) => (
                <option key={m.establishmentId} value={m.establishmentId}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : null}
          <div className="hidden items-center gap-2.5 rounded-full border border-black/[0.06] bg-white/70 py-1 pl-1 pr-3 sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-marka-gradient text-[11px] font-semibold text-white">
              {initials(user?.email)}
            </span>
            <span className="text-xs font-medium text-marka-black">{roleLabel}</span>
          </div>
          <Link href="/agenda/novo">
            <Button size="sm">
              <CalendarPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo agendamento</span>
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              void logout().then(() => router.replace("/login"));
            }}
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
