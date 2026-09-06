import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Mirrors packages/auth/src/cookies.ts (AMBASSADOR_REFERRAL_COOKIE /
// referralCookieOptions) — duplicated instead of imported because this
// frontend app has no dependency on the backend-only @marka/auth package.
// apps/api reads this same cookie name in app/api/business/establishments/route.ts.
const AMBASSADOR_REFERRAL_COOKIE = "mk_ref";
function referralCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
}

// Public entry point for an ambassador link (marka.ia/indique/CODIGO).
// Tracks the click server-to-server, drops the mk_ref cookie the pending
// Referral rides on through signup (see apps/api/app/api/business/
// establishments/route.ts), and sends the visitor into the normal signup
// flow — never invents a separate "referred signup" page.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const existingRef = req.cookies.get(AMBASSADOR_REFERRAL_COOKIE)?.value;
  const visitorRef = existingRef ?? randomUUID();

  try {
    await fetch(`${API_URL}/api/public/ambassadors/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, visitorRef }),
      cache: "no-store",
    });
  } catch {
    // A tracking failure must never block the visitor from reaching signup.
  }

  const response = NextResponse.redirect(new URL("/register", req.url));
  response.cookies.set(AMBASSADOR_REFERRAL_COOKIE, visitorRef, referralCookieOptions());
  return response;
}
