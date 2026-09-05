import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";
import { computeSlotsForEstablishment } from "@/lib/consumer-scheduling";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.string().min(1),
  professionalId: z.string().min(1).optional(),
});

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const sp = req.nextUrl.searchParams;
  const query = querySchema.parse({
    date: sp.get("date") ?? undefined,
    serviceId: sp.get("serviceId") ?? undefined,
    professionalId: sp.get("professionalId") ?? undefined,
  });

  const establishment = await db.establishment.findFirst({
    where: { id: establishmentId },
  });
  if (!establishment) throw new NotFoundError("Estabelecimento não encontrado");

  const result = await computeSlotsForEstablishment(establishment, query);
  return ok(result);
});
