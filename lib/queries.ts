import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { mapBrand, mapCategory, mapOrder, mapProduct } from "@/lib/data/mappers";
import { prisma } from "@/lib/prisma";
import type { BRANDS_QUERYResult, Category, Product } from "@/types";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  discount: true,
  stock: true,
  status: true,
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

type SearchProductsInput = {
  selectedCategory?: string;
  selectedCategoryId?: string;
  selectedBrand?: string;
  searchTerm?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  limit?: number;
};

const STOREFRONT_REVALIDATE = 300;
const PRODUCT_SEARCH_REVALIDATE = 120;

const normalizeSearchProductsInput = ({
  selectedCategory,
  selectedCategoryId,
  selectedBrand,
  searchTerm,
  minPrice,
  maxPrice,
  limit,
}: SearchProductsInput) => ({
  selectedCategory: selectedCategory?.trim() || "",
  selectedCategoryId: selectedCategoryId?.trim() || "",
  selectedBrand: selectedBrand?.trim() || "",
  searchTerm: searchTerm?.trim() || "",
  minPrice:
    typeof minPrice === "number" && Number.isFinite(minPrice) ? minPrice : null,
  maxPrice:
    typeof maxPrice === "number" && Number.isFinite(maxPrice) ? maxPrice : null,
  limit: typeof limit === "number" && Number.isFinite(limit) && limit > 0 ? limit : null,
});

const getCachedCategories = unstable_cache(
  async (quantity?: number): Promise<Category[]> => {
    const categories = await prisma.category.findMany({
      orderBy: {
        title: "asc",
      },
      take: quantity,
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

    return categories.map(mapCategory);
  },
  ["storefront-categories"],
  { revalidate: STOREFRONT_REVALIDATE }
);

const getCachedAllCategorySlugs = unstable_cache(
  async () => {
    const categories = await prisma.category.findMany({
      orderBy: {
        slug: "asc",
      },
      select: {
        slug: true,
      },
    });

    return categories.map((category) => category.slug);
  },
  ["storefront-category-slugs"],
  { revalidate: STOREFRONT_REVALIDATE }
);

const getCachedFooterCategories = unstable_cache(
  async (quantity?: number) => {
    const categories = await prisma.category.findMany({
      orderBy: {
        title: "asc",
      },
      take: quantity,
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    return categories.map((category) => ({
      _id: category.id,
      title: category.title,
      slug: {
        current: category.slug,
      },
    }));
  },
  ["storefront-footer-categories"],
  { revalidate: STOREFRONT_REVALIDATE }
);

const getCachedAllBrands = unstable_cache(
  async (): Promise<BRANDS_QUERYResult> => {
    const brands = await prisma.brand.findMany({
      orderBy: {
        title: "asc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        imageUrl: true,
      },
    });

    return brands.map(mapBrand);
  },
  ["storefront-brands"],
  { revalidate: STOREFRONT_REVALIDATE }
);

const getCachedDealProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const products = await prisma.product.findMany({
      where: {
        status: "hot",
      },
      orderBy: {
        name: "asc",
      },
      select: productSelect,
    });

    return products.map(mapProduct);
  },
  ["storefront-deals"],
  { revalidate: STOREFRONT_REVALIDATE }
);

const getCachedProductBySlug = unstable_cache(
  async (slug: string): Promise<Product | null> => {
    const product = await prisma.product.findUnique({
      where: {
        slug,
      },
      select: productSelect,
    });

    return product ? mapProduct(product) : null;
  },
  ["storefront-product-by-slug"],
  { revalidate: STOREFRONT_REVALIDATE }
);

const getCachedAllProductSlugs = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      orderBy: {
        slug: "asc",
      },
      select: {
        slug: true,
      },
    });

    return products.map((product) => product.slug);
  },
  ["storefront-product-slugs"],
  { revalidate: STOREFRONT_REVALIDATE }
);

const getCachedSearchProducts = unstable_cache(
  async (input: ReturnType<typeof normalizeSearchProductsInput>): Promise<Product[]> => {
    const filters: Prisma.ProductWhereInput[] = [];
    const tokens = input.searchTerm
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);

    if (input.selectedCategoryId) {
      filters.push({
        categories: {
          some: {
            categoryId: input.selectedCategoryId,
          },
        },
      });
    }

    if (input.selectedCategory) {
      filters.push({
        categories: {
          some: {
            category: {
              slug: input.selectedCategory,
            },
          },
        },
      });
    }

    if (input.selectedBrand) {
      filters.push({
        brand: {
          is: {
            slug: input.selectedBrand,
          },
        },
      });
    }

    if (input.minPrice !== null && input.maxPrice !== null) {
      filters.push({
        price: {
          gte: new Prisma.Decimal(input.minPrice),
          lte: new Prisma.Decimal(input.maxPrice),
        },
      });
    }

    for (const token of tokens) {
      filters.push({
        OR: [
          {
            name: {
              contains: token,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: token,
              mode: "insensitive",
            },
          },
        ],
      });
    }

    const products = await prisma.product.findMany({
      where: filters.length ? { AND: filters } : undefined,
      orderBy: {
        name: "asc",
      },
      take: input.limit || undefined,
      select: productSelect,
    });

    return products.map(mapProduct);
  },
  ["storefront-search-products"],
  { revalidate: PRODUCT_SEARCH_REVALIDATE }
);

export const getCategories = async (
  quantity?: number,
  _revalidate?: number
): Promise<Category[]> => {
  void _revalidate;
  return getCachedCategories(quantity);
};

export const getAllCategorySlugs = async () => getCachedAllCategorySlugs();

export const getFooterCategories = async (
  quantity?: number,
  _revalidate = 60
) => {
  void _revalidate;
  return getCachedFooterCategories(quantity);
};

export const getAllBrands = async (): Promise<BRANDS_QUERYResult> => getCachedAllBrands();

export const getDealProducts = async (): Promise<Product[]> => getCachedDealProducts();

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  return getCachedProductBySlug(slug);
};

export const getAllProductSlugs = async () => getCachedAllProductSlugs();

export const searchProducts = async ({
  selectedCategory,
  selectedCategoryId,
  selectedBrand,
  searchTerm,
  minPrice,
  maxPrice,
  limit,
}: SearchProductsInput): Promise<Product[]> => {
  return getCachedSearchProducts(
    normalizeSearchProductsInput({
      selectedCategory,
      selectedCategoryId,
      selectedBrand,
      searchTerm,
      minPrice,
      maxPrice,
      limit,
    })
  );
};

export const getProductsByCategoryId = async (categoryId: string) =>
  searchProducts({ selectedCategoryId: categoryId });

export const getProductsByCategorySlug = async (categorySlug: string) =>
  searchProducts({ selectedCategory: categorySlug });

export const getSearchSuggestions = async (query: string, limit = 6) =>
  searchProducts({ searchTerm: query, limit });

export const getMyOrders = async (userId: string) => {
  const orders = await prisma.order.findMany({
    where: {
      clerkUserId: userId,
    },
    orderBy: {
      orderDate: "desc",
    },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return orders.map(mapOrder);
};

export const getMyOrdersCount = async (userId: string) =>
  prisma.order.count({
    where: {
      clerkUserId: userId,
    },
  });
