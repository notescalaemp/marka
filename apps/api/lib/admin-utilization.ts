import { db, Prisma } from "@marka/db";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Weekday approximation for a rolling 30-day window. */
const BUSINESS_DAYS_30 = 22;

export interface UtilizationStats {
  utilization: number;
  utilizationDelta: number;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function utilizationPct(
  bookedMinutes: number,
  professionals: number,
  slotStartHour: number,
  slotEndHour: number
): number {
  if (professionals <= 0) return bookedMinutes > 0 ? 100 : 0;
  const hoursPerDay = Math.max(1, slotEndHour - slotStartHour);
  const capacity = professionals * hoursPerDay * 60 * BUSINESS_DAYS_30;
  if (capacity <= 0) return 0;
  return Math.min(100, round1((bookedMinutes / capacity) * 100));
}

/**
 * Slot utilization proxy for the last 30 days vs the prior 30 days.
 * booked minutes / (active professionals × business hours × ~22 weekdays).
 */
export async function queryUtilizationByIds(
  ids: string[]
): Promise<Map<string, UtilizationStats>> {
  const result = new Map<string, UtilizationStats>();
  if (ids.length === 0) return result;

  const now = Date.now();
  const currentStart = new Date(now - 30 * DAY_MS);
  const prevStart = new Date(now - 60 * DAY_MS);

  const [establishments, bookedRows] = await Promise.all([
    db.establishment.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        slotStartHour: true,
        slotEndHour: true,
        professionals: { where: { active: true }, select: { id: true } },
      },
    }),
    db.$queryRaw<{ establishmentId: string; period: string; minutes: number }[]>(Prisma.sql`
      SELECT
        a."establishmentId" AS "establishmentId",
        CASE WHEN a."startAt" >= ${currentStart} THEN 'current' ELSE 'prev' END AS period,
        COALESCE(SUM(EXTRACT(EPOCH FROM (a."endAt" - a."startAt")) / 60.0), 0)::float8 AS minutes
      FROM appointments a
      WHERE a."establishmentId" IN (${Prisma.join(ids)})
        AND a."startAt" >= ${prevStart}
        AND a."startAt" < ${new Date(now)}
        AND a.status NOT IN ('CANCELADO', 'BLOQUEADO')
      GROUP BY a."establishmentId", period
    `),
  ]);

  const booked = new Map<string, { current: number; prev: number }>();
  for (const row of bookedRows) {
    const entry = booked.get(row.establishmentId) ?? { current: 0, prev: 0 };
    if (row.period === "current") entry.current = Number(row.minutes);
    else entry.prev = Number(row.minutes);
    booked.set(row.establishmentId, entry);
  }

  for (const est of establishments) {
    const mins = booked.get(est.id) ?? { current: 0, prev: 0 };
    const pros = est.professionals.length;
    const current = utilizationPct(mins.current, pros, est.slotStartHour, est.slotEndHour);
    const prev = utilizationPct(mins.prev, pros, est.slotStartHour, est.slotEndHour);
    result.set(est.id, {
      utilization: current,
      utilizationDelta: round1(current - prev),
    });
  }

  for (const id of ids) {
    if (!result.has(id)) {
      result.set(id, { utilization: 0, utilizationDelta: 0 });
    }
  }

  return result;
}

export async function queryUtilizationForOne(id: string): Promise<UtilizationStats> {
  const map = await queryUtilizationByIds([id]);
  return map.get(id) ?? { utilization: 0, utilizationDelta: 0 };
}
