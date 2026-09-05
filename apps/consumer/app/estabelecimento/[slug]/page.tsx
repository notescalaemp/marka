"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { getEstablishmentBySlug, ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { toUiEstablishment, type Establishment } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

export default function EstablishmentPage() {
  const params = useParams<{ slug: string }>();
  const toast = useToast();
  const {
    isFavoriteEst,
    toggleEstablishmentFavorite,
    toggleProfessionalFavorite,
    isFavoriteProf,
    authStatus,
  } = useStore();

  const [est, setEst] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getEstablishmentBySlug(params.slug);
        if (cancelled) return;
        const ui = toUiEstablishment(data);
        setEst(ui);
        setServiceId(ui.services[0]?.id ?? null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Falha ao carregar");
        setEst(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !est) {
    return (
      <EmptyState
        title="Estabelecimento não encontrado"
        description={error ?? "Verifique o link ou busque outro."}
        action={
          <Link href="/buscar">
            <Button variant="secondary">Voltar à busca</Button>
          </Link>
        }
      />
    );
  }

  const service = est.services.find((s) => s.id === serviceId) ?? est.services[0];
  const photo = est.photos[0];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {photo ? (
          <img
            src={photo}
            alt={est.name}
            className="h-48 w-full rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-lg bg-marka-off text-sm text-marka-gray">
            Sem foto
          </div>
        )}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{est.name}</h1>
            <p className="mt-1 text-sm text-marka-gray">
              {est.category === "nails"
                ? "Nails"
                : est.category === "barbearia"
                  ? "Barbearia"
                  : "Lash Designer"}{" "}
              · {est.location}
            </p>
          </div>
          {est.rating != null ? <StarRating rating={est.rating} /> : null}
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-marka-graphite">
          {est.priceRange ? <span>{est.priceRange}</span> : null}
          {est.nextSlotsLabel ? (
            <>
              <span>·</span>
              <span>{est.nextSlotsLabel}</span>
            </>
          ) : null}
        </div>
      </div>

      {est.description ? (
        <section className="space-y-2">
          <h2 className="text-base font-medium">O que é</h2>
          <p className="text-sm text-marka-graphite">{est.description}</p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-medium">Serviços</h2>
        {est.services.length === 0 ? (
          <p className="text-sm text-marka-gray">Nenhum serviço disponível.</p>
        ) : (
          <div className="space-y-2">
            {est.services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceId(s.id)}
                className={
                  service?.id === s.id
                    ? "w-full rounded-lg border-2 border-marka-black bg-marka-off p-3 text-left"
                    : "w-full rounded-lg border border-marka-graphite/10 p-3 text-left"
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-sm">{formatPrice(s.price)}</span>
                </div>
                <p className="text-xs text-marka-gray">{s.durationMin} min</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium">Profissionais</h2>
        <div className="space-y-3">
          {est.professionals.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-marka-graphite/10 p-3"
            >
              {p.photo ? (
                <img
                  src={p.photo}
                  alt={p.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-marka-off text-xs">
                  {p.name.slice(0, 1)}
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-marka-gray">
                  {p.specialty || "Profissional"}
                  {p.nextSlot ? ` · ${p.nextSlot}` : ""}
                </div>
              </div>
              <button
                type="button"
                className="text-xs underline"
                onClick={() => {
                  if (authStatus !== "authenticated") {
                    toast.show("Faça login para favoritar.");
                    return;
                  }
                  void toggleProfessionalFavorite(p.id).catch((err) => {
                    toast.show(err instanceof ApiError ? err.message : "Erro");
                  });
                }}
              >
                {isFavoriteProf(p.id) ? "Remover" : "Favoritar"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {est.hours ? (
        <section className="space-y-2 text-sm text-marka-graphite">
          <h2 className="text-base font-medium">Horário</h2>
          <p>{est.hours}</p>
        </section>
      ) : null}

      <section className="space-y-2 text-sm text-marka-graphite">
        <h2 className="text-base font-medium">Pagamento</h2>
        <p>
          {est.paymentOptions.length
            ? est.paymentOptions
                .map((p) => (p === "online" ? "Online" : "No estabelecimento"))
                .join(" · ")
            : "No estabelecimento"}
        </p>
      </section>

      <div className="flex flex-col gap-2">
        <Link
          href={`/agendar?est=${est.slug}${service ? `&service=${service.id}` : ""}`}
        >
          <Button className="w-full" disabled={!service}>
            Agendar
          </Button>
        </Link>
        <Button
          variant="secondary"
          onClick={() => {
            if (authStatus !== "authenticated") {
              toast.show("Faça login para favoritar.");
              return;
            }
            void toggleEstablishmentFavorite(est.id).catch((err) => {
              toast.show(err instanceof ApiError ? err.message : "Erro");
            });
          }}
        >
          {isFavoriteEst(est.id)
            ? "Remover dos favoritos"
            : "Favoritar estabelecimento"}
        </Button>
      </div>
    </div>
  );
}
