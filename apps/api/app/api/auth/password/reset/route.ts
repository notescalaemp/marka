import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { hashOpaqueToken, hashPassword } from "@marka/auth";
import { withHandler, ok, ValidationError } from "@marka/shared";

const bodySchema = z.object({ token: z.string().min(1), password: z.string().min(8) });

export const POST = withHandler(async (req: NextRequest) => {
  const body = bodySchema.parse(await req.json());
  const tokenHash = hashOpaqueToken(body.token);

  const resetToken = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new ValidationError("Token inválido ou expirado");
  }

  const passwordHash = await hashPassword(body.password);

  await db.$transaction([
    db.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    // Changing the password invalidates every existing session for that user.
    db.session.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return ok({ message: "Senha atualizada com sucesso." });
});
