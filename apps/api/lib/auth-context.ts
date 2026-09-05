import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import {
  USER_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
  verifyUserSession,
  verifyAdminSession,
} from "@marka/auth";
import { UnauthorizedError } from "@marka/shared";

export function getUserAuth(req: NextRequest) {
  const token = req.cookies.get(USER_SESSION_COOKIE)?.value;
  if (!token) return Promise.resolve(null);
  return verifyUserSession(db, token);
}

export async function requireUserAuth(req: NextRequest) {
  const session = await getUserAuth(req);
  if (!session) throw new UnauthorizedError();
  return session;
}

export function getAdminAuth(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return Promise.resolve(null);
  return verifyAdminSession(db, token);
}

export async function requireAdminAuth(req: NextRequest) {
  const session = await getAdminAuth(req);
  if (!session) throw new UnauthorizedError();
  return session;
}
