"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { getAdminReferrals } from "@/lib/api";
import type { AdminReferralRow } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
import { REFERRAL_STATUS_TONE, StatusPill } from "./StatusPill";

const PAGE_SIZE = 20;

export function AmbassadorReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AdminReferralRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await getAdminReferrals({ page, pageSize: PAGE_SIZE });
      setItems(data);
      setTotal(meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar indicações");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader title="Indicações" description="Todas as indicações registradas pelo programa." />
      <div className="card p-4">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : error ? (
          <ErrorState description={error} onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <EmptyState title="Nenhuma indicação ainda" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-head-cell">Embaixador</th>
                    <th className="table-head-cell">Estabelecimento</th>
                    <th className="table-head-cell">Data</th>
                    <th className="table-head-cell">Status</th>
                    <th className="table-head-cell">Convertido em</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell font-medium text-marka-black">{r.ambassadorName}</td>
                      <td className="table-cell text-marka-graphite">{r.establishmentName ?? "—"}</td>
                      <td className="table-cell text-marka-gray">{formatDate(r.createdAt)}</td>
                      <td className="table-cell">
                        <StatusPill tone={REFERRAL_STATUS_TONE[r.status] ?? "default"}>{r.status}</StatusPill>
                      </td>
                      <td className="table-cell text-marka-gray">{r.convertedAt ? formatDate(r.convertedAt) : "—"}</td>
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
