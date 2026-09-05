"use client";

import { EstablishmentCard } from "@/components/EstablishmentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

export default function FavoritesPage() {
  const {
    favorites,
    toggleEstablishmentFavorite,
    toggleProfessionalFavorite,
    authStatus,
  } = useStore();
  const toast = useToast();

  if (authStatus === "unauthenticated") {
    return (
      <EmptyState
        title="Faça login"
        description="Entre na sua conta para ver seus favoritos."
        action={
          <Link href="/perfil">
            <Button variant="secondary">Ir para perfil</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Favoritos</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Estabelecimentos</h2>
        {favorites.establishments.length === 0 ? (
          <EmptyState
            title="Nenhum estabelecimento favoritado"
            description="Toque em Favoritar em um resultado de busca."
            action={
              <Link href="/buscar">
                <Button size="sm" variant="secondary">
                  Buscar
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {favorites.establishments.map((est) => (
              <EstablishmentCard
                key={est.id}
                est={est}
                favorite
                onFavorite={() => {
                  void toggleEstablishmentFavorite(est.id).catch((err) => {
                    toast.show(err instanceof ApiError ? err.message : "Erro");
                  });
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Profissionais</h2>
        {favorites.professionals.length === 0 ? (
          <EmptyState
            title="Nenhum profissional favoritado"
            description="Favoritos de profissionais aparecem aqui."
          />
        ) : (
          <div className="space-y-3">
            {favorites.professionals.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-marka-graphite/10 p-3"
              >
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt={p.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-marka-off text-xs">
                    {p.name.slice(0, 1)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-marka-gray">
                    {p.specialty}
                    {p.establishmentName ? ` · ${p.establishmentName}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() => {
                    void toggleProfessionalFavorite(p.id).catch((err) => {
                      toast.show(err instanceof ApiError ? err.message : "Erro");
                    });
                  }}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
