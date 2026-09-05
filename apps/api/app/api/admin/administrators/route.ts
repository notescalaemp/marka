import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { hashPassword } from "@marka/auth";
import { withHandler, ok, created, ConflictError, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryAdministratorsList } from "@/lib/admin-resources";

const createSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["super_admin", "finance", "support", "operations", "product", "read_only"]),
});

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "administrators");

  const items = await queryAdministratorsList();
  return ok(items);
});

export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "administrators");

  const body = createSchema.parse(await req.json());
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent");

  const existing = await db.administrator.findUnique({ where: { email: body.email } });
  if (existing) throw new ConflictError("E-mail já cadastrado");

  const passwordHash = await hashPassword(body.password);
  const admin = await db.administrator.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role,
    },
  });

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: "admin.administrator.create",
    targetType: "administrator",
    targetId: admin.id,
    ip,
    userAgent,
  });

  return created({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: "ativo",
  });
});
