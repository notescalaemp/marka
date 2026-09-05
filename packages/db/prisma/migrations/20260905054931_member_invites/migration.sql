-- CreateTable
CREATE TABLE "member_invites" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "BusinessRole" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_invites_tokenHash_key" ON "member_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "member_invites_establishmentId_idx" ON "member_invites"("establishmentId");

-- CreateIndex
CREATE INDEX "member_invites_email_idx" ON "member_invites"("email");

-- AddForeignKey
ALTER TABLE "member_invites" ADD CONSTRAINT "member_invites_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
