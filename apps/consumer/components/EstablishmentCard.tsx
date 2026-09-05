"use client";

import Link from "next/link";
import { StarRating } from "@/components/ui/StarRating";
import { cn } from "@/lib/cn";
import type { Establishment } from "@/lib/types";
import { formatDistance } from "@/lib/format";

interface Props {
  est: Establishment;
  favorite?: boolean;
  onFavorite?: () => void;
}

function categoryLabel(category: string) {
  if (category === "nails") return "Nails";
  if (category === "barbearia") return "Barbearia";
  if (category === "lash-designer") return "Lash Designer";
  return category;
}

export function EstablishmentCard({ est, favorite, onFavorite }: Props) {
  const photo = est.photos[0];

  return (
    <article className="group overflow-hidden rounded-lg border border-marka-graphite/10 bg-marka-white">
      <Link href={`/estabelecimento/${est.slug}`} className="block">
        <div className="relative h-36 overflow-hidden bg-marka-off">
          {photo ? (
            <img
              src={photo}
              alt={est.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-marka-gray">
              Sem foto
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-md bg-marka-black/80 px-2 py-1 text-xs text-marka-white">
            {categoryLabel(est.category)}
          </span>
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-medium text-marka-black">{est.name}</h3>
            {est.rating != null ? <StarRating rating={est.rating} size="sm" /> : null}
          </div>
          <p className="text-xs text-marka-gray">{est.location}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-marka-graphite">
            {est.priceRange ? <span>{est.priceRange}</span> : null}
            {est.distanceKm != null ? (
              <>
                <span>·</span>
                <span>{formatDistance(est.distanceKm)}</span>
              </>
            ) : null}
            {est.nextSlotsLabel ? (
              <>
                <span>·</span>
                <span>{est.nextSlotsLabel}</span>
              </>
            ) : null}
          </div>
        </div>
      </Link>
      {onFavorite ? (
        <button
          type="button"
          onClick={onFavorite}
          className={cn(
            "mx-3 mb-3 w-[calc(100%-1.5rem)] rounded-md border px-3 py-2 text-sm",
            favorite
              ? "border-marka-black bg-marka-off text-marka-black"
              : "border-marka-graphite/15 text-marka-graphite"
          )}
        >
          {favorite ? "Remover dos favoritos" : "Favoritar"}
        </button>
      ) : null}
    </article>
  );
}
