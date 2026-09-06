"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { ApiError, getAmbassador, setAmbassadorStatus } from "@/lib/api";
import type { AmbassadorDetail } from "@/lib/types";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import {
  AMBASSADOR_STATUS_TONE,
  REFERRAL_STATUS_TONE,
  StatusPill,
} from "./StatusPill";

export function AmbassadorDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<AmbassadorDetail | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      setData(await getAmbassador(id));
    } catch (err) {
      setData(null);
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(err instanceof Error ? err.message : "Erro ao carregar embaixador");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove() {
    if (!data) return;
    try {
      await setAmbassadorStatus(data.id, "remove");
      toast.show("Acesso de Embaixador removido");
      setConfirmRemove(false);
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Não foi possível remover");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-black/10 bg-marka-off/60 p-10 text-center">
        <h2 className="text-lg font-semibold text-marka-black">Embaixador não encontrado</h2>
        <Link href="/ambassadors/list" className="mt-4 inline-block text-sm font-medium text-marka-green-dark underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  const link = `marka.ai/indique/${data.code}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.establishmentName}
        description={`Código ${data.code} · ${link}`}
        actions={
          <>
            {data.status !== "REMOVED" && (
              <Button size="sm" variant="destructive" onClick={() => setConfirmRemove(true)}>
                Remover Embaixador
              </Button>
            )}
            <Link href="/ambassadors/list">
              <Button size="sm" variant="secondary">Voltar</Button>
            </Link>
          </>
        }
      />

      <div className="flex gap-2">
        <StatusPill tone={AMBASSADOR_STATUS_TONE[data.status] ?? "default"}>{data.status}</StatusPill>
      </div>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Indicações", formatNumber(data.referrals)],
          ["Conversões", formatNumber(data.conversions)],
          ["Clientes ativos", formatNumber(data.activeCustomers)],
          ["Receita gerada", formatPrice(data.revenueGenerated)],
          ["Comissões", formatPrice(data.commissionGenerated)],
          ["Saldo", formatPrice(data.availableBalance)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-black/[0.06] px-3 py-2">
            <p className="text-xs text-marka-gray">{label}</p>
            <p className="mt-0.5 text-sm font-medium">{value}</p>
          </div>
        ))}
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold text-marka-graphite">Histórico de indicações</h2>
        {data.referralHistory.length === 0 ? (
          <p className="text-sm text-marka-gray">Nenhuma indicação ainda.</p>
        ) : (
          <ul className="space-y-2">
            {data.referralHistory.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-black/[0.06] px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-marka-black">{r.establishmentName ?? "—"}</p>
                  <p className="text-xs text-marka-gray">{formatDate(r.createdAt)}</p>
                </div>
                <StatusPill tone={REFERRAL_STATUS_TONE[r.status] ?? "default"}>{r.status}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold text-marka-graphite">Histórico financeiro</h2>
        {data.financialHistory.length === 0 ? (
          <p className="text-sm text-marka-gray">Nenhuma movimentação ainda.</p>
        ) : (
          <ul className="space-y-2">
            {data.financialHistory.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-xl border border-black/[0.06] px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-marka-black">{f.label}</p>
                  <p className="text-xs text-marka-gray">
                    {formatDate(f.date)} · {f.status}
                  </p>
                </div>
                <span className={f.amount >= 0 ? "text-sm font-semibold text-marka-green-dark" : "text-sm font-semibold text-marka-graphite"}>
                  {f.amount >= 0 ? "+" : "-"} {formatPrice(Math.abs(f.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirmRemove}
        title="Remover acesso de Embaixador"
        description="O estabelecimento perde acesso à dashboard e a novos links de indicação. Todo o histórico de indicações, comissões e saques é preservado — nada é apagado."
        confirmLabel="Remover"
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
