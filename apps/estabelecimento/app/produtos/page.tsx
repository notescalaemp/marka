"use client";

import { useState } from "react";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export default function ProdutosPage() {
  const { products, addProduct } = useStore();
  const [name, setName] = useState("");
  const [stock, setStock] = useState(10);
  const [price, setPrice] = useState(45);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Catálogo e preço de entrada"
      />

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">Novo produto</h2>
        <input
          className="field"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="grid gap-2 md:grid-cols-2">
          <input
            className="field"
            type="number"
            placeholder="Estoque"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
          />
          <input
            className="field"
            type="number"
            placeholder="Preço"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (!name.trim()) return;
            addProduct({ name, stock, minStock: 5, cost: 20, price, unit: "un" });
            setName("");
          }}
        >
          Adicionar
        </Button>
      </Card>

      <div className="stagger grid gap-3 md:grid-cols-2">
        {products.map((p) => (
          <Card key={p.id} className="p-4">
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-marka-gray">
              {formatPrice(p.price)} · estoque {p.stock} {p.unit}
            </p>
            {p.stock <= p.minStock ? (
              <p className="mt-2 text-sm text-amber-800">
                Estoque baixo · {p.minStock - p.stock} abaixo do mínimo
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
