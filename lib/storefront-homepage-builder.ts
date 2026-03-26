import { Prisma } from "@prisma/client";

import {
  parseProductSectionConfig,
  parseSectionConfigObject,
  type HomepageDynamicSection,
  type StorefrontRenderableLink,
  type StorefrontRenderableSocialLink,
} from "@/lib/homepage-sections";
import { mapBrand, mapCategory, mapProduct } from "@/lib/data/mappers";
import { prisma } from "@/lib/prisma";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  discount: true,
  stock: true,
  status: true,
  isActive: true,
  isFeatured: true,
  images: {
    orderBy: {
      sortOrder: "asc" as const,
    },
    select: {
      id: true,
      url: true,
      altText: true,
    },
  },
  brand: {
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      imageUrl: true,
    },
  },
  categories: {
    include: {
      category: {
        select: {
          title: true,
        },
      },
    },
  },
};

type ProductRecord = Prisma.ProductGetPayload<{
  select: typeof productSelect;
}>;

type HomepageBuilderSettings = {
  heroAutoplayMs: number;
  featuredCategoriesLimit: number;
  promotionsLimit: number;
  bestSellersLimit: number;
  newArrivalsLimit: number;
  brandsLimit: number;
  loyaltyBadge: string;
  loyaltyTitle: string;
  loyaltyDescription: string;
  loyaltyCtaLabel: string;
  loyaltyCtaHref: string;
  loyaltyHighlightText: string;
  loyaltyImageUrl: string | null;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterPlaceholder: string;
  newsletterButtonLabel: string;
  newsletterSuccessMessage: string;
  newsletterErrorMessage: string;
};

type HomepageBuilderShell = {
  headerLinks: StorefrontRenderableLink[];
  footerQuickLinks: StorefrontRenderableLink[];
  footerLegalLinks: StorefrontRenderableLink[];
  socialLinks: StorefrontRenderableSocialLink[];
};

const clampLimit = (value: number | null | undefined, fallback: number, max = 30) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  if (value < 1) {
    return 1;
  }

  return Math.min(value, max);
};

const toCategory = (category: {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  range: number | null;
  featured: boolean;
  imageUrl: string | null;
  _count?: {
    products: number;
  };
}) => mapCategory(category);

const toProduct = (product: ProductRecord) => mapProduct(product);

const toBrand = (brand: {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}) => mapBrand(brand);

const resolveProductOrderBy = (
  sortBy: "createdAt" | "updatedAt" | "price" | "discount" | "name" | null,
  sortOrder: "asc" | "desc"
): Prisma.ProductOrderByWithRelationInput[] => {
  if (sortBy) {
    return [{ [sortBy]: sortOrder } as Prisma.ProductOrderByWithRelationInput];
  }

  return [{ updatedAt: "desc" }];
};

const getBestSellerProducts = async (limit: number) => {
  const bestSellerGroups = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: {
        not: null,
      },
      order: {
        paymentStatus: "paid",
      },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: limit,
  });

  const bestSellerIds = bestSellerGroups
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));

  if (!bestSellerIds.length) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: bestSellerIds,
      },
      isActive: true,
    },
    select: productSelect,
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  return bestSellerIds
    .map((id) => byId.get(id))
    .filter((item): item is ProductRecord => Boolean(item))
    .map(toProduct);
};

const resolveManualProductsFromConfig = async (productIds: string[]) => {
  if (!productIds.length) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      isActive: true,
    },
    select: productSelect,
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  return productIds
    .map((id) => byId.get(id))
    .filter((item): item is ProductRecord => Boolean(item))
    .map(toProduct);
};

export async function buildDynamicHomepageSections({
  shell,
  settings,
}: {
  shell: HomepageBuilderShell;
  settings: HomepageBuilderSettings;
}): Promise<HomepageDynamicSection[]> {
  const sections = await prisma.homepageSection.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      products: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          product: {
            select: productSelect,
          },
        },
      },
    },
  });

  if (!sections.length) {
    return [];
  }

  const resolved: HomepageDynamicSection[] = [];

  for (const section of sections) {
    const baseConfig = parseSectionConfigObject(section.config);
    const base: Omit<HomepageDynamicSection, "type"> = {
      id: section.id,
      key: section.key,
      title: section.title,
      subtitle: section.subtitle,
      order: section.order,
      layout: section.layout,
      theme: section.theme,
      ctaLabel: section.ctaLabel,
      ctaLink: section.ctaLink,
      limit: section.limit,
      config: baseConfig,
    };

    if (section.type === "hero") {
      const slides = await prisma.homeHeroSlide.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });

      if (!slides.length) {
        continue;
      }

      resolved.push({
        ...base,
        type: "hero",
        config: {
          ...baseConfig,
          autoplayMs:
            typeof baseConfig.autoplayMs === "number" && baseConfig.autoplayMs >= 2000
              ? Math.trunc(baseConfig.autoplayMs)
              : settings.heroAutoplayMs,
        },
        heroSlides: slides.map((slide) => ({
          id: slide.id,
          badge: slide.badge,
          title: slide.title,
          subtitle: slide.subtitle,
          ctaLabel: slide.ctaLabel,
          ctaHref: slide.ctaHref,
          imageUrl: slide.imageUrl,
          altText: slide.altText,
          sortOrder: slide.sortOrder,
        })),
      });
      continue;
    }

    if (section.type === "product_list") {
      const productConfig = parseProductSectionConfig(
        section.config,
        section.limit,
        section.layout
      );
      const limit = clampLimit(
        productConfig.limit,
        productConfig.sourceType === "discounted"
          ? settings.promotionsLimit
          : productConfig.sourceType === "best_sellers"
            ? settings.bestSellersLimit
            : productConfig.sourceType === "newest"
              ? settings.newArrivalsLimit
              : 10
      );

      const manualFromRelation = section.products
        .filter((item) => item.product?.isActive)
        .map((item) => ({
          sortOrder: item.sortOrder,
          product: item.product,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => item.product)
        .filter((item): item is ProductRecord => Boolean(item))
        .map(toProduct);

      let products = manualFromRelation;

      if (productConfig.sourceType !== "manual_selection") {
        const orderBy = resolveProductOrderBy(productConfig.sortBy, productConfig.sortOrder);

        if (productConfig.sourceType === "by_category" && productConfig.categoryId) {
          const items = await prisma.product.findMany({
            where: {
              isActive: true,
              categories: {
                some: {
                  categoryId: productConfig.categoryId,
                },
              },
            },
            orderBy,
            select: productSelect,
            take: limit,
          });
          products = items.map(toProduct);
        } else if (productConfig.sourceType === "by_brand" && productConfig.brandId) {
          const items = await prisma.product.findMany({
            where: {
              isActive: true,
              brandId: productConfig.brandId,
            },
            orderBy,
            select: productSelect,
            take: limit,
          });
          products = items.map(toProduct);
        } else if (productConfig.sourceType === "by_tag" && productConfig.tagId) {
          const items = await prisma.product.findMany({
            where: {
              isActive: true,
              tags: {
                some: {
                  tagId: productConfig.tagId,
                },
              },
            },
            orderBy,
            select: productSelect,
            take: limit,
          });
          products = items.map(toProduct);
        } else if (productConfig.sourceType === "discounted") {
          const items = await prisma.product.findMany({
            where: {
              isActive: true,
              OR: [
                {
                  discount: {
                    gt: 0,
                  },
                },
                {
                  status: "sale",
                },
              ],
            },
            orderBy: [{ discount: "desc" }, { updatedAt: "desc" }],
            select: productSelect,
            take: limit,
          });
          products = items.map(toProduct);
        } else if (productConfig.sourceType === "best_sellers") {
          products = await getBestSellerProducts(limit);
        } else if (productConfig.sourceType === "newest") {
          const items = await prisma.product.findMany({
            where: {
              isActive: true,
            },
            orderBy: [{ createdAt: "desc" }],
            select: productSelect,
            take: limit,
          });
          products = items.map(toProduct);
        } else {
          const items = await prisma.product.findMany({
            where: {
              isActive: true,
              isFeatured: true,
            },
            orderBy,
            select: productSelect,
            take: limit,
          });
          products = items.map(toProduct);
        }
      } else if (!products.length) {
        products = await resolveManualProductsFromConfig(productConfig.productIds);
      }

      if (productConfig.hideIfEmpty && !products.length) {
        continue;
      }

      resolved.push({
        ...base,
        type: "product_list",
        productConfig,
        config: {
          ...baseConfig,
          sourceType: productConfig.sourceType,
          layout: productConfig.layout,
          sortBy: productConfig.sortBy,
          sortOrder: productConfig.sortOrder,
          hideIfEmpty: productConfig.hideIfEmpty,
          limit,
        },
        products: products.slice(0, limit),
      });
      continue;
    }

    if (section.type === "category_list") {
      const categoryIds = Array.isArray(baseConfig.categoryIds)
        ? baseConfig.categoryIds.filter((item): item is string => typeof item === "string")
        : [];
      const featuredOnly = Boolean(baseConfig.featuredOnly);
      const limit = clampLimit(section.limit, settings.featuredCategoriesLimit, 24);

      let categories = [];

      if (categoryIds.length) {
        const rows = await prisma.category.findMany({
          where: {
            id: {
              in: categoryIds,
            },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            range: true,
            featured: true,
            imageUrl: true,
            _count: {
              select: {
                products: true,
              },
            },
          },
        });
        const byId = new Map(rows.map((item) => [item.id, item]));
        categories = categoryIds
          .map((id) => byId.get(id))
          .filter((item): item is (typeof rows)[number] => Boolean(item))
          .slice(0, limit)
          .map(toCategory);
      } else {
        const rows = await prisma.category.findMany({
          where: featuredOnly
            ? {
                featured: true,
              }
            : undefined,
          orderBy: [{ title: "asc" }],
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            range: true,
            featured: true,
            imageUrl: true,
            _count: {
              select: {
                products: true,
              },
            },
          },
          take: limit,
        });
        categories = rows.map(toCategory);
      }

      if (!categories.length) {
        continue;
      }

      resolved.push({
        ...base,
        type: "category_list",
        categories,
        config: {
          ...baseConfig,
          featuredOnly,
          limit,
        },
      });
      continue;
    }

    if (section.type === "brand_list") {
      const brandIds = Array.isArray(baseConfig.brandIds)
        ? baseConfig.brandIds.filter((item): item is string => typeof item === "string")
        : [];
      const limit = clampLimit(section.limit, settings.brandsLimit, 24);

      let brands = [];

      if (brandIds.length) {
        const rows = await prisma.brand.findMany({
          where: {
            id: {
              in: brandIds,
            },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            imageUrl: true,
          },
        });
        const byId = new Map(rows.map((item) => [item.id, item]));
        brands = brandIds
          .map((id) => byId.get(id))
          .filter((item): item is (typeof rows)[number] => Boolean(item))
          .slice(0, limit)
          .map(toBrand);
      } else {
        const rows = await prisma.brand.findMany({
          orderBy: [{ title: "asc" }],
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            imageUrl: true,
          },
          take: limit,
        });
        brands = rows.map(toBrand);
      }

      if (!brands.length) {
        continue;
      }

      resolved.push({
        ...base,
        type: "brand_list",
        brands,
        config: {
          ...baseConfig,
          limit,
        },
      });
      continue;
    }

    if (section.type === "reassurance") {
      const trustItems = await prisma.homeTrustItem.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });

      if (!trustItems.length) {
        continue;
      }

      resolved.push({
        ...base,
        type: "reassurance",
        trustItems: trustItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          icon: item.icon,
          sortOrder: item.sortOrder,
        })),
      });
      continue;
    }

    if (section.type === "newsletter") {
      resolved.push({
        ...base,
        type: "newsletter",
        config: {
          ...baseConfig,
          title: base.title || settings.newsletterTitle,
          description: base.subtitle || settings.newsletterDescription,
          placeholder:
            typeof baseConfig.placeholder === "string"
              ? baseConfig.placeholder
              : settings.newsletterPlaceholder,
          buttonLabel:
            typeof baseConfig.buttonLabel === "string"
              ? baseConfig.buttonLabel
              : settings.newsletterButtonLabel,
          successMessage:
            typeof baseConfig.successMessage === "string"
              ? baseConfig.successMessage
              : settings.newsletterSuccessMessage,
          errorMessage:
            typeof baseConfig.errorMessage === "string"
              ? baseConfig.errorMessage
              : settings.newsletterErrorMessage,
        },
      });
      continue;
    }

    if (section.type === "custom_banner") {
      resolved.push({
        ...base,
        type: "custom_banner",
        config: {
          ...baseConfig,
          badge:
            typeof baseConfig.badge === "string" && baseConfig.badge.trim()
              ? baseConfig.badge
              : settings.loyaltyBadge,
          title:
            typeof baseConfig.title === "string" && baseConfig.title.trim()
              ? baseConfig.title
              : settings.loyaltyTitle,
          description:
            typeof baseConfig.description === "string" && baseConfig.description.trim()
              ? baseConfig.description
              : settings.loyaltyDescription,
          ctaLabel:
            typeof baseConfig.ctaLabel === "string" && baseConfig.ctaLabel.trim()
              ? baseConfig.ctaLabel
              : settings.loyaltyCtaLabel,
          ctaHref:
            typeof baseConfig.ctaHref === "string" && baseConfig.ctaHref.trim()
              ? baseConfig.ctaHref
              : settings.loyaltyCtaHref,
          highlightText:
            typeof baseConfig.highlightText === "string" && baseConfig.highlightText.trim()
              ? baseConfig.highlightText
              : settings.loyaltyHighlightText,
          imageUrl:
            typeof baseConfig.imageUrl === "string" && baseConfig.imageUrl.trim()
              ? baseConfig.imageUrl
              : settings.loyaltyImageUrl,
        },
      });
      continue;
    }

    if (section.type === "links_group") {
      const group =
        typeof baseConfig.group === "string" ? baseConfig.group.toLowerCase() : "footer_quick";
      const limit = clampLimit(section.limit, 8, 30);

      const grouped: Array<StorefrontRenderableLink & { group: "header" | "footer_quick" | "footer_legal" }> = [
        ...shell.headerLinks.map((item) => ({ ...item, group: "header" as const })),
        ...shell.footerQuickLinks.map((item) => ({ ...item, group: "footer_quick" as const })),
        ...shell.footerLegalLinks.map((item) => ({ ...item, group: "footer_legal" as const })),
      ];

      const links =
        group === "all"
          ? grouped
          : grouped.filter((item) => item.group === group);

      if (!links.length) {
        continue;
      }

      resolved.push({
        ...base,
        type: "links_group",
        links: links.slice(0, limit),
        config: {
          ...baseConfig,
          group,
          limit,
        },
      });
      continue;
    }

    if (section.type === "social_links") {
      const limit = clampLimit(section.limit, shell.socialLinks.length || 4, 12);
      const links = shell.socialLinks.slice(0, limit);

      if (!links.length) {
        continue;
      }

      resolved.push({
        ...base,
        type: "social_links",
        socialLinks: links,
        config: {
          ...baseConfig,
          limit,
        },
      });
      continue;
    }

    if (section.type === "custom_html") {
      if (typeof baseConfig.html !== "string" || !baseConfig.html.trim()) {
        console.warn(`Homepage section \"${section.key}\" ignored because html config is missing.`);
        continue;
      }

      resolved.push({
        ...base,
        type: "custom_html",
        config: {
          ...baseConfig,
          html: baseConfig.html,
        },
      });
      continue;
    }

    if (section.type === "rich_text") {
      if (typeof baseConfig.content !== "string" || !baseConfig.content.trim()) {
        console.warn(`Homepage section \"${section.key}\" ignored because content config is missing.`);
        continue;
      }

      resolved.push({
        ...base,
        type: "rich_text",
        config: {
          ...baseConfig,
          content: baseConfig.content,
        },
      });
      continue;
    }

    console.warn(`Unknown homepage section type for key \"${section.key}\": ${section.type}`);
  }

  return resolved.sort((left, right) => left.order - right.order);
}
