import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, RateLimitError, rateLimiter, clientIp } from "@marka/shared";

const bodySchema = z.object({
  code: z.string().trim().min(1).max(64),
  visitorRef: z.string().trim().min(10).max(128),
});

// Unauthenticated by design — hit server-to-server from
// apps/estabelecimento/app/indique/[code]/route.ts on every link open.
// Never trusts the caller's word on anything beyond "this code was
// presented" — an invalid/inactive code is a silent no-op, not an error,
// so a mistyped or stale link never breaks the redirect for the visitor.
export const POST = withHandler(async (req: NextRequest) => {
  const ip = clientIp(req);
  if (!rateLimiter.check(`ambassador-track:${ip}`, 30, 60_000).allowed) throw new RateLimitError();

  const body = bodySchema.parse(await req.json());

  const ambassador = await db.ambassadorProfile.findUnique({ where: { code: body.code } });
  if (!ambassador || ambassador.status !== "ACTIVE") {
    return ok({ tracked: false });
  }

  const existing = await db.referral.findUnique({ where: { visitorRef: body.visitorRef } });

  const referral =
    existing ??
    (await db.referral.create({
      data: { ambassadorId: ambassador.id, visitorRef: body.visitorRef, source: "link" },
    }));

  await db.referralEvent.create({
    data: { ambassadorId: ambassador.id, referralId: referral.id, type: "LINK_ACCESSED" },
  });

  return ok({ tracked: true });
});
