import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, created, NotFoundError, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

const bodySchema = z.object({ serviceId: z.string().min(1) });

// Associates an existing Service with an existing Professional. Both ids
// are re-checked against establishmentId here — neither one is trusted just
// because it appeared in a previous, unrelated response to this caller.
export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, professionalId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const professional = await db.professional.findFirst({ where: { id: professionalId, establishmentId } });
  if (!professional) throw new NotFoundError("Profissional não encontrado");

  const { serviceId } = bodySchema.parse(await req.json());
  const service = await db.service.findFirst({ where: { id: serviceId, establishmentId } });
  if (!service) throw new NotFoundError("Serviço não encontrado neste estabelecimento");

  const link = await db.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId, serviceId } },
    update: {},
    create: { professionalId, serviceId },
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "professional.service.attach",
    targetType: "Professional",
    targetId: professionalId,
    metadata: { serviceId },
  });

  return created(link);
});
