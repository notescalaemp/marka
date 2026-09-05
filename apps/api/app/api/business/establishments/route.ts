import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, created, ConflictError, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";

// GET: establishments the caller belongs to (any role) — never a global list,
// that only exists for Backoffice under /api/admin/*.
export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);

  const memberships = await db.establishmentMember.findMany({
    where: { userId: session.userId, status: "ACTIVE" },
    select: { role: true, establishment: true },
  });

  return ok(memberships.map((m) => ({ ...m.establishment, role: m.role })));
});

const bodySchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  category: z.enum(["nails", "barbearia", "lash_designer"]),
  timezone: z.string().optional(),
});

// POST: self-serve onboarding. Creates the Establishment and makes the
// caller its OWNER — the only way an EstablishmentMember row with role
// OWNER is ever created.
export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);
  const body = bodySchema.parse(await req.json());

  const existing = await db.establishment.findUnique({ where: { slug: body.slug } });
  if (existing) throw new ConflictError("Esse slug já está em uso");

  const establishment = await db.$transaction(async (tx) => {
    const est = await tx.establishment.create({
      data: {
        name: body.name,
        slug: body.slug,
        category: body.category,
        timezone: body.timezone ?? "America/Sao_Paulo",
      },
    });
    await tx.establishmentMember.create({
      data: { establishmentId: est.id, userId: session.userId, role: "OWNER", joinedAt: new Date() },
    });
    return est;
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId: establishment.id,
    action: "establishment.create",
  });

  return created({ ...establishment, role: "OWNER" as const });
});
