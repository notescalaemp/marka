import type { NextRequest } from "next/server";
import { z } from "zod";
import { db, StockMoveType } from "@marka/db";
import { withHandler, ok, created, parsePagination, NotFoundError, ValidationError, writeAuditLog } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, productId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const product = await db.product.findFirst({ where: { id: productId, establishmentId } });
  if (!product) throw new NotFoundError("Produto não encontrado");

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams);
  const [movements, total] = await db.$transaction([
    db.stockMovement.findMany({ where: { productId }, skip, take, orderBy: { createdAt: "desc" } }),
    db.stockMovement.count({ where: { productId } }),
  ]);

  return ok(
    {
      currentStock: product.currentStock,
      minStock: product.minStock,
      lowStock: product.currentStock <= product.minStock,
      movements,
    },
    { page, pageSize, total }
  );
});

const bodySchema = z.object({
  type: z.nativeEnum(StockMoveType),
  quantity: z
    .number()
    .int()
    .refine((n) => n !== 0, "Quantidade não pode ser zero"),
  reason: z.string().optional(),
});

// A single transaction ties the ledger entry (StockMovement, signed so the
// history always sums back to currentStock) to the cached counter update on
// Product, so the two can never drift out of sync.
export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, productId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const body = bodySchema.parse(await req.json());
  if ((body.type === "IN" || body.type === "OUT") && body.quantity < 0) {
    throw new ValidationError("Quantidade deve ser positiva para entrada/saída");
  }

  const result = await db.$transaction(async (tx) => {
    const product = await tx.product.findFirst({ where: { id: productId, establishmentId } });
    if (!product) throw new NotFoundError("Produto não encontrado");

    const delta =
      body.type === "OUT" ? -Math.abs(body.quantity) : body.type === "IN" ? Math.abs(body.quantity) : body.quantity;
    const newStock = product.currentStock + delta;
    if (newStock < 0) throw new ValidationError("Estoque insuficiente para esta saída");

    const movement = await tx.stockMovement.create({
      data: { establishmentId, productId, type: body.type, quantity: delta, reason: body.reason, createdByUserId: session.userId },
    });
    const updatedProduct = await tx.product.update({ where: { id: productId }, data: { currentStock: newStock } });

    return { movement, product: updatedProduct };
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "stock.movement",
    targetType: "Product",
    targetId: productId,
    metadata: { type: body.type, quantity: body.quantity, reason: body.reason },
  });

  return created({
    ...result.movement,
    currentStock: result.product.currentStock,
    lowStock: result.product.currentStock <= result.product.minStock,
  });
});
