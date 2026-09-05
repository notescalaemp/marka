"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { supportTickets } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/format";

const TYPE_FILTERS = [
  "all",
  "billing",
  "technical",
  "onboarding",
] as const;
const STATUS_FILTERS = [
  "all",
  "open",
  "in_progress",
  "resolved",
] as const;
const PRIORITY_FILTERS = [
  "all",
  "high",
  "medium",
  "low",
] as const;

export function SupportPage() {
  const [loading] = useState(false);
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>("all");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [priority, setPriority] = useState<(typeof PRIORITY_FILTERS)[number]>(
    "all"
  );
  const [q, setQ] = useState("");
  const toast = useToast();
  const [tickets, setTickets] = useState(supportTickets);
  const [selected, setSelected] = useState(supportTickets[0]?.id ?? null);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (q.trim()) {
        const hay = `${t.subject} ${t.customer} ${t.establishment}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [type, status, priority, q, tickets]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selected),
    [tickets, selected]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const openCount = tickets.filter((t) => t.status !== "resolved").length;
  const highPriority = tickets.filter((t) => t.priority === "high").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Central de suporte interno para contas e incidentes."
        actions={
          <Button size="sm" onClick={() => toast.show("Ticket aberto (mock)")}>
            Novo ticket
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tickets abertos", value: String(openCount) },
          { label: "High priority", value: String(highPriority) },
          {
            label: "Resolved",
            value: String(
              tickets.filter((t) => t.status === "resolved").length
            ),
          },
          {
            label: "Aberto",
            value: String(tickets.filter((t) => t.status === "open").length),
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

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar ticket..."
              className="rounded-md border border-marka-graphite/20 px-2 py-1.5 text-xs"
              aria-label="Buscar tickets"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as (typeof TYPE_FILTERS)[number])}
              className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
              aria-label="Filtro tipo"
            >
              {TYPE_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "Todos os tipos" : s}
                </option>
              ))}
            </select>
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
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as (typeof PRIORITY_FILTERS)[number])}
              className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
              aria-label="Filtro prioridade"
            >
              {PRIORITY_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "Todas as prioridades" : s}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhum ticket com esses filtros"
              description="Ajuste a busca ou limpe os filtros."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                    <th className="px-2 py-2 font-medium">Ticket</th>
                    <th className="px-2 py-2 font-medium">Cliente</th>
                    <th className="px-2 py-2 font-medium">Tipo</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Prioridade</th>
                    <th className="px-2 py-2 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className={`border-b border-marka-graphite/5 hover:bg-marka-off/60 ${
                        selected === t.id ? "bg-marka-off/60" : ""
                      }`}
                    >
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          className="font-medium text-marka-black underline"
                          onClick={() => setSelected(t.id)}
                        >
                          {t.subject}
                        </button>
                      </td>
                      <td className="px-2 py-2">{t.customer}</td>
                      <td className="px-2 py-2 capitalize">{t.type}</td>
                      <td className="px-2 py-2 capitalize">{t.status}</td>
                      <td className="px-2 py-2 capitalize">{t.priority}</td>
                      <td className="px-2 py-2 text-marka-gray">
                        {formatDateTime(t.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          {!selectedTicket ? (
            <EmptyState
              title="Selecione um ticket"
              description="Escolha um ticket na lista para ver o contexto e as ações."
            />
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-marka-graphite">Detalhe</h2>
              <div>
                <p className="text-xs text-marka-gray">Assunto</p>
                <p className="text-sm font-medium">{selectedTicket.subject}</p>
              </div>
              <div>
                <p className="text-xs text-marka-gray">Estabelecimento</p>
                <p className="text-sm">{selectedTicket.establishment}</p>
              </div>
              <div>
                <p className="text-xs text-marka-gray">Prioridade</p>
                <p className="text-sm capitalize">{selectedTicket.priority}</p>
              </div>
              <div>
                <p className="text-xs text-marka-gray">Status</p>
                <p className="text-sm capitalize">{selectedTicket.status}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setTickets((prev) =>
                      prev.map((t) =>
                        t.id === selectedTicket.id
                          ? { ...t, status: "in_progress" }
                          : t
                      )
                    );
                    toast.show("Ticket em progresso");
                  }}
                >
                  Marcar em progresso
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setTickets((prev) =>
                      prev.map((t) =>
                        t.id === selectedTicket.id
                          ? { ...t, status: "resolved" }
                          : t
                      )
                    );
                    toast.show("Ticket resolvido");
                  }}
                >
                  Resolver
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
