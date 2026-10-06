-- Preserve source-of-truth identifiers and values that do not fit the
-- operational catalogue columns (notably duplicate source SKUs).
ALTER TABLE "Product"
ADD COLUMN "sourceName" TEXT,
ADD COLUMN "sourceProductId" TEXT,
ADD COLUMN "sourceVariantId" TEXT,
ADD COLUMN "sourceSku" TEXT,
ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "sourceAvailable" BOOLEAN;

CREATE UNIQUE INDEX "Product_sourceName_sourceProductId_key"
ON "Product"("sourceName", "sourceProductId");

CREATE INDEX "Product_sourceSku_idx" ON "Product"("sourceSku");
