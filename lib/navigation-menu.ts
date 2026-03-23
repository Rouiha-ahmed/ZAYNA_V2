import type { StorefrontLink } from "@/lib/storefront";
import type { Category } from "@/types";

export type NavCategoryItem = Category & { slug: { current: string } };

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
  const categoryItems = categories.filter(
    (category): category is NavCategoryItem => Boolean(category.slug?.current)
  );
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

  topLevelCategories.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  for (const [parentId, children] of childrenByParent.entries()) {
    childrenByParent.set(
      parentId,
      children.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    );
  }

  return {
    topLevelCategories,
    childrenByParent,
  };
};
