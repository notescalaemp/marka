import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import {
  PUBLIC_ESTABLISHMENT_STATUSES,
  serializeEstablishment,
  serializeProfessional,
} from "@/lib/consumer";

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);

  const [estFavorites, profFavorites] = await Promise.all([
    db.favoriteEstablishment.findMany({
      where: {
        userId: session.userId,
        establishment: { status: { in: [...PUBLIC_ESTABLISHMENT_STATUSES] } },
      },
      include: {
        establishment: {
          include: {
            services: { where: { active: true } },
            professionals: {
              where: { active: true },
              include: {
                member: { select: { user: { select: { name: true } } } },
                services: { include: { service: { select: { id: true, name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.favoriteProfessional.findMany({
      where: {
        userId: session.userId,
        professional: { active: true },
      },
      include: {
        professional: {
          include: {
            member: { select: { user: { select: { name: true } } } },
            services: { include: { service: { select: { id: true, name: true } } } },
            establishment: { select: { id: true, slug: true, name: true, status: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return ok({
    establishments: estFavorites.map((f) => serializeEstablishment(f.establishment)),
    professionals: profFavorites
      .filter((f) =>
        PUBLIC_ESTABLISHMENT_STATUSES.includes(
          f.professional.establishment.status as (typeof PUBLIC_ESTABLISHMENT_STATUSES)[number]
        )
      )
      .map((f) => ({
        ...serializeProfessional(f.professional),
        establishmentId: f.professional.establishment.id,
        establishmentSlug: f.professional.establishment.slug,
        establishmentName: f.professional.establishment.name,
      })),
  });
});
