"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { formatPrice } from "@/lib/format";
import { churnBreakdown, churnRiskRows } from "@/lib/mock-data";

export function ChurnPage() {
  const [loading] = useState(false);
  const [reason, setReason] = useState("all");

  const metrics = useMemo(
    () => [
      { label: "Customer churn", value: "2,4%" },
      { label: "Revenue churn", value: "1,8%" },
      { label: "GRR", value: "97,6%" },
      { label: "NRR", value: "98,1%" },
    ],
    []
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const mrrAtRisk = churnRiskRows.reduce((s, r) => s + r.mrr, 0);

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
            {churnBreakdown.map((c) => (
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
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          <h2 className="text-sm font-medium text-marka-graphite">
            MRR at risk
          </h2>
          <p className="mt-2 text-lg font-semibold text-marka-black">
            {formatPrice(mrrAtRisk)}
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
              ? "Breakdown por plano e idade do cliente."
              : "Filtro aplicado: alta/média prioridade."}
          </p>
        </div>
      </div>
    </div>
  );
}
