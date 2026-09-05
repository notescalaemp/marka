"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { getAdminEstablishments } from "@/lib/api";
import type { EstablishmentListItemView } from "@/lib/api-types";
import { formatNumber, formatPrice } from "@/lib/format";
import { mapEstablishmentListItem } from "@/lib/mappers";
import type { ChurnRisk, EstablishmentStatus } from "@/lib/types";

const PAGE_SIZE = 20;

const STATUS_FILTERS: Array<"all" | EstablishmentStatus> = [
  "all",
  "active",
  "trial",
  "inactive",
  "suspended",
  "canceled",
];

function riskLabel(risk: ChurnRisk | string) {
  switch (risk) {
    case "high":
      return "High risk";
    case "medium":
      return "Medium";
    case "low":
      return "Low risk";
    default:
      return "—";
  }
}

export function EstablishmentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<EstablishmentListItemView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState<"all" | EstablishmentStatus>("all");
  const [risk, setRisk] = useState<"all" | ChurnRisk>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await getAdminEstablishments({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        plan: plan !== "all" ? plan : undefined,
        status: status !== "all" ? status : undefined,
        risk: risk !== "all" ? risk : undefined,
      });
      setItems(data.map(mapEstablishmentListItem));
      setTotal(Number(meta.total ?? 0));
      setPageSize(Number(meta.pageSize ?? PAGE_SIZE));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar estabelecimentos"
      );
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, plan, status, risk]);

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
        title="Establishments"
        description="Administrar todos os estabelecimentos da plataforma."
        actions={
          <Link href="/establishments">
            <Button size="sm">Novo estabelecimento</Button>
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: loading ? "…" : formatNumber(total) },
          { label: "Ativos", value: "—" },
          { label: "Trial", value: "—" },
          { label: "MRR", value: "—" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-marka-graphite/10 bg-marka-white p-3"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-lg font-semibold text-marka-black">
              {m.value}
            </p>
          </div>
        ))}
      </section>

      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex min-w-[200px] flex-1 gap-2">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Buscar estabelecimento…"
              className="w-full rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
              aria-label="Busca"
            />
            <Button size="sm" variant="secondary" onClick={applySearch}>
              Buscar
            </Button>
          </div>
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
          <select
            value={status}
            onChange={(e) =>
              onFilterChange(setStatus, e.target.value as typeof status)
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
            value={risk}
            onChange={(e) =>
              onFilterChange(setRisk, e.target.value as typeof risk)
            }
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro risco"
          >
            <option value="all">Todos os riscos</option>
            <option value="high">High risk</option>
            <option value="medium">Medium</option>
            <option value="low">Low risk</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum estabelecimento encontrado"
            description="Nenhum estabelecimento com esses filtros."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                    <th className="px-2 py-2 font-medium">Estabelecimento</th>
                    <th className="px-2 py-2 font-medium">Proprietário</th>
                    <th className="px-2 py-2 font-medium">Plano</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">MRR</th>
                    <th className="px-2 py-2 font-medium">Entrada</th>
                    <th className="px-2 py-2 font-medium">Último acesso</th>
                    <th className="px-2 py-2 font-medium">Profis.</th>
                    <th className="px-2 py-2 font-medium">Clientes</th>
                    <th className="px-2 py-2 font-medium">Utilização</th>
                    <th className="px-2 py-2 font-medium">Churn risk</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                    >
                      <td className="px-2 py-2">
                        <Link
                          href={`/establishments/${e.id}`}
                          className="font-medium text-marka-black hover:underline"
                        >
                          {e.name}
                        </Link>
                      </td>
                      <td className="px-2 py-2 text-marka-graphite">
                        {e.ownerName}
                      </td>
                      <td className="px-2 py-2">{e.plan}</td>
                      <td className="px-2 py-2">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="px-2 py-2">{formatPrice(e.mrr)}</td>
                      <td className="px-2 py-2 text-marka-gray">
                        {e.createdAt}
                      </td>
                      <td className="px-2 py-2 text-marka-gray">
                        {e.lastAccess}
                      </td>
                      <td className="px-2 py-2">{e.professionals}</td>
                      <td className="px-2 py-2">{e.customers}</td>
                      <td className="px-2 py-2">
                        {e.utilization == null ? "—" : `${e.utilization}%`}
                      </td>
                      <td className="px-2 py-2">
                        <span className="text-xs capitalize text-marka-graphite">
                          {riskLabel(e.churnRisk)}
                        </span>
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
