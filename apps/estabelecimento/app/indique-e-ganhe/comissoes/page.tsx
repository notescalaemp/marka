"use client";

import { useEffect, useState } from "react";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { Skeleton } from "@marka/ui/skeleton";
import { useStore } from "@/lib/store";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { getAmbassadorCommissions } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/format";
import type { AmbassadorCommissionsDto } from "@/lib/api-types";

export default function MinhasComissoesPage() {
  const { establishmentId } = useStore();
  const [data, setData] = useState<AmbassadorCommissionsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!establishmentId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getAmbassadorCommissions(establishmentId));
    } catch {
      setError("Não foi possível carregar suas comissões.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishmentId]);

  return (
    <div className="space-y-6">
      <PageHeader title="Minhas comissões" description="Total gerado, pendente, aprovado e pago" />

      {error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : loading || !data ? (
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs text-marka-gray">Comissão total</p>
              <p className="mt-1 text-lg font-semibold text-marka-black">{formatPrice(data.totals.total)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-marka-gray">Comissão pendente</p>
              <p className="mt-1 text-lg font-semibold text-marka-black">{formatPrice(data.totals.pending)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-marka-gray">Comissão aprovada</p>
              <p className="mt-1 text-lg font-semibold text-marka-black">{formatPrice(data.totals.approved)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-marka-gray">Comissão paga</p>
              <p className="mt-1 text-lg font-semibold text-marka-black">{formatPrice(data.totals.paid)}</p>
            </Card>
          </div>

          <Card className="border-marka-green/30 bg-marka-green-soft/40 p-5">
            <p className="text-xs text-marka-gray">Saldo disponível</p>
            <p className="mt-1 text-2xl font-semibold text-marka-green-dark">
              {formatPrice(data.totals.availableBalance)}
            </p>
          </Card>

          <Card className="p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-marka-gray">
              Histórico de movimentações
            </p>
            {data.movements.length === 0 ? (
              <EmptyState title="Sem movimentações ainda" />
            ) : (
              <ul className="stagger space-y-2">
                {data.movements.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-marka-off"
                  >
                    <div>
                      <p className="text-sm font-medium text-marka-black">{m.label}</p>
                      <p className="text-xs text-marka-gray">{formatDate(m.date)}</p>
                    </div>
                    <span
                      className={
                        m.amount >= 0
                          ? "text-sm font-semibold text-marka-green-dark"
                          : "text-sm font-semibold text-marka-graphite"
                      }
                    >
                      {m.amount >= 0 ? "+" : "-"} {formatPrice(Math.abs(m.amount))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
