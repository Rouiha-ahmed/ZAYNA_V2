import { Prisma } from "@prisma/client";

import { mapCategory } from "@/lib/data/mappers";
import { flattenCompleteCategoryTrees } from "@/lib/navigation-menu";
import { prisma } from "@/lib/prisma";
import { sellableProductWhere } from "@/lib/products/storefront-rules";
import type { Category } from "@/types";

/**
 * Only opted-in top-level categories belong in the main navigation. Their
 * active children remain available in the existing desktop/mobile dropdowns.
 */
export const navigationCategoryWhere = {
  isActive: true,
  archivedAt: null,
  OR: [
    { parentId: null, showInNavigation: true },
    {
      parent: {
        is: {
          parentId: null,
          showInNavigation: true,
          isActive: true,
          archivedAt: null,
        },
      },
    },
  ],
} satisfies Prisma.CategoryWhereInput;

export async function getNavigationCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: navigationCategoryWhere,
    orderBy: [{ range: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      range: true,
      description: true,
      featured: true,
      imageUrl: true,
      parentId: true,
      _count: {
        select: {
          products: { where: { product: { is: sellableProductWhere } } },
        },
      },
    },
  });

  return flattenCompleteCategoryTrees(rows).map(mapCategory);
}
