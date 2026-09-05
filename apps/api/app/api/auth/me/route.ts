import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);

  const memberships = await db.establishmentMember.findMany({
    where: { userId: session.userId, status: "ACTIVE" },
    select: {
      establishmentId: true,
      role: true,
      establishment: { select: { name: true, slug: true } },
    },
  });

  return ok({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    phone: session.user.phone,
    emailVerifiedAt: session.user.emailVerifiedAt,
    memberships: memberships.map((m) => ({
      establishmentId: m.establishmentId,
      role: m.role,
      name: m.establishment.name,
      slug: m.establishment.slug,
    })),
  });
});
