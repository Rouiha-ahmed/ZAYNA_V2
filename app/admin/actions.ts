"use server";

import { PaymentMethod, type ProductStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { adminOrderStageOptions, adminStageToOrderStatus, requireAdmin } from "@/lib/admin";
import { deleteStoredAsset, deleteStoredAssets, isUploadedFile, saveOptimizedImage } from "@/lib/admin-media";
import { prisma } from "@/lib/prisma";

type AdminSection =
  | "dashboard"
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
  redirect(`/admin${query ? `?${query}` : ""}#${section}`);
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
            description,
            price,
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
      include: {
        brand: {
          select: {
            slug: true,
          },
        },
        categories: {
          include: {
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
            discount,
            stock,
            status: deriveProductStatus(discount, isFeatured),
            isFeatured,
            brandId: brand?.id || null,
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
      include: {
        brand: {
          select: {
            slug: true,
          },
        },
        categories: {
          include: {
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
