import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, noContent, NotFoundError, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const DELETE = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, professionalId, serviceId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const professional = await db.professional.findFirst({ where: { id: professionalId, establishmentId } });
  if (!professional) throw new NotFoundError("Profissional não encontrado");

  await db.professionalService.deleteMany({ where: { professionalId, serviceId } });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "professional.service.detach",
    targetType: "Professional",
    targetId: professionalId,
    metadata: { serviceId },
  });

  return noContent();
});
