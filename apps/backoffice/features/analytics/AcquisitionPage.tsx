"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { formatNumber } from "@/lib/format";
import { getAdminAcquisitionAnalytics } from "@/lib/api";
import type { AdminAcquisitionDto } from "@/lib/api-types";

export function AcquisitionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminAcquisitionDto | null>(null);
  const [channel, setChannel] = useState("all");
  const [step, setStep] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dto = await getAdminAcquisitionAnalytics();
      setData(dto);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar acquisition");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const funnel = data?.funnel ?? [];
  const channels = data?.channels ?? [];

  const funnelConversion = useMemo(() => {
    if (funnel.length < 2 || funnel[0].value === 0) return "—";
    return `${((funnel[funnel.length - 1].value / funnel[0].value) * 100).toFixed(1)}%`;
  }, [funnel]);

  const filteredChannels = useMemo(
    () =>
      channel === "all"
        ? channels
        : channels.filter((c) => c.label === channel),
    [channels, channel]
  );

  const selectedStep = funnel[Math.min(step, Math.max(funnel.length - 1, 0))];
  const conversionToSelected =
    selectedStep && funnel[0]?.value
      ? ((selectedStep.value / funnel[0].value) * 100).toFixed(1)
      : "—";

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
          title="Acquisition"
          description="Funil: Visitantes → Trial → Payment."
        />
        <ErrorState description={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acquisition"
        description="Funil: Visitantes → Trial → Payment."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Leads", value: data ? formatNumber(data.leads) : "—" },
          { label: "Signups", value: data ? formatNumber(data.signups) : "—" },
          {
            label: "Trial → Paid",
            value: data ? `${data.trialToPaid.toFixed(1)}%` : "—",
          },
          {
            label: "CAC",
            value: data?.cac == null ? "—" : formatNumber(data.cac),
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-marka-graphite/10 bg-marka-white p-3"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-lg font-semibold text-marka-black">{m.value}</p>
          </div>
        ))}
      </section>

      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
        <h2 className="text-sm font-medium text-marka-graphite">Funil interativo</h2>
        {funnel.length === 0 ? (
          <p className="mt-3 text-sm text-marka-gray">Sem dados de funil.</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {funnel.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                    step === i
                      ? "border-marka-black bg-marka-black text-marka-white"
                      : "border-marka-graphite/20 bg-marka-white text-marka-graphite"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {selectedStep ? (
              <div className="mt-4 rounded-md border border-marka-graphite/10 bg-marka-off/40 px-3 py-3">
                <p className="text-xs text-marka-gray">{selectedStep.label}</p>
                <p className="mt-1 text-lg font-semibold text-marka-black">
                  {formatNumber(selectedStep.value)}
                </p>
                <p className="mt-1 text-xs text-marka-gray">
                  Participação no funil: {conversionToSelected}%
                </p>
              </div>
            ) : null}
            <p className="mt-2 text-xs text-marka-gray">
              Conversão total do funil: {funnelConversion}
            </p>
          </>
        )}
      </div>

      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-marka-graphite">Canais</h2>
          {channels.length > 0 ? (
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
              aria-label="Filtro canal"
            >
              <option value="all">Todos os canais</option>
              {channels.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {filteredChannels.length === 0 ? (
          <EmptyState
            title="Nenhum canal disponível"
            description="Atribuição por canal ainda não está disponível nos dados."
          />
        ) : (
          <ul className="space-y-2">
            {filteredChannels.map((c) => (
              <li
                key={c.label}
                className="flex items-center justify-between gap-3 rounded-md border border-marka-graphite/10 px-3 py-2 text-sm"
              >
                <span>{c.label}</span>
                <span className="text-marka-graphite">{c.value}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
