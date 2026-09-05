import type { NextRequest } from "next/server";
import { z } from "zod";
import { db, CampaignChannel, CampaignStatus } from "@marka/db";
import {
  withHandler,
  ok,
  created,
  parsePagination,
  writeAuditLog,
} from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams);
  const [items, total] = await db.$transaction([
    db.campaign.findMany({
      where: { establishmentId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    db.campaign.count({ where: { establishmentId } }),
  ]);

  return ok(items, { page, pageSize, total });
});

const createSchema = z.object({
  name: z.string().min(2),
  channel: z.nativeEnum(CampaignChannel),
  status: z.nativeEnum(CampaignStatus).optional(),
  audience: z.unknown().optional(),
  scheduledAt: z.coerce.date().optional(),
});

export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const body = createSchema.parse(await req.json());

  const campaign = await db.campaign.create({
    data: {
      establishmentId,
      name: body.name,
      channel: body.channel,
      status: body.status ?? "DRAFT",
      audience: body.audience !== undefined ? (body.audience as object) : undefined,
      scheduledAt: body.scheduledAt,
    },
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "campaign.create",
    targetType: "Campaign",
    targetId: campaign.id,
  });

  return created(campaign);
});
