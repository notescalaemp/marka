import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { hashOpaqueToken } from "@marka/auth";
import { withHandler, ok, ValidationError } from "@marka/shared";

// Unauthenticated by design, same as password reset — the token itself is
// the credential (received out-of-band, e.g. via email).
const bodySchema = z.object({ token: z.string().min(1) });

export const POST = withHandler(async (req: NextRequest) => {
  const { token } = bodySchema.parse(await req.json());
  const tokenHash = hashOpaqueToken(token);

  const verification = await db.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!verification || verification.usedAt || verification.expiresAt < new Date()) {
    throw new ValidationError("Token inválido ou expirado");
  }

  await db.$transaction([
    db.user.update({ where: { id: verification.userId }, data: { emailVerifiedAt: new Date() } }),
    db.emailVerificationToken.update({ where: { id: verification.id }, data: { usedAt: new Date() } }),
  ]);

  return ok({ message: "E-mail verificado com sucesso." });
});
