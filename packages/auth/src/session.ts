import type { PrismaClient, Session, User, AdminSession, Administrator } from "@marka/db";
import { generateOpaqueToken, hashOpaqueToken } from "./tokens";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Only the SHA-256 hash is ever persisted; the raw token lives solely in the
// cookie, so a DB read/leak alone can never be replayed as a live session.
const generateToken = generateOpaqueToken;
const hashToken = hashOpaqueToken;

export interface SessionMeta {
  ip?: string | null;
  userAgent?: string | null;
}

// --- Users (Consumer + Business) ------------------------------------------

export async function createUserSession(db: PrismaClient, userId: string, meta: SessionMeta = {}) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { userId, tokenHash: hashToken(token), ip: meta.ip, userAgent: meta.userAgent, expiresAt },
  });
  return { token, expiresAt };
}

export async function verifyUserSession(
  db: PrismaClient,
  token: string
): Promise<(Session & { user: User }) | null> {
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.user.status !== "ACTIVE") return null;
  return session;
}

export async function revokeUserSession(db: PrismaClient, token: string) {
  await db.session.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// --- Administrators (Backoffice) -------------------------------------------

export async function createAdminSession(db: PrismaClient, administratorId: string, meta: SessionMeta = {}) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.adminSession.create({
    data: { administratorId, tokenHash: hashToken(token), ip: meta.ip, userAgent: meta.userAgent, expiresAt },
  });
  return { token, expiresAt };
}

export async function verifyAdminSession(
  db: PrismaClient,
  token: string
): Promise<(AdminSession & { administrator: Administrator }) | null> {
  const session = await db.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { administrator: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.administrator.status !== "ACTIVE") return null;
  return session;
}

export async function revokeAdminSession(db: PrismaClient, token: string) {
  await db.adminSession.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
