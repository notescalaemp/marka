import type { NextRequest } from "next/server";
import { withHandler, ok, ValidationError, RateLimitError, rateLimiter } from "@marka/shared";
import { requireUserAuth } from "@/lib/auth-context";
import { issueEmailVerification } from "@/lib/email-verification";

// Also doubles as "resend" — issueEmailVerification always invalidates the
// previous token before issuing a new one, so there's no separate endpoint.
export const POST = withHandler(async (req: NextRequest) => {
  const session = await requireUserAuth(req);

  if (!rateLimiter.check(`email-verify-request:${session.userId}`, 5, 60_000).allowed) {
    throw new RateLimitError();
  }
  if (session.user.emailVerifiedAt) {
    throw new ValidationError("E-mail já verificado");
  }

  await issueEmailVerification(session.userId, session.user.email);

  return ok({ message: "E-mail de verificação enviado." });
});
