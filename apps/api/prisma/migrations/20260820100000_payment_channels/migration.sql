-- CreateEnum
CREATE TYPE "PaymentChannelType" AS ENUM ('PROMPTPAY_PHONE', 'PROMPTPAY_NATIONAL_ID', 'PROMPTPAY_EWALLET', 'BANK_TRANSFER', 'CUSTOM_QR');

-- CreateEnum
CREATE TYPE "PaymentProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paymentChannelId" TEXT,
ADD COLUMN     "paymentInstruction" JSONB;

-- CreateTable
CREATE TABLE "store_payment_channels" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" "PaymentChannelType" NOT NULL,
    "label" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "proxyValue" TEXT,
    "bankCode" TEXT,
    "bankAccountNumber" TEXT,
    "qrImageUrl" TEXT,
    "instructions" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_payment_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_proofs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "channelId" TEXT,
    "amount" INTEGER NOT NULL,
    "reference" TEXT,
    "slipKey" TEXT NOT NULL,
    "slipUrl" TEXT NOT NULL,
    "transferredAt" TIMESTAMP(3),
    "status" "PaymentProofStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_payment_channels_storeId_position_idx" ON "store_payment_channels"("storeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "store_payment_channels_storeId_label_key" ON "store_payment_channels"("storeId", "label");

-- CreateIndex
CREATE INDEX "payment_proofs_orderId_createdAt_idx" ON "payment_proofs"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_proofs_status_idx" ON "payment_proofs"("status");

-- CreateIndex
CREATE INDEX "orders_paymentChannelId_idx" ON "orders"("paymentChannelId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_paymentChannelId_fkey" FOREIGN KEY ("paymentChannelId") REFERENCES "store_payment_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_payment_channels" ADD CONSTRAINT "store_payment_channels_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "store_payment_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

