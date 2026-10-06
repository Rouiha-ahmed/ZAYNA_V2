import { prisma } from "@/lib/prisma";

export const normalizeCategoryName = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[\u2010-\u2015\u2212_-]+/g, " ")
    .replace(/[\u2018\u2019\u02bc'`]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export type CategoryPlacementRecord = {
  id: string;
  title: string;
  parentId: string | null;
  isActive: boolean;
  archivedAt: Date | string | null;
};

export const findSimilarCategory = <T extends Pick<CategoryPlacementRecord, "id" | "title">>(
  title: string,
  categories: T[],
  excludeId?: string
) => {
  const normalized = normalizeCategoryName(title);
  return categories.find(
    (category) =>
      category.id !== excludeId && normalizeCategoryName(category.title) === normalized
  );
};

export function resolveCategoryFlagUpdate(
  current: { isActive: boolean; featured: boolean },
  requested: { isActive?: boolean; isFeatured?: boolean },
) {
  const nextIsActive = requested.isActive ?? current.isActive;
  const nextIsFeatured = requested.isActive === false
    ? false
    : requested.isFeatured ?? current.featured;

  if (nextIsFeatured && !nextIsActive) {
    throw new Error("Activez d’abord la catégorie avant de l’afficher sur la Homepage.");
  }

  return {
    data: {
      ...(typeof requested.isActive === "boolean"
        ? { isActive: requested.isActive }
        : {}),
      ...(typeof requested.isFeatured === "boolean"
        ? { featured: requested.isFeatured }
        : {}),
      ...(requested.isActive === false ? { featured: false } : {}),
    },
    audit: {
      ...(typeof requested.isActive === "boolean"
        ? { isActive: requested.isActive }
        : {}),
      ...(typeof requested.isFeatured === "boolean"
        ? { isFeatured: nextIsFeatured }
        : {}),
      ...(requested.isActive === false ? { isFeatured: false } : {}),
    },
    nextIsActive,
    nextIsFeatured,
  };
}

export function validateCategoryPlacement({
  categoryId,
  parentId,
  isActive,
  categories,
}: {
  categoryId?: string;
  parentId: string | null;
  isActive: boolean;
  categories: CategoryPlacementRecord[];
}) {
  if (!parentId) return;
  if (categoryId && categoryId === parentId) {
    throw new Error("Une catégorie ne peut pas être son propre parent.");
  }

  const parent = categories.find((category) => category.id === parentId);
  if (!parent) throw new Error("La catégorie parente est introuvable.");
  if (parent.archivedAt) throw new Error("Une catégorie archivée ne peut pas devenir parente.");
  if (parent.parentId) {
    throw new Error("Deux niveaux maximum : choisissez une catégorie principale.");
  }
  if (isActive && !parent.isActive) {
    throw new Error("Activez d’abord la catégorie parente.");
  }

  if (categoryId) {
    const hasChildren = categories.some(
      (category) => category.parentId === categoryId && !category.archivedAt
    );
    if (hasChildren) {
      throw new Error("Une catégorie qui contient des sous-catégories doit rester au premier niveau.");
    }
  }
}

export type AdminCategoryItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  archivedAt: Date | null;
  archivedBy: string | null;
  updatedAt: Date;
  productCount: number;
  orphanRiskCount: number;
  products: Array<{ id: string; name: string }>;
};

export type AdminCategoriesData = {
  metrics: {
    totalCategories: number;
    activeCategories: number;
    featuredCategories: number;
    emptyCategories: number;
    uncategorizedProducts: number;
    archivedCategories: number;
  };
  categories: AdminCategoryItem[];
  duplicateGroups: Array<Array<{ id: string; title: string }>>;
};

export const getPotentialCategoryDuplicateGroups = <
  T extends Pick<CategoryPlacementRecord, "id" | "title">,
>(categories: T[]) => {
  const groups = new Map<string, T[]>();
  for (const category of categories) {
    const key = normalizeCategoryName(category.title);
    if (key) groups.set(key, [...(groups.get(key) || []), category]);
  }
  return Array.from(groups.values()).filter((group) => group.length > 1);
};

export async function getAdminCategoriesData(): Promise<AdminCategoriesData> {
  const [rows, activeCategories, featuredCategories, uncategorizedProducts] =
    await Promise.all([
      prisma.category.findMany({
        orderBy: [{ parentId: "asc" }, { range: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          imageUrl: true,
          parentId: true,
          range: true,
          isActive: true,
          featured: true,
          archivedAt: true,
          archivedBy: true,
          updatedAt: true,
          _count: { select: { products: true } },
          products: {
            orderBy: { product: { name: "asc" } },
            take: 5,
            select: { product: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.category.count({ where: { archivedAt: null, isActive: true } }),
      prisma.category.count({
        where: { archivedAt: null, isActive: true, featured: true },
      }),
      prisma.product.count({
        where: {
          isActive: true,
          categories: {
            none: { category: { archivedAt: null, isActive: true } },
          },
        },
      }),
    ]);

  const categoryRelations = await prisma.productCategory.findMany({
    where: { categoryId: { in: rows.map((row) => row.id) } },
    select: { categoryId: true, productId: true },
  });
  const productIdsByCategory = new Map<string, Set<string>>();
  for (const relation of categoryRelations) {
    const direct = productIdsByCategory.get(relation.categoryId) || new Set<string>();
    direct.add(relation.productId);
    productIdsByCategory.set(relation.categoryId, direct);
    const parentId = rows.find((row) => row.id === relation.categoryId)?.parentId;
    if (parentId) {
      const parent = productIdsByCategory.get(parentId) || new Set<string>();
      parent.add(relation.productId);
      productIdsByCategory.set(parentId, parent);
    }
  }

  const riskCounts = await Promise.all(
    rows.map(async (row) => {
      if (row.archivedAt) return 0;
      const subtreeIds = [
        row.id,
        ...rows
          .filter((candidate) => candidate.parentId === row.id && !candidate.archivedAt)
          .map((candidate) => candidate.id),
      ];
      return prisma.product.count({
        where: {
          isActive: true,
          categories: {
            some: { categoryId: { in: subtreeIds } },
            none: {
              category: {
                id: { notIn: subtreeIds },
                archivedAt: null,
                isActive: true,
              },
            },
          },
        },
      });
    })
  );

  const categories = rows.map<AdminCategoryItem>((row, index) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    imageUrl: row.imageUrl,
    parentId: row.parentId,
    sortOrder: row.range ?? 0,
    isActive: row.isActive,
    isFeatured: row.featured,
    archivedAt: row.archivedAt,
    archivedBy: row.archivedBy,
    updatedAt: row.updatedAt,
    productCount: productIdsByCategory.get(row.id)?.size || 0,
    orphanRiskCount: riskCounts[index] || 0,
    products: row.products.map(({ product }) => product),
  }));

  return {
    metrics: {
      totalCategories: rows.filter((row) => !row.archivedAt).length,
      activeCategories,
      featuredCategories,
      emptyCategories: rows.filter(
        (row) => !row.archivedAt && !(productIdsByCategory.get(row.id)?.size),
      ).length,
      uncategorizedProducts,
      archivedCategories: rows.filter((row) => Boolean(row.archivedAt)).length,
    },
    categories,
    duplicateGroups: getPotentialCategoryDuplicateGroups(rows).map((group) =>
      group.map(({ id, title }) => ({ id, title }))
    ),
  };
}
