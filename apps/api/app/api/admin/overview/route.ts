import type { NextRequest } from "next/server";
import { withHandler, ok } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import {
  getGlobalMrr,
  getActiveBusinessesCount,
  getChurnRate,
  getNetNewMrr,
  getMrrAtRisk,
  getTrialToPaid,
  getSeries,
  getActivity,
  getPlansOverview,
} from "@/lib/admin-overview";

// Global platform view — never tenant-scoped, so this deliberately does not
// use requireMembership(). Authorization here is:
//   requireAdminAuth  (is there a valid Administrator session at all)
//   -> requireAdminPermission  (does this admin's role include "overview")
//   -> query.
export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "overview");

  const [mrr, activeBusinesses, churn, netNewMrr, mrrAtRisk, trialToPaid, series, activity, plans] =
    await Promise.all([
      getGlobalMrr(),
      getActiveBusinessesCount(),
      getChurnRate(),
      getNetNewMrr(),
      getMrrAtRisk(),
      getTrialToPaid(),
      getSeries(),
      getActivity(),
      getPlansOverview(),
    ]);

  return ok({
    kpis: {
      mrr,
      arr: mrr * 12,
      activeBusinesses,
      churn,
      // No historical MRR/ARR snapshot exists yet to compare against — see
      // STATUS report. 0 here means "no comparison available", not "no
      // growth".
      delta: { mrr: 0, arr: 0 },
    },
    series,
    secondary: [{ netNewMrr, mrrAtRisk, trialToPaid }],
    activity,
    plans,
  });
});
