"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { getAmbassadors, setAmbassadorStatus } from "@/lib/api";
import type { AmbassadorRow } from "@/lib/types";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { AMBASSADOR_STATUS_TONE, StatusPill } from "./StatusPill";

const PAGE_SIZE = 20;

export function AmbassadorsListPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AmbassadorRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<{ id: string; action: "suspend" | "remove" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, meta } = await getAmbassadors({ page, pageSize: PAGE_SIZE, search: search || undefined });
      setItems(data);
      setTotal(meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar embaixadores");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function runAction(id: string, action: "suspend" | "remove") {
    try {
      await setAmbassadorStatus(id, action === "suspend" ? "suspend" : "remove");
      toast.show(action === "suspend" ? "Embaixador suspenso" : "Acesso de Embaixador removido");
      setConfirm(null);
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Não foi possível concluir a ação");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Embaixadores" description="Todos os estabelecimentos com o programa liberado." />

      <div className="card p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            className="field-sm"
            placeholder="Buscar estabelecimento..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <EmptyState title="Nenhum embaixador ainda" description="Promova um estabelecimento na página de detalhes dele." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-head-cell">Embaixador</th>
                    <th className="table-head-cell">Data de entrada</th>
                    <th className="table-head-cell">Indicações</th>
                    <th className="table-head-cell">Conversões</th>
                    <th className="table-head-cell">Clientes ativos</th>
                    <th className="table-head-cell">Comissão gerada</th>
                    <th className="table-head-cell">Saldo disponível</th>
                    <th className="table-head-cell">Status</th>
                    <th className="table-head-cell">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id} className="table-row">
                      <td className="table-cell font-medium text-marka-black">{a.establishmentName}</td>
                      <td className="table-cell text-marka-gray">{formatDate(a.createdAt)}</td>
                      <td className="table-cell">{formatNumber(a.referrals)}</td>
                      <td className="table-cell">{formatNumber(a.conversions)}</td>
                      <td className="table-cell">{formatNumber(a.activeCustomers)}</td>
                      <td className="table-cell">{formatPrice(a.commissionGenerated)}</td>
                      <td className="table-cell">{formatPrice(a.availableBalance)}</td>
                      <td className="table-cell">
                        <StatusPill tone={AMBASSADOR_STATUS_TONE[a.status] ?? "default"}>{a.status}</StatusPill>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          <Link href={`/ambassadors/${a.id}`}>
                            <Button size="sm" variant="secondary">Ver detalhes</Button>
                          </Link>
                          {a.status === "ACTIVE" && (
                            <Button size="sm" variant="secondary" onClick={() => setConfirm({ id: a.id, action: "suspend" })}>
                              Suspender
                            </Button>
                          )}
                          {a.status !== "REMOVED" && (
                            <Button size="sm" variant="destructive" onClick={() => setConfirm({ id: a.id, action: "remove" })}>
                              Remover
                            </Button>
                          )}
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

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.action === "remove" ? "Remover acesso de Embaixador" : "Suspender Embaixador"}
        description={
          confirm?.action === "remove"
            ? "O estabelecimento perde acesso à dashboard e a novos links de indicação. Todo o histórico de indicações, comissões e saques é preservado."
            : "O estabelecimento perde acesso temporário à dashboard de Indique e Ganhe até ser reativado."
        }
        confirmLabel={confirm?.action === "remove" ? "Remover" : "Suspender"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && void runAction(confirm.id, confirm.action)}
      />
    </div>
  );
}
