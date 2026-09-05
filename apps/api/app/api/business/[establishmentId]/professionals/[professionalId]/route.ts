import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, professionalId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const professional = await db.professional.findFirst({
    where: { id: professionalId, establishmentId },
    include: {
      member: { select: { role: true, user: { select: { id: true, name: true, email: true } } } },
      services: { include: { service: true } },
    },
  });
  if (!professional) throw new NotFoundError("Profissional não encontrado");

  return ok(professional);
});

const bodySchema = z.object({
  bio: z.string().optional(),
  photoUrl: z.string().url().optional(),
  specialties: z.array(z.string()).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
  active: z.boolean().optional(),
});

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, professionalId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const existing = await db.professional.findFirst({ where: { id: professionalId, establishmentId } });
  if (!existing) throw new NotFoundError("Profissional não encontrado");

  const body = bodySchema.parse(await req.json());
  const professional = await db.professional.update({ where: { id: professionalId }, data: body });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "professional.update",
    targetType: "Professional",
    targetId: professional.id,
    metadata: body,
  });

  return ok(professional);
});
