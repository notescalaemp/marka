import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { generateOpaqueToken, hashOpaqueToken } from "@marka/auth";
import { withHandler, ok, RateLimitError, rateLimiter, clientIp } from "@marka/shared";

const bodySchema = z.object({ email: z.string().email() });
const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

export const POST = withHandler(async (req: NextRequest) => {
  const ip = clientIp(req);
  if (!rateLimiter.check(`forgot:${ip}`, 5, 60_000).allowed) throw new RateLimitError();

  const { email } = bodySchema.parse(await req.json());
  const user = await db.user.findUnique({ where: { email } });

  // Always respond the same way whether or not the email exists, to avoid
  // leaking which addresses are registered.
  if (user) {
    const token = generateOpaqueToken();
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashOpaqueToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
    });
    // TODO: send through the notification provider once wired (email/WhatsApp).
    // Logged for now so the flow is testable end-to-end without one.
    console.log(`[password-reset] token for ${email}: ${token}`);
  }

  return ok({ message: "Se o e-mail existir, um link de recuperação foi enviado." });
});
