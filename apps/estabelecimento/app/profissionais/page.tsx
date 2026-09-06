"use client";

import Link from "next/link";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export default function ProfissionaisPage() {
  const { professionals, services, clients, appointments } = useStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profissionais"
        description="Equipe, especialidades e desempenho"
      />

      <div className="stagger grid gap-3 md:grid-cols-2">
        {professionals.map((p) => {
          const servicesCount = services.filter((s) =>
            p.services.includes(s.name)
          ).length;
          const appts = appointments.filter((a) => a.professionalId === p.id);
          const ticket =
            appts.length === 0
              ? 0
              : appts.reduce((s, a) => {
                  const svc = services.find((x) => x.id === a.serviceId);
                  return s + (svc?.price ?? 0);
                }, 0) / appts.length;
          return (
            <Link key={p.id} href={`/profissionais/${p.id}`}>
              <Card interactive className="p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={p.photo}
                    alt={p.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-marka-gray">
                      {p.specialties.join(" · ")}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <p>
                    <span className="text-marka-gray">Serviços:</span>{" "}
                    {servicesCount}
                  </p>
                  <p>
                    <span className="text-marka-gray">Atend.:</span>{" "}
                    {appts.length}
                  </p>
                  <p>
                    <span className="text-marka-gray">Ticket:</span>{" "}
                    {formatPrice(ticket)}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-marka-gray">
        {clients.length} clientes no total · {professionals.length} profissionais
      </p>
    </div>
  );
}
