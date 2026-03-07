import type { Category } from "@/types";

export type HomeCategory = Pick<Category, "_id" | "title" | "slug"> & {
  productCount?: number;
};

export const getHomeTabCategories = (categories: HomeCategory[]) => {
  const categoriesWithSlug = (categories || []).filter(
    (category): category is HomeCategory & { slug: { current: string } } =>
      Boolean(category?._id && category?.title && category?.slug?.current)
  );

  const categoriesWithProducts = categoriesWithSlug.filter(
    (category) => (category.productCount || 0) > 0
  );

  return categoriesWithProducts.length > 0 ? categoriesWithProducts : categoriesWithSlug;
};
