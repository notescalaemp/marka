import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(8).max(30).nullable().optional(),
});

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);
  const user = session.user;
  return ok({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    emailVerifiedAt: user.emailVerifiedAt,
  });
});

export const PATCH = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);
  const body = patchSchema.parse(await req.json());

  const updated = await db.user.update({
    where: { id: session.userId },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      emailVerifiedAt: true,
    },
  });

  return ok(updated);
});
