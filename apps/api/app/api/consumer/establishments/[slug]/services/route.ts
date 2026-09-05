import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError } from "@marka/shared";
import { PUBLIC_ESTABLISHMENT_STATUSES, serializeService } from "@/lib/consumer";

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

  const services = await db.service.findMany({
    where: { establishmentId: est.id, active: true },
    orderBy: { name: "asc" },
  });

  return ok(services.map(serializeService));
});
