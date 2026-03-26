-- CreateEnum
CREATE TYPE "HomepageSectionType" AS ENUM (
    'hero',
    'product_list',
    'category_list',
    'brand_list',
    'reassurance',
    'newsletter',
    'custom_banner',
    'links_group',
    'social_links',
    'custom_html',
    'rich_text'
);

-- CreateEnum
CREATE TYPE "HomepageProductSourceType" AS ENUM (
    'manual_selection',
    'by_category',
    'by_brand',
    'by_tag',
    'discounted',
    'best_sellers',
    'newest',
    'featured'
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTag" (
    "productId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("productId","tagId")
);

-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "HomepageSectionType" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "layout" TEXT,
    "theme" TEXT,
    "ctaLabel" TEXT,
    "ctaLink" TEXT,
    "limit" INTEGER,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageSectionProduct" (
    "sectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomepageSectionProduct_pkey" PRIMARY KEY ("sectionId","productId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Tag_title_idx" ON "Tag"("title");

-- CreateIndex
CREATE INDEX "ProductTag_tagId_idx" ON "ProductTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "HomepageSection_key_key" ON "HomepageSection"("key");

-- CreateIndex
CREATE INDEX "HomepageSection_isActive_order_idx" ON "HomepageSection"("isActive", "order");

-- CreateIndex
CREATE INDEX "HomepageSection_type_idx" ON "HomepageSection"("type");

-- CreateIndex
CREATE INDEX "HomepageSectionProduct_sectionId_sortOrder_idx" ON "HomepageSectionProduct"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "HomepageSectionProduct_productId_idx" ON "HomepageSectionProduct"("productId");

-- AddForeignKey
ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageSectionProduct" ADD CONSTRAINT "HomepageSectionProduct_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "HomepageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageSectionProduct" ADD CONSTRAINT "HomepageSectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
