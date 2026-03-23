-- CreateEnum
CREATE TYPE "SiteLinkGroup" AS ENUM ('header', 'footer_quick', 'footer_legal');

-- CreateTable
CREATE TABLE "StorefrontSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "announcementEnabled" BOOLEAN NOT NULL DEFAULT true,
    "announcementText" TEXT NOT NULL DEFAULT 'Livraison gratuite partout au Maroc des 299 MAD d''achat.',
    "announcementHref" TEXT,
    "heroAutoplayMs" INTEGER NOT NULL DEFAULT 5000,
    "featuredCategoriesTitle" TEXT NOT NULL DEFAULT 'Categories en vedette',
    "featuredCategoriesSubtitle" TEXT NOT NULL DEFAULT 'Retrouvez les univers les plus demandes par nos clientes.',
    "promotionsTitle" TEXT NOT NULL DEFAULT 'Promotions du moment',
    "promotionsSubtitle" TEXT NOT NULL DEFAULT 'Des remises actives sur une selection de produits.',
    "bestSellersTitle" TEXT NOT NULL DEFAULT 'Meilleures ventes',
    "bestSellersSubtitle" TEXT NOT NULL DEFAULT 'Les produits les plus commandes cette semaine.',
    "newArrivalsTitle" TEXT NOT NULL DEFAULT 'Nouveautes',
    "newArrivalsSubtitle" TEXT NOT NULL DEFAULT 'Les derniers ajouts de notre catalogue.',
    "brandsTitle" TEXT NOT NULL DEFAULT 'Marques partenaires',
    "brandsSubtitle" TEXT NOT NULL DEFAULT 'Des marques dermo-cosmetiques reconnues.',
    "trustTitle" TEXT NOT NULL DEFAULT 'Pourquoi commander chez Zayna',
    "trustSubtitle" TEXT NOT NULL DEFAULT 'Des engagements clairs pour une experience d''achat fluide.',
    "loyaltyBadge" TEXT NOT NULL DEFAULT 'Programme fidelite',
    "loyaltyTitle" TEXT NOT NULL DEFAULT 'Cumulez des avantages a chaque commande',
    "loyaltyDescription" TEXT NOT NULL DEFAULT 'Activez votre carte fidelite pour debloquer des offres reservees, des remises personnalisees et un suivi sur mesure.',
    "loyaltyCtaLabel" TEXT NOT NULL DEFAULT 'Demander ma carte',
    "loyaltyCtaHref" TEXT NOT NULL DEFAULT '/#contact',
    "loyaltyHighlightText" TEXT NOT NULL DEFAULT 'Service client disponible 7j/7',
    "loyaltyImageUrl" TEXT,
    "newsletterTitle" TEXT NOT NULL DEFAULT 'Restez informee des nouveautes',
    "newsletterDescription" TEXT NOT NULL DEFAULT 'Recevez nos conseils beaute, offres et lancements en avant-premiere.',
    "newsletterPlaceholder" TEXT NOT NULL DEFAULT 'Votre adresse e-mail',
    "newsletterButtonLabel" TEXT NOT NULL DEFAULT 'S''abonner',
    "newsletterSuccessMessage" TEXT NOT NULL DEFAULT 'Merci, votre inscription a bien ete prise en compte.',
    "newsletterErrorMessage" TEXT NOT NULL DEFAULT 'Impossible de valider votre inscription pour le moment.',
    "footerAboutTitle" TEXT NOT NULL DEFAULT 'A propos de Zayna',
    "footerAboutDescription" TEXT NOT NULL DEFAULT 'Votre parapharmacie en ligne pour une routine beaute et bien-etre complete.',
    "footerQuickLinksTitle" TEXT NOT NULL DEFAULT 'Liens rapides',
    "footerLegalLinksTitle" TEXT NOT NULL DEFAULT 'Informations legales',
    "footerCategoriesTitle" TEXT NOT NULL DEFAULT 'Categories',
    "footerContactPhone" TEXT,
    "footerContactEmail" TEXT,
    "footerContactHours" TEXT,
    "footerCopyrightText" TEXT NOT NULL DEFAULT 'ZAYNA. Tous droits reserves.',
    "featuredCategoriesLimit" INTEGER NOT NULL DEFAULT 8,
    "promotionsLimit" INTEGER NOT NULL DEFAULT 10,
    "bestSellersLimit" INTEGER NOT NULL DEFAULT 10,
    "newArrivalsLimit" INTEGER NOT NULL DEFAULT 10,
    "brandsLimit" INTEGER NOT NULL DEFAULT 12,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeHeroSlide" (
    "id" TEXT NOT NULL,
    "badge" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "imageUrl" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeHeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeTrustItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeTrustItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteLink" (
    "id" TEXT NOT NULL,
    "group" "SiteLinkGroup" NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSocialLink" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeHeroSlide_isActive_sortOrder_idx" ON "HomeHeroSlide"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "HomeTrustItem_isActive_sortOrder_idx" ON "HomeTrustItem"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "SiteLink_group_sortOrder_idx" ON "SiteLink"("group", "sortOrder");

-- CreateIndex
CREATE INDEX "SiteSocialLink_sortOrder_idx" ON "SiteSocialLink"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_email_key" ON "NewsletterSubscription"("email");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_isActive_createdAt_idx" ON "NewsletterSubscription"("isActive", "createdAt");
