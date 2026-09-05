import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, productId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const product = await db.product.findFirst({ where: { id: productId, establishmentId } });
  if (!product) throw new NotFoundError("Produto não encontrado");

  return ok({ ...product, lowStock: product.currentStock <= product.minStock });
});

const bodySchema = z.object({
  name: z.string().min(2).optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  costPrice: z.number().nonnegative().optional(),
  price: z.number().nonnegative().optional(),
  minStock: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, productId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const existing = await db.product.findFirst({ where: { id: productId, establishmentId } });
  if (!existing) throw new NotFoundError("Produto não encontrado");

  const body = bodySchema.parse(await req.json());
  const product = await db.product.update({ where: { id: productId }, data: body });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "product.update",
    targetType: "Product",
    targetId: product.id,
    metadata: body,
  });

  return ok(product);
});
