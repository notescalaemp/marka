"use client";

import { useState } from "react";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export default function ServicosPage() {
  const { services, professionals, addService } = useStore();
  const [name, setName] = useState("");
  const [price, setPrice] = useState(80);
  const [duration, setDuration] = useState(45);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços"
        description="Serviços do estabelecimento (genéricos por nicho)"
      />

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">Novo serviço</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="h-10 rounded-md border border-marka-graphite/20 px-3 text-sm"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="h-10 rounded-md border border-marka-graphite/20 px-3 text-sm"
            type="number"
            placeholder="Preço"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          <input
            className="h-10 rounded-md border border-marka-graphite/20 px-3 text-sm"
            type="number"
            placeholder="Duração (min)"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (!name.trim()) return;
            addService({
              name,
              description: "Novo serviço",
              price,
              durationMin: duration,
              category: "Nails",
              professionals: professionals.map((p) => p.id).slice(0, 1),
            });
            setName("");
          }}
        >
          Adicionar
        </Button>
      </Card>

      {services.length === 0 ? (
        <EmptyState title="Sem serviços" description="Adicione o primeiro." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-marka-gray">{s.description}</p>
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(s.price)}
                </p>
              </div>
              <p className="mt-2 text-xs text-marka-gray">
                {s.durationMin} min · {s.category}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
