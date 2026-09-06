"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { getAdminPayments } from "@/lib/api";
import type {
  AdminPaymentListItemDto,
  AdminPaymentsKpisDto,
} from "@/lib/api-types";
import { formatNumber, formatPrice } from "@/lib/format";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  "all",
  "approved",
  "pending",
  "failed",
  "refunded",
] as const;

const STATUS_TO_API: Record<string, string> = {
  approved: "PAID",
  pending: "PENDING",
  failed: "FAILED",
  refunded: "REFUNDED",
};

const METHODS = ["all", "PIX", "card", "cash", "other"] as const;

const METHOD_TO_API: Record<string, string> = {
  PIX: "PIX",
  card: "CARD",
  cash: "CASH",
  other: "OTHER",
};

export function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminPaymentListItemDto[]>([]);
  const [kpis, setKpis] = useState<AdminPaymentsKpisDto | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await getAdminPayments({
        page,
        pageSize: PAGE_SIZE,
        status: status !== "all" ? STATUS_TO_API[status] : undefined,
        method: method !== "all" ? METHOD_TO_API[method] : undefined,
      });
      setItems(data.items);
      setKpis(data.kpis);
      setTotal(Number(meta.total ?? 0));
      setPageSize(Number(meta.pageSize ?? PAGE_SIZE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pagamentos");
      setItems([]);
      setKpis(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, status, method]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function onFilterChange<T>(setter: (v: T) => void, value: T) {
    setPage(1);
    setter(value);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Pagamentos e métodos (PIX, cartão, boleto)."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Volume", value: kpis ? formatPrice(kpis.volume) : "—" },
          { label: "Aprovados", value: kpis ? formatNumber(kpis.approved) : "—" },
          { label: "Falhas", value: kpis ? formatNumber(kpis.failed) : "—" },
          {
            label: "Failure rate",
            value: kpis ? `${kpis.failureRate.toFixed(1)}%` : "—",
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
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) =>
              onFilterChange(setStatus, e.target.value as (typeof STATUS_FILTERS)[number])
            }
            className="field-sm"
            aria-label="Filtro status"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Todos os status" : s}
              </option>
            ))}
          </select>
          <select
            value={method}
            onChange={(e) =>
              onFilterChange(setMethod, e.target.value as (typeof METHODS)[number])
            }
            className="field-sm"
            aria-label="Filtro método"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m === "all" ? "Todos os métodos" : m}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum pagamento encontrado"
            description="Nenhum pagamento com esses filtros."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-head-cell">Pagamento</th>
                    <th className="table-head-cell">Cliente</th>
                    <th className="table-head-cell">Estabelecimento</th>
                    <th className="table-head-cell">Valor</th>
                    <th className="table-head-cell">Método</th>
                    <th className="table-head-cell">Status</th>
                    <th className="table-head-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr
                      key={p.id}
                      className="table-row"
                    >
                      <td className="table-cell font-medium text-marka-black">{p.id}</td>
                      <td className="table-cell">{p.customer}</td>
                      <td className="table-cell text-marka-graphite">{p.establishment}</td>
                      <td className="table-cell">{formatPrice(p.value)}</td>
                      <td className="table-cell">{p.method}</td>
                      <td className="table-cell capitalize">{p.status}</td>
                      <td className="table-cell text-marka-gray">{p.date}</td>
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
