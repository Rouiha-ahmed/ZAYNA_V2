-- Repair migration for admin homepage builder/product sections.
-- Safe to run even if objects already exist.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HomepageSectionType') THEN
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
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HomepageProductSourceType') THEN
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
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Tag" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductTag" (
  "productId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("productId", "tagId")
);

CREATE TABLE IF NOT EXISTS "HomepageSection" (
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

CREATE TABLE IF NOT EXISTS "HomepageSectionProduct" (
  "sectionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomepageSectionProduct_pkey" PRIMARY KEY ("sectionId", "productId")
);

CREATE TABLE IF NOT EXISTS "HomepageProductSection" (
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

CREATE TABLE IF NOT EXISTS "HomepageProductSectionItem" (
  "id" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HomepageProductSectionItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tag_slug_key" ON "Tag"("slug");
CREATE INDEX IF NOT EXISTS "Tag_title_idx" ON "Tag"("title");

CREATE INDEX IF NOT EXISTS "ProductTag_tagId_idx" ON "ProductTag"("tagId");

CREATE UNIQUE INDEX IF NOT EXISTS "HomepageSection_key_key" ON "HomepageSection"("key");
CREATE INDEX IF NOT EXISTS "HomepageSection_isActive_order_idx" ON "HomepageSection"("isActive", "order");
CREATE INDEX IF NOT EXISTS "HomepageSection_type_idx" ON "HomepageSection"("type");

CREATE INDEX IF NOT EXISTS "HomepageSectionProduct_sectionId_sortOrder_idx" ON "HomepageSectionProduct"("sectionId", "sortOrder");
CREATE INDEX IF NOT EXISTS "HomepageSectionProduct_productId_idx" ON "HomepageSectionProduct"("productId");

CREATE UNIQUE INDEX IF NOT EXISTS "HomepageProductSection_slug_key" ON "HomepageProductSection"("slug");
CREATE INDEX IF NOT EXISTS "HomepageProductSection_isActive_order_idx" ON "HomepageProductSection"("isActive", "order");

CREATE UNIQUE INDEX IF NOT EXISTS "HomepageProductSectionItem_sectionId_productId_key" ON "HomepageProductSectionItem"("sectionId", "productId");
CREATE INDEX IF NOT EXISTS "HomepageProductSectionItem_sectionId_order_idx" ON "HomepageProductSectionItem"("sectionId", "order");
CREATE INDEX IF NOT EXISTS "HomepageProductSectionItem_productId_idx" ON "HomepageProductSectionItem"("productId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductTag_productId_fkey') THEN
    ALTER TABLE "ProductTag"
      ADD CONSTRAINT "ProductTag_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductTag_tagId_fkey') THEN
    ALTER TABLE "ProductTag"
      ADD CONSTRAINT "ProductTag_tagId_fkey"
      FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'HomepageSectionProduct_sectionId_fkey') THEN
    ALTER TABLE "HomepageSectionProduct"
      ADD CONSTRAINT "HomepageSectionProduct_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "HomepageSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'HomepageSectionProduct_productId_fkey') THEN
    ALTER TABLE "HomepageSectionProduct"
      ADD CONSTRAINT "HomepageSectionProduct_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'HomepageProductSectionItem_sectionId_fkey') THEN
    ALTER TABLE "HomepageProductSectionItem"
      ADD CONSTRAINT "HomepageProductSectionItem_sectionId_fkey"
      FOREIGN KEY ("sectionId") REFERENCES "HomepageProductSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'HomepageProductSectionItem_productId_fkey') THEN
    ALTER TABLE "HomepageProductSectionItem"
      ADD CONSTRAINT "HomepageProductSectionItem_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
