import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { updateSupportTicket } from "@/lib/admin-resources";

const patchSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  assigneeId: z.string().trim().min(1).nullable().optional(),
});

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "support");

  const { id } = await params;
  const body = patchSchema.parse(await req.json());

  const ticket = await updateSupportTicket(id, body);
  if (!ticket) throw new NotFoundError("Ticket não encontrado");

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: "admin.support_ticket.update",
    targetType: "support_ticket",
    targetId: id,
    metadata: body,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return ok(ticket);
});
