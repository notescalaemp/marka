import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { generateOpaqueToken, hashOpaqueToken } from "@marka/auth";
import {
  withHandler,
  created,
  writeAuditLog,
  ConflictError,
  RateLimitError,
  rateLimiter,
  emailProvider,
} from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

// Managing the team is kept to OWNER/ADMIN — not MANAGER, which has no
// dedicated team-management permission in
// apps/estabelecimento/lib/permissions.ts.
const MANAGE_ROLES = ["OWNER", "ADMIN"] as const;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// OWNER is deliberately excluded: it's only ever created once, at
// establishment onboarding (see /api/business/establishments POST).
const bodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MANAGER", "PROFESSIONAL", "STAFF"]),
});

export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  if (!rateLimiter.check(`member-invite:${session.userId}`, 20, 60_000).allowed) {
    throw new RateLimitError();
  }

  const body = bodySchema.parse(await req.json());

  const existingUser = await db.user.findUnique({ where: { email: body.email } });
  if (existingUser) {
    const existingMembership = await db.establishmentMember.findFirst({
      where: { establishmentId, userId: existingUser.id, status: "ACTIVE" },
    });
    if (existingMembership) throw new ConflictError("Este e-mail já é membro deste estabelecimento");
  }

  // Doubles as "resend": any previous pending invite for this email in this
  // establishment is invalidated before a fresh one is issued.
  await db.memberInvite.updateMany({
    where: { establishmentId, email: body.email, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const token = generateOpaqueToken();
  const invite = await db.memberInvite.create({
    data: {
      establishmentId,
      email: body.email,
      role: body.role,
      tokenHash: hashOpaqueToken(token),
      invitedByUserId: session.userId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  await emailProvider.send({
    to: body.email,
    subject: "Você foi convidado para uma equipe na marka.ia",
    text: `Use o token a seguir para aceitar o convite: ${token}`,
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "member.invite.create",
    targetType: "MemberInvite",
    targetId: invite.id,
    metadata: { email: body.email, role: body.role },
  });

  // The raw token is only ever delivered through the email channel — never
  // echoed back in the API response.
  return created({ id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt });
});
