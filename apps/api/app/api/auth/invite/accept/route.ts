import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, ForbiddenError, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { resolveValidInvite } from "@/lib/invites";

// Requires an existing session on purpose, reusing /api/auth/register and
// /api/auth/login as-is instead of duplicating account-creation logic here:
//   - has an account already -> POST /api/auth/login (with the invited
//     email), then call this endpoint;
//   - no account yet -> POST /api/auth/register (with the invited email),
//     then call this endpoint.
// establishmentId and role are never read from the request body — both come
// only from the stored invite, so a caller can't grant themselves access to
// an arbitrary establishment or role by tampering with the payload.
const bodySchema = z.object({ token: z.string().min(1) });

export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);
  const { token } = bodySchema.parse(await req.json());
  const invite = await resolveValidInvite(token);

  if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
    throw new ForbiddenError("Este convite não pertence à sua conta");
  }

  const member = await db.$transaction(async (tx) => {
    const m = await tx.establishmentMember.upsert({
      where: { establishmentId_userId: { establishmentId: invite.establishmentId, userId: session.userId } },
      update: { role: invite.role, status: "ACTIVE", joinedAt: new Date() },
      create: {
        establishmentId: invite.establishmentId,
        userId: session.userId,
        role: invite.role,
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });
    await tx.memberInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    return m;
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId: invite.establishmentId,
    action: "member.invite.accept",
    targetType: "EstablishmentMember",
    targetId: member.id,
    metadata: { role: invite.role },
  });

  return ok({ ...member, establishment: invite.establishment });
});
