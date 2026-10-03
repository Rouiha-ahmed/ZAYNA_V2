-- Keep promo configuration available for order history while removing it from use.
ALTER TABLE "PromoCode"
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedBy" TEXT;

CREATE INDEX "PromoCode_archivedAt_idx" ON "PromoCode"("archivedAt");
