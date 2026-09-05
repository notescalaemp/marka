import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import {
  verifyPassword,
  createUserSession,
  USER_SESSION_COOKIE,
  sessionCookieOptions,
} from "@marka/auth";
import { withHandler, ok, UnauthorizedError, RateLimitError, rateLimiter, clientIp } from "@marka/shared";

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(1) });

// bcrypt hash of a random, never-used string — compared against on a
// missing user so a nonexistent email takes the same time as a wrong
// password, instead of returning early and leaking which emails exist.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8vC0jSw2XkGtdMcFzZzhc0Q7yaHnLu";

export const POST = withHandler(async (req: NextRequest) => {
  const ip = clientIp(req);
  if (!rateLimiter.check(`login:${ip}`, 10, 60_000).allowed) throw new RateLimitError();

  const body = bodySchema.parse(await req.json());
  const user = await db.user.findUnique({ where: { email: body.email } });
  const validPassword = await verifyPassword(body.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !validPassword || user.status !== "ACTIVE") {
    throw new UnauthorizedError("E-mail ou senha inválidos");
  }

  const { token, expiresAt } = await createUserSession(db, user.id, {
    ip,
    userAgent: req.headers.get("user-agent"),
  });

  const res = ok({ id: user.id, email: user.email, name: user.name });
  res.cookies.set(USER_SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
});
