// Pure commission math for the "Indique e Ganhe" ambassador program.
// Kept isolated from Prisma/HTTP on purpose: changing the program's rules
// (packages/db AmbassadorProgramSettings) must never require touching the
// callers in apps/api — see the model comment in schema.prisma.

export type AmbassadorCommissionModel = "ONE_TIME" | "RECURRING" | "HYBRID";
export type AmbassadorCommissionValueType = "PERCENT" | "FIXED";

export interface AmbassadorCommissionSettings {
  active: boolean;
  commissionModel: AmbassadorCommissionModel;
  commissionType: AmbassadorCommissionValueType;
  bonusAmount: number | null;
  recurringPercent: number | null;
  recurringFixed: number | null;
}

// Discriminated on `kind` so callers narrow periodKey's nullability instead
// of asserting it — a BONUS is always period-less, a RECURRING never is.
export type CommissionInstruction =
  | { kind: "BONUS"; periodKey: null; amount: number }
  | { kind: "RECURRING"; periodKey: string; amount: number };

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** "2026-09" for the given date (UTC), used as the idempotency key for a
 * recurring commission — one per ambassador/referral/period, never more. */
export function periodKeyFor(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function recurringAmount(settings: AmbassadorCommissionSettings, planPriceMonthly: number): number {
  const amount =
    settings.commissionType === "PERCENT"
      ? (planPriceMonthly * (settings.recurringPercent ?? 0)) / 100
      : settings.recurringFixed ?? 0;
  return round2(amount);
}

/** Commissions to create the moment a referral converts (its establishment's
 * Subscription first becomes ACTIVE). ONE_TIME/HYBRID grant the flat bônus;
 * RECURRING/HYBRID also grant the first recurring cycle. */
export function commissionsForConversion(
  settings: AmbassadorCommissionSettings,
  planPriceMonthly: number,
  firstPeriodKey: string
): CommissionInstruction[] {
  if (!settings.active) return [];
  const instructions: CommissionInstruction[] = [];

  if (settings.commissionModel === "ONE_TIME" || settings.commissionModel === "HYBRID") {
    const amount = round2(settings.bonusAmount ?? 0);
    if (amount > 0) instructions.push({ kind: "BONUS", periodKey: null, amount });
  }

  if (settings.commissionModel === "RECURRING" || settings.commissionModel === "HYBRID") {
    const amount = recurringAmount(settings, planPriceMonthly);
    if (amount > 0) instructions.push({ kind: "RECURRING", periodKey: firstPeriodKey, amount });
  }

  return instructions;
}

/** One recurring cycle's commission for an already-converted, still-active
 * referral (called per billing period — see apps/api/app/api/admin/
 * ambassadors/run-recurring, the stand-in for a real billing webhook). */
export function commissionForPeriod(
  settings: AmbassadorCommissionSettings,
  planPriceMonthly: number,
  periodKey: string
): CommissionInstruction | null {
  if (!settings.active) return null;
  if (settings.commissionModel === "ONE_TIME") return null;

  const amount = recurringAmount(settings, planPriceMonthly);
  if (amount <= 0) return null;
  return { kind: "RECURRING", periodKey, amount };
}
