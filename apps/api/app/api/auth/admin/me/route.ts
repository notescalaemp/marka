import type { NextRequest } from "next/server";
import { withHandler, ok } from "@marka/shared";
import { requireAdminAuth } from "@/lib/auth-context";

export const GET = withHandler(async (req: NextRequest) => {
  const session = await requireAdminAuth(req);
  const { administrator } = session;
  return ok({
    id: administrator.id,
    email: administrator.email,
    name: administrator.name,
    role: administrator.role,
  });
});
