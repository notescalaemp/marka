"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { EstablishmentCard } from "@/components/EstablishmentCard";
import { FilterDrawer } from "@/components/FilterDrawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { listEstablishments, ApiError } from "@/lib/api";
import type { FilterState, Establishment } from "@/lib/types";
import { toUiEstablishment } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";

function SearchPageInner() {
  const params = useSearchParams();
  const toast = useToast();
  const { toggleEstablishmentFavorite, isFavoriteEst, authStatus } = useStore();
  const initialQ = params.get("q") ?? "";
  const initialCategory =
    (params.get("category") as "nails" | "barbearia" | "lash-designer" | null) ?? "all";

  const [query, setQuery] = useState(initialQ);
  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    location: "",
    price: "",
    rating: "",
    availability: "",
    distance: "",
    service: "",
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [results, setResults] = useState<Establishment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiParams = useMemo(
    () => ({
      q: query || undefined,
      category: filters.category === "all" ? undefined : filters.category,
      location: filters.location || undefined,
      availableToday: filters.availability === "today" ? "true" : undefined,
      pageSize: 20,
    }),
    [query, filters]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listEstablishments(apiParams);
        if (cancelled) return;
        setResults(data.items.map(toUiEstablishment));
        setTotal(data.total);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Falha na busca");
        setResults([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiParams]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Buscar</h1>
        <Button size="sm" variant="secondary" onClick={() => setDrawerOpen(true)}>
          Filtros
        </Button>
      </div>

      <SearchBar
        initialQuery={query}
        onSearch={(q) => setQuery(q)}
      />

      <div className="flex flex-wrap gap-2 text-xs text-marka-gray">
        {loading ? "Buscando…" : `${total} resultado${total === 1 ? "" : "s"}`}
        {query ? ` para “${query}”` : ""}
      </div>

      {error ? (
        <EmptyState title="Erro na busca" description={error} />
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}

      {!loading && !error && results.length === 0 ? (
        <EmptyState
          title="Nenhum resultado"
          description="Tente outra busca ou limpe os filtros."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery("");
                setFilters({
                  category: "all",
                  location: "",
                  price: "",
                  rating: "",
                  availability: "",
                  distance: "",
                  service: "",
                });
              }}
            >
              Limpar busca
            </Button>
          }
        />
      ) : null}

      {!loading && !error ? (
        <div className="space-y-3">
          {results.map((est) => (
            <EstablishmentCard
              key={est.id}
              est={est}
              favorite={isFavoriteEst(est.id)}
              onFavorite={() => {
                if (authStatus !== "authenticated") {
                  toast.show("Faça login para favoritar.");
                  return;
                }
                void toggleEstablishmentFavorite(est.id).catch((err) => {
                  toast.show(err instanceof ApiError ? err.message : "Erro ao favoritar");
                });
              }}
            />
          ))}
        </div>
      ) : null}

      <FilterDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        filters={filters}
        onChange={setFilters}
        onApply={() => setDrawerOpen(false)}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-sm text-marka-gray">Carregando…</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
