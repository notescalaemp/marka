"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { formatDateTime, formatNumber, formatPrice } from "@/lib/format";
import { getAdminChurnRisk } from "@/lib/api";
import type {
  AdminChurnRiskKpisDto,
  AdminChurnRiskListItemDto,
} from "@/lib/api-types";
import { useToast } from "@/components/Toast";
import { useStore } from "@/lib/store";

const PAGE_SIZE = 20;

function matchesRiskFilter(
  riskScore: number,
  risk: "all" | "high" | "medium" | "low"
) {
  if (risk === "all") return true;
  if (risk === "high") return riskScore >= 70;
  if (risk === "medium") return riskScore >= 40 && riskScore < 70;
  return riskScore < 40;
}

export function ChurnRiskPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminChurnRiskListItemDto[]>([]);
  const [kpis, setKpis] = useState<AdminChurnRiskKpisDto | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [risk, setRisk] = useState<"all" | "high" | "medium" | "low">("all");
  const toast = useToast();
  const { startImpersonation } = useStore();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await getAdminChurnRisk({
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(data.items);
      setKpis(data.kpis);
      setTotal(Number(meta.total ?? 0));
      setPageSize(Number(meta.pageSize ?? PAGE_SIZE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar churn risk");
      setItems([]);
      setKpis(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => items.filter((r) => matchesRiskFilter(r.riskScore, risk)),
    [items, risk]
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Churn Risk"
        description="Contas em risco e MRR at risk."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "High risk", value: kpis ? formatNumber(kpis.high) : "—" },
          { label: "Medium risk", value: kpis ? formatNumber(kpis.medium) : "—" },
          {
            label: "Customers at risk",
            value: kpis ? formatNumber(kpis.customersAtRisk) : "—",
          },
          {
            label: "MRR at risk",
            value: kpis ? formatPrice(kpis.mrrAtRisk) : "—",
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

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={() => void load()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhuma conta em risco"
            description="Nenhum estabelecimento com esses filtros."
          />
        ) : (
          <>
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
                      <td className="px-2 py-2 text-marka-gray">
                        {r.lastLogin ? formatDateTime(r.lastLogin) : "—"}
                      </td>
                      <td className="px-2 py-2">
                        {r.utilization == null ? "—" : `${r.utilization}%`}
                      </td>
                      <td className="px-2 py-2">
                        {r.utilizationDelta == null
                          ? "—"
                          : `${r.utilizationDelta >= 0 ? "+" : ""}${r.utilizationDelta}%`}
                      </td>
                      <td className="px-2 py-2 text-marka-gray">
                        {r.reasons.length ? r.reasons.join(", ") : "—"}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-2">
                          <Link
                            href={`/establishments/${r.id}`}
                            className="text-xs text-emerald-700 underline"
                          >
                            Visualizar
                          </Link>
                          <button
                            type="button"
                            className="text-xs text-marka-graphite underline"
                            onClick={() => {
                              void startImpersonation({
                                id: r.id,
                                name: r.establishment,
                              }).then(() => {
                                toast.show(`Impersonation de ${r.establishment}`);
                              }).catch((err) => {
                                toast.show(
                                  err instanceof Error
                                    ? err.message
                                    : "Erro ao iniciar impersonation"
                                );
                              });
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

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-marka-gray">
                Página {page} de {totalPages} · {formatNumber(total)} no total
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
