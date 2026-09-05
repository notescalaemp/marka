"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { formatPrice } from "@/lib/format";
import { churnRiskRows } from "@/lib/mock-data";
import { useToast } from "@/components/Toast";
import { useStore } from "@/lib/store";

export function ChurnRiskPage() {
  const [loading] = useState(false);
  const [risk, setRisk] = useState<"all" | "high" | "medium" | "low">("all");
  const toast = useToast();
  const { startImpersonation } = useStore();

  const filtered = useMemo(() => {
    if (risk === "all") return churnRiskRows;
    return churnRiskRows.filter((r) => r.riskScore > (risk === "high" ? 70 : risk === "medium" ? 40 : 0));
  }, [risk]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const highRiskMrr = churnRiskRows
    .filter((r) => r.riskScore >= 70)
    .reduce((s, r) => s + r.mrr, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Churn Risk"
        description="Contas em risco e MRR at risk."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "High risk", value: String(churnRiskRows.filter((r) => r.riskScore >= 70).length) },
          { label: "Medium risk", value: String(churnRiskRows.filter((r) => r.riskScore >= 40 && r.riskScore < 70).length) },
          { label: "Customers at risk", value: String(churnRiskRows.length) },
          { label: "MRR at risk", value: formatPrice(highRiskMrr) },
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
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "high", "medium", "low"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRisk(r)}
              className={`rounded-md border px-2.5 py-1 text-xs capitalize transition-colors ${
                risk === r
                  ? "border-marka-black bg-marka-black text-marka-white"
                  : "border-marka-graphite/20 bg-marka-white text-marka-graphite"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                <th className="px-2 py-2 font-medium">Estabelecimento</th>
                <th className="px-2 py-2 font-medium">Plano</th>
                <th className="px-2 py-2 font-medium">MRR</th>
                <th className="px-2 py-2 font-medium">Risk score</th>
                <th className="px-2 py-2 font-medium">Último login</th>
                <th className="px-2 py-2 font-medium">Utilização</th>
                <th className="px-2 py-2 font-medium">Δ Uso</th>
                <th className="px-2 py-2 font-medium">Motivos</th>
                <th className="px-2 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                >
                  <td className="px-2 py-2 font-medium">{r.establishment}</td>
                  <td className="px-2 py-2">{r.plan}</td>
                  <td className="px-2 py-2">{formatPrice(r.mrr)}</td>
                  <td className="px-2 py-2">{r.riskScore}</td>
                  <td className="px-2 py-2 text-marka-gray">{r.lastLogin}</td>
                  <td className="px-2 py-2">{r.utilization}%</td>
                  <td className="px-2 py-2">
                    {r.utilizationDelta >= 0 ? "+" : ""}
                    {r.utilizationDelta}%
                  </td>
                  <td className="px-2 py-2 text-marka-gray">
                    {r.reasons.join(", ")}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-emerald-700 underline"
                      >
                        Visualizar
                      </button>
                      <button
                        type="button"
                        className="text-xs text-marka-graphite underline"
                        onClick={() => {
                          startImpersonation(r.establishment);
                          toast.show(`Impersonation de ${r.establishment}`);
                        }}
                      >
                        Acessar
                      </button>
                      <button
                        type="button"
                        className="text-xs text-emerald-700 underline"
                      >
                        Contato
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
