import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, noContent, NotFoundError } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";

export const DELETE = withHandler(async (req: NextRequest, { params }) => {
  const session = await requireUserAuth(req);
  const { id } = await params;

  const existing = await db.favoriteEstablishment.findUnique({
    where: {
      userId_establishmentId: {
        userId: session.userId,
        establishmentId: id,
      },
    },
  });
  if (!existing) throw new NotFoundError("Favorito não encontrado");

  await db.favoriteEstablishment.delete({
    where: {
      userId_establishmentId: {
        userId: session.userId,
        establishmentId: id,
      },
    },
  });

  return noContent();
});
