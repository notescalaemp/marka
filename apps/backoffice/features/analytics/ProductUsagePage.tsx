"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { formatNumber, formatPercent } from "@/lib/format";
import { getAdminProductUsageAnalytics } from "@/lib/api";
import type { AdminProductUsageDto } from "@/lib/api-types";

export function ProductUsagePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminProductUsageDto | null>(null);
  const [plan, setPlan] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dto = await getAdminProductUsageAnalytics();
      setData(dto);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar product usage");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const features = data?.features ?? [];
  const kpis = data?.kpis;

  const mostUsed = useMemo(
    () => (features.length ? [...features].sort((a, b) => b.adoption - a.adoption)[0] : null),
    [features]
  );
  const leastUsed = useMemo(
    () => (features.length ? [...features].sort((a, b) => a.adoption - b.adoption)[0] : null),
    [features]
  );

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
          title="Product Usage"
          description="Entender como o produto é utilizado."
        />
        <ErrorState description={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Usage"
        description="Entender como o produto é utilizado."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "DAU", value: kpis ? formatNumber(kpis.dau) : "—" },
          { label: "WAU", value: kpis ? formatNumber(kpis.wau) : "—" },
          {
            label: "Stickiness",
            value: kpis ? `${kpis.stickiness.toFixed(1)}%` : "—",
          },
          {
            label: "Sessões/usuário",
            value: kpis ? kpis.sessionsPerUser.toFixed(1).replace(".", ",") : "—",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="card p-3"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-lg font-semibold text-marka-black">{m.value}</p>
          </div>
        ))}
      </section>

      <div className="card p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {(["all", "Pro", "Starter", "Enterprise"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              className={`rounded-md border px-2.5 py-1 text-xs capitalize transition-colors ${
                plan === p
                  ? "border-transparent bg-marka-gradient text-white shadow-card-hover"
                  : "border-black/10 bg-white text-marka-graphite hover:border-marka-green/40 hover:text-marka-green"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        {plan !== "all" ? (
          <p className="mb-3 text-xs text-marka-gray">
            Filtro por plano ainda não disponível na API — exibindo uso global.
          </p>
        ) : null}

        <div className="space-y-3">
          {features.map((f) => (
            <div key={f.feature}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{f.feature}</span>
                <span className="text-xs text-marka-gray">
                  {formatPercent(f.adoption)} · {f.growth >= 0 ? "+" : ""}
                  {f.growth.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-marka-off">
                <div
                  className="h-full rounded-full bg-marka-green"
                  style={{ width: `${Math.min(f.adoption, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-black/[0.06] p-3">
            <p className="text-xs text-marka-gray">Mais usada</p>
            <p className="mt-1 text-sm font-medium">{mostUsed?.feature ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-black/[0.06] p-3">
            <p className="text-xs text-marka-gray">Menos usada</p>
            <p className="mt-1 text-sm font-medium">{leastUsed?.feature ?? "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
