"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { formatPercent } from "@/lib/format";
import { productUsage } from "@/lib/mock-data";

export function ProductUsagePage() {
  const [loading] = useState(false);
  const [plan, setPlan] = useState("all");

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const mostUsed = [...productUsage].sort((a, b) => b.adoption - a.adoption)[0];
  const leastUsed = [...productUsage].sort((a, b) => a.adoption - b.adoption)[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Usage"
        description="Entender como o produto é utilizado."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "DAU", value: "1.720" },
          { label: "WAU", value: "3.840" },
          { label: "Stickiness", value: "41%" },
          { label: "Sessões/usuário", value: "3,2" },
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
        <div className="mb-3 flex flex-wrap gap-2">
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

        <div className="space-y-3">
          {productUsage.map((f) => (
            <div key={f.feature}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{f.feature}</span>
                <span className="text-xs text-marka-gray">
                  {formatPercent(f.adoption)} · +{f.growth.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-marka-off">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(f.adoption, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-marka-graphite/10 p-3">
            <p className="text-xs text-marka-gray">Mais usada</p>
            <p className="mt-1 text-sm font-medium">{mostUsed.feature}</p>
          </div>
          <div className="rounded-md border border-marka-graphite/10 p-3">
            <p className="text-xs text-marka-gray">Menos usada</p>
            <p className="mt-1 text-sm font-medium">{leastUsed.feature}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
