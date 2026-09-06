import type { NextRequest } from "next/server";
import { db } from "@marka/db";
import { withHandler, ok, writeAuditLog, clientIp } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";
import { runRecurringCommissions } from "@/lib/ambassador";

// POST: generates this billing period's recurring commission for every
// active referral. Manual for now — this project has no live payment
// gateway wired (packages/shared/src/payments.ts is MANUAL-only), so there
// is no webhook to hang this off yet. This endpoint is that future hook's
// stand-in; swap for a scheduled job or a real billing webhook later
// without touching packages/shared/src/ambassador-commission.ts.
export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "ambassadors");

  const created = await runRecurringCommissions();

  await writeAuditLog(db, {
    actorType: "ADMINISTRATOR",
    actorId: session.administrator.id,
    action: "ambassador.commissions.run_recurring",
    metadata: { created },
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  return ok({ created });
});
