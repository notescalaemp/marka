"use client";

import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export default function RelatoriosPage() {
  const { appointments, clients, services, professionals } = useStore();

  const revenue = appointments.reduce((s, a) => {
    const svc = services.find((x) => x.id === a.serviceId);
    return s + (svc?.price ?? 0);
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Informações úteis para gestão"
      />

      <div className="stagger grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-semibold">Faturamento</h2>
          <p className="mt-1 text-lg font-medium">{formatPrice(revenue)}</p>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Serviços</h2>
          <p className="mt-1 text-lg font-medium">{services.length}</p>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Profissionais</h2>
          <p className="mt-1 text-lg font-medium">{professionals.length}</p>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Clientes</h2>
          <p className="mt-1 text-lg font-medium">{clients.length}</p>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Agenda</h2>
          <p className="mt-1 text-lg font-medium">{appointments.length}</p>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold">Cancelamentos</h2>
          <p className="mt-1 text-lg font-medium">
            {appointments.filter((a) => a.status === "cancelado").length}
          </p>
        </Card>
      </div>
    </div>
  );
}
