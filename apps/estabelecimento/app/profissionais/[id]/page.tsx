"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export default function ProfessionalDetailPage() {
  const params = useParams<{ id: string }>();
  const { professionals, services, appointments, clients } = useStore();
  const p = professionals.find((x) => x.id === params.id);

  if (!p) {
    return (
      <div className="card p-6">
        <h1 className="text-lg font-semibold">Profissional não encontrado</h1>
        <Link href="/profissionais" className="mt-2 inline-block text-sm">
          Voltar
        </Link>
      </div>
    );
  }

  const appts = appointments.filter((a) => a.professionalId === p.id);
  const ticket =
    appts.length === 0
      ? 0
      : appts.reduce((s, a) => {
          const svc = services.find((x) => x.id === a.serviceId);
          return s + (svc?.price ?? 0);
        }, 0) / appts.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={p.name}
        description="Desempenho individual"
        actions={
          <Link href="/profissionais">
            <Button size="sm" variant="secondary">
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="stagger grid gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Comissão</p>
          <p className="mt-1 text-lg font-semibold">
            {p.commissionPercent}%
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Atendimentos</p>
          <p className="mt-1 text-lg font-semibold">{appts.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Ticket médio</p>
          <p className="mt-1 text-lg font-semibold">{formatPrice(ticket)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-marka-gray">Faturamento</p>
          <p className="mt-1 text-lg font-semibold">
            {formatPrice(appts.reduce((s, a) => {
              const svc = services.find((x) => x.id === a.serviceId);
              return s + (svc?.price ?? 0);
            }, 0))}
          </p>
        </Card>
      </div>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Serviços</h2>
        <p className="text-sm">
          {p.services.join(" · ") || "Sem serviços vinculados"}
        </p>
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 font-semibold">Clientes</h2>
        <div className="space-y-1">
          {clients
            .filter((c) => c.professionalId === p.id)
            .map((c) => (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="text-sm text-marka-graphite hover:text-marka-black"
              >
                {c.name}
              </Link>
            ))}
        </div>
      </Card>
    </div>
  );
}
