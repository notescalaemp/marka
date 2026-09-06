"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { formatNumber, formatPrice } from "@/lib/format";
import { getAdminCustomers } from "@/lib/api";
import type {
  AdminCustomerListItemDto,
  AdminCustomersKpisDto,
} from "@/lib/api-types";
import { useToast } from "@/components/Toast";

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  "all",
  "ativo",
  "cancelado",
  "no-show",
  "inativo",
] as const;

export function CustomersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminCustomerListItemDto[]>([]);
  const [kpis, setKpis] = useState<AdminCustomersKpisDto | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await getAdminCustomers({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
      });
      setItems(data.items);
      setKpis(data.kpis);
      setTotal(Number(meta.total ?? 0));
      setPageSize(Number(meta.pageSize ?? PAGE_SIZE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar clientes");
      setItems([]);
      setKpis(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function applySearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function onFilterChange<T>(setter: (v: T) => void, value: T) {
    setPage(1);
    setter(value);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Consumidores finais do ecossistema marka.ia."
        actions={
          <Button size="sm" onClick={() => toast.show("Segmento criado (mock)")}>
            Novo segmento
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: kpis ? formatNumber(kpis.total) : "—" },
          {
            label: "Novos (mês)",
            value: kpis ? formatNumber(kpis.newThisMonth) : "—",
          },
          {
            label: "Agendamentos",
            value: kpis ? formatNumber(kpis.bookings) : "—",
          },
          {
            label: "Booking conversion",
            value:
              kpis?.bookingConversion == null
                ? "—"
                : `${kpis.bookingConversion.toFixed(1)}%`,
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
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            placeholder="Buscar cliente..."
            className="field-sm"
            aria-label="Buscar clientes"
          />
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
            title="Nenhum cliente encontrado"
            description="Ajuste os filtros ou limpe a busca."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-head-cell">Cliente</th>
                    <th className="table-head-cell">Status</th>
                    <th className="table-head-cell">Agendamentos</th>
                    <th className="table-head-cell">Ticket médio</th>
                    <th className="table-head-cell">Repeat booking</th>
                    <th className="table-head-cell">Total pago</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr
                      key={c.id}
                      className="table-row"
                    >
                      <td className="table-cell font-medium text-marka-black">{c.name}</td>
                      <td className="table-cell capitalize">{c.status}</td>
                      <td className="table-cell">{c.bookings}</td>
                      <td className="table-cell">{formatPrice(c.ticket)}</td>
                      <td className="table-cell">{c.repeat}%</td>
                      <td className="table-cell">{formatPrice(c.total)}</td>
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
