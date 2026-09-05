import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError, ForbiddenError, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;

// Never OWNER: there is exactly one per establishment, created only at
// onboarding — no flow here creates, transfers or demotes it.
const bodySchema = z.object({ role: z.enum(["ADMIN", "MANAGER", "PROFESSIONAL", "STAFF"]) });

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, memberId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const target = await db.establishmentMember.findFirst({ where: { id: memberId, establishmentId } });
  if (!target) throw new NotFoundError("Membro não encontrado");
  if (target.role === "OWNER") throw new ForbiddenError("Não é possível alterar o papel do Owner");

  const body = bodySchema.parse(await req.json());

  const member = await db.establishmentMember.update({ where: { id: memberId }, data: { role: body.role } });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "member.role_change",
    targetType: "EstablishmentMember",
    targetId: member.id,
    metadata: { from: target.role, to: body.role },
  });

  return ok(member);
});

// Deactivates rather than deletes: preserves appointment/audit history tied
// to this membership, and leaves the underlying User untouched (they keep
// access to any other establishment they belong to). No session revocation
// is needed — access is re-checked live via requireMembership on every
// request, so flipping status to SUSPENDED takes effect on their very next
// call to this establishment.
export const DELETE = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, memberId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const target = await db.establishmentMember.findFirst({ where: { id: memberId, establishmentId } });
  if (!target) throw new NotFoundError("Membro não encontrado");
  if (target.role === "OWNER") throw new ForbiddenError("O Owner não pode ser removido");

  const member = await db.establishmentMember.update({
    where: { id: memberId },
    data: { status: "SUSPENDED" },
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "member.remove",
    targetType: "EstablishmentMember",
    targetId: member.id,
  });

  return ok(member);
});
