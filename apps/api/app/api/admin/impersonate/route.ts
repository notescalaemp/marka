import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import {
  createUserSession,
  revokeUserSession,
  USER_SESSION_COOKIE,
  sessionCookieOptions,
  clearedCookieOptions,
} from "@marka/auth";
import { withHandler, ok, noContent, NotFoundError, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";

const bodySchema = z.object({
  establishmentId: z.string().min(1),
});

export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "impersonate");

  const body = bodySchema.parse(await req.json());
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");

  const establishment = await db.establishment.findUnique({
    where: { id: body.establishmentId },
    include: {
      members: {
        where: { role: "OWNER", status: "ACTIVE" },
        take: 1,
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!establishment) throw new NotFoundError("Estabelecimento não encontrado");

  const ownerMembership = establishment.members[0];
  if (!ownerMembership) throw new NotFoundError("Proprietário ativo não encontrado");

  const { token, expiresAt } = await createUserSession(db, ownerMembership.user.id, {
    ip,
    userAgent,
  });

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: "admin.impersonate.start",
    establishmentId: establishment.id,
    targetType: "establishment",
    targetId: establishment.id,
    metadata: { userId: ownerMembership.user.id },
    ip,
    userAgent,
  });

  const res = ok({
    establishmentId: establishment.id,
    establishmentName: establishment.name,
    userId: ownerMembership.user.id,
    userName: ownerMembership.user.name,
  });
  res.cookies.set(USER_SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
});

export const DELETE = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "impersonate");

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");
  const userToken = req.cookies.get(USER_SESSION_COOKIE)?.value;

  if (userToken) {
    await revokeUserSession(db, userToken);
  }

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: "admin.impersonate.end",
    ip,
    userAgent,
  });

  const res = noContent();
  res.cookies.set(USER_SESSION_COOKIE, "", clearedCookieOptions());
  return res;
});
