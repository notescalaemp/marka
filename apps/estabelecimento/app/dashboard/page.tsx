"use client";

import Link from "next/link";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { Button } from "@marka/ui/button";
import { StatusBadge } from "@marka/ui/badge-status";
import { useStore } from "@/lib/store";
import { countByStatus } from "@/lib/insights";
import { formatPrice, formatDateTime } from "@/lib/format";

export default function DashboardPage() {
  const {
    appointments,
    clients,
    products,
    services,
    professionals,
    freeSlots,
    establishment,
    overview,
  } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.date === today);
  const status = countByStatus(todayAppts);
  const revenue = overview?.revenue.total ?? 0;
  const ticket =
    overview?.revenue.ticketAverage ??
    clients.reduce((s, c) => s + c.ticketAvg, 0) / Math.max(clients.length, 1);
  const lowStock = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${establishment?.name ?? "Estabelecimento"} · visão do dia`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Agenda hoje</p>
          <p className="mt-1 text-2xl font-semibold">
            {overview?.appointments.total ?? todayAppts.length}
          </p>
          <p className="mt-1 text-xs text-marka-gray">
            {status.confirmado} confirmados · {status.aguardando} aguardando
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Slots livres</p>
          <p className="mt-1 text-2xl font-semibold">{freeSlots.length}</p>
          <Link
            href="/agenda/novo"
            className="mt-1 block text-xs text-marka-black underline"
          >
            Preencher horários
          </Link>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Receita</p>
          <p className="mt-1 text-2xl font-semibold">{formatPrice(revenue)}</p>
          <p className="mt-1 text-xs text-marka-gray">
            Ticket médio {formatPrice(ticket)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Alertas</p>
          <p className="mt-1 text-2xl font-semibold">{lowStock.length}</p>
          <p className="mt-1 text-xs text-marka-gray">
            {lowStock.length
              ? `${lowStock[0]?.name} em baixo estoque`
              : "Estoque ok"}
          </p>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Agenda de hoje</h2>
            <Link href="/agenda">
              <Button size="sm" variant="secondary">
                Ver agenda
              </Button>
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <p className="text-sm text-marka-gray">Nenhum agendamento hoje.</p>
          ) : (
            <ul className="space-y-2">
              {todayAppts.map((a) => {
                const client = clients.find((c) => c.id === a.clientId);
                const service = services.find((s) => s.id === a.serviceId);
                const pro = professionals.find((p) => p.id === a.professionalId);
                return (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-2 border-b border-marka-graphite/10 pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatDateTime(a.date, a.time)} · {client?.name}
                      </p>
                      <p className="text-xs text-marka-gray">
                        {service?.name} · {pro?.name}
                      </p>
                    </div>
                    <StatusBadge>{a.status}</StatusBadge>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold">Resumo</h2>
          <div className="mt-3 space-y-2 text-sm text-marka-graphite">
            <p>Clientes: {overview?.customers.total ?? clients.length}</p>
            <p>
              Agendamentos concluídos:{" "}
              {overview?.appointments.completed ??
                appointments.filter((a) => a.status === "concluido").length}
            </p>
            {overview?.occupancy != null ? (
              <p>Ocupação: {Math.round(overview.occupancy * 100)}%</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
