import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, created, parsePagination, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

// Reference implementation of the tenant-isolation pattern every
// establishment-scoped route must follow:
//   1. resolve the caller's session
//   2. requireMembership(userId, establishmentId, [...]) — verifies the
//      caller actually belongs to THIS establishment before anything else
//   3. every query is filtered by establishmentId from the verified
//      membership, never by a value taken as-is from the client

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams);
  const [items, total] = await db.$transaction([
    db.service.findMany({ where: { establishmentId }, skip, take, orderBy: { createdAt: "desc" } }),
    db.service.count({ where: { establishmentId } }),
  ]);

  return ok(items, { page, pageSize, total });
});

const bodySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  price: z.number().nonnegative(),
  category: z.string().optional(),
});

export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  // Creating/editing the service catalog is an operational decision, kept
  // to OWNER/ADMIN/MANAGER regardless of the broader read-only "services"
  // nav permission PROFESSIONAL/STAFF also hold in the frontend RBAC map.
  await requireMembership(session.userId, establishmentId, ["OWNER", "ADMIN", "MANAGER"]);

  const body = bodySchema.parse(await req.json());
  const service = await db.service.create({ data: { ...body, establishmentId } });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "service.create",
    targetType: "Service",
    targetId: service.id,
  });

  return created(service);
});
