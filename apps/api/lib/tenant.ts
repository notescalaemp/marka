import { db } from "@marka/db";
import type { BusinessRole } from "@marka/auth";
import { ForbiddenError } from "@marka/shared";

// The one place every business route must call before touching
// establishment-scoped data. Never trust an establishmentId from the URL or
// body without confirming the caller is an active member of it — this is
// what prevents IDOR across tenants.
export async function requireMembership(
  userId: string,
  establishmentId: string,
  allowedRoles?: BusinessRole[]
) {
  const membership = await db.establishmentMember.findUnique({
    where: { establishmentId_userId: { establishmentId, userId } },
  });

  if (!membership || membership.status !== "ACTIVE") {
    throw new ForbiddenError("Você não tem acesso a este estabelecimento");
  }
  if (allowedRoles && !allowedRoles.includes(membership.role as BusinessRole)) {
    throw new ForbiddenError("Seu papel não permite esta ação");
  }
  return membership;
}
