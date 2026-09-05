"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@marka/ui/badge-status";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "novos", label: "Novos" },
  { id: "frequentes", label: "Frequentes" },
  { id: "vip", label: "VIP" },
  { id: "inativos", label: "Inativos" },
  { id: "risco", label: "Em risco" },
  { id: "aniversariantes", label: "Aniversariantes" },
] as const;

export default function ClientesPage() {
  const { clients, professionals } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    return clients.filter((c) => {
      if (filter !== "all" && c.segment !== filter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    });
  }, [clients, filter, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Lista, filtros e próxima oportunidade"
        actions={
          <input
            className="h-9 w-56 rounded-md border border-marka-graphite/20 px-3 text-sm"
            placeholder="Buscar cliente"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={
              filter === f.id
                ? "rounded-md bg-marka-black px-3 py-1.5 text-sm text-marka-white"
                : "rounded-md border border-marka-graphite/20 px-3 py-1.5 text-sm"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum cliente"
          description="Adicione clientes a partir do perfil ou CRM."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((c) => {
            const prof = professionals.find((p) => p.id === c.professionalId);
            return (
              <Link key={c.id} href={`/clientes/${c.id}`}>
                <Card className="p-4 transition hover:border-marka-black/30">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold">{c.name}</p>
                      <p className="text-sm text-marka-gray">{c.phone}</p>
                    </div>
                    <StatusBadge
                      tone={
                        c.segment === "risco"
                          ? "danger"
                          : c.segment === "vip"
                            ? "success"
                            : "default"
                      }
                    >
                      {c.segment}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <span className="text-marka-gray">Última visita:</span>{" "}
                      {c.lastVisit}
                    </p>
                    <p>
                      <span className="text-marka-gray">Frequência:</span>{" "}
                      {c.frequencyDays}d
                    </p>
                    <p>
                      <span className="text-marka-gray">Ticket médio:</span>{" "}
                      {formatPrice(c.ticketAvg)}
                    </p>
                    <p>
                      <span className="text-marka-gray">Prof:</span>{" "}
                      {prof?.name ?? "—"}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-marka-graphite">
                    Próxima: {c.nextOpportunity}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
