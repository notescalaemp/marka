"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { formatPrice } from "@/lib/format";
import { getAdminFinance, type FinancePeriod } from "@/lib/api";
import type { AdminFinanceDto } from "@/lib/api-types";

const PERIODS = [
  { id: "7d" as const, label: "7 dias" },
  { id: "30d" as const, label: "30 dias" },
  { id: "90d" as const, label: "90 dias" },
];

export function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<FinancePeriod>("30d");
  const [data, setData] = useState<AdminFinanceDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dto = await getAdminFinance(period);
      setData(dto);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar finance");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Finance" description="Visão financeira da marka.ia." />
        <ErrorState description={error} onRetry={() => void load()} />
      </div>
    );
  }

  const metrics = data?.metrics ?? [];
  const breakdown = data?.breakdown;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Visão financeira da marka.ia."
      />

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              period === p.id
                ? "border-transparent bg-marka-gradient text-white shadow-card-hover"
                : "border-black/10 bg-white text-marka-graphite hover:border-marka-green/40 hover:text-marka-green"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="card p-4"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-xl font-semibold text-marka-black">
              {m.value}
            </p>
            {m.delta !== undefined ? (
              <p
                className={
                  m.delta >= 0
                    ? "mt-1 text-xs text-marka-green-dark"
                    : "mt-1 text-xs text-red-700"
                }
              >
                {m.delta >= 0 ? "+" : ""}
                {m.delta.toFixed(1)}% vs. anterior
              </p>
            ) : null}
          </div>
        ))}
      </section>

      <div className="card p-4">
        <h2 className="text-sm font-medium text-marka-graphite">Breakdown</h2>
        <ul className="mt-3 space-y-2 text-sm text-marka-graphite">
          <li>
            Receita recorrente:{" "}
            {breakdown ? formatPrice(breakdown.recurring) : "—"}
          </li>
          <li>
            Receita não recorrente:{" "}
            {breakdown ? formatPrice(breakdown.nonRecurring) : "—"}
          </li>
          <li>
            Inadimplência:{" "}
            {breakdown ? String(breakdown.delinquency) : "—"}
          </li>
          <li>
            Margem:{" "}
            {breakdown?.margin == null ? "—" : `${breakdown.margin}%`}
          </li>
        </ul>
      </div>
    </div>
  );
}
