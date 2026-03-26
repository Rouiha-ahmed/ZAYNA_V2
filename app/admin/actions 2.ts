"use server";

import {
  HomepageProductSourceType,
  HomepageSectionType,
  PaymentMethod,
  SiteLinkGroup,
  type ProductStatus,
} from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import {
  adminOrderStageOptions,
  adminStageToOrderStatus,
  getAdminDataTag,
  requireAdmin,
} from "@/lib/admin";
import { deleteStoredAsset, deleteStoredAssets, isUploadedFile, saveOptimizedImage } from "@/lib/admin-media";
import { prisma } from "@/lib/prisma";

type AdminSection =
  | "dashboard"
  | "homepage"
  | "orders"
  | "products"
  | "categories"
  | "brands"
  | "promos";

type EntityName = "category" | "brand" | "product";

type UploadedAsset = Awaited<ReturnType<typeof saveOptimizedImage>>;

const allPaymentMethods: PaymentMethod[] = ["cod", "cmi_card", "installments"];

const readText = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const readOptionalText = (formData: FormData, key: string) => {
  const value = readText(formData, key);
  return value || null;
};

const requireTextField = (value: string, message: string) => {
  if (!value) {
    throw new Error(message);
  }

  return value;
};

const readBoolean = (formData: FormData, key: string) => formData.get(key) === "on";

const readInteger = (
  formData: FormData,
  key: string,
  options: { min?: number; max?: number; defaultValue?: number } = {}
) => {
  const rawValue = readText(formData, key);

  if (!rawValue) {
    return options.defaultValue ?? 0;
  }

  const value = Number.parseInt(rawValue, 10);

  if (Number.isNaN(value)) {
    throw new Error("Merci de verifier les nombres saisis.");
  }

  if (typeof options.min === "number" && value < options.min) {
    throw new Error("Certaines valeurs numeriques sont trop petites.");
  }

  if (typeof options.max === "number" && value > options.max) {
    throw new Error("Certaines valeurs numeriques sont trop grandes.");
  }

  return value;
};

const readDecimal = (
  formData: FormData,
  key: string,
  options: { min?: number; max?: number; defaultValue?: number } = {}
) => {
  const rawValue = readText(formData, key);

  if (!rawValue) {
    return options.defaultValue ?? 0;
  }

  const value = Number.parseFloat(rawValue);

  if (Number.isNaN(value)) {
    throw new Error("Merci de verifier les montants saisis.");
  }

  if (typeof options.min === "number" && value < options.min) {
    throw new Error("Certains montants sont trop petits.");
  }

  if (typeof options.max === "number" && value > options.max) {
    throw new Error("Certains montants sont trop grands.");
  }

  return value;
};

const readDate = (formData: FormData, key: string) => {
  const value = readText(formData, key);

  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("La date selectionnee n'est pas valide.");
  }

  return date;
};

const readStringList = (formData: FormData, key: string) =>
  Array.from(
    new Set(
      formData
        .getAll(key)
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
    )
  );

const readUploadedFiles = (formData: FormData, key: string) =>
  formData.getAll(key).filter(isUploadedFile);

const readSiteLinkGroup = (formData: FormData, key: string): SiteLinkGroup => {
  const value = readText(formData, key);
  const groups = new Set<SiteLinkGroup>(["header", "footer_quick", "footer_legal"]);

  if (!groups.has(value as SiteLinkGroup)) {
    throw new Error("Le groupe de lien selectionne est invalide.");
  }

  return value as SiteLinkGroup;
};

const homepageSectionTypes = new Set<HomepageSectionType>([
  "hero",
  "product_list",
  "category_list",
  "brand_list",
  "reassurance",
  "newsletter",
  "custom_banner",
  "links_group",
  "social_links",
  "custom_html",
  "rich_text",
]);

const homepageProductSources = new Set<HomepageProductSourceType>([
  "manual_selection",
  "by_category",
  "by_brand",
  "by_tag",
  "discounted",
  "best_sellers",
  "newest",
  "featured",
]);

const productSectionLayouts = new Set(["grid", "carousel", "compact"]);
const productSortByOptions = new Set(["createdAt", "updatedAt", "price", "discount", "name"]);
const sortOrderOptions = new Set(["asc", "desc"]);
const linksGroupOptions = new Set(["header", "footer_quick", "footer_legal", "all"]);

const readHomepageSectionType = (formData: FormData, key: string): HomepageSectionType => {
  const value = readText(formData, key);

  if (!homepageSectionTypes.has(value as HomepageSectionType)) {
    throw new Error("Le type de section homepage est invalide.");
  }

  return value as HomepageSectionType;
};

const readJsonObject = (formData: FormData, key: string) => {
  const value = readText(formData, key);

  if (!value) {
    return {} as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Le contenu JSON de la section est invalide.");
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Le contenu JSON de la section est invalide.");
  }
};

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "item";

const promoCodeify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "PROMO";

const adminRedirect = (
  section: AdminSection,
  params: {
    status?: string;
    error?: string;
  }
) => {
  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.error) {
    searchParams.set("error", params.error);
  }

  const query = searchParams.toString();
  const targetPath =
    section === "dashboard"
      ? "/admin"
      : section === "homepage"
        ? "/admin/homepage"
        : section === "orders"
          ? "/admin/orders"
          : section === "products"
            ? "/admin/products"
            : section === "categories"
              ? "/admin/categories"
              : section === "brands"
                ? "/admin/brands"
                : "/admin/promos";

  redirect(`${targetPath}${query ? `?${query}` : ""}`);
};

const isRedirectSignal = (error: unknown): error is { digest: string } =>
  Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );

const getActionErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const withAction = async (
  section: AdminSection,
  fallbackMessage: string,
  task: () => Promise<void>
) => {
  try {
    await requireAdmin();
    await task();
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    adminRedirect(section, {
      error: getActionErrorMessage(error, fallbackMessage),
    });
  }
};

const refreshStorefront = (paths: Array<string | null | undefined> = []) => {
  const basePaths = ["/admin", "/", "/shop", "/deal", "/orders"];
  const revalidationTargets = [...basePaths, ...paths.filter(Boolean)];

  revalidateTag(getAdminDataTag(), "max");

  for (const path of new Set(revalidationTargets)) {
    revalidatePath(path as string);
  }
};

const requireId = (value: string, message: string) => {
  if (!value) {
    throw new Error(message);
  }

  return value;
};

const slugExists = async (entity: EntityName, slug: string, excludeId?: string) => {
  switch (entity) {
    case "category":
      return Boolean(
        await prisma.category.findFirst({
          where: {
            slug,
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
          },
          select: {
            id: true,
          },
        })
      );
    case "brand":
      return Boolean(
        await prisma.brand.findFirst({
          where: {
            slug,
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
          },
          select: {
            id: true,
          },
        })
      );
    case "product":
      return Boolean(
        await prisma.product.findFirst({
          where: {
            slug,
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
          },
          select: {
            id: true,
          },
        })
      );
  }
};

const generateUniqueSlug = async (
  entity: EntityName,
  source: string,
  excludeId?: string
) => {
  const baseSlug = slugify(source);
  let candidate = baseSlug;
  let index = 2;

  while (await slugExists(entity, candidate, excludeId)) {
    candidate = `${baseSlug}-${index}`;
    index += 1;
  }

  return candidate;
};

const promoCodeExists = async (code: string, excludeId?: string) =>
  Boolean(
    await prisma.promoCode.findFirst({
      where: {
        code,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: {
        id: true,
      },
    })
  );

const generateUniquePromoCode = async (source: string, excludeId?: string) => {
  const baseCode = promoCodeify(source);
  let candidate = baseCode;
  let index = 2;

  while (await promoCodeExists(candidate, excludeId)) {
    candidate = `${baseCode}-${index}`;
    index += 1;
  }

  return candidate;
};

const homepageSectionKeyExists = async (key: string, excludeId?: string) =>
  Boolean(
    await prisma.homepageSection.findFirst({
      where: {
        key,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: {
        id: true,
      },
    })
  );

const generateUniqueHomepageSectionKey = async (source: string, excludeId?: string) => {
  const baseKey = slugify(source);
  let candidate = baseKey;
  let index = 2;

  while (await homepageSectionKeyExists(candidate, excludeId)) {
    candidate = `${baseKey}-${index}`;
    index += 1;
  }

  return candidate;
};

const readOptionalInteger = (
  formData: FormData,
  key: string,
  options: { min?: number; max?: number } = {}
) => {
  const rawValue = readText(formData, key);
  if (!rawValue) {
    return null;
  }

  return readInteger(formData, key, options);
};

const asConfigString = (config: Record<string, unknown>, key: string) => {
  const value = config[key];
  return typeof value === "string" ? value.trim() : "";
};

const asConfigStringArray = (config: Record<string, unknown>, key: string) => {
  const value = config[key];
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const items: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }
    const normalized = entry.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    items.push(normalized);
  }

  return items;
};

const asConfigBoolean = (config: Record<string, unknown>, key: string, fallback = false) => {
  const value = config[key];
  return typeof value === "boolean" ? value : fallback;
};

const asConfigNumber = (
  config: Record<string, unknown>,
  key: string,
  options: { min?: number; max?: number; fallback: number }
) => {
  const value = config[key];
  if (typeof value !== "number" || Number.isNaN(value)) {
    return options.fallback;
  }

  const normalized = Math.trunc(value);

  if (typeof options.min === "number" && normalized < options.min) {
    return options.min;
  }

  if (typeof options.max === "number" && normalized > options.max) {
    return options.max;
  }

  return normalized;
};

const normalizeHomepageSectionConfig = (
  sectionType: HomepageSectionType,
  rawConfig: Record<string, unknown>
) => {
  if (sectionType === "hero") {
    return {
      autoplayMs: asConfigNumber(rawConfig, "autoplayMs", {
        fallback: 5000,
        min: 2000,
        max: 15000,
      }),
    };
  }

  if (sectionType === "product_list") {
    const sourceInput = asConfigString(rawConfig, "sourceType");
    const layoutInput = asConfigString(rawConfig, "layout");
    const sortByInput = asConfigString(rawConfig, "sortBy");
    const sortOrderInput = asConfigString(rawConfig, "sortOrder");

    return {
      sourceType: homepageProductSources.has(sourceInput as HomepageProductSourceType)
        ? (sourceInput as HomepageProductSourceType)
        : "featured",
      productIds: asConfigStringArray(rawConfig, "productIds"),
      categoryId: asConfigString(rawConfig, "categoryId") || null,
      brandId: asConfigString(rawConfig, "brandId") || null,
      tagId: asConfigString(rawConfig, "tagId") || null,
      layout: productSectionLayouts.has(layoutInput) ? layoutInput : "grid",
      sortBy: productSortByOptions.has(sortByInput) ? sortByInput : null,
      sortOrder: sortOrderOptions.has(sortOrderInput) ? sortOrderInput : "desc",
      hideIfEmpty: asConfigBoolean(rawConfig, "hideIfEmpty", true),
      emptyMessage: asConfigString(rawConfig, "emptyMessage"),
    };
  }

  if (sectionType === "category_list") {
    return {
      featuredOnly: asConfigBoolean(rawConfig, "featuredOnly", false),
    };
  }

  if (sectionType === "newsletter") {
    return {
      placeholder: asConfigString(rawConfig, "placeholder"),
      buttonLabel: asConfigString(rawConfig, "buttonLabel"),
      successMessage: asConfigString(rawConfig, "successMessage"),
      errorMessage: asConfigString(rawConfig, "errorMessage"),
    };
  }

  if (sectionType === "custom_banner") {
    return {
      badge: asConfigString(rawConfig, "badge"),
      title: asConfigString(rawConfig, "title"),
      description: asConfigString(rawConfig, "description"),
      ctaLabel: asConfigString(rawConfig, "ctaLabel"),
      ctaHref: asConfigString(rawConfig, "ctaHref"),
      highlightText: asConfigString(rawConfig, "highlightText"),
      imageUrl: asConfigString(rawConfig, "imageUrl"),
    };
  }

  if (sectionType === "links_group") {
    const group = asConfigString(rawConfig, "group");
    return {
      group: linksGroupOptions.has(group) ? group : "footer_quick",
    };
  }

  if (sectionType === "custom_html") {
    return {
      html: asConfigString(rawConfig, "html"),
    };
  }

  if (sectionType === "rich_text") {
    return {
      content: asConfigString(rawConfig, "content"),
    };
  }

  return {};
};

const ensureExistingCategory = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new Error("La categorie selectionnee n'existe plus.");
  }
};

const ensureExistingBrand = async (brandId: string) => {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true },
  });

  if (!brand) {
    throw new Error("La marque selectionnee n'existe plus.");
  }
};

const ensureExistingTag = async (tagId: string) => {
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    select: { id: true },
  });

  if (!tag) {
    throw new Error("Le tag selectionne n'existe plus.");
  }
};

const ensureExistingProducts = async (productIds: string[]) => {
  if (!productIds.length) {
    return [];
  }

  const records = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (records.length !== productIds.length) {
    throw new Error("Certains produits selectionnes n'existent plus.");
  }

  return productIds;
};

const validateHomepageSectionConfigReferences = async (
  sectionType: HomepageSectionType,
  config: Record<string, unknown>
) => {
  if (sectionType !== "product_list") {
    return [] as string[];
  }

  const sourceType = config.sourceType as HomepageProductSourceType | undefined;

  if (sourceType === "by_category") {
    const categoryId =
      typeof config.categoryId === "string" ? config.categoryId.trim() : "";
    if (!categoryId) {
      throw new Error("Selectionnez une categorie pour cette section produits.");
    }
    await ensureExistingCategory(categoryId);
  }

  if (sourceType === "by_brand") {
    const brandId = typeof config.brandId === "string" ? config.brandId.trim() : "";
    if (!brandId) {
      throw new Error("Selectionnez une marque pour cette section produits.");
    }
    await ensureExistingBrand(brandId);
  }

  if (sourceType === "by_tag") {
    const tagId = typeof config.tagId === "string" ? config.tagId.trim() : "";
    if (!tagId) {
      throw new Error("Selectionnez un tag pour cette section produits.");
    }
    await ensureExistingTag(tagId);
  }

  if (sourceType === "manual_selection") {
    const productIds = Array.isArray(config.productIds)
      ? config.productIds.filter((item): item is string => typeof item === "string")
      : [];

    await ensureExistingProducts(productIds);
    return productIds;
  }

  return [] as string[];
};

const deriveProductStatus = (discount: number, featured: boolean): ProductStatus => {
  if (discount > 0) {
    return "sale";
  }

  if (featured) {
    return "hot";
  }

  return "new";
};

const getValidCategoryRecords = async (categoryIds: string[]) => {
  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: categoryIds,
      },
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });

  if (!categories.length || categories.length !== categoryIds.length) {
    throw new Error("Merci de choisir au moins une categorie valide.");
  }

  return categories;
};

const getValidBrandRecord = async (brandId: string | null) => {
  if (!brandId) {
    return null;
  }

  const brand = await prisma.brand.findUnique({
    where: {
      id: brandId,
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });

  if (!brand) {
    throw new Error("La marque selectionnee est introuvable.");
  }

  return brand;
};

export async function createCategoryAction(formData: FormData) {
  return withAction("categories", "Impossible d'ajouter cette categorie.", async () => {
    const title = readText(formData, "title");
    const description = readOptionalText(formData, "description");
    const featured = readBoolean(formData, "featured");
    const imageFile = formData.get("imageFile");

    if (!title) {
      throw new Error("Veuillez saisir le nom de la categorie.");
    }

    const slug = await generateUniqueSlug("category", title);
    let uploadedImage: UploadedAsset | null = null;

    try {
      if (isUploadedFile(imageFile)) {
        uploadedImage = await saveOptimizedImage(imageFile, "categories", title);
      }

      await prisma.category.create({
        data: {
          title,
          slug,
          description,
          featured,
          imageUrl: uploadedImage?.url || null,
        },
      });
    } catch (error) {
      if (uploadedImage?.url) {
        await deleteStoredAsset(uploadedImage.url);
      }

      throw error;
    }

    refreshStorefront([`/category/${slug}`]);
    adminRedirect("categories", {
      status: "Categorie ajoutee.",
    });
  });
}

export async function updateCategoryAction(formData: FormData) {
  return withAction("categories", "Impossible de modifier cette categorie.", async () => {
    const id = requireId(readText(formData, "id"), "Categorie introuvable.");
    const title = readText(formData, "title");
    const description = readOptionalText(formData, "description");
    const featured = readBoolean(formData, "featured");
    const imageFile = formData.get("imageFile");

    if (!title) {
      throw new Error("Veuillez saisir le nom de la categorie.");
    }

    const existingCategory = await prisma.category.findUnique({
      where: {
        id,
      },
      select: {
        slug: true,
        imageUrl: true,
      },
    });

    if (!existingCategory) {
      throw new Error("Cette categorie n'existe plus.");
    }

    let uploadedImage: UploadedAsset | null = null;

    try {
      if (isUploadedFile(imageFile)) {
        uploadedImage = await saveOptimizedImage(imageFile, "categories", title);
      }

      await prisma.category.update({
        where: {
          id,
        },
        data: {
          title,
          description,
          featured,
          ...(uploadedImage?.url
            ? {
                imageUrl: uploadedImage.url,
              }
            : {}),
        },
      });
    } catch (error) {
      if (uploadedImage?.url) {
        await deleteStoredAsset(uploadedImage.url);
      }

      throw error;
    }

    if (uploadedImage?.url && existingCategory.imageUrl) {
      await deleteStoredAsset(existingCategory.imageUrl);
    }

    refreshStorefront([`/category/${existingCategory.slug}`]);
    adminRedirect("categories", {
      status: "Categorie mise a jour.",
    });
  });
}

export async function deleteCategoryAction(formData: FormData) {
  return withAction("categories", "Impossible de supprimer cette categorie.", async () => {
    const id = requireId(readText(formData, "id"), "Categorie introuvable.");
    const category = await prisma.category.findUnique({
      where: {
        id,
      },
      select: {
        slug: true,
        imageUrl: true,
      },
    });

    if (!category) {
      throw new Error("Cette categorie n'existe plus.");
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    await deleteStoredAsset(category.imageUrl);
    refreshStorefront([`/category/${category.slug}`]);
    adminRedirect("categories", {
      status: "Categorie supprimee.",
    });
  });
}

export async function createBrandAction(formData: FormData) {
  return withAction("brands", "Impossible d'ajouter cette marque.", async () => {
    const title = readText(formData, "title");
    const description = readOptionalText(formData, "description");
    const imageFile = formData.get("imageFile");

    if (!title) {
      throw new Error("Veuillez saisir le nom de la marque.");
    }

    const slug = await generateUniqueSlug("brand", title);
    let uploadedImage: UploadedAsset | null = null;

    try {
      if (isUploadedFile(imageFile)) {
        uploadedImage = await saveOptimizedImage(imageFile, "brands", title);
      }

      await prisma.brand.create({
        data: {
          title,
          slug,
          description,
          imageUrl: uploadedImage?.url || null,
        },
      });
    } catch (error) {
      if (uploadedImage?.url) {
        await deleteStoredAsset(uploadedImage.url);
      }

      throw error;
    }

    refreshStorefront([`/brand/${slug}`]);
    adminRedirect("brands", {
      status: "Marque ajoutee.",
    });
  });
}

export async function updateBrandAction(formData: FormData) {
  return withAction("brands", "Impossible de modifier cette marque.", async () => {
    const id = requireId(readText(formData, "id"), "Marque introuvable.");
    const title = readText(formData, "title");
    const description = readOptionalText(formData, "description");
    const imageFile = formData.get("imageFile");

    if (!title) {
      throw new Error("Veuillez saisir le nom de la marque.");
    }

    const existingBrand = await prisma.brand.findUnique({
      where: {
        id,
      },
      select: {
        slug: true,
        imageUrl: true,
      },
    });

    if (!existingBrand) {
      throw new Error("Cette marque n'existe plus.");
    }

    let uploadedImage: UploadedAsset | null = null;

    try {
      if (isUploadedFile(imageFile)) {
        uploadedImage = await saveOptimizedImage(imageFile, "brands", title);
      }

      await prisma.brand.update({
        where: {
          id,
        },
        data: {
          title,
          description,
          ...(uploadedImage?.url
            ? {
                imageUrl: uploadedImage.url,
              }
            : {}),
        },
      });
    } catch (error) {
      if (uploadedImage?.url) {
        await deleteStoredAsset(uploadedImage.url);
      }

      throw error;
    }

    if (uploadedImage?.url && existingBrand.imageUrl) {
      await deleteStoredAsset(existingBrand.imageUrl);
    }

    refreshStorefront([`/brand/${existingBrand.slug}`]);
    adminRedirect("brands", {
      status: "Marque mise a jour.",
    });
  });
}

export async function deleteBrandAction(formData: FormData) {
  return withAction("brands", "Impossible de supprimer cette marque.", async () => {
    const id = requireId(readText(formData, "id"), "Marque introuvable.");
    const brand = await prisma.brand.findUnique({
      where: {
        id,
      },
      select: {
        slug: true,
        imageUrl: true,
      },
    });

    if (!brand) {
      throw new Error("Cette marque n'existe plus.");
    }

    await prisma.brand.delete({
      where: {
        id,
      },
    });

    await deleteStoredAsset(brand.imageUrl);
    refreshStorefront([`/brand/${brand.slug}`]);
    adminRedirect("brands", {
      status: "Marque supprimee.",
    });
  });
}

export async function createProductAction(formData: FormData) {
  return withAction("products", "Impossible d'ajouter ce produit.", async () => {
    const name = readText(formData, "name");
    const description = readOptionalText(formData, "description");
    const price = readDecimal(formData, "price", { min: 0.01 });
    const discount = readInteger(formData, "discount", {
      min: 0,
      max: 100,
      defaultValue: 0,
    });
    const stock = readInteger(formData, "stock", { min: 0 });
    const brandId = readOptionalText(formData, "brandId");
    const categoryIds = readStringList(formData, "categoryIds");
    const imageFiles = readUploadedFiles(formData, "imageFiles");
    const isFeatured = readBoolean(formData, "isFeatured");

    if (!name) {
      throw new Error("Veuillez saisir le nom du produit.");
    }

    if (!categoryIds.length) {
      throw new Error("Choisissez au moins une categorie pour ce produit.");
    }

    if (!imageFiles.length) {
      throw new Error("Ajoutez au moins une photo du produit.");
    }

    if (imageFiles.length > 6) {
      throw new Error("Vous pouvez importer jusqu'a 6 photos par produit.");
    }

    const [categories, brand] = await Promise.all([
      getValidCategoryRecords(categoryIds),
      getValidBrandRecord(brandId),
    ]);
    const slug = await generateUniqueSlug("product", name);
    const regularPrice =
      discount > 0 ? Number((price + (discount * price) / 100).toFixed(2)) : price;
    const salePrice = discount > 0 ? price : null;
    const sku = slug.toUpperCase();
    let uploadedImages: UploadedAsset[] = [];

    try {
      uploadedImages = await Promise.all(
        imageFiles.map((file) => saveOptimizedImage(file, "products", name))
      );

      await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            name,
            slug,
            sku,
            description,
            price,
            regularPrice,
            salePrice,
            discount,
            stock,
            status: deriveProductStatus(discount, isFeatured),
            isFeatured,
            brandId: brand?.id || null,
          },
          select: {
            id: true,
          },
        });

        await tx.productCategory.createMany({
          data: categories.map((category) => ({
            productId: product.id,
            categoryId: category.id,
          })),
        });

        await tx.productImage.createMany({
          data: uploadedImages.map((image, index) => ({
            productId: product.id,
            url: image.url,
            altText: name,
            sortOrder: index,
          })),
        });
      });
    } catch (error) {
      if (uploadedImages.length > 0) {
        await deleteStoredAssets(uploadedImages.map((image) => image.url));
      }

      throw error;
    }

    refreshStorefront([
      `/product/${slug}`,
      ...categories.map((category) => `/category/${category.slug}`),
      brand ? `/brand/${brand.slug}` : null,
    ]);
    adminRedirect("products", {
      status: "Produit ajoute.",
    });
  });
}

export async function updateProductAction(formData: FormData) {
  return withAction("products", "Impossible de modifier ce produit.", async () => {
    const id = requireId(readText(formData, "id"), "Produit introuvable.");
    const name = readText(formData, "name");
    const description = readOptionalText(formData, "description");
    const price = readDecimal(formData, "price", { min: 0.01 });
    const discount = readInteger(formData, "discount", {
      min: 0,
      max: 100,
      defaultValue: 0,
    });
    const stock = readInteger(formData, "stock", { min: 0 });
    const brandId = readOptionalText(formData, "brandId");
    const categoryIds = readStringList(formData, "categoryIds");
    const imageFiles = readUploadedFiles(formData, "imageFiles");
    const isFeatured = readBoolean(formData, "isFeatured");

    if (!name) {
      throw new Error("Veuillez saisir le nom du produit.");
    }

    if (!categoryIds.length) {
      throw new Error("Choisissez au moins une categorie pour ce produit.");
    }

    if (imageFiles.length > 6) {
      throw new Error("Vous pouvez importer jusqu'a 6 photos par produit.");
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        id,
      },
      select: {
        slug: true,
        brand: {
          select: {
            slug: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                slug: true,
              },
            },
          },
        },
        images: {
          orderBy: {
            sortOrder: "asc",
          },
          select: {
            url: true,
          },
        },
      },
    });

    if (!existingProduct) {
      throw new Error("Ce produit n'existe plus.");
    }

    const [categories, brand] = await Promise.all([
      getValidCategoryRecords(categoryIds),
      getValidBrandRecord(brandId),
    ]);
    const regularPrice =
      discount > 0 ? Number((price + (discount * price) / 100).toFixed(2)) : price;
    const salePrice = discount > 0 ? price : null;

    let uploadedImages: UploadedAsset[] = [];

    try {
      if (imageFiles.length > 0) {
        uploadedImages = await Promise.all(
          imageFiles.map((file) => saveOptimizedImage(file, "products", name))
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: {
            id,
          },
          data: {
            name,
            description,
            price,
            regularPrice,
            salePrice,
            discount,
            stock,
            status: deriveProductStatus(discount, isFeatured),
            isFeatured,
            brandId: brand?.id || null,
          },
          select: {
            id: true,
          },
        });

        await tx.productCategory.deleteMany({
          where: {
            productId: id,
          },
        });

        await tx.productCategory.createMany({
          data: categories.map((category) => ({
            productId: id,
            categoryId: category.id,
          })),
        });

        if (uploadedImages.length > 0) {
          await tx.productImage.deleteMany({
            where: {
              productId: id,
            },
          });

          await tx.productImage.createMany({
            data: uploadedImages.map((image, index) => ({
              productId: id,
              url: image.url,
              altText: name,
              sortOrder: index,
            })),
          });
        }
      });
    } catch (error) {
      if (uploadedImages.length > 0) {
        await deleteStoredAssets(uploadedImages.map((image) => image.url));
      }

      throw error;
    }

    if (uploadedImages.length > 0) {
      await deleteStoredAssets(existingProduct.images.map((image) => image.url));
    }

    refreshStorefront([
      `/product/${existingProduct.slug}`,
      ...existingProduct.categories.map((item) => `/category/${item.category.slug}`),
      ...categories.map((category) => `/category/${category.slug}`),
      existingProduct.brand?.slug ? `/brand/${existingProduct.brand.slug}` : null,
      brand ? `/brand/${brand.slug}` : null,
    ]);
    adminRedirect("products", {
      status: "Produit mis a jour.",
    });
  });
}

export async function deleteProductAction(formData: FormData) {
  return withAction("products", "Impossible de supprimer ce produit.", async () => {
    const id = requireId(readText(formData, "id"), "Produit introuvable.");
    const product = await prisma.product.findUnique({
      where: {
        id,
      },
      select: {
        slug: true,
        brand: {
          select: {
            slug: true,
          },
        },
        categories: {
          select: {
            category: {
              select: {
                slug: true,
              },
            },
          },
        },
        images: {
          select: {
            url: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error("Ce produit n'existe plus.");
    }

    await prisma.product.delete({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    await deleteStoredAssets(product.images.map((image) => image.url));
    refreshStorefront([
      `/product/${product.slug}`,
      ...product.categories.map((item) => `/category/${item.category.slug}`),
      product.brand?.slug ? `/brand/${product.brand.slug}` : null,
    ]);
    adminRedirect("products", {
      status: "Produit supprime.",
    });
  });
}

export async function createPromoCodeAction(formData: FormData) {
  return withAction("promos", "Impossible d'ajouter ce code promo.", async () => {
    const title = readText(formData, "title");
    const requestedCode = readText(formData, "code");
    const discountValue = readInteger(formData, "discountValue", {
      min: 1,
      max: 100,
    });
    const endsAt = readDate(formData, "endsAt");
    const active = readBoolean(formData, "active");

    if (!title) {
      throw new Error("Veuillez saisir un nom pour ce code promo.");
    }

    const code = await generateUniquePromoCode(requestedCode || title);

    await prisma.promoCode.create({
      data: {
        title,
        code,
        active,
        discountType: "percentage",
        discountValue,
        minimumOrderAmount: 0,
        allowedPaymentMethods: allPaymentMethods,
        endsAt,
      },
    });

    refreshStorefront();
    adminRedirect("promos", {
      status: "Code promo ajoute.",
    });
  });
}

export async function updatePromoCodeAction(formData: FormData) {
  return withAction("promos", "Impossible de modifier ce code promo.", async () => {
    const id = requireId(readText(formData, "id"), "Code promo introuvable.");
    const title = readText(formData, "title");
    const requestedCode = readText(formData, "code");
    const discountValue = readInteger(formData, "discountValue", {
      min: 1,
      max: 100,
    });
    const endsAt = readDate(formData, "endsAt");
    const active = readBoolean(formData, "active");

    if (!title) {
      throw new Error("Veuillez saisir un nom pour ce code promo.");
    }

    const existingPromo = await prisma.promoCode.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingPromo) {
      throw new Error("Ce code promo n'existe plus.");
    }

    const code = await generateUniquePromoCode(requestedCode || title, id);

    await prisma.promoCode.update({
      where: {
        id,
      },
      data: {
        title,
        code,
        active,
        discountType: "percentage",
        discountValue,
        minimumOrderAmount: 0,
        allowedPaymentMethods: allPaymentMethods,
        startsAt: null,
        endsAt,
        usageLimit: null,
      },
    });

    refreshStorefront();
    adminRedirect("promos", {
      status: "Code promo mis a jour.",
    });
  });
}

export async function deletePromoCodeAction(formData: FormData) {
  return withAction("promos", "Impossible de supprimer ce code promo.", async () => {
    const id = requireId(readText(formData, "id"), "Code promo introuvable.");

    await prisma.promoCode.delete({
      where: {
        id,
      },
    });

    refreshStorefront();
    adminRedirect("promos", {
      status: "Code promo supprime.",
    });
  });
}

export async function createHomepageSectionAction(formData: FormData) {
  return withAction("homepage", "Impossible d'ajouter cette section homepage.", async () => {
    const sectionType = readHomepageSectionType(formData, "type");
    const title = requireTextField(
      readText(formData, "title"),
      "Le titre de section est obligatoire."
    );
    const keyInput = readText(formData, "key") || title;
    const key = await generateUniqueHomepageSectionKey(keyInput);
    const rawConfig = readJsonObject(formData, "configJson");
    const config = normalizeHomepageSectionConfig(sectionType, rawConfig);
    const manualProductIds = await validateHomepageSectionConfigReferences(sectionType, config);

    const createdSection = await prisma.homepageSection.create({
      data: {
        key,
        type: sectionType,
        title,
        subtitle: readOptionalText(formData, "subtitle"),
        isActive: readBoolean(formData, "isActive"),
        order: readInteger(formData, "order", {
          min: 0,
          max: 500,
          defaultValue: 0,
        }),
        layout: readOptionalText(formData, "layout"),
        theme: readOptionalText(formData, "theme"),
        ctaLabel: readOptionalText(formData, "ctaLabel"),
        ctaLink: readOptionalText(formData, "ctaLink"),
        limit: readOptionalInteger(formData, "limit", {
          min: 1,
          max: 50,
        }),
        config,
      },
      select: {
        id: true,
      },
    });

    if (manualProductIds.length) {
      await prisma.homepageSectionProduct.createMany({
        data: manualProductIds.map((productId, index) => ({
          sectionId: createdSection.id,
          productId,
          sortOrder: index,
        })),
      });
    }

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Section homepage ajoutee.",
    });
  });
}

export async function updateHomepageSectionAction(formData: FormData) {
  return withAction("homepage", "Impossible de modifier cette section homepage.", async () => {
    const id = requireId(readText(formData, "id"), "Section introuvable.");
    const sectionType = readHomepageSectionType(formData, "type");
    const title = requireTextField(
      readText(formData, "title"),
      "Le titre de section est obligatoire."
    );
    const existing = await prisma.homepageSection.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new Error("Cette section n'existe plus.");
    }

    const keyInput = readText(formData, "key") || title;
    const key = await generateUniqueHomepageSectionKey(keyInput, id);
    const rawConfig = readJsonObject(formData, "configJson");
    const config = normalizeHomepageSectionConfig(sectionType, rawConfig);
    const manualProductIds = await validateHomepageSectionConfigReferences(sectionType, config);

    await prisma.$transaction(async (tx) => {
      await tx.homepageSection.update({
        where: {
          id,
        },
        data: {
          key,
          type: sectionType,
          title,
          subtitle: readOptionalText(formData, "subtitle"),
          isActive: readBoolean(formData, "isActive"),
          order: readInteger(formData, "order", {
            min: 0,
            max: 500,
            defaultValue: 0,
          }),
          layout: readOptionalText(formData, "layout"),
          theme: readOptionalText(formData, "theme"),
          ctaLabel: readOptionalText(formData, "ctaLabel"),
          ctaLink: readOptionalText(formData, "ctaLink"),
          limit: readOptionalInteger(formData, "limit", {
            min: 1,
            max: 50,
          }),
          config,
        },
      });

      await tx.homepageSectionProduct.deleteMany({
        where: {
          sectionId: id,
        },
      });

      if (manualProductIds.length) {
        await tx.homepageSectionProduct.createMany({
          data: manualProductIds.map((productId, index) => ({
            sectionId: id,
            productId,
            sortOrder: index,
          })),
        });
      }
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Section homepage mise a jour.",
    });
  });
}

export async function deleteHomepageSectionAction(formData: FormData) {
  return withAction("homepage", "Impossible de supprimer cette section homepage.", async () => {
    const id = requireId(readText(formData, "id"), "Section introuvable.");

    await prisma.homepageSection.delete({
      where: {
        id,
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Section homepage supprimee.",
    });
  });
}

export async function toggleHomepageSectionStatusAction(formData: FormData) {
  return withAction("homepage", "Impossible de changer le statut de cette section.", async () => {
    const id = requireId(readText(formData, "id"), "Section introuvable.");
    const isActive = readText(formData, "isActive") === "1";

    await prisma.homepageSection.update({
      where: {
        id,
      },
      data: {
        isActive,
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: isActive ? "Section activee." : "Section desactivee.",
    });
  });
}

export async function reorderHomepageSectionAction(formData: FormData) {
  return withAction("homepage", "Impossible de reordonner les sections homepage.", async () => {
    const id = requireId(readText(formData, "id"), "Section introuvable.");
    const direction = readText(formData, "direction");

    if (direction !== "up" && direction !== "down") {
      throw new Error("Direction de tri invalide.");
    }

    const sections = await prisma.homepageSection.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
      },
    });

    const currentIndex = sections.findIndex((section) => section.id === id);
    if (currentIndex < 0) {
      throw new Error("Section introuvable.");
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) {
      adminRedirect("homepage", {
        status: "Ordre inchange.",
      });
    }

    const reordered = [...sections];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    await prisma.$transaction(
      reordered.map((section, index) =>
        prisma.homepageSection.update({
          where: {
            id: section.id,
          },
          data: {
            order: index,
          },
        })
      )
    );

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Ordre des sections mis a jour.",
    });
  });
}

export async function updateStorefrontSettingsAction(formData: FormData) {
  return withAction("homepage", "Impossible de mettre a jour les reglages homepage.", async () => {
    const announcementText = requireTextField(
      readText(formData, "announcementText"),
      "Le texte de la barre d'annonce est obligatoire."
    );
    const featuredCategoriesTitle = requireTextField(
      readText(formData, "featuredCategoriesTitle"),
      "Le titre de la section categories est obligatoire."
    );
    const promotionsTitle = requireTextField(
      readText(formData, "promotionsTitle"),
      "Le titre de la section promotions est obligatoire."
    );
    const bestSellersTitle = requireTextField(
      readText(formData, "bestSellersTitle"),
      "Le titre de la section meilleures ventes est obligatoire."
    );
    const newArrivalsTitle = requireTextField(
      readText(formData, "newArrivalsTitle"),
      "Le titre de la section nouveautes est obligatoire."
    );
    const brandsTitle = requireTextField(
      readText(formData, "brandsTitle"),
      "Le titre de la section marques est obligatoire."
    );
    const trustTitle = requireTextField(
      readText(formData, "trustTitle"),
      "Le titre de la section confiance est obligatoire."
    );
    const loyaltyTitle = requireTextField(
      readText(formData, "loyaltyTitle"),
      "Le titre de la section fidelite est obligatoire."
    );
    const loyaltyDescription = requireTextField(
      readText(formData, "loyaltyDescription"),
      "La description de la section fidelite est obligatoire."
    );
    const loyaltyCtaLabel = requireTextField(
      readText(formData, "loyaltyCtaLabel"),
      "Le libelle du bouton fidelite est obligatoire."
    );
    const loyaltyCtaHref = requireTextField(
      readText(formData, "loyaltyCtaHref"),
      "Le lien du bouton fidelite est obligatoire."
    );
    const newsletterTitle = requireTextField(
      readText(formData, "newsletterTitle"),
      "Le titre newsletter est obligatoire."
    );
    const newsletterDescription = requireTextField(
      readText(formData, "newsletterDescription"),
      "La description newsletter est obligatoire."
    );
    const newsletterPlaceholder = requireTextField(
      readText(formData, "newsletterPlaceholder"),
      "Le placeholder newsletter est obligatoire."
    );
    const newsletterButtonLabel = requireTextField(
      readText(formData, "newsletterButtonLabel"),
      "Le bouton newsletter est obligatoire."
    );
    const newsletterSuccessMessage = requireTextField(
      readText(formData, "newsletterSuccessMessage"),
      "Le message de succes newsletter est obligatoire."
    );
    const newsletterErrorMessage = requireTextField(
      readText(formData, "newsletterErrorMessage"),
      "Le message d'erreur newsletter est obligatoire."
    );
    const footerAboutTitle = requireTextField(
      readText(formData, "footerAboutTitle"),
      "Le titre du bloc a propos est obligatoire."
    );
    const footerAboutDescription = requireTextField(
      readText(formData, "footerAboutDescription"),
      "La description du bloc a propos est obligatoire."
    );
    const footerQuickLinksTitle = requireTextField(
      readText(formData, "footerQuickLinksTitle"),
      "Le titre des liens rapides est obligatoire."
    );
    const footerLegalLinksTitle = requireTextField(
      readText(formData, "footerLegalLinksTitle"),
      "Le titre des liens legaux est obligatoire."
    );
    const footerCategoriesTitle = requireTextField(
      readText(formData, "footerCategoriesTitle"),
      "Le titre des categories footer est obligatoire."
    );
    const footerCopyrightText = requireTextField(
      readText(formData, "footerCopyrightText"),
      "Le texte copyright est obligatoire."
    );

    await prisma.storefrontSettings.upsert({
      where: {
        id: "default",
      },
      update: {
        announcementEnabled: readBoolean(formData, "announcementEnabled"),
        announcementText,
        announcementHref: readOptionalText(formData, "announcementHref"),
        heroAutoplayMs: readInteger(formData, "heroAutoplayMs", {
          min: 2000,
          max: 15000,
          defaultValue: 5000,
        }),
        featuredCategoriesTitle,
        featuredCategoriesSubtitle: readText(formData, "featuredCategoriesSubtitle"),
        promotionsTitle,
        promotionsSubtitle: readText(formData, "promotionsSubtitle"),
        bestSellersTitle,
        bestSellersSubtitle: readText(formData, "bestSellersSubtitle"),
        newArrivalsTitle,
        newArrivalsSubtitle: readText(formData, "newArrivalsSubtitle"),
        brandsTitle,
        brandsSubtitle: readText(formData, "brandsSubtitle"),
        trustTitle,
        trustSubtitle: readText(formData, "trustSubtitle"),
        loyaltyBadge: readText(formData, "loyaltyBadge"),
        loyaltyTitle,
        loyaltyDescription,
        loyaltyCtaLabel,
        loyaltyCtaHref,
        loyaltyHighlightText: readText(formData, "loyaltyHighlightText"),
        loyaltyImageUrl: readOptionalText(formData, "loyaltyImageUrl"),
        newsletterTitle,
        newsletterDescription,
        newsletterPlaceholder,
        newsletterButtonLabel,
        newsletterSuccessMessage,
        newsletterErrorMessage,
        footerAboutTitle,
        footerAboutDescription,
        footerQuickLinksTitle,
        footerLegalLinksTitle,
        footerCategoriesTitle,
        footerContactPhone: readOptionalText(formData, "footerContactPhone"),
        footerContactEmail: readOptionalText(formData, "footerContactEmail"),
        footerContactHours: readOptionalText(formData, "footerContactHours"),
        footerCopyrightText,
        featuredCategoriesLimit: readInteger(formData, "featuredCategoriesLimit", {
          min: 1,
          max: 16,
          defaultValue: 8,
        }),
        promotionsLimit: readInteger(formData, "promotionsLimit", {
          min: 1,
          max: 24,
          defaultValue: 10,
        }),
        bestSellersLimit: readInteger(formData, "bestSellersLimit", {
          min: 1,
          max: 24,
          defaultValue: 10,
        }),
        newArrivalsLimit: readInteger(formData, "newArrivalsLimit", {
          min: 1,
          max: 24,
          defaultValue: 10,
        }),
        brandsLimit: readInteger(formData, "brandsLimit", {
          min: 1,
          max: 18,
          defaultValue: 12,
        }),
      },
      create: {
        id: "default",
        announcementEnabled: readBoolean(formData, "announcementEnabled"),
        announcementText,
        announcementHref: readOptionalText(formData, "announcementHref"),
        heroAutoplayMs: readInteger(formData, "heroAutoplayMs", {
          min: 2000,
          max: 15000,
          defaultValue: 5000,
        }),
        featuredCategoriesTitle,
        featuredCategoriesSubtitle: readText(formData, "featuredCategoriesSubtitle"),
        promotionsTitle,
        promotionsSubtitle: readText(formData, "promotionsSubtitle"),
        bestSellersTitle,
        bestSellersSubtitle: readText(formData, "bestSellersSubtitle"),
        newArrivalsTitle,
        newArrivalsSubtitle: readText(formData, "newArrivalsSubtitle"),
        brandsTitle,
        brandsSubtitle: readText(formData, "brandsSubtitle"),
        trustTitle,
        trustSubtitle: readText(formData, "trustSubtitle"),
        loyaltyBadge: readText(formData, "loyaltyBadge"),
        loyaltyTitle,
        loyaltyDescription,
        loyaltyCtaLabel,
        loyaltyCtaHref,
        loyaltyHighlightText: readText(formData, "loyaltyHighlightText"),
        loyaltyImageUrl: readOptionalText(formData, "loyaltyImageUrl"),
        newsletterTitle,
        newsletterDescription,
        newsletterPlaceholder,
        newsletterButtonLabel,
        newsletterSuccessMessage,
        newsletterErrorMessage,
        footerAboutTitle,
        footerAboutDescription,
        footerQuickLinksTitle,
        footerLegalLinksTitle,
        footerCategoriesTitle,
        footerContactPhone: readOptionalText(formData, "footerContactPhone"),
        footerContactEmail: readOptionalText(formData, "footerContactEmail"),
        footerContactHours: readOptionalText(formData, "footerContactHours"),
        footerCopyrightText,
        featuredCategoriesLimit: readInteger(formData, "featuredCategoriesLimit", {
          min: 1,
          max: 16,
          defaultValue: 8,
        }),
        promotionsLimit: readInteger(formData, "promotionsLimit", {
          min: 1,
          max: 24,
          defaultValue: 10,
        }),
        bestSellersLimit: readInteger(formData, "bestSellersLimit", {
          min: 1,
          max: 24,
          defaultValue: 10,
        }),
        newArrivalsLimit: readInteger(formData, "newArrivalsLimit", {
          min: 1,
          max: 24,
          defaultValue: 10,
        }),
        brandsLimit: readInteger(formData, "brandsLimit", {
          min: 1,
          max: 18,
          defaultValue: 12,
        }),
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Reglages homepage mis a jour.",
    });
  });
}

export async function createHomeHeroSlideAction(formData: FormData) {
  return withAction("homepage", "Impossible d'ajouter ce slide hero.", async () => {
    const title = requireTextField(readText(formData, "title"), "Le titre du slide est obligatoire.");
    const imageFile = formData.get("imageFile");
    const imageUrlInput = readOptionalText(formData, "imageUrl");
    let uploadedImage: UploadedAsset | null = null;

    try {
      if (isUploadedFile(imageFile)) {
        uploadedImage = await saveOptimizedImage(imageFile, "homepage", title);
      }

      await prisma.homeHeroSlide.create({
        data: {
          badge: readOptionalText(formData, "badge"),
          title,
          subtitle: readOptionalText(formData, "subtitle"),
          ctaLabel: readOptionalText(formData, "ctaLabel"),
          ctaHref: readOptionalText(formData, "ctaHref"),
          imageUrl: uploadedImage?.url || imageUrlInput,
          altText: readOptionalText(formData, "altText"),
          sortOrder: readInteger(formData, "sortOrder", {
            min: 0,
            max: 200,
            defaultValue: 0,
          }),
          isActive: readBoolean(formData, "isActive"),
        },
      });
    } catch (error) {
      if (uploadedImage?.url) {
        await deleteStoredAsset(uploadedImage.url);
      }
      throw error;
    }

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Slide hero ajoute.",
    });
  });
}

export async function updateHomeHeroSlideAction(formData: FormData) {
  return withAction("homepage", "Impossible de modifier ce slide hero.", async () => {
    const id = requireId(readText(formData, "id"), "Slide hero introuvable.");
    const title = requireTextField(readText(formData, "title"), "Le titre du slide est obligatoire.");
    const imageFile = formData.get("imageFile");
    const imageUrlInput = readOptionalText(formData, "imageUrl");
    const removeImage = readBoolean(formData, "removeImage");

    const existing = await prisma.homeHeroSlide.findUnique({
      where: {
        id,
      },
      select: {
        imageUrl: true,
      },
    });

    if (!existing) {
      throw new Error("Ce slide hero n'existe plus.");
    }

    let uploadedImage: UploadedAsset | null = null;
    let nextImageUrl = existing.imageUrl;

    try {
      if (isUploadedFile(imageFile)) {
        uploadedImage = await saveOptimizedImage(imageFile, "homepage", title);
      }

      if (removeImage) {
        nextImageUrl = null;
      }

      if (imageUrlInput !== null) {
        nextImageUrl = imageUrlInput;
      }

      if (uploadedImage?.url) {
        nextImageUrl = uploadedImage.url;
      }

      await prisma.homeHeroSlide.update({
        where: {
          id,
        },
        data: {
          badge: readOptionalText(formData, "badge"),
          title,
          subtitle: readOptionalText(formData, "subtitle"),
          ctaLabel: readOptionalText(formData, "ctaLabel"),
          ctaHref: readOptionalText(formData, "ctaHref"),
          imageUrl: nextImageUrl,
          altText: readOptionalText(formData, "altText"),
          sortOrder: readInteger(formData, "sortOrder", {
            min: 0,
            max: 200,
            defaultValue: 0,
          }),
          isActive: readBoolean(formData, "isActive"),
        },
      });
    } catch (error) {
      if (uploadedImage?.url) {
        await deleteStoredAsset(uploadedImage.url);
      }
      throw error;
    }

    if (existing.imageUrl && existing.imageUrl !== nextImageUrl) {
      await deleteStoredAsset(existing.imageUrl);
    }

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Slide hero mis a jour.",
    });
  });
}

export async function deleteHomeHeroSlideAction(formData: FormData) {
  return withAction("homepage", "Impossible de supprimer ce slide hero.", async () => {
    const id = requireId(readText(formData, "id"), "Slide hero introuvable.");
    const existing = await prisma.homeHeroSlide.findUnique({
      where: {
        id,
      },
      select: {
        imageUrl: true,
      },
    });

    if (!existing) {
      throw new Error("Ce slide hero n'existe plus.");
    }

    await prisma.homeHeroSlide.delete({
      where: {
        id,
      },
    });

    await deleteStoredAsset(existing.imageUrl);
    refreshStorefront();
    adminRedirect("homepage", {
      status: "Slide hero supprime.",
    });
  });
}

export async function createHomeTrustItemAction(formData: FormData) {
  return withAction("homepage", "Impossible d'ajouter ce bloc de confiance.", async () => {
    const title = requireTextField(readText(formData, "title"), "Le titre est obligatoire.");
    const description = requireTextField(
      readText(formData, "description"),
      "La description est obligatoire."
    );
    const icon = requireTextField(readText(formData, "icon"), "L'icone est obligatoire.");

    await prisma.homeTrustItem.create({
      data: {
        title,
        description,
        icon,
        sortOrder: readInteger(formData, "sortOrder", {
          min: 0,
          max: 200,
          defaultValue: 0,
        }),
        isActive: readBoolean(formData, "isActive"),
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Bloc de confiance ajoute.",
    });
  });
}

export async function updateHomeTrustItemAction(formData: FormData) {
  return withAction("homepage", "Impossible de modifier ce bloc de confiance.", async () => {
    const id = requireId(readText(formData, "id"), "Bloc de confiance introuvable.");
    const title = requireTextField(readText(formData, "title"), "Le titre est obligatoire.");
    const description = requireTextField(
      readText(formData, "description"),
      "La description est obligatoire."
    );
    const icon = requireTextField(readText(formData, "icon"), "L'icone est obligatoire.");

    await prisma.homeTrustItem.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        icon,
        sortOrder: readInteger(formData, "sortOrder", {
          min: 0,
          max: 200,
          defaultValue: 0,
        }),
        isActive: readBoolean(formData, "isActive"),
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Bloc de confiance mis a jour.",
    });
  });
}

export async function deleteHomeTrustItemAction(formData: FormData) {
  return withAction("homepage", "Impossible de supprimer ce bloc de confiance.", async () => {
    const id = requireId(readText(formData, "id"), "Bloc de confiance introuvable.");

    await prisma.homeTrustItem.delete({
      where: {
        id,
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Bloc de confiance supprime.",
    });
  });
}

export async function createSiteLinkAction(formData: FormData) {
  return withAction("homepage", "Impossible d'ajouter ce lien.", async () => {
    const title = requireTextField(readText(formData, "title"), "Le titre du lien est obligatoire.");
    const href = requireTextField(readText(formData, "href"), "L'URL du lien est obligatoire.");

    await prisma.siteLink.create({
      data: {
        group: readSiteLinkGroup(formData, "group"),
        title,
        href,
        sortOrder: readInteger(formData, "sortOrder", {
          min: 0,
          max: 200,
          defaultValue: 0,
        }),
        openInNewTab: readBoolean(formData, "openInNewTab"),
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Lien ajoute.",
    });
  });
}

export async function updateSiteLinkAction(formData: FormData) {
  return withAction("homepage", "Impossible de modifier ce lien.", async () => {
    const id = requireId(readText(formData, "id"), "Lien introuvable.");
    const title = requireTextField(readText(formData, "title"), "Le titre du lien est obligatoire.");
    const href = requireTextField(readText(formData, "href"), "L'URL du lien est obligatoire.");

    await prisma.siteLink.update({
      where: {
        id,
      },
      data: {
        group: readSiteLinkGroup(formData, "group"),
        title,
        href,
        sortOrder: readInteger(formData, "sortOrder", {
          min: 0,
          max: 200,
          defaultValue: 0,
        }),
        openInNewTab: readBoolean(formData, "openInNewTab"),
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Lien mis a jour.",
    });
  });
}

export async function deleteSiteLinkAction(formData: FormData) {
  return withAction("homepage", "Impossible de supprimer ce lien.", async () => {
    const id = requireId(readText(formData, "id"), "Lien introuvable.");

    await prisma.siteLink.delete({
      where: {
        id,
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Lien supprime.",
    });
  });
}

export async function createSiteSocialLinkAction(formData: FormData) {
  return withAction("homepage", "Impossible d'ajouter ce reseau social.", async () => {
    const platform = requireTextField(
      readText(formData, "platform"),
      "La plateforme est obligatoire."
    );
    const title = requireTextField(readText(formData, "title"), "Le titre est obligatoire.");
    const href = requireTextField(readText(formData, "href"), "L'URL est obligatoire.");

    await prisma.siteSocialLink.create({
      data: {
        platform,
        title,
        href,
        sortOrder: readInteger(formData, "sortOrder", {
          min: 0,
          max: 200,
          defaultValue: 0,
        }),
        openInNewTab: readBoolean(formData, "openInNewTab"),
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Reseau social ajoute.",
    });
  });
}

export async function updateSiteSocialLinkAction(formData: FormData) {
  return withAction("homepage", "Impossible de modifier ce reseau social.", async () => {
    const id = requireId(readText(formData, "id"), "Reseau social introuvable.");
    const platform = requireTextField(
      readText(formData, "platform"),
      "La plateforme est obligatoire."
    );
    const title = requireTextField(readText(formData, "title"), "Le titre est obligatoire.");
    const href = requireTextField(readText(formData, "href"), "L'URL est obligatoire.");

    await prisma.siteSocialLink.update({
      where: {
        id,
      },
      data: {
        platform,
        title,
        href,
        sortOrder: readInteger(formData, "sortOrder", {
          min: 0,
          max: 200,
          defaultValue: 0,
        }),
        openInNewTab: readBoolean(formData, "openInNewTab"),
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Reseau social mis a jour.",
    });
  });
}

export async function deleteSiteSocialLinkAction(formData: FormData) {
  return withAction("homepage", "Impossible de supprimer ce reseau social.", async () => {
    const id = requireId(readText(formData, "id"), "Reseau social introuvable.");

    await prisma.siteSocialLink.delete({
      where: {
        id,
      },
    });

    refreshStorefront();
    adminRedirect("homepage", {
      status: "Reseau social supprime.",
    });
  });
}

export async function updateOrderStatusAction(formData: FormData) {
  return withAction("orders", "Impossible de mettre a jour cette commande.", async () => {
    const id = requireId(readText(formData, "id"), "Commande introuvable.");
    const nextStage = readText(formData, "status");
    const allowedStages = new Set(adminOrderStageOptions.map((option) => option.value));

    if (!allowedStages.has(nextStage as (typeof adminOrderStageOptions)[number]["value"])) {
      throw new Error("Le statut choisi n'est pas valide.");
    }

    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      select: {
        paymentMethod: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      throw new Error("Cette commande n'existe plus.");
    }

    const status = adminStageToOrderStatus(
      nextStage as (typeof adminOrderStageOptions)[number]["value"]
    );

    await prisma.order.update({
      where: {
        id,
      },
      data: {
        status,
        ...(status === "delivered" &&
        order.paymentMethod === "cod" &&
        order.paymentStatus !== "paid"
          ? {
              paymentStatus: "paid",
            }
          : {}),
      },
    });

    refreshStorefront(["/orders"]);
    adminRedirect("orders", {
      status: "Statut de commande mis a jour.",
    });
  });
}
