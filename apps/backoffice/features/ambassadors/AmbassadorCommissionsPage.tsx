"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { getAdminCommissions, setAdminCommissionStatus } from "@/lib/api";
import type { AdminCommissionRow } from "@/lib/types";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { COMMISSION_STATUS_TONE, StatusPill } from "./StatusPill";

const PAGE_SIZE = 20;
const STATUS_FILTERS = ["all", "PENDING", "APPROVED", "PAID", "CANCELED"] as const;

export function AmbassadorCommissionsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminCommissionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await getAdminCommissions({
        page,
        pageSize: PAGE_SIZE,
        status: status !== "all" ? status : undefined,
      });
      setItems(data);
      setTotal(meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function act(id: string, action: "approve" | "cancel") {
    try {
      await setAdminCommissionStatus(id, action);
      toast.show(action === "approve" ? "Comissão aprovada" : "Comissão cancelada");
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Não foi possível concluir a ação");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Comissões" description="Todas as comissões geradas pelo programa." />
      <div className="card p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as (typeof STATUS_FILTERS)[number]);
            }}
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
          <Skeleton className="h-40 w-full" />
        ) : error ? (
          <ErrorState description={error} onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <EmptyState title="Nenhuma comissão ainda" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-head-cell">Embaixador</th>
                    <th className="table-head-cell">Indicação</th>
                    <th className="table-head-cell">Tipo</th>
                    <th className="table-head-cell">Valor</th>
                    <th className="table-head-cell">Status</th>
                    <th className="table-head-cell">Data</th>
                    <th className="table-head-cell">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id} className="table-row">
                      <td className="table-cell font-medium text-marka-black">{c.ambassadorName}</td>
                      <td className="table-cell text-marka-graphite">{c.referralEstablishment ?? "—"}</td>
                      <td className="table-cell capitalize">{c.kind.toLowerCase()}</td>
                      <td className="table-cell">{formatPrice(c.amount)}</td>
                      <td className="table-cell">
                        <StatusPill tone={COMMISSION_STATUS_TONE[c.status] ?? "default"}>{c.status}</StatusPill>
                      </td>
                      <td className="table-cell text-marka-gray">{formatDate(c.createdAt)}</td>
                      <td className="table-cell">
                        {c.status === "PENDING" && (
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => void act(c.id, "approve")}>
                              Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => void act(c.id, "cancel")}>
                              Cancelar
                            </Button>
                          </div>
                        )}
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
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Anterior
                </Button>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
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
