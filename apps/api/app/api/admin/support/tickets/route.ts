import type { NextRequest } from "next/server";
import { withHandler, ok } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";
import { requireAdminPermission } from "@/lib/admin";

// No SupportTicket model exists in the schema — this endpoint returns empty
// data until a ticketing system is implemented.
export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  requireAdminPermission(session.administrator.role, "alerts");

  return ok({
    kpis: { open: 0, highPriority: 0, resolved: 0, openOnly: 0 },
    items: [],
  });
});
