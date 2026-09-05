import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { hashOpaqueToken } from "@marka/auth";
import {
  withHandler,
  ok,
  ForbiddenError,
  ValidationError,
  ConflictError,
  RateLimitError,
  rateLimiter,
  writeAuditLog,
} from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";

// Only { token } is accepted — establishmentId, the target member and the
// resulting roles all come from the stored OwnershipTransfer row, never
// from this body, so tampering with the payload can't redirect the effect
// of a valid token to a different establishment/role.
const bodySchema = z.object({ token: z.string().min(1) });

export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);

  if (!rateLimiter.check(`ownership-transfer-accept:${session.userId}`, 10, 60_000).allowed) {
    throw new RateLimitError();
  }

  const { token } = bodySchema.parse(await req.json());
  const transfer = await db.ownershipTransfer.findUnique({ where: { tokenHash: hashOpaqueToken(token) } });
  if (!transfer || transfer.revokedAt || transfer.acceptedAt || transfer.expiresAt < new Date()) {
    throw new ValidationError("Transferência inválida ou expirada");
  }

  // The authenticated identity must be exactly the stored recipient.
  const toMember = await db.establishmentMember.findFirst({
    where: { id: transfer.toMemberId, establishmentId: transfer.establishmentId },
    select: { userId: true },
  });
  if (!toMember || toMember.userId !== session.userId) {
    throw new ForbiddenError("Esta transferência não pertence à sua conta");
  }

  const result = await db.$transaction(async (tx) => {
    // Atomically claim the transfer: the WHERE clause is re-evaluated by
    // Postgres against the committed row, so if a concurrent request already
    // accepted (or it was revoked/expired) since we read it above, this
    // matches zero rows and only one concurrent accept can ever win.
    const claimed = await tx.ownershipTransfer.updateMany({
      where: { id: transfer.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new ConflictError("Esta transferência já foi utilizada ou não é mais válida");
    }

    // Re-verify both sides of the transfer inside the transaction — either
    // membership may have changed since the transfer was initiated.
    const fromMember = await tx.establishmentMember.findFirst({
      where: { id: transfer.fromMemberId, establishmentId: transfer.establishmentId, role: "OWNER", status: "ACTIVE" },
    });
    if (!fromMember) throw new ConflictError("O Owner original não é mais válido para esta transferência");

    const toMemberFresh = await tx.establishmentMember.findFirst({
      where: { id: transfer.toMemberId, establishmentId: transfer.establishmentId, status: "ACTIVE" },
    });
    if (!toMemberFresh) throw new ConflictError("O destinatário não está mais ativo neste estabelecimento");

    // Promote first, demote second — the establishment holds at least one
    // OWNER at every intermediate point of this transaction, never zero.
    const newOwner = await tx.establishmentMember.update({ where: { id: toMemberFresh.id }, data: { role: "OWNER" } });
    const newAdmin = await tx.establishmentMember.update({ where: { id: fromMember.id }, data: { role: "ADMIN" } });

    return { newOwner, newAdmin };
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId: transfer.establishmentId,
    action: "ownership.transfer.accept",
    targetType: "EstablishmentMember",
    targetId: result.newOwner.id,
    metadata: { fromMemberId: result.newAdmin.id, toMemberId: result.newOwner.id },
  });

  return ok({ establishmentId: transfer.establishmentId, newOwnerMemberId: result.newOwner.id, newAdminMemberId: result.newAdmin.id });
});
