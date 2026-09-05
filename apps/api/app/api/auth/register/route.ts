import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { hashPassword, createUserSession, USER_SESSION_COOKIE, sessionCookieOptions } from "@marka/auth";
import { withHandler, created, ConflictError, RateLimitError, rateLimiter, clientIp } from "@marka/shared";
import { issueEmailVerification } from "@/lib/email-verification";

// Shared identity endpoint: used both by Consumer signup and by whoever
// later becomes a Business owner via POST /api/business/establishments.
const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
});

export const POST = withHandler(async (req: NextRequest) => {
  const ip = clientIp(req);
  if (!rateLimiter.check(`register:${ip}`, 5, 60_000).allowed) throw new RateLimitError();

  const body = bodySchema.parse(await req.json());

  const existing = await db.user.findUnique({ where: { email: body.email } });
  if (existing) throw new ConflictError("E-mail já cadastrado");

  const passwordHash = await hashPassword(body.password);
  const user = await db.user.create({
    data: { email: body.email, name: body.name, phone: body.phone, passwordHash },
  });

  const { token, expiresAt } = await createUserSession(db, user.id, {
    ip,
    userAgent: req.headers.get("user-agent"),
  });

  await issueEmailVerification(user.id, user.email);

  const res = created({ id: user.id, email: user.email, name: user.name });
  res.cookies.set(USER_SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
});
