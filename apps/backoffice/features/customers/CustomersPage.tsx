"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { formatPrice } from "@/lib/format";
import { customers } from "@/lib/mock-data";
import { useToast } from "@/components/Toast";

const STATUS_FILTERS = [
  "all",
  "ativo",
  "cancelado",
  "no-show",
] as const;

export function CustomersPage() {
  const [loading] = useState(false);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const toast = useToast();

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (q.trim()) {
        if (!c.name.toLowerCase().includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [status, q]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const total = customers.reduce((s, c) => s + c.total, 0);
  const bookingConversion =
    customers.reduce((s, c) => s + c.bookings, 0) / Math.max(total, 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Consumidores finais do ecossistema marka.ia."
        actions={
          <Button size="sm" onClick={() => toast.show("Segmento criado (mock)")}>
            Novo segmento
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: String(total) },
          {
            label: "Novos (mês)",
            value: String(
              customers.filter((c) => c.status === "ativo").length
            ),
          },
          {
            label: "Agendamentos",
            value: String(
              customers.reduce((s, c) => s + c.bookings, 0)
            ),
          },
          {
            label: "Booking conversion",
            value: `${(bookingConversion * 100).toFixed(0)}%`,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-marka-graphite/10 bg-marka-white p-3"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-lg font-semibold text-marka-black">{m.value}</p>
          </div>
        ))}
      </section>

      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente..."
            className="rounded-md border border-marka-graphite/20 px-2 py-1.5 text-xs"
            aria-label="Buscar clientes"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUS_FILTERS)[number])}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro status"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Todos os status" : s}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Ajuste os filtros ou limpe a busca."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                  <th className="px-2 py-2 font-medium">Cliente</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Agendamentos</th>
                  <th className="px-2 py-2 font-medium">Ticket médio</th>
                  <th className="px-2 py-2 font-medium">Repeat booking</th>
                  <th className="px-2 py-2 font-medium">Frequência</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                  >
                    <td className="px-2 py-2 font-medium">{c.name}</td>
                    <td className="px-2 py-2 capitalize">{c.status}</td>
                    <td className="px-2 py-2">{c.bookings}</td>
                    <td className="px-2 py-2">{formatPrice(c.ticket)}</td>
                    <td className="px-2 py-2">{Math.round(c.repeat * 100)}%</td>
                    <td className="px-2 py-2">{c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
