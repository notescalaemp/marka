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
            className="card p-3"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-lg font-semibold text-marka-black">{m.value}</p>
          </div>
        ))}
      </section>

      <div className="card p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "high", "medium", "low"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRisk(r)}
              className={`rounded-md border px-2.5 py-1 text-xs capitalize transition-colors ${
                risk === r
                  ? "border-transparent bg-marka-gradient text-white shadow-card-hover"
                  : "border-black/10 bg-white text-marka-graphite hover:border-marka-green/40 hover:text-marka-green"
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
                  <tr className="table-head-row">
                    <th className="table-head-cell">Estabelecimento</th>
                    <th className="table-head-cell">Plano</th>
                    <th className="table-head-cell">MRR</th>
                    <th className="table-head-cell">Risk score</th>
                    <th className="table-head-cell">Último login</th>
                    <th className="table-head-cell">Utilização</th>
                    <th className="table-head-cell">Δ Uso</th>
                    <th className="table-head-cell">Motivos</th>
                    <th className="table-head-cell">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="table-row"
                    >
                      <td className="table-cell font-medium text-marka-black">{r.establishment}</td>
                      <td className="table-cell">{r.plan}</td>
                      <td className="table-cell">{formatPrice(r.mrr)}</td>
                      <td className="table-cell">{r.riskScore}</td>
                      <td className="table-cell text-marka-gray">
                        {r.lastLogin ? formatDateTime(r.lastLogin) : "—"}
                      </td>
                      <td className="table-cell">
                        {r.utilization == null ? "—" : `${r.utilization}%`}
                      </td>
                      <td className="table-cell">
                        {r.utilizationDelta == null
                          ? "—"
                          : `${r.utilizationDelta >= 0 ? "+" : ""}${r.utilizationDelta}%`}
                      </td>
                      <td className="table-cell text-marka-gray">
                        {r.reasons.length ? r.reasons.join(", ") : "—"}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <Link
                            href={`/establishments/${r.id}`}
                            className="text-xs text-marka-green-dark underline"
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
                            className="text-xs text-marka-green-dark underline"
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
