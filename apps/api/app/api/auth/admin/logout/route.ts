import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { revokeAdminSession, ADMIN_SESSION_COOKIE, clearedCookieOptions } from "@marka/auth";
import { withHandler, noContent } from "@marka/shared";

export const POST = withHandler(async (req: NextRequest) => {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) await revokeAdminSession(db, token);

  const res = noContent();
  res.cookies.set(ADMIN_SESSION_COOKIE, "", clearedCookieOptions());
  return res;
});
