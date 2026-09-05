-- AlterTable
ALTER TABLE "establishments" ADD COLUMN     "acceptsLocalPayment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsOnlinePayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "hoursText" TEXT,
ADD COLUMN     "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "slotEndHour" INTEGER NOT NULL DEFAULT 19,
ADD COLUMN     "slotStartHour" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "favorite_establishments" (
    "userId" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_establishments_pkey" PRIMARY KEY ("userId","establishmentId")
);

-- CreateTable
CREATE TABLE "favorite_professionals" (
    "userId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_professionals_pkey" PRIMARY KEY ("userId","professionalId")
);

-- CreateIndex
CREATE INDEX "favorite_establishments_establishmentId_idx" ON "favorite_establishments"("establishmentId");

-- CreateIndex
CREATE INDEX "favorite_professionals_professionalId_idx" ON "favorite_professionals"("professionalId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_establishmentId_userId_key" ON "customers"("establishmentId", "userId");

-- AddForeignKey
ALTER TABLE "favorite_establishments" ADD CONSTRAINT "favorite_establishments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_establishments" ADD CONSTRAINT "favorite_establishments_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_professionals" ADD CONSTRAINT "favorite_professionals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_professionals" ADD CONSTRAINT "favorite_professionals_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
