import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, parsePagination } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

// Same visibility as the Professionals list — mirrors the "professionals"
// permission in apps/estabelecimento/lib/permissions.ts (OWNER/ADMIN/MANAGER).
const LIST_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...LIST_ROLES]);

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams);
  const where = { establishmentId };

  const [items, total] = await db.$transaction([
    db.establishmentMember.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        status: true,
        invitedAt: true,
        joinedAt: true,
        user: { select: { id: true, name: true, email: true } },
        professional: { select: { id: true, active: true } },
      },
    }),
    db.establishmentMember.count({ where }),
  ]);

  return ok(items, { page, pageSize, total });
});
