"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Share2, Check } from "lucide-react";
import { Card } from "@marka/ui/card";
import { Button } from "@marka/ui/button";
import { PageHeader } from "@marka/ui/page-header";
import { StatusBadge } from "@marka/ui/badge-status";
import { Skeleton } from "@marka/ui/skeleton";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ToastProvider";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { getAmbassadorOverview, listAmbassadorReferrals } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/format";
import type { AmbassadorOverviewDto, AmbassadorReferralDto } from "@/lib/api-types";

const REFERRAL_STATUS_TONE: Record<string, "default" | "success" | "warning" | "danger"> = {
  PENDING: "default",
  SIGNED_UP: "warning",
  UNDER_REVIEW: "warning",
  ACTIVE: "success",
  CANCELED: "danger",
};

const REFERRAL_STATUS_LABEL: Record<string, string> = {
  PENDING: "Cadastro",
  SIGNED_UP: "Em avaliação",
  UNDER_REVIEW: "Em avaliação",
  ACTIVE: "Ativo",
  CANCELED: "Cancelado",
};

export default function IndiqueEGanhePage() {
  const { establishment, establishmentId } = useStore();
  const toast = useToast();
  const [overview, setOverview] = useState<AmbassadorOverviewDto | null>(null);
  const [referrals, setReferrals] = useState<AmbassadorReferralDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const code = establishment?.ambassador?.code ?? null;
  const link = code && typeof window !== "undefined" ? `${window.location.origin}/indique/${code}` : "";

  async function load() {
    if (!establishmentId) return;
    setLoading(true);
    setError(null);
    try {
      const [ov, refs] = await Promise.all([
        getAmbassadorOverview(establishmentId),
        listAmbassadorReferrals(establishmentId),
      ]);
      setOverview(ov);
      setReferrals(refs);
    } catch {
      setError("Não foi possível carregar seus dados de Embaixador.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishmentId]);

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.show("Link copiado");
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function shareLink() {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Marka IA", text: "Conheça o Marka IA", url: link });
      } catch {
        /* usuário cancelou o compartilhamento */
      }
    } else {
      await copyLink();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Indique negócios. Ganhe com o Marka."
        description="Compartilhe seu link exclusivo e acompanhe suas indicações em um só lugar."
        actions={
          <Link href="/indique-e-ganhe/saques" className="pill">
            Saques
          </Link>
        }
      />

      <Card className="space-y-4 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-marka-gray">
          Seu link de indicação
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="truncate rounded-xl bg-marka-off px-4 py-2.5 font-mono text-sm text-marka-black">
            {link || "gerando link..."}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" onClick={() => void copyLink()} disabled={!link}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar link"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void shareLink()} disabled={!link}>
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : loading || !overview ? (
        <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="Indicações" value={String(overview.metrics.referrals)} />
            <MetricCard label="Cadastros" value={String(overview.metrics.signups)} />
            <MetricCard label="Clientes ativos" value={String(overview.metrics.activeCustomers)} />
            <MetricCard label="Conversões" value={String(overview.metrics.conversions)} />
            <MetricCard label="Comissões" value={formatPrice(overview.metrics.commissions)} />
            <MetricCard
              label="Disponível para saque"
              value={formatPrice(overview.metrics.availableBalance)}
              highlight
            />
          </div>

          <Card className="p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-marka-gray">
              Funil de indicação
            </p>
            <div className="space-y-1">
              {overview.funnel.map((step, i) => (
                <div key={step.step}>
                  <div className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-marka-off">
                    <span className="text-sm font-medium text-marka-graphite">{step.label}</span>
                    <span className="text-sm font-semibold text-marka-black">{step.count}</span>
                  </div>
                  {i < overview.funnel.length - 1 && (
                    <div className="ml-3 h-3 w-px bg-black/[0.08]" />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-black/[0.06] p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-marka-gray">
                Minhas indicações
              </p>
              <Link href="/indique-e-ganhe/comissoes" className="text-sm font-medium text-marka-green-dark">
                Ver comissões →
              </Link>
            </div>
            {referrals.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Nenhuma indicação ainda"
                  description="Compartilhe seu link para começar a indicar estabelecimentos."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/[0.06] text-left text-xs uppercase tracking-wide text-marka-gray">
                      <th className="px-5 py-3 font-medium">Estabelecimento</th>
                      <th className="px-5 py-3 font-medium">Data</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Plano</th>
                      <th className="px-5 py-3 font-medium">Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r.id} className="border-b border-black/[0.04] last:border-0 hover:bg-marka-off/60">
                        <td className="px-5 py-3 font-medium text-marka-black">
                          {r.establishmentName ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-marka-gray">{formatDate(r.createdAt)}</td>
                        <td className="px-5 py-3">
                          <StatusBadge tone={REFERRAL_STATUS_TONE[r.status] ?? "default"}>
                            {REFERRAL_STATUS_LABEL[r.status] ?? r.status}
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-3 text-marka-graphite">{r.plan ?? "—"}</td>
                        <td className="px-5 py-3 font-medium text-marka-black">{formatPrice(r.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card interactive className={highlight ? "border-marka-green/30 bg-marka-green-soft/40 p-4" : "p-4"}>
      <p className="text-xs text-marka-gray">{label}</p>
      <p className="mt-1 text-lg font-semibold text-marka-black">{value}</p>
    </Card>
  );
}
