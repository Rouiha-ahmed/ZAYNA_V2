-- CreateTable
CREATE TABLE "HomepageProductSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageProductSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageProductSectionItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageProductSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageProductSection_slug_key" ON "HomepageProductSection"("slug");

-- CreateIndex
CREATE INDEX "HomepageProductSection_isActive_order_idx" ON "HomepageProductSection"("isActive", "order");

-- CreateIndex
CREATE INDEX "HomepageProductSectionItem_sectionId_order_idx" ON "HomepageProductSectionItem"("sectionId", "order");

-- CreateIndex
CREATE INDEX "HomepageProductSectionItem_productId_idx" ON "HomepageProductSectionItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "HomepageProductSectionItem_sectionId_productId_key" ON "HomepageProductSectionItem"("sectionId", "productId");

-- AddForeignKey
ALTER TABLE "HomepageProductSectionItem" ADD CONSTRAINT "HomepageProductSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HomepageProductSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageProductSectionItem" ADD CONSTRAINT "HomepageProductSectionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
