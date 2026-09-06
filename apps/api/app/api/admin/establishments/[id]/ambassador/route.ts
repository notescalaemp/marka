import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, created, NotFoundError, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { generateAmbassadorCode } from "@/lib/ambassador";

// GET: current ambassador status for the "Programa de Embaixadores" section
// on the establishment detail page — null when it was never promoted.
export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "establishment_detail");

  const profile = await db.ambassadorProfile.findUnique({ where: { establishmentId: id } });
  return ok(
    profile && {
      id: profile.id,
      code: profile.code,
      status: profile.status,
      createdAt: profile.createdAt.toISOString(),
      removedAt: profile.removedAt ? profile.removedAt.toISOString() : null,
    }
  );
});

// POST: "Tornar Embaixador". Only an authorized Administrator can grant this
// — never the establishment itself (see product spec section 26). Promoting
// an establishment that was previously REMOVED reactivates it and reuses its
// permanent code rather than minting a new one.
export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");

  const establishment = await db.establishment.findUnique({ where: { id } });
  if (!establishment) throw new NotFoundError("Estabelecimento não encontrado");

  const existing = await db.ambassadorProfile.findUnique({ where: { establishmentId: id } });

  const profile = existing
    ? await db.ambassadorProfile.update({
        where: { establishmentId: id },
        data: { status: "ACTIVE", removedAt: null },
      })
    : await db.ambassadorProfile.create({
        data: {
          establishmentId: id,
          code: await generateAmbassadorCode(establishment.name),
          createdByAdminId: session.administrator.id,
        },
      });

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    establishmentId: id,
    action: existing ? "ambassador.reactivated" : "ambassador.promoted",
    targetType: "ambassador_profile",
    targetId: profile.id,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return created({ code: profile.code, status: profile.status, createdAt: profile.createdAt.toISOString() });
});
