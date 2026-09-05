"use client";

import { useMemo, useState } from "react";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { InsightCard } from "@marka/ui/insight";

export default function FinanceiroPage() {
  const { appointments, services, clients, professionals } = useStore();
  const [period, setPeriod] = useState("30d");
  const [professionalId, setProfessionalId] = useState("all");

  const metrics = useMemo(() => {
    const revenue = appointments.reduce((s, a) => {
      const svc = services.find((x) => x.id === a.serviceId);
      return s + (svc?.price ?? 0);
    }, 0);
    const ticket =
      clients.reduce((s, c) => s + c.ticketAvg, 0) / Math.max(clients.length, 1);
    return { revenue, ticket };
  }, [appointments, services, clients]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Faturamento, ticket médio e evolução"
      />

      <div className="flex flex-wrap gap-2">
        {["7d", "30d", "mês"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={
              period === p
                ? "rounded-md bg-marka-black px-3 py-1.5 text-sm text-marka-white"
                : "rounded-md border border-marka-graphite/20 px-3 py-1.5 text-sm"
            }
          >
            {p}
          </button>
        ))}
        <select
          className="h-9 rounded-md border border-marka-graphite/20 px-2 text-sm"
          value={professionalId}
          onChange={(e) => setProfessionalId(e.target.value)}
        >
          <option value="all">Todos profissionais</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Receitas</p>
          <p className="mt-1 text-lg font-semibold">
            {formatPrice(metrics.revenue)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Ticket médio</p>
          <p className="mt-1 text-lg font-semibold">
            {formatPrice(metrics.ticket)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Período</p>
          <p className="mt-1 text-lg font-semibold capitalize">{period}</p>
        </Card>
      </div>

      <InsightCard
        title="Seu ticket médio aumentou 7% neste período"
        explanation="Com base nos tickets dos últimos agendamentos e clientes."
        actionLabel="Ver clientes"
        onAction={() => {
          window.location.href = "/clientes";
        }}
      />

      <Card className="p-4">
        <h2 className="mb-2 font-semibold">Evolução</h2>
        <p className="text-sm text-marka-graphite">
          Filtrando {professionalId === "all" ? "todos" : "um profissional"} ·{" "}
          {metrics.revenue.toLocaleString("pt-BR")} no total do mock.
        </p>
      </Card>
    </div>
  );
}
