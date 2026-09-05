import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, created, NotFoundError } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { PUBLIC_ESTABLISHMENT_STATUSES } from "@/lib/consumer";

const bodySchema = z.object({
  professionalId: z.string().min(1),
});

export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);
  const body = bodySchema.parse(await req.json());

  const professional = await db.professional.findFirst({
    where: {
      id: body.professionalId,
      active: true,
      establishment: { status: { in: [...PUBLIC_ESTABLISHMENT_STATUSES] } },
    },
  });
  if (!professional) throw new NotFoundError("Profissional não encontrado");

  await db.favoriteProfessional.upsert({
    where: {
      userId_professionalId: {
        userId: session.userId,
        professionalId: professional.id,
      },
    },
    create: { userId: session.userId, professionalId: professional.id },
    update: {},
  });

  return created({ professionalId: professional.id });
});
