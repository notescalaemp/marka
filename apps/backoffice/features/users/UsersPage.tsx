"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { getAdminUsers } from "@/lib/api";
import type {
  AdminUserListItemDto,
  AdminUsersKpisDto,
} from "@/lib/api-types";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";

const PAGE_SIZE = 20;

const USER_TYPES = [
  "all",
  "Owner",
  "Admin",
  "Manager",
  "Professional",
  "Staff",
  "Customer",
] as const;

const TYPE_TO_API: Record<string, string> = {
  Owner: "OWNER",
  Admin: "ADMIN",
  Manager: "MANAGER",
  Professional: "PROFESSIONAL",
  Staff: "STAFF",
  Customer: "CUSTOMER",
};

const STATUS_FILTERS = ["all", "ativo", "inativo"] as const;

const STATUS_TO_API: Record<string, string> = {
  ativo: "ACTIVE",
  inativo: "SUSPENDED",
};

export function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminUserListItemDto[]>([]);
  const [kpis, setKpis] = useState<AdminUsersKpisDto | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<(typeof USER_TYPES)[number]>("all");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await getAdminUsers({
        page,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        type: type !== "all" ? TYPE_TO_API[type] : undefined,
        status: status !== "all" ? STATUS_TO_API[status] : undefined,
      });
      setItems(data.items);
      setKpis(data.kpis);
      setTotal(Number(meta.total ?? 0));
      setPageSize(Number(meta.pageSize ?? PAGE_SIZE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar usuários");
      setItems([]);
      setKpis(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, type, status]);

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
        title="Users"
        description="Gerenciar usuários da plataforma."
        actions={
          <Button size="sm" variant="secondary">
            Novo usuário
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: kpis ? formatNumber(kpis.total) : "—" },
          { label: "Ativos", value: kpis ? formatNumber(kpis.active) : "—" },
          { label: "DAU", value: kpis ? formatNumber(kpis.dau) : "—" },
          { label: "WAU", value: kpis ? formatNumber(kpis.wau) : "—" },
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
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
            placeholder="Buscar..."
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Buscar usuários"
          />
          <select
            value={type}
            onChange={(e) =>
              onFilterChange(setType, e.target.value as (typeof USER_TYPES)[number])
            }
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro tipo"
          >
            {USER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "Todos os tipos" : t}
              </option>
            ))}
          </select>
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
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum usuário encontrado"
            description="Nenhum usuário com esses filtros."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                    <th className="px-2 py-2 font-medium">Usuário</th>
                    <th className="px-2 py-2 font-medium">Estabelecimento</th>
                    <th className="px-2 py-2 font-medium">Tipo</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Último login</th>
                    <th className="px-2 py-2 font-medium">Criaç.</th>
                    <th className="px-2 py-2 font-medium">Atividade</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                    >
                      <td className="px-2 py-2 font-medium text-marka-black">{u.name}</td>
                      <td className="px-2 py-2 text-marka-graphite">
                        {u.establishment ?? "—"}
                      </td>
                      <td className="px-2 py-2">{u.type}</td>
                      <td className="px-2 py-2">
                        <span
                          className={
                            u.status === "ativo"
                              ? "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-800"
                              : "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-marka-off text-marka-graphite"
                          }
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-marka-gray">
                        {u.lastLogin ? formatDateTime(u.lastLogin) : "—"}
                      </td>
                      <td className="px-2 py-2 text-marka-gray">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-2 py-2 text-marka-gray">{u.activity}</td>
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
