import { db } from "@marka/db";
import { ForbiddenError } from "@marka/shared";
import {
  commissionsForConversion,
  commissionForPeriod,
  periodKeyFor,
  type AmbassadorCommissionSettings,
} from "@marka/shared";

// The one place every /ambassador/* business route must call after
// requireMembership — mirrors apps/api/lib/tenant.ts::requireMembership.
// Never trust a client-supplied "I'm an ambassador" flag: this is the only
// source of truth, and it is re-checked on every request.
export async function requireAmbassador(establishmentId: string) {
  const profile = await db.ambassadorProfile.findUnique({ where: { establishmentId } });
  if (!profile || profile.status !== "ACTIVE") {
    throw new ForbiddenError("Este estabelecimento não é Embaixador");
  }
  return profile;
}

function normalizeCodeFragment(name: string): string {
  const stripped = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return stripped.slice(0, 16) || "PARCEIRO";
}

// Generated once, at promotion time, and never regenerated afterwards — the
// code is permanent for the lifetime of the AmbassadorProfile row.
export async function generateAmbassadorCode(establishmentName: string): Promise<string> {
  const base = `MARKA-${normalizeCodeFragment(establishmentName)}`;
  let candidate = base;
  let attempt = 1;
  while (await db.ambassadorProfile.findUnique({ where: { code: candidate } })) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}

const SETTINGS_ID = "default";

export async function ensureAmbassadorProgramSettings() {
  const existing = await db.ambassadorProgramSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (existing) return existing;
  return db.ambassadorProgramSettings.create({ data: { id: SETTINGS_ID } });
}

export function toCommissionSettings(
  row: Awaited<ReturnType<typeof ensureAmbassadorProgramSettings>>
): AmbassadorCommissionSettings {
  return {
    active: row.active,
    commissionModel: row.commissionModel,
    commissionType: row.commissionType,
    bonusAmount: row.bonusAmount ? Number(row.bonusAmount) : null,
    recurringPercent: row.recurringPercent ? Number(row.recurringPercent) : null,
    recurringFixed: row.recurringFixed ? Number(row.recurringFixed) : null,
  };
}

// Stand-in for a real billing webhook (no payment gateway is wired in this
// project yet — see packages/shared/src/payments.ts). Scans referrals whose
// referred establishment's own Subscription has become ACTIVE and converts
// them: transitions status, records the funnel events, and creates the
// conversion commission(s). Idempotent — safe to call as often as needed.
// Called opportunistically before reading ambassador data (see the
// overview/detail/list routes) so numbers are always fresh without a cron.
export async function syncAmbassadorConversions(ambassadorId?: string) {
  const referrals = await db.referral.findMany({
    where: {
      status: { in: ["SIGNED_UP", "UNDER_REVIEW"] },
      ambassadorId: ambassadorId ?? undefined,
      referredEstablishment: { subscription: { status: "ACTIVE" } },
    },
    include: { referredEstablishment: { include: { subscription: { include: { plan: true } } } } },
  });

  if (referrals.length === 0) return 0;

  const settings = toCommissionSettings(await ensureAmbassadorProgramSettings());
  const now = new Date();
  const periodKey = periodKeyFor(now);

  for (const referral of referrals) {
    const planPrice = Number(referral.referredEstablishment?.subscription?.plan.priceMonthly ?? 0);
    const instructions = commissionsForConversion(settings, planPrice, periodKey);

    await db.$transaction(async (tx) => {
      await tx.referral.update({
        where: { id: referral.id },
        data: { status: "ACTIVE", convertedAt: now },
      });
      await tx.referralEvent.createMany({
        data: [
          { ambassadorId: referral.ambassadorId, referralId: referral.id, type: "ESTABLISHMENT_ACTIVATED" },
          { ambassadorId: referral.ambassadorId, referralId: referral.id, type: "PLAN_SUBSCRIBED" },
        ],
      });
      for (const instruction of instructions) {
        const commission = await tx.commission.create({
          data: {
            ambassadorId: referral.ambassadorId,
            referralId: referral.id,
            kind: instruction.kind,
            periodKey: instruction.periodKey,
            amount: instruction.amount,
          },
        });
        await tx.referralEvent.create({
          data: {
            ambassadorId: referral.ambassadorId,
            referralId: referral.id,
            type: "COMMISSION_CREATED",
            metadata: { commissionId: commission.id, kind: commission.kind, amount: instruction.amount },
          },
        });
      }
    });
  }

  return referrals.length;
}

// Generates this period's recurring commission for every referral already
// ACTIVE, one per referral per periodKey (unique constraint on Commission
// makes this safe to re-run). This is the manual trigger described in the
// plan as the future home of a real billing-cycle webhook.
export async function runRecurringCommissions(periodKey: string = periodKeyFor(new Date())) {
  const referrals = await db.referral.findMany({
    where: { status: "ACTIVE" },
    include: { referredEstablishment: { include: { subscription: { include: { plan: true } } } } },
  });

  const settings = toCommissionSettings(await ensureAmbassadorProgramSettings());
  let created = 0;

  for (const referral of referrals) {
    const planPrice = Number(referral.referredEstablishment?.subscription?.plan.priceMonthly ?? 0);
    const instruction = commissionForPeriod(settings, planPrice, periodKey);
    // commissionForPeriod only ever produces a RECURRING instruction — this
    // narrows periodKey to `string` for the compound-unique lookup below.
    if (!instruction || instruction.kind !== "RECURRING") continue;

    const existing = await db.commission.findUnique({
      where: {
        ambassadorId_referralId_kind_periodKey: {
          ambassadorId: referral.ambassadorId,
          referralId: referral.id,
          kind: instruction.kind,
          periodKey: instruction.periodKey,
        },
      },
    });
    if (existing) continue;

    const commission = await db.commission.create({
      data: {
        ambassadorId: referral.ambassadorId,
        referralId: referral.id,
        kind: instruction.kind,
        periodKey: instruction.periodKey,
        amount: instruction.amount,
      },
    });
    await db.referralEvent.create({
      data: {
        ambassadorId: referral.ambassadorId,
        referralId: referral.id,
        type: "COMMISSION_CREATED",
        metadata: { commissionId: commission.id, kind: commission.kind, amount: instruction.amount },
      },
    });
    created += 1;
  }

  return created;
}

export async function computeAvailableBalance(ambassadorId: string) {
  const [earned, withdrawn] = await Promise.all([
    db.commission.aggregate({
      where: { ambassadorId, status: { in: ["APPROVED", "PAID"] } },
      _sum: { amount: true },
    }),
    db.ambassadorWithdrawal.aggregate({
      where: { ambassadorId, status: { in: ["PENDING", "PROCESSING", "PAID"] } },
      _sum: { amount: true },
    }),
  ]);
  return Number(earned._sum.amount ?? 0) - Number(withdrawn._sum.amount ?? 0);
}
