import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@marka/db";
import {
  withHandler,
  ok,
  created,
  parsePagination,
  writeAuditLog,
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

// Team management (bio, commission, specialties) is kept to OWNER/ADMIN/
// MANAGER, matching the "professionals" permission in
// apps/estabelecimento/lib/permissions.ts — PROFESSIONAL/STAFF don't hold it.
const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  // Agenda and day-to-day ops need the roster; mutations stay MANAGE-only.
  await requireMembership(session.userId, establishmentId);

  const { skip, take, page, pageSize } = parsePagination(req.nextUrl.searchParams);
  const activeParam = req.nextUrl.searchParams.get("active");

  const where = {
    establishmentId,
    ...(activeParam !== null ? { active: activeParam === "true" } : {}),
  };

  const [items, total] = await db.$transaction([
    db.professional.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        member: { select: { role: true, user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { services: true } },
      },
    }),
    db.professional.count({ where }),
  ]);

  return ok(items, { page, pageSize, total });
});

const bodySchema = z.object({
  memberId: z.string().min(1),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional(),
  specialties: z.array(z.string()).optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
});

// A Professional profile always extends an existing EstablishmentMember —
// there is no member-invite endpoint yet, so memberId must reference one
// already created for this establishment with role PROFESSIONAL.
export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const body = bodySchema.parse(await req.json());

  const member = await db.establishmentMember.findFirst({
    where: { id: body.memberId, establishmentId },
  });
  if (!member) throw new NotFoundError("Membro não encontrado neste estabelecimento");
  if (member.role !== "PROFESSIONAL") {
    throw new ValidationError("O membro precisa ter o papel PROFESSIONAL para ter um perfil de profissional");
  }

  const existingProfile = await db.professional.findUnique({ where: { memberId: body.memberId } });
  if (existingProfile) throw new ConflictError("Este membro já possui um perfil de profissional");

  const professional = await db.professional.create({
    data: {
      establishmentId,
      memberId: body.memberId,
      bio: body.bio,
      photoUrl: body.photoUrl,
      specialties: body.specialties ?? [],
      commissionPercent: body.commissionPercent ?? 0,
    },
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "professional.create",
    targetType: "Professional",
    targetId: professional.id,
  });

  return created(professional);
});
