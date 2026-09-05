import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __markaPrisma: PrismaClient | undefined;
}

// Reused across hot-reloads in dev and across warm serverless invocations so
// we don't exhaust Postgres connections; a fresh instance is created per
// cold start only.
export const db = globalThis.__markaPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__markaPrisma = db;
}
