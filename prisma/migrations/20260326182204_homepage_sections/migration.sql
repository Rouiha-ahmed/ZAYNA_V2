-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- RenameIndex
ALTER INDEX "Product_isActive_isFeatured_isBestSeller_isNewArrival_isPromoti" RENAME TO "Product_isActive_isFeatured_isBestSeller_isNewArrival_isPro_idx";
