"use client";

import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { InsightCard } from "@marka/ui/insight";
import { useStore } from "@/lib/store";

export default function MarkaAiPage() {
  const { clients, appointments, products } = useStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title="marka AI"
        description="Insights contextuais — não chatbot"
      />

      <div className="space-y-3">
        <InsightCard
          title="Agenda: horários livres amanhã"
          explanation="5 slots abertos — preencha com retorno VIP."
          actionLabel="Preencher horários"
          onAction={() => {
            window.location.href = "/agenda/novo";
          }}
        />
        <InsightCard
          title={`CRM: ${clients.filter((c) => c.segment === "risco").length} clientes atrasados`}
          explanation="Priorize reativação e campanhas."
          actionLabel="Ver clientes"
          onAction={() => {
            window.location.href = "/clientes";
          }}
        />
        <InsightCard
          title="Financeiro: ticket médio em alta"
          explanation="Mantenha o foco em serviços de maior valor."
          actionLabel="Ver financeiro"
          onAction={() => {
            window.location.href = "/financeiro";
          }}
        />
        <InsightCard
          title="Estoque: alerta de reposição"
          explanation={`Gel X e produtos com estoque baixo.`}
          actionLabel="Ver estoque"
          onAction={() => {
            window.location.href = "/estoque";
          }}
        />
        <InsightCard
          title="Marketing: alta probabilidade de retorno"
          explanation="31 clientes com potencial de retorno."
          actionLabel="Ver campanhas"
          onAction={() => {
            window.location.href = "/marketing";
          }}
        />
      </div>

      <Card className="p-4">
        <p className="text-sm text-marka-graphite">
          A IA deve transformar dados em ações. Atual:{" "}
          {appointments.length} agendamentos · {products.length} produtos ·{" "}
          {clients.length} clientes.
        </p>
      </Card>
    </div>
  );
}
