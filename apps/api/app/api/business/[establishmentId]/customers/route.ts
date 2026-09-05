import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, created, parsePagination, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams);
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const where = {
    establishmentId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await db.$transaction([
    db.customer.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    db.customer.count({ where }),
  ]);

  return ok(items, { page, pageSize, total });
});

const bodySchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const body = bodySchema.parse(await req.json());
  const customer = await db.customer.create({ data: { ...body, establishmentId } });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "customer.create",
    targetType: "Customer",
    targetId: customer.id,
  });

  return created(customer);
});
