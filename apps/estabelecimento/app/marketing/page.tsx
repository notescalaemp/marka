"use client";

import { useState } from "react";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ToastProvider";

export default function MarketingPage() {
  const { campaigns, addCampaign } = useStore();
  const toast = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState("retorno");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing"
        description="Campanhas simples para retorno e reativação"
      />

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">Nova campanha</h2>
        <input
          className="field"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="field"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="retorno">Retorno</option>
          <option value="aniversario">Aniversário</option>
          <option value="promocao">Promoção</option>
          <option value="vip">VIP</option>
          <option value="reativacao">Reativação</option>
        </select>
        <Button
          size="sm"
          onClick={() => {
            if (!name.trim()) return;
            addCampaign({ name: name.trim(), type });
            toast.show("Campanha criada");
            setName("");
          }}
        >
          Criar
        </Button>
      </Card>

      <div className="stagger space-y-2">
        {campaigns.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-marka-gray">{c.type}</p>
              </div>
              <span className="text-sm">{c.status}</span>
            </div>
            <p className="mt-2 text-sm text-marka-graphite">
              Público {c.audience} · enviados {c.delivered} · conversões{" "}
              {c.conversions}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
