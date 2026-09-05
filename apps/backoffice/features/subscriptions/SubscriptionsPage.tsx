"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { getAdminSubscriptions } from "@/lib/api";
import type {
  AdminSubscriptionListItemDto,
  AdminSubscriptionsKpisDto,
} from "@/lib/api-types";
import { formatNumber, formatPrice } from "@/lib/format";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  "all",
  "active",
  "trial",
  "past_due",
  "canceled",
  "paused",
  "upgraded",
  "downgraded",
] as const;

const STATUS_TO_API: Record<string, string> = {
  active: "ACTIVE",
  trial: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  paused: "INCOMPLETE",
};

export function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminSubscriptionListItemDto[]>([]);
  const [kpis, setKpis] = useState<AdminSubscriptionsKpisDto | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [plan, setPlan] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const apiStatus = status !== "all" ? STATUS_TO_API[status] : undefined;
    if (status !== "all" && !apiStatus) {
      setItems([]);
      setKpis(null);
      setTotal(0);
      setLoading(false);
      return;
    }
    try {
      const { data, meta } = await getAdminSubscriptions({
        page,
        pageSize: PAGE_SIZE,
        status: apiStatus,
        plan: plan !== "all" ? plan : undefined,
      });
      setItems(data.items);
      setKpis(data.kpis);
      setTotal(Number(meta.total ?? 0));
      setPageSize(Number(meta.pageSize ?? PAGE_SIZE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar assinaturas");
      setItems([]);
      setKpis(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, status, plan]);

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
        title="Subscriptions"
        description="Gerenciar assinaturas e status."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ativas", value: kpis ? formatNumber(kpis.active) : "—" },
          { label: "Trial", value: kpis ? formatNumber(kpis.trial) : "—" },
          { label: "Past due", value: kpis ? formatNumber(kpis.pastDue) : "—" },
          {
            label: "Expansion MRR",
            value: kpis ? formatPrice(kpis.expansionMrr) : "—",
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
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) =>
              onFilterChange(setStatus, e.target.value as (typeof STATUS_FILTERS)[number])
            }
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro status"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Todos os status" : s}
              </option>
            ))}
          </select>
          <select
            value={plan}
            onChange={(e) => onFilterChange(setPlan, e.target.value)}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro plano"
          >
            <option value="all">Todos os planos</option>
            <option value="Pro">Pro</option>
            <option value="Starter">Starter</option>
            <option value="Enterprise">Enterprise</option>
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
            title="Nenhuma assinatura encontrada"
            description="Nenhuma assinatura com esses filtros."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                    <th className="px-2 py-2 font-medium">Cliente</th>
                    <th className="px-2 py-2 font-medium">Estabelecimento</th>
                    <th className="px-2 py-2 font-medium">Plano</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">MRR</th>
                    <th className="px-2 py-2 font-medium">Entrada</th>
                    <th className="px-2 py-2 font-medium">Próxima cobrança</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                    >
                      <td className="px-2 py-2 font-medium">{s.customer}</td>
                      <td className="px-2 py-2 text-marka-graphite">{s.establishment}</td>
                      <td className="px-2 py-2">{s.plan}</td>
                      <td className="px-2 py-2 capitalize">{s.status}</td>
                      <td className="px-2 py-2">{formatPrice(s.mrr)}</td>
                      <td className="px-2 py-2 text-marka-gray">{s.createdAt}</td>
                      <td className="px-2 py-2 text-marka-gray">{s.nextBilling}</td>
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
