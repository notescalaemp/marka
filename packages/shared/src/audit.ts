import type { PrismaClient, Prisma } from "@marka/db";

// Built on Prisma's own unchecked-create type (plain scalar FKs, no
// relation-connect objects) so this can never drift from the schema.
export type AuditLogInput = Omit<Prisma.AuditLogUncheckedCreateInput, "id" | "createdAt">;

// Fire-and-forget-safe: callers should still `await` this so failures are
// visible in logs, but a failed audit write must never itself roll back or
// block the business operation it is describing.
export async function writeAuditLog(db: PrismaClient, input: AuditLogInput) {
  try {
    await db.auditLog.create({ data: input });
  } catch (error) {
    console.error("Failed to write audit log", input.action, error);
  }
}
