import type { NextRequest } from "next/server";
import { db, AppointmentStatus } from "@marka/db";
import { withHandler, ok } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const DAY_MS = 24 * 60 * 60 * 1000;

type SegmentKey =
  | "novos"
  | "frequentes"
  | "vip"
  | "inativos"
  | "risco"
  | "aniversariantes";

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const now = new Date();
  const customers = await db.customer.findMany({
    where: { establishmentId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      tags: true,
      createdAt: true,
      appointments: {
        where: {
          status: { in: [AppointmentStatus.CONCLUIDO, AppointmentStatus.CONFIRMADO] },
        },
        orderBy: { startAt: "desc" },
        select: { startAt: true, price: true },
      },
    },
  });

  const segments: Record<
    SegmentKey,
    Array<{
      id: string;
      name: string;
      phone: string | null;
      lastVisit: string | null;
      visitCount: number;
      ticketAvg: number;
    }>
  > = {
    novos: [],
    frequentes: [],
    vip: [],
    inativos: [],
    risco: [],
    aniversariantes: [],
  };

  for (const c of customers) {
    const visits = c.appointments;
    const visitCount = visits.length;
    const lastVisit = visits[0]?.startAt ?? null;
    const ticketAvg =
      visitCount > 0
        ? visits.reduce((s, a) => s + Number(a.price), 0) / visitCount
        : 0;

    const daysSinceLast = lastVisit
      ? Math.floor((now.getTime() - lastVisit.getTime()) / DAY_MS)
      : null;
    const daysSinceCreated = Math.floor(
      (now.getTime() - c.createdAt.getTime()) / DAY_MS
    );

    const item = {
      id: c.id,
      name: c.name,
      phone: c.phone,
      lastVisit: lastVisit?.toISOString() ?? null,
      visitCount,
      ticketAvg,
    };

    const tagSet = new Set(c.tags.map((t) => t.toLowerCase()));

    if (tagSet.has("vip") || ticketAvg >= 200) {
      segments.vip.push(item);
    }

    if (daysSinceCreated <= 30 && visitCount <= 2) {
      segments.novos.push(item);
    }

    if (visitCount >= 4 && daysSinceLast !== null && daysSinceLast <= 45) {
      segments.frequentes.push(item);
    }

    if (daysSinceLast !== null && daysSinceLast > 60) {
      segments.inativos.push(item);
    } else if (daysSinceLast !== null && daysSinceLast > 35 && daysSinceLast <= 60) {
      segments.risco.push(item);
    } else if (visitCount === 0 && daysSinceCreated > 14) {
      segments.risco.push(item);
    }

    // Birthday segment only when tagged — Customer has no birthDate field.
    if (tagSet.has("aniversario") || tagSet.has("aniversariante")) {
      segments.aniversariantes.push(item);
    }
  }

  return ok({
    generatedAt: now.toISOString(),
    counts: {
      novos: segments.novos.length,
      frequentes: segments.frequentes.length,
      vip: segments.vip.length,
      inativos: segments.inativos.length,
      risco: segments.risco.length,
      aniversariantes: segments.aniversariantes.length,
    },
    segments,
  });
});
