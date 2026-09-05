import type { NextRequest } from "next/server";
import { z } from "zod";
import { db, AppointmentStatus, PaymentStatus } from "@marka/db";
import { withHandler, ok, ValidationError } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId);

  const parsed = querySchema.parse({
    from: req.nextUrl.searchParams.get("from") ?? undefined,
    to: req.nextUrl.searchParams.get("to") ?? undefined,
  });

  const from = parsed.from ?? new Date(new Date().setHours(0, 0, 0, 0));
  const to = parsed.to ?? new Date(from.getTime() + 24 * 60 * 60 * 1000 - 1);
  if (to < from) throw new ValidationError("Período inválido");

  const apptWhere = {
    establishmentId,
    startAt: { gte: from, lte: to },
  };

  const [
    appointmentsTotal,
    appointmentsByStatus,
    customersTotal,
    revenueAgg,
    paidPayments,
  ] = await Promise.all([
    db.appointment.count({ where: apptWhere }),
    db.appointment.groupBy({
      by: ["status"],
      where: apptWhere,
      _count: { _all: true },
    }),
    db.customer.count({ where: { establishmentId } }),
    db.payment.aggregate({
      where: {
        establishmentId,
        status: PaymentStatus.PAID,
        createdAt: { gte: from, lte: to },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.payment.findMany({
      where: {
        establishmentId,
        status: PaymentStatus.PAID,
        createdAt: { gte: from, lte: to },
      },
      select: { amount: true, customerId: true },
    }),
  ]);

  const statusMap = Object.fromEntries(
    (Object.keys(AppointmentStatus) as AppointmentStatus[]).map((s) => [s, 0])
  ) as Record<AppointmentStatus, number>;
  for (const row of appointmentsByStatus) {
    statusMap[row.status] = row._count._all;
  }

  const revenue =
    revenueAgg._sum.amount !== null && revenueAgg._sum.amount !== undefined
      ? Number(revenueAgg._sum.amount)
      : 0;
  const paidCount = revenueAgg._count._all;
  const ticketAverage = paidCount > 0 ? revenue / paidCount : null;

  const cancellations = statusMap.CANCELADO;
  const noShows = statusMap.NO_SHOW;
  const completed = statusMap.CONCLUIDO;
  const confirmed = statusMap.CONFIRMADO + statusMap.AGUARDANDO;

  // Occupancy: completed+confirmed vs total non-canceled appointments in range.
  const denom =
    appointmentsTotal - statusMap.CANCELADO - statusMap.BLOQUEADO;
  const occupancy =
    denom > 0 ? (completed + statusMap.CONFIRMADO + statusMap.AGUARDANDO) / denom : null;

  return ok({
    period: { from: from.toISOString(), to: to.toISOString() },
    appointments: {
      total: appointmentsTotal,
      byStatus: statusMap,
      confirmed,
      completed,
      cancellations,
      noShows,
    },
    customers: { total: customersTotal },
    revenue: {
      total: revenue,
      paidCount,
      ticketAverage,
    },
    occupancy,
  });
});
