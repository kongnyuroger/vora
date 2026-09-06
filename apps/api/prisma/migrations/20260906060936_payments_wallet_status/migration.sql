/*
  Warnings:

  - Added the required column `updatedAt` to the `wallet_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "failureReason" TEXT;

-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'SUCCESS',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "wallet_transactions_userId_createdAt_idx" ON "wallet_transactions"("userId", "createdAt");
