"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { listBookings, ApiError, type ApiBooking } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function statusLabel(status: string) {
  switch (status) {
    case "cancelled":
      return "Cancelado";
    case "completed":
      return "Concluído";
    case "confirmed":
      return "Confirmado";
    case "pending":
      return "Aguardando";
    case "no_show":
      return "Não compareceu";
    default:
      return status;
  }
}

function AgendamentosInner() {
  const params = useSearchParams();
  const { cancelAppointment, authStatus } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<"next" | "history">("next");
  const [items, setItems] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const confirmed = params.get("confirmado") === "1";

  useEffect(() => {
    if (authStatus === "loading") return;
    if (authStatus !== "authenticated") {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listBookings(tab === "next" ? "upcoming" : "history");
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Falha ao carregar");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, authStatus]);

  if (authStatus === "unauthenticated") {
    return (
      <EmptyState
        title="Faça login"
        description="Entre na sua conta para ver seus agendamentos."
        action={
          <Link href="/perfil">
            <Button variant="secondary">Ir para perfil</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Agendamentos</h1>
      {confirmed ? (
        <p className="rounded-md bg-marka-off px-3 py-2 text-sm">
          Agendamento confirmado.
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={tab === "next" ? "primary" : "secondary"}
          onClick={() => setTab("next")}
        >
          Próximos
        </Button>
        <Button
          size="sm"
          variant={tab === "history" ? "primary" : "secondary"}
          onClick={() => setTab("history")}
        >
          Histórico
        </Button>
      </div>

      {loading ? <Skeleton className="h-24 w-full" /> : null}
      {error ? <EmptyState title="Erro" description={error} /> : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title={tab === "next" ? "Nenhum agendamento" : "Sem histórico"}
          description={
            tab === "next"
              ? "Quando você confirmar um horário, ele aparece aqui."
              : "Atendimentos concluídos ou cancelados aparecem aqui."
          }
          action={
            tab === "next" ? (
              <Link href="/buscar">
                <Button variant="secondary">Buscar</Button>
              </Link>
            ) : undefined
          }
        />
      ) : null}

      {!loading &&
        !error &&
        items.map((a) => (
          <Card key={a.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium">{a.establishmentName}</h3>
                <p className="text-sm text-marka-gray">
                  {formatDate(a.date)} · {a.time}
                </p>
              </div>
              <span className="text-xs">{formatPrice(a.price)}</span>
            </div>
            <p className="text-sm">{a.serviceName}</p>
            <p className="text-xs text-marka-gray">
              {a.professionalName} · {statusLabel(a.status)}
            </p>
            <div className="flex gap-2">
              <Link href={`/estabelecimento/${a.establishmentSlug}`}>
                <Button size="sm" variant="secondary">
                  Ver
                </Button>
              </Link>
              {tab === "next" && (a.status === "confirmed" || a.status === "pending") ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void cancelAppointment(a.id)
                      .then(() => {
                        toast.show("Agendamento cancelado.");
                        setItems((prev) => prev.filter((x) => x.id !== a.id));
                      })
                      .catch((err) => {
                        toast.show(err instanceof ApiError ? err.message : "Erro ao cancelar");
                      });
                  }}
                >
                  Cancelar
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
    </div>
  );
}

export default function AgendamentosPage() {
  return (
    <Suspense fallback={<div className="text-sm text-marka-gray">Carregando…</div>}>
      <AgendamentosInner />
    </Suspense>
  );
}
