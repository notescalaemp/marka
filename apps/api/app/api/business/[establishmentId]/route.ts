import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import {
  withHandler,
  ok,
  NotFoundError,
  ValidationError,
  writeAuditLog,
} from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const establishment = await db.establishment.findFirst({
    where: { id: establishmentId },
    include: { ambassadorProfile: { select: { code: true, status: true } } },
  });
  if (!establishment) throw new NotFoundError("Estabelecimento não encontrado");

  const { ambassadorProfile, ...rest } = establishment;
  return ok({ ...rest, ambassador: ambassadorProfile });
});

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  hoursText: z.string().nullable().optional(),
  category: z.enum(["nails", "barbearia", "lash_designer"]).optional(),
  timezone: z.string().min(1).optional(),
  slotStartHour: z.number().int().min(0).max(23).optional(),
  slotEndHour: z.number().int().min(1).max(24).optional(),
  acceptsLocalPayment: z.boolean().optional(),
  acceptsOnlinePayment: z.boolean().optional(),
  photoUrls: z.array(z.string().url()).optional(),
});

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const body = patchSchema.parse(await req.json());

  const existing = await db.establishment.findFirst({ where: { id: establishmentId } });
  if (!existing) throw new NotFoundError("Estabelecimento não encontrado");

  const start = body.slotStartHour ?? existing.slotStartHour;
  const end = body.slotEndHour ?? existing.slotEndHour;
  if (end <= start) {
    throw new ValidationError("Horário de término deve ser depois do início");
  }

  const establishment = await db.establishment.update({
    where: { id: establishmentId },
    data: body,
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "establishment.update",
    targetType: "Establishment",
    targetId: establishmentId,
    metadata: { fields: Object.keys(body) },
  });

  return ok(establishment);
});
