"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { getAdminRetentionAnalytics } from "@/lib/api";
import type { AdminRetentionCohortDto } from "@/lib/api-types";

const MONTH_KEYS = ["m1", "m2", "m3", "m4", "m5", "m6"] as const;
const MONTH_LABELS = ["M1", "M2", "M3", "M4", "M5", "M6"];

export function RetentionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cohorts, setCohorts] = useState<AdminRetentionCohortDto[]>([]);
  const [plan, setPlan] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { cohorts: data } = await getAdminRetentionAnalytics();
      setCohorts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar retention");
      setCohorts([]);
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
          title="Retention"
          description="Cohorts e retenção por período."
        />
        <ErrorState description={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retention"
        description="Cohorts e retenção por período."
      />

      <div className="flex flex-wrap gap-2">
        {(["all", "Pro", "Starter", "Enterprise"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlan(p)}
            className={`rounded-md border px-2.5 py-1 text-xs capitalize transition-colors ${
              plan === p
                ? "border-marka-black bg-marka-black text-marka-white"
                : "border-marka-graphite/20 bg-marka-white text-marka-graphite"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
        <h2 className="text-sm font-medium text-marka-graphite">
          Cohort analysis
        </h2>
        {plan !== "all" ? (
          <p className="mt-2 text-xs text-marka-gray">
            Filtro por plano ainda não disponível na API — exibindo todos os cohorts.
          </p>
        ) : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                <th className="px-2 py-2 font-medium">Cohort</th>
                {MONTH_LABELS.map((m) => (
                  <th key={m} className="px-2 py-2 font-medium">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((row) => (
                <tr
                  key={row.month}
                  className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                >
                  <td className="px-2 py-2 font-medium">{row.month}</td>
                  {MONTH_KEYS.map((key) => {
                    const value = row[key];
                    return (
                      <td key={key} className="px-2 py-2 text-marka-graphite">
                        {value === null ? "—" : `${value}%`}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
