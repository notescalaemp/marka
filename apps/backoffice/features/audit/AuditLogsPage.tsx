"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { getAdminAuditLogs } from "@/lib/api";
import type { AdminAuditLogDto } from "@/lib/api-types";
import { formatDateTime, formatNumber } from "@/lib/format";

const PAGE_SIZE = 20;

const RESULT_FILTERS = ["all", "sucesso", "falha"] as const;

export function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminAuditLogDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [result, setResult] = useState<(typeof RESULT_FILTERS)[number]>("all");
  const [actionInput, setActionInput] = useState("");
  const [action, setAction] = useState("");
  const [adminInput, setAdminInput] = useState("");
  const [admin, setAdmin] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await getAdminAuditLogs({
        page,
        pageSize: PAGE_SIZE,
        action: action || undefined,
        admin: admin || undefined,
      });
      setItems(data);
      setTotal(Number(meta.total ?? 0));
      setPageSize(Number(meta.pageSize ?? PAGE_SIZE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar audit logs");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, action, admin]);

  useEffect(() => {
    void load();
  }, [load]);

  const admins = useMemo(() => {
    const set = new Set(items.map((l) => l.admin));
    return ["all", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((l) => {
      if (result !== "all" && result === "sucesso" && l.result !== "sucesso") {
        return false;
      }
      if (result === "falha" && l.result === "sucesso") return false;
      return true;
    });
  }, [items, result]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function applyFilters() {
    setPage(1);
    setAction(actionInput.trim());
    setAdmin(adminInput === "all" ? "" : adminInput.trim());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Registro de ações administrativas."
      />

      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={result}
            onChange={(e) => {
              setPage(1);
              setResult(e.target.value as (typeof RESULT_FILTERS)[number]);
            }}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro resultado"
          >
            {RESULT_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Todos os resultados" : s}
              </option>
            ))}
          </select>
          <input
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
            placeholder="Filtrar ação..."
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro ação"
          />
          <select
            value={adminInput || "all"}
            onChange={(e) => setAdminInput(e.target.value)}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro administrador"
          >
            {admins.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Todos os admins" : s}
              </option>
            ))}
          </select>
          <Button size="sm" variant="secondary" onClick={applyFilters}>
            Aplicar
          </Button>
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
            title="Nenhum log com esses filtros"
            description="Ajuste os filtros ou limpe a busca."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                    <th className="px-2 py-2 font-medium">Data/hora</th>
                    <th className="px-2 py-2 font-medium">Administrador</th>
                    <th className="px-2 py-2 font-medium">Ação</th>
                    <th className="px-2 py-2 font-medium">Entidade</th>
                    <th className="px-2 py-2 font-medium">Resultado</th>
                    <th className="px-2 py-2 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                    >
                      <td className="px-2 py-2 text-marka-gray">
                        {formatDateTime(l.at)}
                      </td>
                      <td className="px-2 py-2">{l.admin}</td>
                      <td className="px-2 py-2">{l.action}</td>
                      <td className="px-2 py-2">{l.entity}</td>
                      <td className="px-2 py-2 capitalize">{l.result}</td>
                      <td className="px-2 py-2 text-marka-gray">{l.ip}</td>
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
