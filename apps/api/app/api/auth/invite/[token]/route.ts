import type { NextRequest } from "next/server";
import { withHandler, ok } from "@marka/shared";
import { resolveValidInvite } from "@/lib/invites";

// Public by design (like the invite link itself): whoever holds the raw
// token is treated as the invitee, no session required to preview it.
export const GET = withHandler(async (req: NextRequest, { params }) => {
  const { token } = await params;
  const invite = await resolveValidInvite(token);

  return ok({
    email: invite.email,
    role: invite.role,
    establishment: invite.establishment,
    expiresAt: invite.expiresAt,
  });
});
