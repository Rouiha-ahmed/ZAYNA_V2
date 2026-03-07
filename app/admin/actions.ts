"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PaymentMethod, Prisma, ProductStatus, PromoDiscountType } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const IMAGE_ROOT = path.join(process.cwd(), "images");
const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MIME_TO_EXTENSION = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
]);

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const normalizePromoCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s-_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const parseNumber = (value: FormDataEntryValue | null, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOptionalDate = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isUploadedFile = (value: FormDataEntryValue | null): value is File =>
  typeof File !== "undefined" && value instanceof File && value.size > 0;

const getUploadExtension = (file: File) => {
  const mimeExtension = MIME_TO_EXTENSION.get(file.type.toLowerCase());
  if (mimeExtension) {
    return mimeExtension;
  }

  const filenameExtension = path.extname(file.name || "").toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.has(filenameExtension) ? filenameExtension : null;
};

const saveImageFile = async (
  file: File,
  directory: "brands" | "products" | "categories",
  baseName: string
) => {
  const extension = getUploadExtension(file);

  if (!extension) {
    throw new Error("Le fichier image doit etre en PNG, JPG ou WEBP.");
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("Chaque image doit faire moins de 5 Mo.");
  }

  const safeBaseName = normalizeSlug(baseName) || directory;
  const fileName = `${safeBaseName}-${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
  const targetDirectory = path.join(IMAGE_ROOT, directory);
  const targetPath = path.join(targetDirectory, fileName);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await mkdir(targetDirectory, { recursive: true });
  await writeFile(targetPath, fileBuffer);

  return `/api/assets/${directory}/${fileName}`;
};

const getErrorMessage = (error: unknown) => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "Une valeur unique existe deja. Verifiez le slug ou le code.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
};

const adminRedirect = (params: Record<string, string | undefined>, hash?: string) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  const query = search.toString();
  redirect(`/admin${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`);
};

const refreshStorefront = () => {
  revalidatePath("/admin");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/deal");
  revalidatePath("/brand/[slug]", "page");
  revalidatePath("/category/[slug]", "page");
  revalidatePath("/product/[slug]", "page");
};

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const slug = normalizeSlug(rawSlug || title);
  const description = String(formData.get("description") || "").trim() || null;
  const rangeRaw = String(formData.get("range") || "").trim();
  const manualImageUrl = String(formData.get("imageUrl") || "").trim() || null;
  const imageFile = formData.get("imageFile");
  const featured = formData.get("featured") === "on";

  if (!title) {
    adminRedirect({ error: "Le titre de categorie est obligatoire." }, "categories");
  }

  if (!slug) {
    adminRedirect({ error: "Le slug de categorie est obligatoire." }, "categories");
  }

  const range = rangeRaw ? Number(rangeRaw) : null;
  if (rangeRaw && !Number.isInteger(range)) {
    adminRedirect({ error: "Le champ range doit etre un entier." }, "categories");
  }

  try {
    const imageUrl = isUploadedFile(imageFile)
      ? await saveImageFile(imageFile, "categories", slug || title)
      : manualImageUrl;

    await prisma.category.create({
      data: {
        title,
        slug,
        description,
        range,
        featured,
        imageUrl,
      },
    });

    refreshStorefront();
    adminRedirect({ status: "category-created" }, "categories");
  } catch (error) {
    adminRedirect({ error: getErrorMessage(error) }, "categories");
  }
}

export async function createBrandAction(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const slug = normalizeSlug(rawSlug || title);
  const description = String(formData.get("description") || "").trim() || null;
  const manualImageUrl = String(formData.get("imageUrl") || "").trim() || null;
  const imageFile = formData.get("imageFile");

  if (!title) {
    adminRedirect({ error: "Le titre de marque est obligatoire." }, "brands");
  }

  if (!slug) {
    adminRedirect({ error: "Le slug de marque est obligatoire." }, "brands");
  }

  try {
    const imageUrl = isUploadedFile(imageFile)
      ? await saveImageFile(imageFile, "brands", slug || title)
      : manualImageUrl;

    await prisma.brand.create({
      data: {
        title,
        slug,
        description,
        imageUrl,
      },
    });

    refreshStorefront();
    adminRedirect({ status: "brand-created" }, "brands");
  } catch (error) {
    adminRedirect({ error: getErrorMessage(error) }, "brands");
  }
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const slug = normalizeSlug(rawSlug || name);
  const description = String(formData.get("description") || "").trim() || null;
  const price = parseNumber(formData.get("price"), NaN);
  const discount = parseNumber(formData.get("discount"), 0);
  const stock = parseNumber(formData.get("stock"), 0);
  const statusValue = String(formData.get("status") || "new") as ProductStatus;
  const isFeatured = formData.get("isFeatured") === "on";
  const brandId = String(formData.get("brandId") || "").trim() || null;
  const categoryIds = formData
    .getAll("categoryIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const manualImageUrls = String(formData.get("imageUrls") || "")
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
  const imageFiles = formData
    .getAll("imageFiles")
    .filter((value): value is File => isUploadedFile(value));

  if (!name) {
    adminRedirect({ error: "Le nom du produit est obligatoire." }, "products");
  }

  if (!slug) {
    adminRedirect({ error: "Le slug du produit est obligatoire." }, "products");
  }

  if (!Number.isFinite(price) || price <= 0) {
    adminRedirect({ error: "Le prix du produit doit etre superieur a zero." }, "products");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    adminRedirect({ error: "Le stock doit etre un entier positif." }, "products");
  }

  if (!Number.isInteger(discount) || discount < 0) {
    adminRedirect({ error: "La remise doit etre un entier positif." }, "products");
  }

  if (!["new", "hot", "sale"].includes(statusValue)) {
    adminRedirect({ error: "Le statut du produit est invalide." }, "products");
  }

  if (!categoryIds.length) {
    adminRedirect({ error: "Selectionnez au moins une categorie." }, "products");
  }

  if (!manualImageUrls.length && !imageFiles.length) {
    adminRedirect({ error: "Ajoutez au moins une image produit." }, "products");
  }

  try {
    const uploadedImageUrls = await Promise.all(
      imageFiles.map((file, index) =>
        saveImageFile(file, "products", `${slug || name}-${index + 1}`)
      )
    );
    const imageUrls = [...uploadedImageUrls, ...manualImageUrls];

    await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: new Prisma.Decimal(price),
        discount,
        stock,
        status: statusValue,
        isFeatured,
        brandId,
        images: {
          create: imageUrls.map((url, index) => ({
            url,
            altText: name,
            sortOrder: index,
          })),
        },
        categories: {
          create: categoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
      },
    });

    refreshStorefront();
    adminRedirect({ status: "product-created" }, "products");
  } catch (error) {
    adminRedirect({ error: getErrorMessage(error) }, "products");
  }
}

export async function createPromoCodeAction(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") || "").trim();
  const rawCode = String(formData.get("code") || "").trim();
  const code = normalizePromoCode(rawCode || title);
  const active = formData.get("active") === "on";
  const discountType = String(formData.get("discountType") || "percentage") as PromoDiscountType;
  const discountValue = parseNumber(formData.get("discountValue"), NaN);
  const minimumOrderAmount = parseNumber(formData.get("minimumOrderAmount"), 0);
  const usageLimitRaw = String(formData.get("usageLimit") || "").trim();
  const usageLimit = usageLimitRaw ? Number(usageLimitRaw) : null;
  const startsAt = parseOptionalDate(formData.get("startsAt"));
  const endsAt = parseOptionalDate(formData.get("endsAt"));
  const allowedPaymentMethods = formData
    .getAll("allowedPaymentMethods")
    .map((value) => String(value))
    .filter((value): value is PaymentMethod =>
      ["cod", "cmi_card", "installments"].includes(value)
    );

  if (!title) {
    adminRedirect({ error: "Le titre du code promo est obligatoire." }, "promos");
  }

  if (!code) {
    adminRedirect({ error: "Le code promo est obligatoire." }, "promos");
  }

  if (!["percentage", "fixed"].includes(discountType)) {
    adminRedirect({ error: "Le type de reduction est invalide." }, "promos");
  }

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    adminRedirect({ error: "La valeur de reduction doit etre superieure a zero." }, "promos");
  }

  if (!allowedPaymentMethods.length) {
    adminRedirect(
      { error: "Choisissez au moins un moyen de paiement autorise." },
      "promos"
    );
  }

  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
    adminRedirect({ error: "La limite d'utilisation doit etre un entier positif." }, "promos");
  }

  if (startsAt && endsAt && startsAt > endsAt) {
    adminRedirect({ error: "La date de fin doit etre apres la date de debut." }, "promos");
  }

  try {
    await prisma.promoCode.create({
      data: {
        title,
        code,
        active,
        discountType,
        discountValue: new Prisma.Decimal(discountValue),
        minimumOrderAmount: new Prisma.Decimal(minimumOrderAmount),
        allowedPaymentMethods,
        startsAt,
        endsAt,
        usageLimit,
      },
    });

    refreshStorefront();
    adminRedirect({ status: "promo-created" }, "promos");
  } catch (error) {
    adminRedirect({ error: getErrorMessage(error) }, "promos");
  }
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    adminRedirect({ error: "Categorie introuvable." }, "categories");
  }

  try {
    await prisma.category.delete({
      where: { id },
    });

    refreshStorefront();
    adminRedirect({ status: "category-deleted" }, "categories");
  } catch (error) {
    adminRedirect({ error: getErrorMessage(error) }, "categories");
  }
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    adminRedirect({ error: "Produit introuvable." }, "products");
  }

  try {
    await prisma.product.delete({
      where: { id },
    });

    refreshStorefront();
    adminRedirect({ status: "product-deleted" }, "products");
  } catch (error) {
    adminRedirect({ error: getErrorMessage(error) }, "products");
  }
}

export async function deleteBrandAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    adminRedirect({ error: "Marque introuvable." }, "brands");
  }

  try {
    await prisma.brand.delete({
      where: { id },
    });

    refreshStorefront();
    adminRedirect({ status: "brand-deleted" }, "brands");
  } catch (error) {
    adminRedirect({ error: getErrorMessage(error) }, "brands");
  }
}

export async function deletePromoCodeAction(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    adminRedirect({ error: "Code promo introuvable." }, "promos");
  }

  try {
    await prisma.promoCode.delete({
      where: { id },
    });

    refreshStorefront();
    adminRedirect({ status: "promo-deleted" }, "promos");
  } catch (error) {
    adminRedirect({ error: getErrorMessage(error) }, "promos");
  }
}
