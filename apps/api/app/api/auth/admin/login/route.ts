import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import {
  verifyPassword,
  createAdminSession,
  ADMIN_SESSION_COOKIE,
  sessionCookieOptions,
} from "@marka/auth";
import {
  withHandler,
  ok,
  UnauthorizedError,
  RateLimitError,
  rateLimiter,
  clientIp,
  writeAuditLog,
} from "@marka/shared";

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(1) });

// Same hash-a-dummy-value trick as /api/auth/login — no public registration
// exists for administrators (see packages/db/prisma/seed.ts), so this is a
// privileged, higher-value target and gets its own tighter rate limit.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8vC0jSw2XkGtdMcFzZzhc0Q7yaHnLu";

export const POST = withHandler(async (req: NextRequest) => {
  const ip = clientIp(req);
  if (!rateLimiter.check(`admin-login:${ip}`, 5, 60_000).allowed) throw new RateLimitError();

  const body = bodySchema.parse(await req.json());
  const admin = await db.administrator.findUnique({ where: { email: body.email } });
  const validPassword = await verifyPassword(body.password, admin?.passwordHash ?? DUMMY_HASH);

  if (!admin || !validPassword || admin.status !== "ACTIVE") {
    throw new UnauthorizedError("E-mail ou senha inválidos");
  }

  const userAgent = req.headers.get("user-agent");
  const { token, expiresAt } = await createAdminSession(db, admin.id, { ip, userAgent });

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: admin.id,
    action: "admin.login",
    ip,
    userAgent,
  });

  const res = ok({ id: admin.id, email: admin.email, name: admin.name, role: admin.role });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
});
