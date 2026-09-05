"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { formatPrice } from "@/lib/format";
import { financeMetrics } from "@/lib/mock-data";

const PERIODS = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
] as const;

export function FinancePage() {
  const [loading] = useState(false);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("30d");

  const metrics = useMemo(
    () =>
      financeMetrics.map((m) => {
        const delta = m.delta ?? 0;
        return {
          ...m,
          value:
            period === "7d"
              ? m.value
              : period === "90d"
                ? m.value
                : m.value,
        };
      }),
    [period]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

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
                ? "border-marka-black bg-marka-black text-marka-white"
                : "border-marka-graphite/20 bg-marka-white text-marka-graphite"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-xl font-semibold text-marka-black">
              {m.value}
            </p>
            {m.delta !== undefined ? (
              <p
                className={
                  m.delta >= 0
                    ? "mt-1 text-xs text-emerald-700"
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

      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
        <h2 className="text-sm font-medium text-marka-graphite">
          Breakdown
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-marka-graphite">
          <li>Receita recorrente: {formatPrice(44100)}</li>
          <li>Receita não recorrente: {formatPrice(4200)}</li>
          <li>Inadimplência: {formatPrice(1280)}</li>
          <li>Margem: 62%</li>
        </ul>
      </div>
    </div>
  );
}
