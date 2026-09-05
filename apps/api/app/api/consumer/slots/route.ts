import type { NextRequest } from "next/server";
import { z } from "zod";
import { withHandler, ok } from "@marka/shared";
import { computeSlots } from "@/lib/consumer-scheduling";

const querySchema = z.object({
  establishmentId: z.string().min(1),
  serviceId: z.string().min(1),
  professionalId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const GET = withHandler(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const query = querySchema.parse({
    establishmentId: sp.get("establishmentId") ?? undefined,
    serviceId: sp.get("serviceId") ?? undefined,
    professionalId: sp.get("professionalId") ?? undefined,
    date: sp.get("date") ?? undefined,
  });

  const result = await computeSlots(query);
  return ok(result);
});
