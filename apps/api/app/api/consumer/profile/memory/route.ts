import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);

  const appointments = await db.appointment.findMany({
    where: {
      customer: { userId: session.userId },
      status: { in: ["CONFIRMADO", "CONCLUIDO"] },
    },
    orderBy: { startAt: "desc" },
    take: 50,
    include: {
      service: { select: { id: true, name: true } },
      professional: {
        select: {
          id: true,
          member: { select: { user: { select: { name: true } } } },
        },
      },
      establishment: { select: { id: true, name: true, slug: true } },
    },
  });

  if (appointments.length === 0) {
    return ok({
      lastVisitAt: null,
      lastServiceName: null,
      visitCount: 0,
      topServices: [] as { name: string; count: number }[],
      topProfessionals: [] as { id: string; name: string; count: number }[],
    });
  }

  const serviceCounts = new Map<string, number>();
  const professionalCounts = new Map<string, { name: string; count: number }>();

  for (const a of appointments) {
    serviceCounts.set(a.service.name, (serviceCounts.get(a.service.name) ?? 0) + 1);
    const prev = professionalCounts.get(a.professionalId);
    professionalCounts.set(a.professionalId, {
      name: a.professional.member.user.name,
      count: (prev?.count ?? 0) + 1,
    });
  }

  const last = appointments[0];

  return ok({
    lastVisitAt: last.startAt.toISOString(),
    lastServiceName: last.service.name,
    visitCount: appointments.length,
    topServices: [...serviceCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    topProfessionals: [...professionalCounts.entries()]
      .map(([id, v]) => ({ id, name: v.name, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  });
});
