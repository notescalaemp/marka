"use client";

import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export default function EstoquePage() {
  const { products, updateProduct } = useStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque"
        description="Alertas e reposição"
      />

      <div className="space-y-2">
        {products.map((p) => {
          const daysLeft =
            p.minStock > 0
              ? Math.round((p.minStock / Math.max(p.stock, 1)) * 5)
              : 0;
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-marka-gray">
                    Custo {formatPrice(p.cost)} · preço{" "}
                    {formatPrice(p.price)}
                  </p>
                </div>
                <p className="text-sm">
                  Estoque: {p.stock}/{p.minStock}
                </p>
              </div>
              {p.stock <= p.minStock ? (
                <p className="mt-2 text-sm text-amber-800">
                  Estoque baixo · {p.name} deve acabar em ~{daysLeft} dias
                </p>
              ) : (
                <p className="mt-2 text-sm text-marka-gray">
                  Estoque acima do mínimo
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    updateProduct(p.id, { stock: Math.max(0, p.stock - 1) })
                  }
                >
                  Saída
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    updateProduct(p.id, { stock: p.stock + 1 })
                  }
                >
                  Entrada
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
