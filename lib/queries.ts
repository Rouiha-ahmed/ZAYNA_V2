import { Prisma } from "@prisma/client";

import { mapBrand, mapCategory, mapOrder, mapProduct } from "@/lib/data/mappers";
import { prisma } from "@/lib/prisma";
import type { BRANDS_QUERYResult, Category, Product } from "@/types";

const productInclude = {
  images: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  brand: true,
  categories: {
    include: {
      category: true,
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

export const getCategories = async (
  quantity?: number,
  _revalidate?: number
): Promise<Category[]> => {
  void _revalidate;
  const categories = await prisma.category.findMany({
    orderBy: {
      title: "asc",
    },
    take: quantity,
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return categories.map(mapCategory);
};

export const getAllCategorySlugs = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      slug: "asc",
    },
    select: {
      slug: true,
    },
  });

  return categories.map((category) => category.slug);
};

export const getFooterCategories = async (
  quantity?: number,
  _revalidate = 60
) => {
  void _revalidate;
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
};

export const getAllBrands = async (): Promise<BRANDS_QUERYResult> => {
  const brands = await prisma.brand.findMany({
    orderBy: {
      title: "asc",
    },
  });

  return brands.map(mapBrand);
};

export const getDealProducts = async (): Promise<Product[]> => {
  const products = await prisma.product.findMany({
    where: {
      status: "hot",
    },
    orderBy: {
      name: "asc",
    },
    include: productInclude,
  });

  return products.map(mapProduct);
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  const product = await prisma.product.findUnique({
    where: {
      slug,
    },
    include: productInclude,
  });

  return product ? mapProduct(product) : null;
};

export const getAllProductSlugs = async () => {
  const products = await prisma.product.findMany({
    orderBy: {
      slug: "asc",
    },
    select: {
      slug: true,
    },
  });

  return products.map((product) => product.slug);
};

export const searchProducts = async ({
  selectedCategory,
  selectedCategoryId,
  selectedBrand,
  searchTerm,
  minPrice,
  maxPrice,
  limit,
}: SearchProductsInput): Promise<Product[]> => {
  const filters: Prisma.ProductWhereInput[] = [];
  const tokens = (searchTerm || "")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (selectedCategoryId) {
    filters.push({
      categories: {
        some: {
          categoryId: selectedCategoryId,
        },
      },
    });
  }

  if (selectedCategory) {
    filters.push({
      categories: {
        some: {
          category: {
            slug: selectedCategory,
          },
        },
      },
    });
  }

  if (selectedBrand) {
    filters.push({
      brand: {
        is: {
          slug: selectedBrand,
        },
      },
    });
  }

  if (
    typeof minPrice === "number" &&
    Number.isFinite(minPrice) &&
    typeof maxPrice === "number" &&
    Number.isFinite(maxPrice)
  ) {
    filters.push({
      price: {
        gte: new Prisma.Decimal(minPrice),
        lte: new Prisma.Decimal(maxPrice),
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
    take: limit,
    include: productInclude,
  });

  return products.map(mapProduct);
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
