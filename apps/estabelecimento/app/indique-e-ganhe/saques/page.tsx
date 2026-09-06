"use client";

import { useEffect, useState } from "react";
import { Card } from "@marka/ui/card";
import { Button } from "@marka/ui/button";
import { PageHeader } from "@marka/ui/page-header";
import { StatusBadge } from "@marka/ui/badge-status";
import { Skeleton } from "@marka/ui/skeleton";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ToastProvider";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ApiError } from "@/lib/api";
import { getAmbassadorWithdrawals, requestAmbassadorWithdrawal } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/format";
import type { AmbassadorWithdrawalsDto } from "@/lib/api-types";

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning",
  PROCESSING: "info",
  PAID: "success",
  REJECTED: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  PAID: "Pago",
  REJECTED: "Recusado",
};

export default function SaquesPage() {
  const { establishmentId } = useStore();
  const toast = useToast();
  const [data, setData] = useState<AmbassadorWithdrawalsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  async function load() {
    if (!establishmentId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getAmbassadorWithdrawals(establishmentId));
    } catch {
      setError("Não foi possível carregar seus saques.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishmentId]);

  async function requestWithdrawal() {
    if (!establishmentId) return;
    setRequesting(true);
    try {
      await requestAmbassadorWithdrawal(establishmentId);
      toast.show("Saque solicitado");
      await load();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Não foi possível solicitar o saque");
    } finally {
      setRequesting(false);
    }
  }

  const canWithdraw = data ? data.availableBalance >= data.minWithdrawalAmount : false;

  return (
    <div className="space-y-6">
      <PageHeader title="Saques" description="Solicite o saque do seu saldo disponível" />

      {error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : loading || !data ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <Card className="space-y-4 border-marka-green/30 bg-marka-green-soft/40 p-6">
            <div>
              <p className="text-xs text-marka-gray">Saldo disponível</p>
              <p className="mt-1 text-3xl font-semibold text-marka-green-dark">
                {formatPrice(data.availableBalance)}
              </p>
            </div>
            <Button onClick={() => void requestWithdrawal()} disabled={!canWithdraw || requesting} loading={requesting}>
              Solicitar saque
            </Button>
            {!canWithdraw && (
              <p className="text-xs text-marka-gray">
                Saques disponíveis a partir de {formatPrice(data.minWithdrawalAmount)}.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-marka-gray">
              Últimos saques
            </p>
            {data.withdrawals.length === 0 ? (
              <EmptyState title="Nenhum saque solicitado ainda" />
            ) : (
              <ul className="stagger space-y-2">
                {data.withdrawals.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-marka-off"
                  >
                    <div>
                      <p className="text-sm font-medium text-marka-black">{formatPrice(w.amount)}</p>
                      <p className="text-xs text-marka-gray">{formatDate(w.requestedAt)}</p>
                    </div>
                    <StatusBadge tone={STATUS_TONE[w.status] ?? "default"}>
                      {STATUS_LABEL[w.status] ?? w.status}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
