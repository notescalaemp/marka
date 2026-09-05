"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@marka/ui/button";
import { MarkaMark } from "./MarkaMark";
import { useStore } from "@/lib/store";

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

  const roleLabel =
    role === "OWNER"
      ? "Dono"
      : role === "ADMIN"
        ? "Admin"
        : role === "MANAGER"
          ? "Gestor"
          : role === "PROFESSIONAL"
            ? "Profissional"
            : "Staff";

  return (
    <header className="sticky top-0 z-30 border-b border-marka-graphite/10 bg-marka-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <MarkaMark className="text-marka-black" />
          <div>
            <p className="text-sm font-medium text-marka-black">
              {establishment?.name ?? "Sem estabelecimento"}
            </p>
            <p className="text-xs text-marka-gray">
              {user?.email ?? roleLabel} · {roleLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {memberships.length > 1 ? (
            <select
              value={establishmentId ?? ""}
              onChange={(e) => void selectEstablishment(e.target.value)}
              className="hidden max-w-[10rem] rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs text-marka-graphite md:block"
              aria-label="Estabelecimento"
            >
              {memberships.map((m) => (
                <option key={m.establishmentId} value={m.establishmentId}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : null}
          <Link href="/agenda/novo">
            <Button size="sm" variant="secondary">
              Novo agendamento
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
