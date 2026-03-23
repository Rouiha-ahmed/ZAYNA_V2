-- Alter category for subcategory tree
ALTER TABLE "Category" ADD COLUMN "parentId" TEXT;

-- Alter brand for active toggle
ALTER TABLE "Brand" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Extend product catalog fields
ALTER TABLE "Product" ADD COLUMN "sku" TEXT;
ALTER TABLE "Product" ADD COLUMN "barcode" TEXT;
ALTER TABLE "Product" ADD COLUMN "shortDescription" TEXT;
ALTER TABLE "Product" ADD COLUMN "fullDescription" TEXT;
ALTER TABLE "Product" ADD COLUMN "regularPrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "salePrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Product" ADD COLUMN "isBestSeller" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "isNewArrival" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "isPromotion" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "seoTitle" TEXT;
ALTER TABLE "Product" ADD COLUMN "seoDescription" TEXT;
ALTER TABLE "Product" ADD COLUMN "seoKeywords" TEXT;

UPDATE "Product"
SET "regularPrice" = "price"
WHERE "regularPrice" IS NULL;

UPDATE "Product"
SET "sku" = CONCAT('SKU-', SUBSTRING("id" FROM 1 FOR 8))
WHERE "sku" IS NULL;

ALTER TABLE "Product" ALTER COLUMN "regularPrice" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "sku" SET NOT NULL;

-- Extend product image for variant support
ALTER TABLE "ProductImage" ADD COLUMN "variantId" TEXT;
ALTER TABLE "ProductImage" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- Create product variants
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "option1Name" TEXT,
    "option1Value" TEXT,
    "option2Name" TEXT,
    "option2Value" TEXT,
    "option3Name" TEXT,
    "option3Value" TEXT,
    "regularPrice" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- Create related products join table
CREATE TABLE "ProductRelated" (
    "productId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductRelated_pkey" PRIMARY KEY ("productId","relatedProductId")
);

-- Indexes
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Category_parentId_title_idx" ON "Category"("parentId", "title");
CREATE INDEX "Product_isActive_isFeatured_isBestSeller_isNewArrival_isPromotion_idx" ON "Product"("isActive", "isFeatured", "isBestSeller", "isNewArrival", "isPromotion");
CREATE INDEX "ProductImage_variantId_sortOrder_idx" ON "ProductImage"("variantId", "sortOrder");
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_productId_sortOrder_idx" ON "ProductVariant"("productId", "sortOrder");
CREATE INDEX "ProductVariant_isActive_stock_idx" ON "ProductVariant"("isActive", "stock");
CREATE INDEX "ProductRelated_relatedProductId_idx" ON "ProductRelated"("relatedProductId");

-- Foreign keys
ALTER TABLE "Category"
  ADD CONSTRAINT "Category_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductImage"
  ADD CONSTRAINT "ProductImage_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductVariant"
  ADD CONSTRAINT "ProductVariant_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductRelated"
  ADD CONSTRAINT "ProductRelated_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductRelated"
  ADD CONSTRAINT "ProductRelated_relatedProductId_fkey"
  FOREIGN KEY ("relatedProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
