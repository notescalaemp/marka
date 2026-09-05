import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError } from "@marka/shared";
import { PUBLIC_ESTABLISHMENT_STATUSES, serializeEstablishment } from "@/lib/consumer";

export const GET = withHandler(async (_req: NextRequest, { params }) => {
  const { slug } = await params;

  const est = await db.establishment.findFirst({
    where: {
      slug,
      status: { in: [...PUBLIC_ESTABLISHMENT_STATUSES] },
    },
    include: {
      services: { where: { active: true }, orderBy: { name: "asc" } },
      professionals: {
        where: { active: true },
        include: {
          member: { select: { user: { select: { name: true } } } },
          services: { include: { service: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  if (!est) throw new NotFoundError("Estabelecimento não encontrado");

  return ok(serializeEstablishment(est));
});
