"use client";

import Link from "next/link";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { InsightCard } from "@marka/ui/insight";
import { useStore } from "@/lib/store";
import { StatusBadge } from "@marka/ui/badge-status";

export default function CrmPage() {
  const { clients } = useStore();
  const segments = {
    inativos: clients.filter((c) => c.segment === "inativos"),
    frequentes: clients.filter((c) => c.segment === "frequentes"),
    vip: clients.filter((c) => c.segment === "vip"),
    aniversariantes: clients.filter((c) => c.segment === "aniversariantes"),
    risco: clients.filter((c) => c.segment === "risco"),
    retorno: clients.filter((c) => c.segment === "novos"),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Segmentos acionáveis"
      />

      <div className="grid gap-3 md:grid-cols-2">
        <InsightCard
          title={`${segments.risco.length + segments.inativos.length} clientes atrasados para retornar`}
          explanation="Segmentos em risco e inativos — priorize reativação."
          actionLabel="Ver clientes"
          onAction={() => {
            window.location.href = "/clientes";
          }}
        />
        <InsightCard
          title={`${segments.frequentes.length + segments.aniversariantes.length} clientes com retorno próximo`}
          explanation="Reative com campanha de retorno."
          actionLabel="Criar campanha"
          onAction={() => {
            window.location.href = "/marketing";
          }}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(segments).map(([key, list]) => (
          <Card key={key} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold capitalize">
                {key === "retorno" ? "Retorno próximo" : key}
              </h2>
              <StatusBadge>{list.length}</StatusBadge>
            </div>
            <ul className="space-y-1 text-sm">
              {list.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clientes/${c.id}`}
                    className="text-marka-graphite hover:text-marka-black"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
