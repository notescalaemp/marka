"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { StatusBadge } from "@marka/ui/badge-status";

export default function ClientProfilePage() {
  const params = useParams<{ id: string }>();
  const { clients, professionals, services, appointments, updateClient } =
    useStore();
  const client = clients.find((c) => c.id === params.id);

  if (!client) {
    return (
      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-6">
        <h1 className="text-lg font-semibold">Cliente não encontrado</h1>
        <Link href="/clientes" className="mt-2 inline-block text-sm">
          Voltar
        </Link>
      </div>
    );
  }

  const prof = professionals.find((p) => p.id === client.professionalId);
  const history = appointments.filter((a) => a.clientId === client.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description="Memória do cliente — não apenas dados"
        actions={
          <div className="flex gap-2">
            <Link href="/clientes">
              <Button size="sm" variant="secondary">
                Voltar
              </Button>
            </Link>
            <Button size="sm" onClick={() => updateClient(client.id, { notes: client.notes ?? "" })}>
              Salvar
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Último atendimento</p>
          <p className="mt-1 text-lg font-semibold">
            {client.lastVisit}
          </p>
          <p className="mt-2 text-sm text-marka-gray">
            Frequência: {client.frequencyDays} dias
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Ticket médio</p>
          <p className="mt-1 text-lg font-semibold">
            {formatPrice(client.ticketAvg)}
          </p>
          <p className="mt-2 text-sm text-marka-gray">
            Prof. favorito: {prof?.name ?? "—"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Próxima oportunidade</p>
          <p className="mt-1 text-lg font-semibold">
            {client.nextOpportunity}
          </p>
          <p className="mt-2 text-sm text-marka-gray">
            Segmento: {client.segment}
          </p>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold">Dados</h2>
          <p className="text-sm">Telefone: {client.phone}</p>
          <p className="text-sm">
            Último serviço:{" "}
            {services.find((s) => s.id === history[0]?.serviceId)?.name ?? "—"}
          </p>
          <p className="text-sm">
            Preferência: {client.preferences?.format ?? "—"} ·{" "}
            {client.preferences?.color ?? "—"}
          </p>
          {client.notes ? (
            <p className="text-sm text-marka-graphite">{client.notes}</p>
          ) : null}
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-semibold">Beauty Memory</h2>
          <div className="rounded-md bg-marka-off p-3">
            <p className="text-sm font-medium">Preferência da cliente</p>
            <p className="text-sm">Formato: {client.preferences?.format ?? "—"}</p>
            <p className="text-sm">
              Cor: {client.preferences?.color ?? "—"}
            </p>
            <p className="text-sm">
              Observação: {client.preferences?.note ?? "—"}
            </p>
          </div>
          <StatusBadge tone="info">Uso no atendimento</StatusBadge>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-marka-graphite">
          Histórico
        </h2>
        <div className="space-y-2">
          {history.map((a) => (
            <div
              key={a.id}
              className="rounded-md border border-marka-graphite/10 bg-marka-white px-3 py-2 text-sm"
            >
              {a.date} · {a.time} ·{" "}
              {services.find((s) => s.id === a.serviceId)?.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
