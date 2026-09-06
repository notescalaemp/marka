"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { ApiError, getAdminEstablishment, getEstablishmentAmbassador, promoteToAmbassador, type EstablishmentAmbassadorDto } from "@/lib/api";
import type { EstablishmentDetailView } from "@/lib/api-types";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { mapEstablishmentDetail } from "@/lib/mappers";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AMBASSADOR_STATUS_TONE, StatusPill } from "@/features/ambassadors/StatusPill";

export function EstablishmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { startImpersonation } = useStore();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<EstablishmentDetailView | null>(null);
  const [ambassador, setAmbassador] = useState<EstablishmentAmbassadorDto | null>(null);
  const [confirmPromote, setConfirmPromote] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const [dto, ambassadorDto] = await Promise.all([
        getAdminEstablishment(id),
        getEstablishmentAmbassador(id),
      ]);
      setData(mapEstablishmentDetail(dto));
      setAmbassador(ambassadorDto);
    } catch (err) {
      setData(null);
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
        setError(null);
      } else {
        setNotFound(false);
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar estabelecimento"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function promote() {
    if (!id) return;
    setPromoting(true);
    try {
      await promoteToAmbassador(id);
      toast.show("Estabelecimento agora é Embaixador");
      setConfirmPromote(false);
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Não foi possível promover");
    } finally {
      setPromoting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-black/10 bg-marka-off/60 p-10 text-center">
        <h2 className="text-lg font-semibold text-marka-black">Estabelecimento não encontrado</h2>
        <p className="mt-1 text-sm text-marka-gray">
          Verifique o ID ou retorne à lista.
        </p>
        <Link
          href="/establishments"
          className="mt-4 inline-block text-sm font-medium text-marka-green-dark underline"
        >
          Voltar à lista
        </Link>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Estabelecimento"
          description="Detalhe do estabelecimento"
          actions={
            <Link href="/establishments">
              <Button size="sm" variant="secondary">
                Voltar
              </Button>
            </Link>
          }
        />
        <ErrorState
          description={error ?? "Dados indisponíveis"}
          onRetry={() => void load()}
        />
      </div>
    );
  }

  const sections = [
    {
      title: "Overview",
      body: (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["MRR", formatPrice(data.mrr)],
            ["LTV", "—"],
            ["Plano", data.plan],
            ["Status", data.status],
            ["Assinatura", data.subscriptionStatus],
            ["Próxima cobrança", data.nextBilling],
            ["Último acesso", data.lastAccess],
            ["Criado em", data.createdAt],
            ["Categoria", data.category || "—"],
            ["Owner", data.ownerName],
            ["E-mail owner", data.ownerEmail],
            ["Members", formatNumber(data.members)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-black/[0.06] bg-marka-off/40 px-3 py-2"
            >
              <p className="text-xs text-marka-gray">{label}</p>
              <p className="mt-0.5 text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Usage",
      body: (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Agendamentos", formatNumber(data.appointmentsTotal)],
            ["Concluídos", formatNumber(data.appointmentsCompleted)],
            ["Cancelados", formatNumber(data.appointmentsCanceled)],
            ["Clientes", formatNumber(data.customers)],
            ["Profissionais", formatNumber(data.professionals)],
            [
              "Utilização",
              data.utilization == null ? "—" : `${data.utilization}%`,
            ],
            ["Serviços", "—"],
            ["Produtos", "—"],
            ["Campanhas", "—"],
            ["marka AI", "—"],
            ["Sessões", "—"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-black/[0.06] px-3 py-2"
            >
              <p className="text-xs text-marka-gray">{label}</p>
              <p className="mt-0.5 text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Engagement",
      body: (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["DAU", "—"],
            ["WAU", "—"],
            ["MAU", "—"],
            ["Dias ativos", "—"],
            ["Sessões", "—"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-black/[0.06] px-3 py-2"
            >
              <p className="text-xs text-marka-gray">{label}</p>
              <p className="mt-0.5 text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Finance",
      body: (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total pago", formatPrice(data.totalPaid)],
            ["Pagamentos falhos", formatNumber(data.failedPayments)],
            ["Reembolsos", formatNumber(data.refunds)],
            ["Inadimplência", "—"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-black/[0.06] px-3 py-2"
            >
              <p className="text-xs text-marka-gray">{label}</p>
              <p className="mt-0.5 text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Churn",
      body: (
        <div className="space-y-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-black/[0.06] px-3 py-2">
              <p className="text-xs text-marka-gray">Churn risk</p>
              <p className="mt-0.5 text-sm font-medium capitalize">
                {data.churnRisk}
              </p>
            </div>
            <div className="rounded-xl border border-black/[0.06] px-3 py-2">
              <p className="text-xs text-marka-gray">MRR at risk</p>
              <p className="mt-0.5 text-sm font-medium">—</p>
            </div>
          </div>
          <p className="text-sm text-marka-gray">
            Motivos de risco detalhados ainda não disponíveis na API.
          </p>
        </div>
      ),
    },
    {
      title: "Activity",
      body:
        data.recentActivity.length === 0 ? (
          <p className="text-sm text-marka-gray">Nenhuma atividade recente.</p>
        ) : (
          <ul className="space-y-2">
            {data.recentActivity.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-black/[0.06] px-3 py-2"
              >
                <p className="text-sm font-medium text-marka-black">
                  {a.action}
                </p>
                <span className="text-xs text-marka-gray">{a.at}</span>
              </li>
            ))}
          </ul>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.name}
        description={`${data.ownerName} · ${data.plan} · ${data.status}`}
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void startImpersonation({ id: data.id, name: data.name })
                  .then(() => toast.show(`Impersonation de ${data.name}`))
                  .catch((err) =>
                    toast.show(
                      err instanceof Error
                        ? err.message
                        : "Erro ao iniciar impersonation"
                    )
                  );
              }}
            >
              Acessar como owner
            </Button>
            <Link href="/establishments">
              <Button size="sm" variant="secondary">
                Voltar
              </Button>
            </Link>
          </>
        }
      />

      <div className="flex gap-2">
        <StatusBadge status={data.status} />
        <span className="text-xs text-marka-gray">
          Churn risk: {data.churnRisk}
        </span>
      </div>

      <section className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold text-marka-graphite">Programa de Embaixadores</h2>
        {ambassador ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <StatusPill tone={AMBASSADOR_STATUS_TONE[ambassador.status] ?? "default"}>{ambassador.status}</StatusPill>
              <p className="text-sm text-marka-graphite">
                Código <span className="font-mono font-medium">{ambassador.code}</span> · marka.ai/indique/{ambassador.code}
              </p>
              <p className="text-xs text-marka-gray">Embaixador desde {formatDate(ambassador.createdAt)}</p>
            </div>
            <div className="flex gap-2">
              {ambassador.status !== "REMOVED" && (
                <Link href={`/ambassadors/${ambassador.id}`}>
                  <Button size="sm" variant="secondary">Ver no programa</Button>
                </Link>
              )}
              {ambassador.status === "REMOVED" && (
                <Button size="sm" onClick={() => setConfirmPromote(true)}>
                  Tornar Embaixador
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-marka-gray">Não é Embaixador</p>
            <Button size="sm" onClick={() => setConfirmPromote(true)}>
              Tornar Embaixador
            </Button>
          </div>
        )}
      </section>

      <div className="stagger space-y-4">
        {sections.map((s) => (
          <section key={s.title} className="card space-y-3 p-4">
            <h2 className="text-sm font-semibold text-marka-graphite">{s.title}</h2>
            {s.body}
          </section>
        ))}
      </div>

      <ConfirmDialog
        open={confirmPromote}
        title="Tornar este estabelecimento um Embaixador?"
        description="Ele terá acesso ao Indique e Ganhe e receberá um link exclusivo para indicações."
        confirmLabel={promoting ? "Confirmando..." : "Confirmar"}
        onCancel={() => setConfirmPromote(false)}
        onConfirm={() => void promote()}
      />
    </div>
  );
}
