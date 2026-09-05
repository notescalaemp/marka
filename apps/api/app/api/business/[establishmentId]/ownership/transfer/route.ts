import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import { generateOpaqueToken, hashOpaqueToken } from "@marka/auth";
import {
  withHandler,
  created,
  writeAuditLog,
  ValidationError,
  NotFoundError,
  RateLimitError,
  rateLimiter,
  emailProvider,
} from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

// Shorter-lived than a member invite — this grants the highest privilege
// level and should go stale quickly if unused.
const TRANSFER_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// The only field ever trusted from the client is which existing member is
// being proposed as the new Owner. Every other fact used later (who the
// current Owner is, which establishment, the resulting roles) is derived
// server-side from the membership rows themselves and from the stored
// transfer — never re-read from a request body.
const bodySchema = z.object({ memberId: z.string().min(1) });

export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  // Only OWNER — not ADMIN — can initiate. Handing over the top privilege
  // level is more sensitive than the OWNER/ADMIN team-management actions.
  const membership = await requireMembership(session.userId, establishmentId, ["OWNER"]);

  if (!rateLimiter.check(`ownership-transfer:${session.userId}`, 5, 60_000).allowed) {
    throw new RateLimitError();
  }

  const { memberId } = bodySchema.parse(await req.json());

  // Scoped by establishmentId in the query itself — a memberId belonging to
  // another establishment simply doesn't resolve here.
  const target = await db.establishmentMember.findFirst({
    where: { id: memberId, establishmentId },
    include: { user: { select: { email: true, status: true, emailVerifiedAt: true } } },
  });
  if (!target) throw new NotFoundError("Membro não encontrado neste estabelecimento");
  if (target.id === membership.id) {
    throw new ValidationError("Você não pode transferir a propriedade para si mesmo");
  }
  if (target.status !== "ACTIVE") throw new ValidationError("O novo Owner precisa estar ativo");
  if (target.user.status !== "ACTIVE") throw new ValidationError("O novo Owner precisa ter uma conta ativa");
  if (!target.user.emailVerifiedAt) throw new ValidationError("O novo Owner precisa ter o e-mail verificado");

  // At most one live transfer per establishment: starting a new one
  // invalidates whatever was pending before.
  await db.ownershipTransfer.updateMany({
    where: { establishmentId, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const token = generateOpaqueToken();
  const transfer = await db.ownershipTransfer.create({
    data: {
      establishmentId,
      fromMemberId: membership.id,
      toMemberId: target.id,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(Date.now() + TRANSFER_TTL_MS),
    },
  });

  await emailProvider.send({
    to: target.user.email,
    subject: "Transferência de propriedade — marka.ia",
    text: `Use o token a seguir para confirmar que você é o novo Owner: ${token}`,
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "ownership.transfer.initiate",
    targetType: "EstablishmentMember",
    targetId: target.id,
    metadata: { fromMemberId: membership.id, toMemberId: target.id },
  });

  // The raw token is only ever delivered through the email channel.
  return created({ id: transfer.id, expiresAt: transfer.expiresAt });
});
