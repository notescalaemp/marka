// Two cookies, matching the two identity tables: `mk_session` (User —
// shared by Consumer and Business, permissions are still fully separated
// per-establishment via RBAC) and `mk_admin_session` (Administrator —
// Backoffice only, never issued or accepted for the other two).

export const USER_SESSION_COOKIE = "mk_session";
export const ADMIN_SESSION_COOKIE = "mk_admin_session";
// Carries the visitorRef of a pending ambassador Referral from
// /indique/[code] through signup — not a session, so it gets its own
// (non-httpOnly-sensitive but still first-party) short lifetime below.
export const AMBASSADOR_REFERRAL_COOKIE = "mk_ref";

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
    // Set in production to a shared parent domain (e.g. ".marka.ia") so the
    // three frontend subdomains can present the same cookie to apps/api.
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
}

// 30 days — long enough that a signup started well after the link click
// still gets attributed, short enough that a stale referral eventually stops
// being claimable.
export function referralCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
}

export function clearedCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
}
