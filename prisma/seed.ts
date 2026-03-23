import {
  PaymentMethod,
  PrismaClient,
  ProductStatus,
  PromoDiscountType,
  SiteLinkGroup,
} from "@prisma/client";

const prisma = new PrismaClient();

const assetUrl = (folder: "products" | "brands" | "banner", file: string) =>
  `/api/assets/${folder}/${file}`;

const categorySeed = [
  {
    title: "PROMOS",
    slug: "promos",
    description: "Une selection de produits a prix doux pour vos routines du moment.",
    range: 49,
    featured: true,
    imageUrl: assetUrl("products", "product_1.png"),
  },
  {
    title: "Visage",
    slug: "visage",
    description: "Nettoyants, serums et soins experts pour une peau eclatante.",
    range: 59,
    featured: true,
    imageUrl: assetUrl("products", "product_2.png"),
  },
  {
    title: "Corps",
    slug: "corps",
    description: "Hydratation, nutrition et confort pour le soin quotidien du corps.",
    range: 39,
    featured: true,
    imageUrl: assetUrl("products", "product_8.png"),
  },
  {
    title: "Solaire",
    slug: "solaire",
    description: "Protections SPF et soins apres-soleil pour toute la famille.",
    range: 79,
    featured: true,
    imageUrl: assetUrl("products", "product_4.png"),
  },
  {
    title: "Cheveux",
    slug: "cheveux",
    description: "Shampooings, soins ciblés et routines capillaires apaisantes.",
    range: 55,
    featured: false,
    imageUrl: assetUrl("products", "product_6.png"),
  },
  {
    title: "Bucco-Dentaire",
    slug: "bucco-dentaire",
    description: "Dentifrices, bains de bouche et accessoires de soin dentaire.",
    range: 29,
    featured: false,
    imageUrl: assetUrl("products", "product_11.png"),
  },
  {
    title: "Maquillage",
    slug: "maquillage",
    description: "Formules confort et teints naturels pour le quotidien.",
    range: 69,
    featured: false,
    imageUrl: assetUrl("products", "product_13.png"),
  },
];

const brandSeed = [
  {
    title: "A-Derma",
    slug: "a-derma",
    description: "Soins reconfortants pour les peaux fragiles.",
    imageUrl: assetUrl("brands", "brand_1.png"),
  },
  {
    title: "Bioderma",
    slug: "bioderma",
    description: "Expertise dermocosmetique pour les routines sensibles.",
    imageUrl: assetUrl("brands", "brand_2.png"),
  },
  {
    title: "CeraVe",
    slug: "cerave",
    description: "Hydratation et barriere cutanee au quotidien.",
    imageUrl: assetUrl("brands", "brand_3.png"),
  },
  {
    title: "Ducray",
    slug: "ducray",
    description: "Solutions capillaires et soins de l'equilibre cutane.",
    imageUrl: assetUrl("brands", "brand_4.png"),
  },
  {
    title: "Eucerin",
    slug: "eucerin",
    description: "Soins dermatologiques a l'efficacite reconnue.",
    imageUrl: assetUrl("brands", "brand_5.png"),
  },
  {
    title: "Filorga",
    slug: "filorga",
    description: "Routines eclat et anti-age inspirees de la medecine esthetique.",
    imageUrl: assetUrl("brands", "brand_6.png"),
  },
  {
    title: "ISDIN",
    slug: "isdin",
    description: "Protection solaire et soin technique nouvelle generation.",
    imageUrl: assetUrl("brands", "brand_7.png"),
  },
  {
    title: "Mustela",
    slug: "mustela",
    description: "Soins doux pour les peaux delicatement exigeantes.",
    imageUrl: assetUrl("brands", "brand_8.png"),
  },
  {
    title: "Nuxe",
    slug: "nuxe",
    description: "Textures sensorielles et bien-etre du quotidien.",
    imageUrl: assetUrl("brands", "brand_9.png"),
  },
  {
    title: "SVR",
    slug: "svr",
    description: "Formules dermatologiques adaptees aux peaux reactivites.",
    imageUrl: assetUrl("brands", "brand_10.png"),
  },
  {
    title: "Uriage",
    slug: "uriage",
    description: "Hydratation thermale et confort longue duree.",
    imageUrl: assetUrl("brands", "brand_11.png"),
  },
  {
    title: "Vichy",
    slug: "vichy",
    description: "Soin expert et routines revitalisantes pour le visage et le corps.",
    imageUrl: assetUrl("brands", "brand_12.png"),
  },
];

type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  stock: number;
  status: ProductStatus;
  isFeatured: boolean;
  brandSlug: string;
  categorySlugs: string[];
  imageFiles: string[];
};

type PromoSeed = {
  title: string;
  code: string;
  active: boolean;
  discountType: PromoDiscountType;
  discountValue: number;
  minimumOrderAmount: number;
  allowedPaymentMethods: PaymentMethod[];
  usageLimit: number;
  usedCount: number;
};

const productSeed: ProductSeed[] = [
  {
    name: "Serum Hydratant Intensif",
    slug: "serum-hydratant-intensif",
    description: "Un serum leger qui aide a repulper la peau et a maintenir son confort toute la journee.",
    price: 129,
    discount: 10,
    stock: 24,
    status: "hot",
    isFeatured: true,
    brandSlug: "cerave",
    categorySlugs: ["visage", "promos"],
    imageFiles: ["product_1.png", "product_2.png"],
  },
  {
    name: "Creme Reparatrice Visage",
    slug: "creme-reparatrice-visage",
    description: "Une creme quotidienne riche en actifs apaisants pour renforcer la barriere cutanee.",
    price: 149,
    discount: 0,
    stock: 18,
    status: "new",
    isFeatured: true,
    brandSlug: "eucerin",
    categorySlugs: ["visage"],
    imageFiles: ["product_2.png", "product_3.png"],
  },
  {
    name: "Gel Nettoyant Apaisant",
    slug: "gel-nettoyant-apaisant",
    description: "Nettoie sans dessécher et laisse une sensation de peau nette et confortable.",
    price: 89,
    discount: 5,
    stock: 32,
    status: "sale",
    isFeatured: false,
    brandSlug: "bioderma",
    categorySlugs: ["visage", "promos"],
    imageFiles: ["product_3.png", "product_4.png"],
  },
  {
    name: "Spray Solaire SPF50",
    slug: "spray-solaire-spf50",
    description: "Protection large spectre au fini leger pour les sorties ensoleillees.",
    price: 179,
    discount: 12,
    stock: 21,
    status: "hot",
    isFeatured: true,
    brandSlug: "isdin",
    categorySlugs: ["solaire", "promos"],
    imageFiles: ["product_4.png", "product_5.png"],
  },
  {
    name: "Lait Solaire Famille",
    slug: "lait-solaire-famille",
    description: "Texture confortable et resistance a l'eau pour la protection des peaux sensibles.",
    price: 169,
    discount: 0,
    stock: 17,
    status: "new",
    isFeatured: false,
    brandSlug: "mustela",
    categorySlugs: ["solaire"],
    imageFiles: ["product_5.png", "product_6.png"],
  },
  {
    name: "Shampooing Fortifiant Doux",
    slug: "shampooing-fortifiant-doux",
    description: "Nettoie le cuir chevelu en douceur et accompagne les cheveux fragilises.",
    price: 95,
    discount: 8,
    stock: 28,
    status: "new",
    isFeatured: false,
    brandSlug: "ducray",
    categorySlugs: ["cheveux"],
    imageFiles: ["product_6.png", "product_7.png"],
  },
  {
    name: "Masque Capillaire Nutritif",
    slug: "masque-capillaire-nutritif",
    description: "Un soin riche qui nourrit les longueurs sans alourdir la fibre.",
    price: 119,
    discount: 0,
    stock: 16,
    status: "sale",
    isFeatured: false,
    brandSlug: "nuxe",
    categorySlugs: ["cheveux", "promos"],
    imageFiles: ["product_7.png", "product_8.png"],
  },
  {
    name: "Huile Seche Corps",
    slug: "huile-seche-corps",
    description: "Huile satinée multi-usage pour nourrir la peau et sublimer son eclat.",
    price: 139,
    discount: 10,
    stock: 22,
    status: "sale",
    isFeatured: true,
    brandSlug: "nuxe",
    categorySlugs: ["corps", "promos"],
    imageFiles: ["product_8.png", "product_9.png"],
  },
  {
    name: "Lait Corporel Relipidant",
    slug: "lait-corporel-relipidant",
    description: "Aide a retrouver souplesse et confort apres la douche.",
    price: 109,
    discount: 0,
    stock: 30,
    status: "new",
    isFeatured: false,
    brandSlug: "uriage",
    categorySlugs: ["corps"],
    imageFiles: ["product_9.png", "product_10.png"],
  },
  {
    name: "Creme Mains Reparatrice",
    slug: "creme-mains-reparatrice",
    description: "Formule cocon pour les mains seches exposees aux agressions quotidiennes.",
    price: 59,
    discount: 15,
    stock: 40,
    status: "sale",
    isFeatured: false,
    brandSlug: "a-derma",
    categorySlugs: ["corps", "promos"],
    imageFiles: ["product_10.png", "product_11.png"],
  },
  {
    name: "Dentifrice Sensibilite Confort",
    slug: "dentifrice-sensibilite-confort",
    description: "Aide a proteger les dents sensibles et a maintenir une haleine fraiche.",
    price: 35,
    discount: 0,
    stock: 45,
    status: "new",
    isFeatured: false,
    brandSlug: "svr",
    categorySlugs: ["bucco-dentaire"],
    imageFiles: ["product_11.png", "product_12.png"],
  },
  {
    name: "Bain de Bouche Fraicheur",
    slug: "bain-de-bouche-fraicheur",
    description: "Complete la routine bucco-dentaire avec une sensation de propre durable.",
    price: 42,
    discount: 5,
    stock: 36,
    status: "sale",
    isFeatured: false,
    brandSlug: "vichy",
    categorySlugs: ["bucco-dentaire", "promos"],
    imageFiles: ["product_12.png", "product_13.png"],
  },
  {
    name: "Mascara Volume Souple",
    slug: "mascara-volume-souple",
    description: "Un mascara confortable au rendu defini pour un regard naturel et intense.",
    price: 119,
    discount: 10,
    stock: 19,
    status: "hot",
    isFeatured: true,
    brandSlug: "filorga",
    categorySlugs: ["maquillage", "promos"],
    imageFiles: ["product_13.png", "product_14.png"],
  },
  {
    name: "BB Cream Eclat Naturel",
    slug: "bb-cream-eclat-naturel",
    description: "Unifie le teint, hydrate et laisse un fini naturel au quotidien.",
    price: 149,
    discount: 0,
    stock: 14,
    status: "new",
    isFeatured: false,
    brandSlug: "vichy",
    categorySlugs: ["maquillage"],
    imageFiles: ["product_14.png", "product_15.png"],
  },
  {
    name: "Rouge a Levres Satin Confort",
    slug: "rouge-a-levres-satin-confort",
    description: "Une texture souple et lumineuse qui colore les levres sans les dessécher.",
    price: 99,
    discount: 0,
    stock: 26,
    status: "new",
    isFeatured: false,
    brandSlug: "mustela",
    categorySlugs: ["maquillage"],
    imageFiles: ["product_15.png", "product_16.png"],
  },
  {
    name: "Gel Anti-Imperfections",
    slug: "gel-anti-imperfections",
    description: "Soin ciblé pour aider a reduire l'aspect des imperfections et des brillances.",
    price: 119,
    discount: 7,
    stock: 27,
    status: "hot",
    isFeatured: true,
    brandSlug: "svr",
    categorySlugs: ["visage", "promos"],
    imageFiles: ["product_16.png", "product_17.png"],
  },
  {
    name: "Serum Vitamine C Eclat",
    slug: "serum-vitamine-c-eclat",
    description: "Illumine le teint et aide a lisser visiblement la peau terne.",
    price: 189,
    discount: 0,
    stock: 12,
    status: "new",
    isFeatured: true,
    brandSlug: "filorga",
    categorySlugs: ["visage"],
    imageFiles: ["product_17.png", "product_18.png"],
  },
  {
    name: "Creme Anti-Age Nuit",
    slug: "creme-anti-age-nuit",
    description: "Soin enveloppant pour accompagner le renouvellement cutane nocturne.",
    price: 239,
    discount: 12,
    stock: 9,
    status: "sale",
    isFeatured: false,
    brandSlug: "filorga",
    categorySlugs: ["visage", "promos"],
    imageFiles: ["product_18.png", "product_19.png"],
  },
  {
    name: "Stick Solaire Zones Sensibles",
    slug: "stick-solaire-zones-sensibles",
    description: "Protection pratique pour les levres, le nez et les zones exposées.",
    price: 89,
    discount: 0,
    stock: 23,
    status: "new",
    isFeatured: false,
    brandSlug: "isdin",
    categorySlugs: ["solaire"],
    imageFiles: ["product_19.png", "product_20.png"],
  },
  {
    name: "Shampooing Antipelliculaire Doux",
    slug: "shampooing-antipelliculaire-doux",
    description: "Purifie le cuir chevelu tout en respectant son equilibre.",
    price: 105,
    discount: 9,
    stock: 20,
    status: "hot",
    isFeatured: false,
    brandSlug: "ducray",
    categorySlugs: ["cheveux", "promos"],
    imageFiles: ["product_20.png", "product_21.png"],
  },
  {
    name: "Gel Douche Surgras",
    slug: "gel-douche-surgras",
    description: "Nettoie la peau en douceur avec un parfum discret et une mousse confortable.",
    price: 49,
    discount: 0,
    stock: 34,
    status: "new",
    isFeatured: false,
    brandSlug: "uriage",
    categorySlugs: ["corps"],
    imageFiles: ["product_21.png", "product_22.png"],
  },
  {
    name: "Baume a Levres Reparateur",
    slug: "baume-a-levres-reparateur",
    description: "Apaise immediatement et aide a nourrir les levres seches.",
    price: 39,
    discount: 5,
    stock: 44,
    status: "sale",
    isFeatured: false,
    brandSlug: "a-derma",
    categorySlugs: ["visage", "promos"],
    imageFiles: ["product_22.png", "product_23.png"],
  },
  {
    name: "Poudre Compacte Matifiante",
    slug: "poudre-compacte-matifiante",
    description: "Fixe le teint et aide a controler l'exces de brillance sans effet masque.",
    price: 129,
    discount: 0,
    stock: 15,
    status: "new",
    isFeatured: false,
    brandSlug: "bioderma",
    categorySlugs: ["maquillage"],
    imageFiles: ["product_23.png", "product_24.png"],
  },
  {
    name: "Brossettes Interdentaires Soin",
    slug: "brossettes-interdentaires-soin",
    description: "Accessoires pratiques pour completer la routine d'hygiene bucco-dentaire.",
    price: 27,
    discount: 0,
    stock: 52,
    status: "new",
    isFeatured: false,
    brandSlug: "vichy",
    categorySlugs: ["bucco-dentaire"],
    imageFiles: ["product_24.png", "product_1.png"],
  },
];

const promoSeed: PromoSeed[] = [
  {
    title: "Bienvenue 10%",
    code: "BIENVENUE10",
    active: true,
    discountType: PromoDiscountType.percentage,
    discountValue: 10,
    minimumOrderAmount: 150,
    allowedPaymentMethods: [
      PaymentMethod.cod,
      PaymentMethod.cmi_card,
      PaymentMethod.installments,
    ],
    usageLimit: 500,
    usedCount: 0,
  },
  {
    title: "Flash Promo 25 MAD",
    code: "FLASH25",
    active: true,
    discountType: PromoDiscountType.fixed,
    discountValue: 25,
    minimumOrderAmount: 220,
    allowedPaymentMethods: [
      PaymentMethod.cmi_card,
      PaymentMethod.installments,
    ],
    usageLimit: 250,
    usedCount: 0,
  },
  {
    title: "Livraison COD 5%",
    code: "COD5",
    active: true,
    discountType: PromoDiscountType.percentage,
    discountValue: 5,
    minimumOrderAmount: 100,
    allowedPaymentMethods: [PaymentMethod.cod],
    usageLimit: 300,
    usedCount: 0,
  },
];

const storefrontSettingsSeed = {
  id: "default",
  announcementEnabled: true,
  announcementText:
    "Livraison offerte a partir de 299 MAD et paiement a la livraison disponible.",
  announcementHref: "/shop",
  featuredCategoriesTitle: "Nos categories favorites",
  featuredCategoriesSubtitle:
    "Des rayons clairs pour trouver rapidement les soins adaptes a vos besoins.",
  promotionsTitle: "Offres et promotions",
  promotionsSubtitle:
    "Une selection de produits avec remises actives et stock mis a jour en temps reel.",
  bestSellersTitle: "Produits les plus commandes",
  bestSellersSubtitle:
    "Les references les plus appreciees par nos clientes cette periode.",
  newArrivalsTitle: "Nouveautes Zayna",
  newArrivalsSubtitle:
    "Decouvrez les derniers ajouts valides par notre equipe.",
  brandsTitle: "Acheter par marque",
  brandsSubtitle: "Retrouvez toutes vos marques preferees au meme endroit.",
  trustTitle: "Pourquoi choisir Zayna",
  trustSubtitle:
    "Un accompagnement fiable, une logistique rapide et un service humain.",
  loyaltyBadge: "Carte fidelite",
  loyaltyTitle: "Cumulez des avantages exclusifs",
  loyaltyDescription:
    "Demandez votre carte fidelite et beneficiez d'offres reservees, de points cumules et de conseils personnalises.",
  loyaltyCtaLabel: "Demander ma carte",
  loyaltyCtaHref: "/#contact",
  loyaltyHighlightText: "Conseilleres disponibles 7j/7 pour vous accompagner.",
  loyaltyImageUrl: "/carte-fideliteEEEEE.png",
  newsletterTitle: "Rejoignez la communaute Zayna",
  newsletterDescription:
    "Recevez nos offres en avant-premiere, nos conseils routine et nos lancements produits.",
  newsletterPlaceholder: "Saisissez votre e-mail",
  newsletterButtonLabel: "Je m'inscris",
  newsletterSuccessMessage:
    "Merci. Votre inscription newsletter est confirmee.",
  newsletterErrorMessage:
    "Une erreur est survenue. Merci de reessayer dans quelques instants.",
  footerAboutTitle: "Zayna Parapharmacie",
  footerAboutDescription:
    "Produits dermo-cosmetiques, routines et conseils pour prendre soin de vous au quotidien.",
  footerQuickLinksTitle: "Navigation",
  footerLegalLinksTitle: "Pages legales",
  footerCategoriesTitle: "Categories populaires",
  footerContactPhone: "+212 6 12 34 56 78",
  footerContactEmail: "contact@zayna.ma",
  footerContactHours: "Lun-Sam : 9h00 - 20h00",
  footerCopyrightText: "ZAYNA. Tous droits reserves.",
  featuredCategoriesLimit: 8,
  promotionsLimit: 10,
  bestSellersLimit: 10,
  newArrivalsLimit: 10,
  brandsLimit: 12,
  heroAutoplayMs: 5200,
};

const heroSlidesSeed = [
  {
    badge: "Nouveautes beaute",
    title: "Vos essentiels para, livres en 24/48h",
    subtitle:
      "Des soins visage, corps et cheveux soigneusement selectionnes avec des prix transparents.",
    ctaLabel: "Explorer la boutique",
    ctaHref: "/shop",
    imageUrl: assetUrl("banner", "banner_1.webp"),
    altText: "Produits para et beaute Zayna",
    sortOrder: 0,
    isActive: true,
  },
  {
    badge: "Promotions actives",
    title: "Jusqu'a -25% sur vos routines du moment",
    subtitle:
      "Profitez d'offres limites sur les references les plus recherchees de notre catalogue.",
    ctaLabel: "Voir les promotions",
    ctaHref: "/deal",
    imageUrl: assetUrl("products", "product_17.png"),
    altText: "Produits en promotion",
    sortOrder: 1,
    isActive: true,
  },
  {
    badge: "Programme fidelite",
    title: "Cumulez des points des votre premiere commande",
    subtitle:
      "Inscrivez-vous et recevez des avantages personnalises adaptes a vos achats.",
    ctaLabel: "Activer ma fidelite",
    ctaHref: "/#contact",
    imageUrl: "/carte-fideliteEEEEE.png",
    altText: "Carte fidelite Zayna",
    sortOrder: 2,
    isActive: true,
  },
];

const trustItemsSeed = [
  {
    title: "Livraison rapide",
    description: "Expedition partout au Maroc avec suivi en temps reel.",
    icon: "truck",
    sortOrder: 0,
    isActive: true,
  },
  {
    title: "Produits verifies",
    description: "Catalogue controle et references de marques reconnues.",
    icon: "shield",
    sortOrder: 1,
    isActive: true,
  },
  {
    title: "Support dedie",
    description: "Une equipe a l'ecoute avant et apres votre commande.",
    icon: "headset",
    sortOrder: 2,
    isActive: true,
  },
  {
    title: "Paiement flexible",
    description: "Carte bancaire, paiement a la livraison ou en plusieurs fois.",
    icon: "wallet",
    sortOrder: 3,
    isActive: true,
  },
];

const siteLinksSeed = [
  {
    group: SiteLinkGroup.header,
    title: "Accueil",
    href: "/",
    sortOrder: 0,
    openInNewTab: false,
  },
  {
    group: SiteLinkGroup.header,
    title: "Boutique",
    href: "/shop",
    sortOrder: 1,
    openInNewTab: false,
  },
  {
    group: SiteLinkGroup.header,
    title: "Promotions",
    href: "/deal",
    sortOrder: 2,
    openInNewTab: false,
  },
  {
    group: SiteLinkGroup.header,
    title: "Contact",
    href: "/#contact",
    sortOrder: 3,
    openInNewTab: false,
  },
  {
    group: SiteLinkGroup.footer_quick,
    title: "A propos",
    href: "/about",
    sortOrder: 0,
    openInNewTab: false,
  },
  {
    group: SiteLinkGroup.footer_quick,
    title: "Contactez-nous",
    href: "/#contact",
    sortOrder: 1,
    openInNewTab: false,
  },
  {
    group: SiteLinkGroup.footer_quick,
    title: "Boutique",
    href: "/shop",
    sortOrder: 2,
    openInNewTab: false,
  },
  {
    group: SiteLinkGroup.footer_legal,
    title: "Conditions generales",
    href: "/terms",
    sortOrder: 0,
    openInNewTab: false,
  },
  {
    group: SiteLinkGroup.footer_legal,
    title: "Politique de confidentialite",
    href: "/privacy",
    sortOrder: 1,
    openInNewTab: false,
  },
];

const socialLinksSeed = [
  {
    platform: "facebook",
    title: "Facebook",
    href: "https://www.facebook.com/",
    sortOrder: 0,
    openInNewTab: true,
  },
  {
    platform: "instagram",
    title: "Instagram",
    href: "https://www.instagram.com/",
    sortOrder: 1,
    openInNewTab: true,
  },
  {
    platform: "tiktok",
    title: "TikTok",
    href: "https://www.tiktok.com/",
    sortOrder: 2,
    openInNewTab: true,
  },
];

async function main() {
  await prisma.newsletterSubscription.deleteMany();
  await prisma.siteSocialLink.deleteMany();
  await prisma.siteLink.deleteMany();
  await prisma.homeTrustItem.deleteMany();
  await prisma.homeHeroSlide.deleteMany();
  await prisma.storefrontSettings.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.promoCode.deleteMany();

  const categoryIds = new Map<string, string>();
  for (const category of categorySeed) {
    const created = await prisma.category.create({
      data: category,
    });
    categoryIds.set(category.slug, created.id);
  }

  const brandIds = new Map<string, string>();
  for (const brand of brandSeed) {
    const created = await prisma.brand.create({
      data: brand,
    });
    brandIds.set(brand.slug, created.id);
  }

  for (const product of productSeed) {
    const brandId = brandIds.get(product.brandSlug);
    if (!brandId) {
      throw new Error(`Missing brand for ${product.slug}`);
    }

    const categoryConnections = product.categorySlugs.map((slug) => {
      const categoryId = categoryIds.get(slug);
      if (!categoryId) {
        throw new Error(`Missing category for ${product.slug}`);
      }

      return {
        categoryId,
      };
    });

    await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        sku: product.slug.toUpperCase(),
        description: product.description,
        price: product.price,
        regularPrice:
          product.discount > 0
            ? Number((product.price + (product.discount * product.price) / 100).toFixed(2))
            : product.price,
        salePrice: product.discount > 0 ? product.price : null,
        discount: product.discount,
        stock: product.stock,
        status: product.status,
        isFeatured: product.isFeatured,
        brandId,
        images: {
          create: product.imageFiles.map((file, index) => ({
            url: assetUrl("products", file),
            altText: product.name,
            sortOrder: index,
          })),
        },
        categories: {
          create: categoryConnections,
        },
      },
    });
  }

  for (const promo of promoSeed) {
    await prisma.promoCode.create({
      data: {
        title: promo.title,
        code: promo.code,
        active: promo.active,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minimumOrderAmount: promo.minimumOrderAmount,
        allowedPaymentMethods: [...promo.allowedPaymentMethods],
        usageLimit: promo.usageLimit,
        usedCount: promo.usedCount,
      },
    });
  }

  await prisma.storefrontSettings.create({
    data: storefrontSettingsSeed,
  });

  for (const slide of heroSlidesSeed) {
    await prisma.homeHeroSlide.create({
      data: slide,
    });
  }

  for (const item of trustItemsSeed) {
    await prisma.homeTrustItem.create({
      data: item,
    });
  }

  for (const link of siteLinksSeed) {
    await prisma.siteLink.create({
      data: link,
    });
  }

  for (const socialLink of socialLinksSeed) {
    await prisma.siteSocialLink.create({
      data: socialLink,
    });
  }

  console.log(
    `Seeded ${categorySeed.length} categories, ${brandSeed.length} brands, ${productSeed.length} products, ${promoSeed.length} promo codes, ${heroSlidesSeed.length} hero slides, ${trustItemsSeed.length} trust items, ${siteLinksSeed.length} site links, and ${socialLinksSeed.length} social links.`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
