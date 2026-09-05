import type { NextRequest } from "next/server";
import { z } from "zod";
import { db, AppointmentStatus, PaymentStatus } from "@marka/db";
import { withHandler, ok, ValidationError } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

function periodBounds(from?: Date, to?: Date) {
  const start = from ?? new Date(new Date().setHours(0, 0, 0, 0));
  const end = to ?? new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (end < start) throw new ValidationError("Período inválido");
  return { from: start, to: end };
}

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const parsed = querySchema.parse({
    from: req.nextUrl.searchParams.get("from") ?? undefined,
    to: req.nextUrl.searchParams.get("to") ?? undefined,
  });
  const { from, to } = periodBounds(parsed.from, parsed.to);

  const [payments, appointments, customersCount, servicesCount, professionalsCount] =
    await Promise.all([
      db.payment.findMany({
        where: {
          establishmentId,
          status: PaymentStatus.PAID,
          createdAt: { gte: from, lte: to },
        },
        select: { amount: true, createdAt: true, method: true },
      }),
      db.appointment.findMany({
        where: {
          establishmentId,
          startAt: { gte: from, lte: to },
        },
        select: {
          status: true,
          price: true,
          serviceId: true,
          professionalId: true,
          customerId: true,
          service: { select: { name: true } },
          professional: {
            select: {
              id: true,
              member: { select: { user: { select: { name: true } } } },
            },
          },
        },
      }),
      db.customer.count({ where: { establishmentId } }),
      db.service.count({ where: { establishmentId, active: true } }),
      db.professional.count({ where: { establishmentId, active: true } }),
    ]);

  const revenueTotal = payments.reduce((s, p) => s + Number(p.amount), 0);

  const byService = new Map<string, { name: string; count: number; revenue: number }>();
  const byProfessional = new Map<
    string,
    { name: string; count: number; revenue: number }
  >();
  const byStatus: Record<string, number> = {};
  const customerIds = new Set<string>();

  for (const a of appointments) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    customerIds.add(a.customerId);

    const svc = byService.get(a.serviceId) ?? {
      name: a.service.name,
      count: 0,
      revenue: 0,
    };
    svc.count += 1;
    if (a.status === AppointmentStatus.CONCLUIDO) {
      svc.revenue += Number(a.price);
    }
    byService.set(a.serviceId, svc);

    const proName = a.professional.member.user.name;
    const pro = byProfessional.get(a.professionalId) ?? {
      name: proName,
      count: 0,
      revenue: 0,
    };
    pro.count += 1;
    if (a.status === AppointmentStatus.CONCLUIDO) {
      pro.revenue += Number(a.price);
    }
    byProfessional.set(a.professionalId, pro);
  }

  return ok({
    period: { from: from.toISOString(), to: to.toISOString() },
    revenue: {
      total: revenueTotal,
      paidCount: payments.length,
      ticketAverage: payments.length > 0 ? revenueTotal / payments.length : null,
    },
    appointments: {
      total: appointments.length,
      byStatus,
      uniqueCustomers: customerIds.size,
    },
    services: {
      catalogActive: servicesCount,
      byService: Array.from(byService.entries()).map(([id, v]) => ({
        serviceId: id,
        ...v,
      })),
    },
    professionals: {
      active: professionalsCount,
      byProfessional: Array.from(byProfessional.entries()).map(([id, v]) => ({
        professionalId: id,
        ...v,
      })),
    },
    customers: {
      total: customersCount,
      activeInPeriod: customerIds.size,
    },
  });
});
