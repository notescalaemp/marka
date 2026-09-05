import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  role: z.enum(["super_admin", "finance", "support", "operations", "product", "read_only"]).optional(),
});

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "administrators");

  const body = patchSchema.parse(await req.json());
  const existing = await db.administrator.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Administrador não encontrado");

  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");

  const admin = await db.administrator.update({
    where: { id },
    data: body,
  });

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: "admin.administrator.update",
    targetType: "administrator",
    targetId: admin.id,
    metadata: body,
    ip,
    userAgent,
  });

  return ok({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status === "ACTIVE" ? "ativo" : "inativo",
  });
});
