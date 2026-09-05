import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, created, NotFoundError, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import {
  createSupportTicket,
  querySupportTickets,
  updateSupportTicket,
} from "@/lib/admin-resources";

const filterSchema = z.object({
  search: z.string().trim().min(1).optional(),
  type: z.enum(["billing", "technical", "onboarding", "all"]).optional(),
  status: z.enum(["open", "in_progress", "resolved", "all"]).optional(),
  priority: z.enum(["high", "medium", "low", "all"]).optional(),
});

const createSchema = z.object({
  subject: z.string().trim().min(1),
  description: z.string().trim().optional(),
  type: z.enum(["billing", "technical", "onboarding"]),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  customerName: z.string().trim().min(1),
  establishmentId: z.string().trim().min(1).optional(),
});

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "support");

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({
    search: sp.get("search") ?? undefined,
    type: sp.get("type") ?? undefined,
    status: sp.get("status") ?? undefined,
    priority: sp.get("priority") ?? undefined,
  });

  const data = await querySupportTickets(filters);
  return ok(data);
});

export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "support");

  const body = createSchema.parse(await req.json());
  if (body.establishmentId) {
    const est = await db.establishment.findUnique({
      where: { id: body.establishmentId },
      select: { id: true },
    });
    if (!est) throw new NotFoundError("Estabelecimento não encontrado");
  }

  const ticket = await createSupportTicket({
    ...body,
    createdById: session.administrator.id,
  });

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: "admin.support_ticket.create",
    targetType: "support_ticket",
    targetId: ticket.id,
    establishmentId: body.establishmentId,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return created(ticket);
});
