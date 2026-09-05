import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError } from "@marka/shared";
import { PUBLIC_ESTABLISHMENT_STATUSES, serializeProfessional } from "@/lib/consumer";

async function resolvePublicEstablishment(slugOrId: string) {
  const est = await db.establishment.findFirst({
    where: {
      status: { in: [...PUBLIC_ESTABLISHMENT_STATUSES] },
      OR: [{ slug: slugOrId }, { id: slugOrId }],
    },
  });
  if (!est) throw new NotFoundError("Estabelecimento não encontrado");
  return est;
}

export const GET = withHandler(async (_req: NextRequest, { params }) => {
  const { slug } = await params;
  const est = await resolvePublicEstablishment(slug);

  const professionals = await db.professional.findMany({
    where: { establishmentId: est.id, active: true },
    include: {
      member: { select: { user: { select: { name: true } } } },
      services: { include: { service: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return ok(professionals.map(serializeProfessional));
});
