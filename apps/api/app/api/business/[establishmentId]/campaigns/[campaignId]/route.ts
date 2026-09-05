import type { NextRequest } from "next/server";
import { z } from "zod";
import { db, CampaignChannel, CampaignStatus } from "@marka/db";
import {
  withHandler,
  ok,
  NotFoundError,
  writeAuditLog,
} from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, campaignId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, establishmentId },
  });
  if (!campaign) throw new NotFoundError("Campanha não encontrada");

  return ok(campaign);
});

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  channel: z.nativeEnum(CampaignChannel).optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  audience: z.unknown().optional(),
  scheduledAt: z.coerce.date().nullable().optional(),
});

export const PATCH = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId, campaignId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const body = patchSchema.parse(await req.json());

  const existing = await db.campaign.findFirst({
    where: { id: campaignId, establishmentId },
  });
  if (!existing) throw new NotFoundError("Campanha não encontrada");

  const campaign = await db.campaign.update({
    where: { id: campaignId },
    data: {
      name: body.name,
      channel: body.channel,
      status: body.status,
      scheduledAt: body.scheduledAt === null ? null : body.scheduledAt,
      ...(body.audience !== undefined
        ? { audience: body.audience as object }
        : {}),
    },
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "campaign.update",
    targetType: "Campaign",
    targetId: campaignId,
    metadata: { fields: Object.keys(body) },
  });

  return ok(campaign);
});
