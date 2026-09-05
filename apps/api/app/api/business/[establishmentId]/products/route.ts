import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, created, parsePagination, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

// Matches the "products"/"stock" permissions in
// apps/estabelecimento/lib/permissions.ts — OWNER/ADMIN/MANAGER only.
const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams);
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const activeParam = sp.get("active");

  const where = {
    establishmentId,
    ...(activeParam !== null ? { active: activeParam === "true" } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await db.$transaction([
    db.product.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    db.product.count({ where }),
  ]);

  return ok(items, { page, pageSize, total });
});

const bodySchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  unit: z.string().optional(),
  costPrice: z.number().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
});

export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const body = bodySchema.parse(await req.json());
  const product = await db.product.create({ data: { ...body, establishmentId } });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "product.create",
    targetType: "Product",
    targetId: product.id,
  });

  return created(product);
});
