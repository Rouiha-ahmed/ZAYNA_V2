import type { StorefrontLink } from "@/lib/storefront";
import type { Category } from "@/types";

export type NavCategoryItem = Category & { slug: { current: string } };

export const flattenCompleteCategoryTrees = <
  T extends { id: string; parentId: string | null },
>(categories: T[]) => {
  const roots = categories.filter((category) => !category.parentId);
  return roots.flatMap((root) => [
    root,
    ...categories.filter((category) => category.parentId === root.id),
  ]);
};

const categoryOrderValue = (category: Category) => {
  const sortOrder = Number(category.sortOrder);
  if (Number.isFinite(sortOrder)) {
    return sortOrder;
  }

  const range = Number(category.range);
  if (Number.isFinite(range)) {
    return range;
  }

  return 0;
};

const normalizedCategoryTitle = (category: Category) => (category.title || "").trim().toLowerCase();

const compareCategoriesByDisplayOrder = (left: Category, right: Category) =>
  categoryOrderValue(left) - categoryOrderValue(right) ||
  (normalizedCategoryTitle(left) < normalizedCategoryTitle(right)
    ? -1
    : normalizedCategoryTitle(left) > normalizedCategoryTitle(right)
      ? 1
      : 0) ||
  (left._id < right._id ? -1 : left._id > right._id ? 1 : 0);

const normalizeHref = (href: string) => {
  const [path] = href.split("?");
  const cleaned = path.replace(/\/+$/g, "");
  return cleaned || "/";
};

const isCategoriesHubLink = (link: StorefrontLink) => {
  const href = normalizeHref(link.href);
  if (href === "/categories" || href === "/category") {
    return true;
  }

  return /cat[ée]gor/i.test(link.title);
};

const isShopLink = (link: StorefrontLink) => {
  const href = normalizeHref(link.href);
  return href === "/shop" || link.title.toLowerCase().includes("boutique");
};

const isPromotionsLink = (link: StorefrontLink) => {
  const href = normalizeHref(link.href);
  return href === "/deal" || link.title.toLowerCase().includes("promo");
};

const isContactLink = (link: StorefrontLink) => {
  const href = normalizeHref(link.href);
  return href === "/contact" || link.title.toLowerCase().includes("contact");
};

export const organizeHeaderLinks = (links: StorefrontLink[]) => {
  const shopLink = links.find(isShopLink);
  const primaryLinks = [shopLink].filter((link): link is StorefrontLink => Boolean(link));
  const primaryIds = new Set(primaryLinks.map((link) => link.id));
  const secondaryLinks = links.filter((link) => {
    if (primaryIds.has(link.id)) {
      return false;
    }

    if (normalizeHref(link.href) === "/") {
      return false;
    }

    if (isPromotionsLink(link) || isContactLink(link)) {
      return false;
    }

    return !isCategoriesHubLink(link);
  });

  return {
    primaryLinks,
    secondaryLinks,
  };
};

export const buildCategoryTree = (categories: Category[]) => {
  const categoryItems = categories
    .filter((category): category is NavCategoryItem => Boolean(category.slug?.current))
    .sort(compareCategoriesByDisplayOrder);
  const categoryMap = new Map(categoryItems.map((category) => [category._id, category]));
  const hasTreeData = categoryItems.some((category) => Boolean(category.parentId));
  const childrenByParent = new Map<string, NavCategoryItem[]>();
  const topLevelCategories: NavCategoryItem[] = [];

  for (const category of categoryItems) {
    if (!hasTreeData || !category.parentId || !categoryMap.has(category.parentId)) {
      topLevelCategories.push(category);
      continue;
    }

    const parentChildren = childrenByParent.get(category.parentId) || [];
    parentChildren.push(category);
    childrenByParent.set(category.parentId, parentChildren);
  }

  for (const [parentId, parentChildren] of childrenByParent.entries()) {
    childrenByParent.set(parentId, [...parentChildren].sort(compareCategoriesByDisplayOrder));
  }

  return {
    topLevelCategories,
    childrenByParent,
  };
};
