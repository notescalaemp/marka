import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, created, NotFoundError } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { PUBLIC_ESTABLISHMENT_STATUSES } from "@/lib/consumer";

const bodySchema = z.object({
  establishmentId: z.string().min(1),
});

export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);
  const body = bodySchema.parse(await req.json());

  const est = await db.establishment.findFirst({
    where: {
      id: body.establishmentId,
      status: { in: [...PUBLIC_ESTABLISHMENT_STATUSES] },
    },
  });
  if (!est) throw new NotFoundError("Estabelecimento não encontrado");

  await db.favoriteEstablishment.upsert({
    where: {
      userId_establishmentId: {
        userId: session.userId,
        establishmentId: est.id,
      },
    },
    create: { userId: session.userId, establishmentId: est.id },
    update: {},
  });

  return created({ establishmentId: est.id });
});
