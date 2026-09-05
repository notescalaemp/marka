"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { formatPrice } from "@/lib/format";
import { getAdminChurnAnalytics } from "@/lib/api";
import type { AdminChurnAnalyticsDto } from "@/lib/api-types";

function formatChurnPct(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function ChurnPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminChurnAnalyticsDto | null>(null);
  const [reason, setReason] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dto = await getAdminChurnAnalytics();
      setData(dto);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar churn");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Churn"
          description="Customer churn, revenue churn e GRR/NRR."
        />
        <ErrorState description={error} onRetry={() => void load()} />
      </div>
    );
  }

  const kpis = data?.kpis;
  const breakdown = data?.breakdown ?? [];

  const metrics = [
    { label: "Customer churn", value: formatChurnPct(kpis?.customerChurn) },
    { label: "Revenue churn", value: formatChurnPct(kpis?.revenueChurn) },
    { label: "GRR", value: formatChurnPct(kpis?.grr) },
    { label: "NRR", value: formatChurnPct(kpis?.nrr) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Churn"
        description="Customer churn, revenue churn e GRR/NRR."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-marka-graphite/10 bg-marka-white p-3"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-lg font-semibold text-marka-black">{m.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          <h2 className="text-sm font-medium text-marka-graphite">Motivos</h2>
          <div className="mt-3 space-y-2">
            {breakdown.length === 0 ? (
              <p className="text-sm text-marka-gray">Sem breakdown disponível.</p>
            ) : (
              breakdown.map((c) => (
                <div key={c.reason}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span>{c.reason}</span>
                    <span>{c.share}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-marka-off">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${c.share}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          <h2 className="text-sm font-medium text-marka-graphite">
            MRR at risk
          </h2>
          <p className="mt-2 text-lg font-semibold text-marka-black">
            {data ? formatPrice(data.mrrAtRisk) : "—"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["all", "high", "medium"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-md border px-2.5 py-1 text-xs capitalize transition-colors ${
                  reason === r
                    ? "border-marka-black bg-marka-black text-marka-white"
                    : "border-marka-graphite/20 bg-marka-white text-marka-graphite"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-marka-gray">
            {reason === "all"
              ? "Breakdown por plano e idade do cliente ainda não disponível na API."
              : "Filtro aplicado: alta/média prioridade (sem breakdown adicional na API)."}
          </p>
        </div>
      </div>
    </div>
  );
}
