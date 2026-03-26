import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultSettings = {
  heroAutoplayMs: 5000,
  featuredCategoriesTitle: "Categories en vedette",
  featuredCategoriesSubtitle: "Retrouvez les univers les plus demandes par nos clientes.",
  promotionsTitle: "Promotions du moment",
  promotionsSubtitle: "Des remises actives sur une selection de produits.",
  bestSellersTitle: "Meilleures ventes",
  bestSellersSubtitle: "Les produits les plus commandes cette semaine.",
  newArrivalsTitle: "Nouveautes",
  newArrivalsSubtitle: "Les derniers ajouts de notre catalogue.",
  brandsTitle: "Marques partenaires",
  brandsSubtitle: "Des marques dermo-cosmetiques reconnues.",
  trustTitle: "Pourquoi commander chez Zayna",
  trustSubtitle: "Des engagements clairs pour une experience d'achat fluide.",
  loyaltyBadge: "Programme fidelite",
  loyaltyTitle: "Cumulez des avantages a chaque commande",
  loyaltyDescription:
    "Activez votre carte fidelite pour debloquer des offres reservees, des remises personnalisees et un suivi sur mesure.",
  loyaltyCtaLabel: "Demander ma carte",
  loyaltyCtaHref: "/#contact",
  loyaltyHighlightText: "Service client disponible 7j/7",
  loyaltyImageUrl: "/carte-fideliteEEEEE.png",
  newsletterTitle: "Restez informee des nouveautes",
  newsletterDescription:
    "Recevez nos conseils beaute, offres et lancements en avant-premiere.",
  newsletterPlaceholder: "Votre adresse e-mail",
  newsletterButtonLabel: "S'abonner",
  newsletterSuccessMessage: "Merci, votre inscription a bien ete prise en compte.",
  newsletterErrorMessage: "Impossible de valider votre inscription pour le moment.",
  featuredCategoriesLimit: 8,
  promotionsLimit: 10,
  bestSellersLimit: 10,
  newArrivalsLimit: 10,
  brandsLimit: 12,
};

async function main() {
  const existingCount = await prisma.homepageSection.count();
  if (existingCount > 0) {
    console.log(`HomepageSection already contains ${existingCount} row(s), skipping backfill.`);
    return;
  }

  const settings =
    (await prisma.storefrontSettings.findUnique({
      where: {
        id: "default",
      },
    })) || defaultSettings;

  const sections = [
    {
      key: "home-hero",
      type: "hero" as const,
      title: "Hero principal",
      subtitle: null,
      order: 0,
      config: {
        autoplayMs: settings.heroAutoplayMs,
      },
      ctaLabel: null,
      ctaLink: null,
      limit: null,
    },
    {
      key: "featured-categories",
      type: "category_list" as const,
      title: settings.featuredCategoriesTitle,
      subtitle: settings.featuredCategoriesSubtitle,
      order: 1,
      config: {
        featuredOnly: true,
      },
      ctaLabel: "Voir tout",
      ctaLink: "/shop",
      limit: settings.featuredCategoriesLimit,
    },
    {
      key: "promotions",
      type: "product_list" as const,
      title: settings.promotionsTitle,
      subtitle: settings.promotionsSubtitle,
      order: 2,
      config: {
        sourceType: "discounted",
        layout: "grid",
        hideIfEmpty: false,
        emptyMessage: "Aucune promotion disponible actuellement.",
      },
      ctaLabel: "Voir les deals",
      ctaLink: "/deal",
      limit: settings.promotionsLimit,
    },
    {
      key: "best-sellers",
      type: "product_list" as const,
      title: settings.bestSellersTitle,
      subtitle: settings.bestSellersSubtitle,
      order: 3,
      config: {
        sourceType: "best_sellers",
        layout: "grid",
        hideIfEmpty: false,
        emptyMessage:
          "Les meilleures ventes apparaitront ici apres les premieres commandes.",
      },
      ctaLabel: null,
      ctaLink: null,
      limit: settings.bestSellersLimit,
    },
    {
      key: "new-arrivals",
      type: "product_list" as const,
      title: settings.newArrivalsTitle,
      subtitle: settings.newArrivalsSubtitle,
      order: 4,
      config: {
        sourceType: "newest",
        layout: "grid",
        hideIfEmpty: false,
        emptyMessage: "Aucune nouveaute n'est disponible pour le moment.",
      },
      ctaLabel: null,
      ctaLink: null,
      limit: settings.newArrivalsLimit,
    },
    {
      key: "brands",
      type: "brand_list" as const,
      title: settings.brandsTitle,
      subtitle: settings.brandsSubtitle,
      order: 5,
      config: {},
      ctaLabel: null,
      ctaLink: null,
      limit: settings.brandsLimit,
    },
    {
      key: "reassurance",
      type: "reassurance" as const,
      title: settings.trustTitle,
      subtitle: settings.trustSubtitle,
      order: 6,
      config: {},
      ctaLabel: null,
      ctaLink: null,
      limit: null,
    },
    {
      key: "loyalty-banner",
      type: "custom_banner" as const,
      title: settings.loyaltyTitle,
      subtitle: settings.loyaltyDescription,
      order: 7,
      config: {
        badge: settings.loyaltyBadge,
        title: settings.loyaltyTitle,
        description: settings.loyaltyDescription,
        ctaLabel: settings.loyaltyCtaLabel,
        ctaHref: settings.loyaltyCtaHref,
        highlightText: settings.loyaltyHighlightText,
        imageUrl: settings.loyaltyImageUrl,
      },
      ctaLabel: settings.loyaltyCtaLabel,
      ctaLink: settings.loyaltyCtaHref,
      limit: null,
    },
    {
      key: "newsletter",
      type: "newsletter" as const,
      title: settings.newsletterTitle,
      subtitle: settings.newsletterDescription,
      order: 8,
      config: {
        placeholder: settings.newsletterPlaceholder,
        buttonLabel: settings.newsletterButtonLabel,
        successMessage: settings.newsletterSuccessMessage,
        errorMessage: settings.newsletterErrorMessage,
      },
      ctaLabel: null,
      ctaLink: null,
      limit: null,
    },
    {
      key: "footer-quick-links",
      type: "links_group" as const,
      title: "Liens utiles",
      subtitle: "Retrouvez les pages importantes de la boutique.",
      order: 9,
      config: {
        group: "footer_quick",
      },
      ctaLabel: null,
      ctaLink: null,
      limit: 6,
    },
    {
      key: "social-links",
      type: "social_links" as const,
      title: "Suivez-nous",
      subtitle: "Retrouvez Zayna sur nos reseaux sociaux.",
      order: 10,
      config: {},
      ctaLabel: null,
      ctaLink: null,
      limit: 6,
    },
  ];

  for (const section of sections) {
    await prisma.homepageSection.create({
      data: {
        key: section.key,
        type: section.type,
        title: section.title,
        subtitle: section.subtitle,
        isActive: true,
        order: section.order,
        ctaLabel: section.ctaLabel,
        ctaLink: section.ctaLink,
        limit: section.limit,
        config: section.config,
      },
    });
  }

  console.log(`Backfilled ${sections.length} homepage sections.`);
}

main()
  .catch((error) => {
    console.error("Homepage sections backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
