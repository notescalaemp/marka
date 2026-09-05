import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const subscription = await db.subscription.findUnique({
    where: { establishmentId },
    include: {
      plan: {
        select: {
          id: true,
          code: true,
          name: true,
          priceMonthly: true,
          features: true,
        },
      },
    },
  });

  if (!subscription) {
    return ok(null);
  }

  return ok(subscription);
});
