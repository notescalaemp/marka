"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { KPICard } from "@/components/KPICard";
import { getAdminOverview } from "@/lib/api";
import type {
  AdminOverviewSeriesPointDto,
  OverviewActivityView,
  OverviewKpiView,
  OverviewPlanView,
  OverviewSecondaryView,
} from "@/lib/api-types";
import { formatPrice } from "@/lib/format";
import {
  mapOverviewActivity,
  mapOverviewKpis,
  mapOverviewPlans,
  mapOverviewSecondary,
} from "@/lib/mappers";

const CHART_METRICS = [
  { id: "mrr", label: "MRR", key: "mrr" as const },
  { id: "arr", label: "ARR", key: "arr" as const },
  { id: "users", label: "Usuários", key: "users" as const },
];

function sliceSeriesByPeriod(
  series: AdminOverviewSeriesPointDto[],
  period: string
): AdminOverviewSeriesPointDto[] {
  // Series is monthly. Slice real points only — never invent values.
  const take =
    period === "7d" ? 1 : period === "30d" ? 1 : period === "90d" ? 3 : series.length;
  return series.slice(-take);
}

export function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<OverviewKpiView[]>([]);
  const [seriesRaw, setSeriesRaw] = useState<AdminOverviewSeriesPointDto[]>([]);
  const [secondary, setSecondary] = useState<OverviewSecondaryView[]>([]);
  const [activity, setActivity] = useState<OverviewActivityView[]>([]);
  const [plans, setPlans] = useState<OverviewPlanView[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["mrr", "users"]);
  const [period, setPeriod] = useState("30d");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dto = await getAdminOverview();
      setKpis(mapOverviewKpis(dto));
      setSeriesRaw(dto.series);
      setSecondary(mapOverviewSecondary(dto));
      setActivity(mapOverviewActivity(dto));
      setPlans(mapOverviewPlans(dto));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar overview");
      setKpis([]);
      setSeriesRaw([]);
      setSecondary([]);
      setActivity([]);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = useMemo(
    () => sliceSeriesByPeriod(seriesRaw, period),
    [seriesRaw, period]
  );

  const series = chartData.map((d) => {
    const mapped: Record<string, number | string> = { period: d.period };
    for (const key of selectedMetrics) {
      if (key === "mrr") mapped.mrr = d.mrr;
      else if (key === "arr") mapped.arr = d.arr;
      else if (key === "users") mapped.users = d.users;
    }
    return mapped;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Overview"
          description="Central de operação da marka.ia — dados, análise e decisões."
        />
        <ErrorState description={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Central de operação da marka.ia — dados, análise e decisões."
      />

      <section className="grid gap-3 md:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href="/analytics/churn-risk">
          <Button size="sm" variant="secondary">
            Analisar contas em risco
          </Button>
        </Link>
        <Link href="/alerts">
          <Button size="sm" variant="secondary">
            Ver alertas
          </Button>
        </Link>
        <Link href="/establishments">
          <Button size="sm" variant="secondary">
            Ver estabelecimentos
          </Button>
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {CHART_METRICS.map((m) => {
                const active = selectedMetrics.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMetrics((prev) => {
                        if (prev.includes(m.id)) {
                          if (prev.length === 1) return prev;
                          return prev.filter((id) => id !== m.id);
                        }
                        return [...prev, m.id];
                      });
                    }}
                    className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                      active
                        ? "border-marka-black bg-marka-black text-marka-white"
                        : "border-marka-graphite/20 bg-marka-white text-marka-graphite"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1 text-xs"
              aria-label="Período"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
          <div className="h-72">
            {series.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-marka-gray">
                Sem dados de série para o período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e6" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const numeric = Number(value);
                      if (name === "mrr" || name === "arr") {
                        return formatPrice(numeric);
                      }
                      return numeric.toLocaleString("pt-BR");
                    }}
                    labelFormatter={(l) => `Período: ${l}`}
                  />
                  {selectedMetrics.map((key, i) => {
                    const colors = ["#0B0B0B", "#0d7a4f", "#8A8A8A", "#242424"];
                    return (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors[i % colors.length]}
                        fill={colors[i % colors.length]}
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          <h2 className="text-sm font-medium text-marka-graphite">
            Métricas complementares
          </h2>
          <ul className="mt-3 space-y-3">
            {secondary.length === 0 ? (
              <li className="text-sm text-marka-gray">Sem métricas complementares.</li>
            ) : (
              secondary.map((m) => (
                <li
                  key={m.label}
                  className="flex items-center justify-between gap-2 border-b border-marka-graphite/5 pb-2 last:border-0"
                >
                  <div>
                    <p className="text-xs text-marka-gray">{m.label}</p>
                    <p className="text-sm font-medium text-marka-black">{m.value}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-marka-graphite">
              Recent Activity
            </h2>
            <Link href="/alerts" className="text-xs text-emerald-700 underline">
              Ver alertas
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-marka-gray">Nenhuma atividade recente.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-marka-graphite/10 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-marka-black">
                      {a.description}
                    </p>
                    <p className="text-xs text-marka-gray">
                      {a.entity} · {a.at}
                    </p>
                  </div>
                  <span className="text-[11px] uppercase text-marka-gray">
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-marka-graphite">Plans</h2>
            <Link href="/plans" className="text-xs text-emerald-700 underline">
              Comparar
            </Link>
          </div>
          {plans.length === 0 ? (
            <p className="text-sm text-marka-gray">Nenhum plano encontrado.</p>
          ) : (
            <ul className="space-y-2">
              {plans.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-marka-graphite/10 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-marka-gray">
                      {p.subscribers} assinantes
                    </p>
                  </div>
                  <div className="text-right text-xs text-marka-graphite">
                    <p>{formatPrice(p.mrr)}</p>
                    <p
                      className={
                        p.growth >= 0 ? "text-emerald-700" : "text-red-700"
                      }
                    >
                      {p.growth.toFixed(1)}% growth
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
