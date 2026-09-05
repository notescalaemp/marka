import { db } from "@marka/db";
import { hashOpaqueToken } from "@marka/auth";
import { ValidationError } from "@marka/shared";

// A single validity check reused by the public preview route and the
// accept route — a valid invite is unrevoked, unaccepted and unexpired.
export async function resolveValidInvite(token: string) {
  const invite = await db.memberInvite.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
    include: { establishment: { select: { id: true, name: true, slug: true } } },
  });

  if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw new ValidationError("Convite inválido ou expirado");
  }

  return invite;
}
