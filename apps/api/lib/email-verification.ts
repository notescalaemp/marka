import { db } from "@marka/db";
import { generateOpaqueToken, hashOpaqueToken } from "@marka/auth";
import { emailProvider } from "@marka/shared";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// Invalidates any previous unused token (reusing usedAt to mean "no longer a
// valid pending token", not only "consumed by a successful verification")
// before issuing a fresh one, so only the latest link/token ever works.
export async function issueEmailVerification(userId: string, email: string) {
  await db.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateOpaqueToken();
  await db.emailVerificationToken.create({
    data: { userId, tokenHash: hashOpaqueToken(token), expiresAt: new Date(Date.now() + VERIFY_TTL_MS) },
  });

  await emailProvider.send({
    to: email,
    subject: "Confirme seu e-mail — marka.ia",
    text: `Use o token a seguir para confirmar seu e-mail: ${token}`,
  });
}
