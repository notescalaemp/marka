"use client";

import { useCallback, useEffect, useState } from "react";
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
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { getAmbassadorOverview } from "@/lib/api";
import type { AmbassadorOverview } from "@/lib/types";
import { formatNumber, formatPrice } from "@/lib/format";

const CHART_COLOR = "#309577";

const PERIODS = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "12m", label: "12 meses" },
] as const;

const METRICS = [
  { id: "referrals", label: "Indicações" },
  { id: "conversions", label: "Conversões" },
  { id: "revenue", label: "Receita gerada" },
  { id: "commissions", label: "Comissões" },
] as const;

export function AmbassadorsOverviewPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("30d");
  const [metric, setMetric] = useState<(typeof METRICS)[number]["id"]>("referrals");
  const [data, setData] = useState<AmbassadorOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAmbassadorOverview(period));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar o programa");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Indique e Ganhe"
        description="Acompanhe o crescimento gerado pelos seus embaixadores."
        actions={
          <>
            <Link href="/ambassadors/list">
              <Button size="sm" variant="secondary">Embaixadores</Button>
            </Link>
            <Link href="/ambassadors/referrals">
              <Button size="sm" variant="secondary">Indicações</Button>
            </Link>
            <Link href="/ambassadors/commissions">
              <Button size="sm" variant="secondary">Comissões</Button>
            </Link>
            <Link href="/ambassadors/withdrawals">
              <Button size="sm" variant="secondary">Saques</Button>
            </Link>
            <Link href="/ambassadors/settings">
              <Button size="sm" variant="secondary">Configurações</Button>
            </Link>
          </>
        }
      />

      {error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : loading || !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <>
          <section className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Embaixadores ativos", formatNumber(data.activeAmbassadors)],
              ["Indicações", formatNumber(data.totalReferrals)],
              ["Novos clientes", formatNumber(data.newCustomers)],
              ["Conversão", `${data.conversionRate.toFixed(1)}%`],
              ["Comissões geradas", formatPrice(data.commissionsGenerated)],
              ["Comissões pendentes", formatPrice(data.commissionsPending)],
              ["Comissões pagas", formatPrice(data.commissionsPaid)],
            ].map(([label, value]) => (
              <div key={label} className="card card-interactive p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-marka-gray">{label}</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-marka-black">{value}</p>
              </div>
            ))}
          </section>

          <section className="card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {METRICS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMetric(m.id)}
                    className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                      metric === m.id
                        ? "border-transparent bg-marka-gradient text-white shadow-card-hover"
                        : "border-black/10 bg-white text-marka-graphite hover:border-marka-green/40 hover:text-marka-green"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as (typeof PERIODS)[number]["id"])}
                className="field-sm"
                aria-label="Período"
              >
                {PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-72">
              {data.series.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-marka-gray">
                  Sem dados de série para o período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series}>
                    <defs>
                      <linearGradient id="ambassadorFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EBEBE7" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#8A8A8A" }} axisLine={{ stroke: "#EBEBE7" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#8A8A8A" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(11,11,11,0.06)",
                        boxShadow: "0 12px 28px -16px rgba(11,11,11,0.25)",
                      }}
                      formatter={(value: number) =>
                        metric === "revenue" || metric === "commissions" ? formatPrice(Number(value)) : formatNumber(Number(value))
                      }
                      labelFormatter={(l) => `Data: ${l}`}
                    />
                    <Area
                      type="monotone"
                      dataKey={metric}
                      stroke={CHART_COLOR}
                      fill="url(#ambassadorFill)"
                      strokeWidth={2.5}
                      animationDuration={600}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
