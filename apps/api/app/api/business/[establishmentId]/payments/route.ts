import type { NextRequest } from "next/server";
import { z } from "zod";
import { db, PaymentMethod, PaymentStatus } from "@marka/db";
import { withHandler, ok, created, parsePagination, writeAuditLog, NotFoundError, resolvePaymentProvider } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { requireMembership } from "@/lib/tenant";

// Payments are financial data — gated the same way as the "finance"
// permission in apps/estabelecimento/lib/permissions.ts (OWNER/ADMIN/MANAGER).
const MANAGE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

const filterSchema = z.object({
  status: z.nativeEnum(PaymentStatus).optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  appointmentId: z.string().optional(),
  customerId: z.string().optional(),
});

export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const sp = req.nextUrl.searchParams;
  const filters = filterSchema.parse({
    status: sp.get("status") ?? undefined,
    method: sp.get("method") ?? undefined,
    appointmentId: sp.get("appointmentId") ?? undefined,
    customerId: sp.get("customerId") ?? undefined,
  });

  const { skip, take, page, pageSize } = parsePagination(sp);
  const where = { establishmentId, ...filters };

  const [items, total] = await db.$transaction([
    db.payment.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    db.payment.count({ where }),
  ]);

  return ok(items, { page, pageSize, total });
});

const bodySchema = z.object({
  amount: z.number().positive(),
  method: z.nativeEnum(PaymentMethod),
  currency: z.string().length(3).optional(),
  appointmentId: z.string().optional(),
  customerId: z.string().optional(),
});

// Routed through the PaymentProvider abstraction (packages/shared/src/
// payments.ts) instead of any gateway SDK — only MANUAL exists today, so
// every charge settles immediately, but callers never see that detail.
export const POST = withHandler(async (req: NextRequest, { params }) => {
  const { establishmentId } = await params;
  const session = await requireUserAuth(req);
  await requireMembership(session.userId, establishmentId, [...MANAGE_ROLES]);

  const body = bodySchema.parse(await req.json());

  if (body.appointmentId) {
    const appointment = await db.appointment.findFirst({ where: { id: body.appointmentId, establishmentId } });
    if (!appointment) throw new NotFoundError("Agendamento não encontrado neste estabelecimento");
  }
  if (body.customerId) {
    const customer = await db.customer.findFirst({ where: { id: body.customerId, establishmentId } });
    if (!customer) throw new NotFoundError("Cliente não encontrado neste estabelecimento");
  }

  const provider = resolvePaymentProvider("MANUAL");
  const charge = await provider.charge({
    amount: body.amount,
    currency: body.currency ?? "BRL",
    method: body.method,
  });

  const payment = await db.payment.create({
    data: {
      establishmentId,
      appointmentId: body.appointmentId,
      customerId: body.customerId,
      amount: body.amount,
      currency: body.currency ?? "BRL",
      method: body.method,
      // Only MANUAL is wired; revisit alongside resolvePaymentProvider once
      // a real gateway is added.
      provider: "MANUAL",
      status: charge.status,
      providerRef: charge.providerRef,
      paidAt: charge.status === "PAID" ? new Date() : null,
    },
  });

  await writeAuditLog(db, {
    actorType: "USER",
    actorId: session.userId,
    establishmentId,
    action: "payment.create",
    targetType: "Payment",
    targetId: payment.id,
  });

  return created(payment);
});
