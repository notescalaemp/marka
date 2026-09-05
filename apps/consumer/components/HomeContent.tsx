"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { BeautyMemoryBanner } from "@/components/BeautyMemoryBanner";
import { categories, toUiEstablishment, type Establishment } from "@/lib/types";
import { listEstablishments, ApiError } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export function HomeContent() {
  const { favorites } = useStore();
  const [recommended, setRecommended] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listEstablishments({ pageSize: 6 });
        if (cancelled) return;
        setRecommended(data.items.map(toUiEstablishment));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Falha ao carregar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm text-marka-gray">
          Descubra, encontre e agende em minutos.
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-marka-black">
          O que você quer fazer?
        </h1>
        <SearchBar />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-marka-graphite">Categorias</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/buscar?category=${c.id}`}
              className="shrink-0 rounded-md border border-marka-graphite/10 bg-marka-off px-3 py-2 text-sm"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <BeautyMemoryBanner />

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-medium text-marka-graphite">
            Próximos e recomendados
          </h2>
          <Link href="/buscar" className="text-sm text-marka-graphite">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : null}

        {error ? (
          <EmptyState
            title="Não foi possível carregar"
            description={error}
            action={
              <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
                Tentar de novo
              </Button>
            }
          />
        ) : null}

        {!loading && !error && recommended.length === 0 ? (
          <EmptyState
            title="Nenhum estabelecimento"
            description="Ainda não há estabelecimentos publicados."
          />
        ) : null}

        {!loading && !error ? (
          <div className="space-y-3">
            {recommended.map((est) => (
              <EstablishmentCard key={est.id} est={est} />
            ))}
          </div>
        ) : null}
      </section>

      {favorites.establishments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-marka-graphite">Favoritos</h2>
          <div className="space-y-3">
            {favorites.establishments.map((est) => (
              <EstablishmentCard key={est.id} est={est} favorite />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-marka-graphite/10 bg-marka-off p-4">
        <h2 className="font-medium">Sugestão</h2>
        <p className="mt-1 text-sm text-marka-graphite">
          Explore as categorias e agende em poucos passos.
        </p>
        <Link href="/buscar" className="mt-3 inline-block text-sm">
          <Button size="sm" variant="secondary">
            Ver serviços
          </Button>
        </Link>
      </section>
    </div>
  );
}
