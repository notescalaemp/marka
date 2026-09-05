"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { BookingWizard } from "@/components/BookingWizard";
import { Button } from "@/components/ui/Button";
import { getEstablishmentBySlug, ApiError } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { toUiEstablishment, type Establishment } from "@/lib/types";

function AgendarInner() {
  const params = useSearchParams();
  const estSlug = params.get("est");
  const service = params.get("service");
  const [est, setEst] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(Boolean(estSlug));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!estSlug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getEstablishmentBySlug(estSlug);
        if (!cancelled) setEst(toUiEstablishment(data));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Estabelecimento inválido");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [estSlug]);

  if (loading) return <Skeleton className="h-40 w-full" />;

  if (estSlug && (error || !est)) {
    return (
      <EmptyState
        title="Estabelecimento não encontrado"
        description={error ?? undefined}
        action={
          <Link href="/buscar">
            <Button variant="secondary">Ir para buscar</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Agendar</h1>
        {est ? (
          <p className="text-sm text-marka-gray">
            {est.name} · {est.category}
          </p>
        ) : null}
      </div>
      <BookingWizard
        initialEstSlug={est?.slug}
        initialServiceId={service ?? undefined}
      />
    </div>
  );
}

export default function AgendarPage() {
  return (
    <Suspense fallback={<div className="text-sm text-marka-gray">Carregando…</div>}>
      <AgendarInner />
    </Suspense>
  );
}
