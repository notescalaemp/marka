import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { revokeUserSession, USER_SESSION_COOKIE, clearedCookieOptions } from "@marka/auth";
import { withHandler, noContent } from "@marka/shared";

export const POST = withHandler(async (req: NextRequest) => {
  const token = req.cookies.get(USER_SESSION_COOKIE)?.value;
  if (token) await revokeUserSession(db, token);

  const res = noContent();
  res.cookies.set(USER_SESSION_COOKIE, "", clearedCookieOptions());
  return res;
});
