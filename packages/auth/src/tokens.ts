import { randomBytes, createHash } from "node:crypto";

// Generic opaque-token helpers shared by sessions, password resets and
// email verification: generate a random token for the client, persist only
// its hash server-side.
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
