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

const CHART_COLORS = ["#309577", "#36A080", "#6AC0A2", "#242424"];

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

      <section className="stagger grid gap-3 md:grid-cols-4">
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
        <div className="card p-4 lg:col-span-2">
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
                        ? "border-transparent bg-marka-gradient text-white shadow-card-hover"
                        : "border-black/10 bg-white text-marka-graphite hover:border-marka-green/40 hover:text-marka-green"
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
              className="field-sm"
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
                  <defs>
                    {CHART_COLORS.map((color, i) => (
                      <linearGradient key={color} id={`overviewFill${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EBEBE7" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12, fill: "#8A8A8A" }}
                    axisLine={{ stroke: "#EBEBE7" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#8A8A8A" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(11,11,11,0.06)",
                      boxShadow: "0 12px 28px -16px rgba(11,11,11,0.25)",
                    }}
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
                    const color = CHART_COLORS[i % CHART_COLORS.length];
                    return (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={color}
                        fill={`url(#overviewFill${i % CHART_COLORS.length})`}
                        strokeWidth={2.5}
                        animationDuration={600}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card p-4">
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
                  className="flex items-center justify-between gap-2 border-b border-black/[0.05] pb-2 last:border-0"
                >
                  <div>
                    <p className="text-xs text-marka-gray">{m.label}</p>
                    <p className="text-sm font-medium tabular-nums text-marka-black">{m.value}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-marka-graphite">
              Recent Activity
            </h2>
            <Link href="/alerts" className="text-xs text-marka-green-dark underline">
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
                  className="flex items-start justify-between gap-3 rounded-xl border border-black/[0.05] px-3 py-2.5 transition-colors hover:bg-marka-off/70"
                >
                  <div>
                    <p className="text-sm font-medium text-marka-black">
                      {a.description}
                    </p>
                    <p className="text-xs text-marka-gray">
                      {a.entity} · {a.at}
                    </p>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-marka-off px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-marka-gray">
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-marka-graphite">Plans</h2>
            <Link href="/plans" className="text-xs text-marka-green-dark underline">
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
                  className="flex items-center justify-between gap-2 rounded-xl border border-black/[0.05] px-3 py-2.5 transition-colors hover:bg-marka-off/70"
                >
                  <div>
                    <p className="text-sm font-medium text-marka-black">{p.name}</p>
                    <p className="text-xs text-marka-gray">
                      {p.subscribers} assinantes
                    </p>
                  </div>
                  <div className="text-right text-xs text-marka-graphite">
                    <p className="font-medium tabular-nums">{formatPrice(p.mrr)}</p>
                    <p
                      className={
                        p.growth >= 0 ? "text-marka-green-dark" : "text-red-700"
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
