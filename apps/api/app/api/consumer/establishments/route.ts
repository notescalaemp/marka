import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, parsePagination, ValidationError } from "@marka/shared";
import {
  fromConsumerCategory,
  PUBLIC_ESTABLISHMENT_STATUSES,
  serializeEstablishment,
} from "@/lib/consumer";

const querySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  availableToday: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export const GET = withHandler(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const filters = querySchema.parse({
    q: sp.get("q") ?? undefined,
    category: sp.get("category") ?? undefined,
    location: sp.get("location") ?? undefined,
    availableToday: sp.get("availableToday") ?? undefined,
  });
  // minRating is accepted for API compatibility but ignored — no rating data in schema.
  const { skip, take, page, pageSize } = parsePagination(sp);

  const category = filters.category
    ? fromConsumerCategory(filters.category)
    : null;
  if (filters.category && !category) {
    throw new ValidationError("Categoria inválida");
  }

  const q = filters.q?.trim();
  const location = filters.location?.trim();

  const where = {
    status: { in: [...PUBLIC_ESTABLISHMENT_STATUSES] },
    ...(category ? { category } : {}),
    ...(location
      ? {
          OR: [
            { city: { contains: location, mode: "insensitive" as const } },
            { state: { contains: location, mode: "insensitive" as const } },
            { address: { contains: location, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { city: { contains: q, mode: "insensitive" as const } },
            { services: { some: { name: { contains: q, mode: "insensitive" as const }, active: true } } },
            {
              professionals: {
                some: {
                  active: true,
                  member: { user: { name: { contains: q, mode: "insensitive" as const } } },
                },
              },
            },
          ],
        }
      : {}),
  };

  const include = {
    services: { where: { active: true } },
    professionals: {
      where: { active: true },
      include: {
        member: { select: { user: { select: { name: true } } } },
        services: { include: { service: { select: { id: true, name: true } } } },
      },
    },
  };

  const [rows, total] = await db.$transaction([
    db.establishment.findMany({
      where,
      skip,
      take,
      orderBy: { name: "asc" },
      include,
    }),
    db.establishment.count({ where }),
  ]);

  // availableToday: keep establishments that have at least one active professional
  // (true availability requires slots; without that filter we don't invent "busy").
  let items = rows.map((est) => serializeEstablishment(est));
  if (filters.availableToday) {
    items = items.filter((e) => e.professionals.length > 0 && e.services.length > 0);
  }

  return ok(
    { items, total, page, pageSize },
    { page, pageSize, total }
  );
});
