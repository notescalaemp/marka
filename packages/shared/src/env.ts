import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET deve ter ao menos 16 caracteres"),
  COOKIE_DOMAIN: z.string().optional().default(""),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CORS_ORIGINS: z.string().optional().default(""),
});

let cached: z.infer<typeof schema> | undefined;

// Lazily parsed so this module can be imported without throwing during
// build/type-check when env vars aren't set yet (e.g. `next build` locally).
export function getEnv() {
  if (!cached) {
    cached = schema.parse(process.env);
  }
  return cached;
}

export function corsOrigins(): string[] {
  return getEnv()
    .CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
