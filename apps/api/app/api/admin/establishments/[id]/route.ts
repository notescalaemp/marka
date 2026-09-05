import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, NotFoundError } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { queryEstablishmentScored } from "@/lib/admin-establishments";
import { queryEstablishmentDetailExtras } from "@/lib/admin-establishment-detail";
import { queryUtilizationForOne } from "@/lib/admin-utilization";

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "establishment_detail");

  const scored = await queryEstablishmentScored(id);
  if (!scored) throw new NotFoundError("Estabelecimento não encontrado");

  const [appointmentsByStatus, revenueByStatus, recentActivity, util, extras] =
    await Promise.all([
      db.appointment.groupBy({
        by: ["status"],
        where: { establishmentId: id },
        _count: { _all: true },
      }),
      db.payment.groupBy({
        by: ["status"],
        where: { establishmentId: id },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      db.auditLog.findMany({
        where: { establishmentId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          action: true,
          actorType: true,
          targetType: true,
          createdAt: true,
        },
      }),
      queryUtilizationForOne(id),
      queryEstablishmentDetailExtras(id, scored),
    ]);

  const appointmentCounts = Object.fromEntries(
    appointmentsByStatus.map((r) => [r.status, r._count._all])
  );
  const totalPaid = revenueByStatus.find((r) => r.status === "PAID")?._sum.amount ?? 0;
  const failedPayments =
    revenueByStatus.find((r) => r.status === "FAILED")?._count._all ?? 0;
  const refunds =
    revenueByStatus.find((r) => r.status === "REFUNDED")?._count._all ?? 0;

  return ok({
    id: scored.id,
    name: scored.name,
    slug: scored.slug,
    category: scored.category,
    status: scored.establishment_status,
    createdAt: scored.createdAt.toISOString(),
    owner: {
      id: scored.owner_id,
      name: scored.owner_name,
      email: scored.owner_email,
    },
    plan: scored.plan_name,
    subscription: scored.subscription_status
      ? {
          status: scored.subscription_status,
          currentPeriodEnd: scored.current_period_end
            ? scored.current_period_end.toISOString()
            : null,
          canceledAt: scored.subscription_canceled_at
            ? scored.subscription_canceled_at.toISOString()
            : null,
        }
      : null,
    mrr: scored.mrr,
    ltv: extras.ltv,
    members: scored.members_count,
    professionals: scored.professionals_count,
    customers: scored.customers_count,
    appointments: {
      total: Object.values(appointmentCounts).reduce((sum, n) => sum + n, 0),
      completed: appointmentCounts.CONCLUIDO ?? 0,
      canceled: appointmentCounts.CANCELADO ?? 0,
    },
    revenue: {
      totalPaid: Number(totalPaid),
      failedPayments,
      refunds,
      delinquency: extras.delinquency,
      delinquencyAmount: extras.delinquencyAmount,
    },
    catalog: {
      services: extras.services,
      products: extras.products,
      campaigns: extras.campaigns,
    },
    engagement: {
      sessions: extras.sessions,
      dau: extras.dau,
      wau: extras.wau,
      mau: extras.mau,
      activeDays: extras.activeDays,
    },
    utilization: util.utilization,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      actorType: a.actorType,
      targetType: a.targetType,
      at: a.createdAt.toISOString(),
    })),
    churnRisk: scored.churn_risk,
    mrrAtRisk: extras.mrrAtRisk,
    churnReasons: extras.churnReasons,
    lastAccess: scored.last_access ? scored.last_access.toISOString() : null,
  });
});
