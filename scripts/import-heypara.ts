import { Prisma, PrismaClient, ProductStatus } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCE_BASE_URL = "https://heypara.ma";
const DEFAULT_CATEGORY_LIMIT = 10;
const DEFAULT_PRODUCT_LIMIT = 80;
const DEFAULT_PER_COLLECTION_CAP = 120;
const MAX_COLLECTION_PAGES = 6;
const REQUEST_RETRIES = 2;

const PRIORITY_COLLECTION_HANDLES = [
  "visage",
  "soins-visage",
  "nettoyants",
  "solaire",
  "cheveux",
  "soins-cheveux",
  "shampoings",
  "promotions",
  "best-sellers",
  "acne",
];

type ShopifyCollection = {
  id: number;
  title: string;
  handle: string;
  description: string | null;
  products_count: number;
  image: {
    src: string;
    alt: string | null;
  } | null;
};

type ShopifyCollectionsResponse = {
  collections: ShopifyCollection[];
};

type ShopifyVariant = {
  id: number;
  sku: string | null;
  barcode?: string | null;
  available: boolean;
  price: string;
  compare_at_price: string | null;
  inventory_quantity?: number | null;
};

type ShopifyImage = {
  id: number;
  src: string;
  position: number | null;
};

type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  body_html: string | null;
  vendor: string | null;
  tags: string[] | string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
};

type ShopifyProductsResponse = {
  products: ShopifyProduct[];
};

type ImportCounters = {
  categoriesInserted: number;
  categoriesUpdated: number;
  brandsInserted: number;
  brandsUpdated: number;
  productsInserted: number;
  productsUpdated: number;
  productsSkipped: number;
  productCategoryLinksAdded: number;
  productTagLinksAdded: number;
  tagsInserted: number;
  tagsUpdated: number;
  imagesAdded: number;
};

const counters: ImportCounters = {
  categoriesInserted: 0,
  categoriesUpdated: 0,
  brandsInserted: 0,
  brandsUpdated: 0,
  productsInserted: 0,
  productsUpdated: 0,
  productsSkipped: 0,
  productCategoryLinksAdded: 0,
  productTagLinksAdded: 0,
  tagsInserted: 0,
  tagsUpdated: 0,
  imagesAdded: 0,
};

const sleep = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const readPositiveInt = (rawValue: string | undefined, fallback: number, max: number) => {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
};

const CATEGORY_LIMIT = readPositiveInt(
  process.env.HEYPARA_CATEGORY_LIMIT,
  DEFAULT_CATEGORY_LIMIT,
  30
);
const PRODUCT_LIMIT = readPositiveInt(
  process.env.HEYPARA_PRODUCT_LIMIT,
  DEFAULT_PRODUCT_LIMIT,
  500
);
const PER_COLLECTION_CAP = readPositiveInt(
  process.env.HEYPARA_PER_COLLECTION_CAP,
  DEFAULT_PER_COLLECTION_CAP,
  500
);

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

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&eacute;/gi, "e")
    .replace(/&egrave;/gi, "e")
    .replace(/&ecirc;/gi, "e")
    .replace(/&agrave;/gi, "a")
    .replace(/&ccedil;/gi, "c")
    .replace(/&uuml;/gi, "u");

const stripHtml = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  const withoutTags = value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(withoutTags).replace(/\s+/g, " ").trim();
};

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
};

const parseMoney = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

const parseTags = (value: ShopifyProduct["tags"]) => {
  if (!value) {
    return [] as string[];
  }

  const rawEntries =
    typeof value === "string"
      ? value.split(",")
      : Array.isArray(value)
        ? value
        : [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const rawEntry of rawEntries) {
    const normalized = rawEntry.trim();
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    tags.push(normalized);
  }

  return tags;
};

const normalizeImageUrl = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }
  return value.trim();
};

const pickMainVariant = (variants: ShopifyVariant[]) => {
  if (!variants.length) {
    return null;
  }

  for (const variant of variants) {
    if (parseMoney(variant.price) !== null) {
      return variant;
    }
  }

  return variants[0];
};

async function fetchJson<T>(url: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= REQUEST_RETRIES + 1; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
          "user-agent": "zayna-importer/1.0 (+https://heypara.ma)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} on ${url}`);
      }

      const body = await response.text();

      try {
        return JSON.parse(body) as T;
      } catch {
        throw new Error(
          `Invalid JSON response on ${url}. Body starts with: ${body.slice(0, 140)}`
        );
      }
    } catch (error) {
      lastError = error;

      if (attempt <= REQUEST_RETRIES) {
        await sleep(350 * attempt);
        continue;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Unknown request error for ${url}`);
}

async function fetchAllCollections() {
  const collectionsByHandle = new Map<string, ShopifyCollection>();

  for (let page = 1; page <= MAX_COLLECTION_PAGES; page += 1) {
    const url = `${SOURCE_BASE_URL}/collections.json?limit=250&page=${page}`;
    const payload = await fetchJson<ShopifyCollectionsResponse>(url);
    const pageCollections = payload.collections || [];

    if (!pageCollections.length) {
      break;
    }

    for (const collection of pageCollections) {
      if (!collection?.handle) {
        continue;
      }
      collectionsByHandle.set(collection.handle, collection);
    }

    if (pageCollections.length < 250) {
      break;
    }
  }

  return [...collectionsByHandle.values()];
}

const chooseCollections = (allCollections: ShopifyCollection[]) => {
  const byHandle = new Map(allCollections.map((collection) => [collection.handle, collection]));
  const selected: ShopifyCollection[] = [];
  const selectedHandles = new Set<string>();

  for (const handle of PRIORITY_COLLECTION_HANDLES) {
    const collection = byHandle.get(handle);
    if (!collection || selectedHandles.has(collection.handle)) {
      continue;
    }
    if (collection.products_count <= 0) {
      continue;
    }
    selected.push(collection);
    selectedHandles.add(collection.handle);
    if (selected.length >= CATEGORY_LIMIT) {
      return selected;
    }
  }

  const fallback = allCollections
    .filter(
      (collection) =>
        !selectedHandles.has(collection.handle) &&
        collection.products_count > 0
    )
    .sort((left, right) => right.products_count - left.products_count);

  for (const collection of fallback) {
    selected.push(collection);
    selectedHandles.add(collection.handle);
    if (selected.length >= CATEGORY_LIMIT) {
      break;
    }
  }

  return selected;
};

async function fetchCollectionProducts(handle: string, cap: number) {
  const productsByHandle = new Map<string, ShopifyProduct>();

  for (let page = 1; page <= MAX_COLLECTION_PAGES; page += 1) {
    const url = `${SOURCE_BASE_URL}/collections/${encodeURIComponent(
      handle
    )}/products.json?limit=250&page=${page}`;
    const payload = await fetchJson<ShopifyProductsResponse>(url);
    const pageProducts = payload.products || [];

    if (!pageProducts.length) {
      break;
    }

    for (const product of pageProducts) {
      if (!product?.handle) {
        continue;
      }
      productsByHandle.set(product.handle, product);
      if (productsByHandle.size >= cap) {
        break;
      }
    }

    if (productsByHandle.size >= cap || pageProducts.length < 250) {
      break;
    }
  }

  return [...productsByHandle.values()];
}

const pickRoundRobinProductHandles = (
  selectedCollections: ShopifyCollection[],
  productsByCollection: Map<string, ShopifyProduct[]>,
  maxProducts: number
) => {
  const selectedHandles: string[] = [];
  const seen = new Set<string>();

  let index = 0;
  while (selectedHandles.length < maxProducts) {
    let foundAtThisDepth = false;

    for (const collection of selectedCollections) {
      const products = productsByCollection.get(collection.handle) || [];
      const product = products[index];

      if (!product) {
        continue;
      }

      foundAtThisDepth = true;

      if (seen.has(product.handle)) {
        continue;
      }

      seen.add(product.handle);
      selectedHandles.push(product.handle);

      if (selectedHandles.length >= maxProducts) {
        break;
      }
    }

    if (!foundAtThisDepth) {
      break;
    }

    index += 1;
  }

  return selectedHandles;
};

const canUseTagModel = () => {
  const rawPrisma = prisma as unknown as Record<string, unknown>;
  const tagDelegate = rawPrisma["tag"] as
    | {
        upsert?: unknown;
      }
    | undefined;
  const productTagDelegate = rawPrisma["productTag"] as
    | {
        createMany?: unknown;
      }
    | undefined;

  return Boolean(
    tagDelegate &&
      typeof tagDelegate.upsert === "function" &&
      productTagDelegate &&
      typeof productTagDelegate.createMany === "function"
  );
};

async function upsertCategory(collection: ShopifyCollection) {
  const existing = await prisma.category.findUnique({
    where: {
      slug: collection.handle,
    },
    select: {
      id: true,
    },
  });

  const cleanDescription = stripHtml(collection.description);
  const imageUrl = normalizeImageUrl(collection.image?.src || "");

  const category = await prisma.category.upsert({
    where: {
      slug: collection.handle,
    },
    create: {
      title: collection.title,
      slug: collection.handle,
      description: cleanDescription || null,
      range: collection.products_count || null,
      featured: true,
      imageUrl: imageUrl || null,
    },
    update: {
      title: collection.title,
      description: cleanDescription || null,
      range: collection.products_count || null,
      featured: true,
      imageUrl: imageUrl || null,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (existing) {
    counters.categoriesUpdated += 1;
  } else {
    counters.categoriesInserted += 1;
  }

  return category;
}

async function upsertBrand(vendor: string | null | undefined) {
  const normalizedVendor = (vendor || "").trim();
  if (!normalizedVendor) {
    return null;
  }

  const brandSlug = slugify(normalizedVendor);

  const existing = await prisma.brand.findUnique({
    where: {
      slug: brandSlug,
    },
    select: {
      id: true,
    },
  });

  const brand = await prisma.brand.upsert({
    where: {
      slug: brandSlug,
    },
    create: {
      title: normalizedVendor,
      slug: brandSlug,
      description: null,
      imageUrl: null,
      isActive: true,
    },
    update: {
      title: normalizedVendor,
      isActive: true,
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });

  if (existing) {
    counters.brandsUpdated += 1;
  } else {
    counters.brandsInserted += 1;
  }

  return brand;
}

async function upsertTag(title: string) {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    return null;
  }

  const tagSlug = slugify(normalizedTitle);

  const existing = await prisma.tag.findUnique({
    where: {
      slug: tagSlug,
    },
    select: {
      id: true,
    },
  });

  const tag = await prisma.tag.upsert({
    where: {
      slug: tagSlug,
    },
    create: {
      title: normalizedTitle,
      slug: tagSlug,
      description: null,
    },
    update: {
      title: normalizedTitle,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (existing) {
    counters.tagsUpdated += 1;
  } else {
    counters.tagsInserted += 1;
  }

  return tag;
}

async function importProducts() {
  console.log("Fetching heypara collections...");
  const allCollections = await fetchAllCollections();
  console.log(`Found ${allCollections.length} collection(s) on source.`);

  const selectedCollections = chooseCollections(allCollections);
  console.log(
    `Selected ${selectedCollections.length} collection(s): ${selectedCollections
      .map((collection) => collection.handle)
      .join(", ")}`
  );

  const categoryIdByHandle = new Map<string, string>();
  for (const collection of selectedCollections) {
    const category = await upsertCategory(collection);
    categoryIdByHandle.set(category.slug, category.id);
  }

  const productsByCollection = new Map<string, ShopifyProduct[]>();
  const categoryHandlesByProduct = new Map<string, Set<string>>();
  const productByHandle = new Map<string, ShopifyProduct>();
  const bestSellerHandles = new Set<string>();
  const promotionHandles = new Set<string>();

  for (const collection of selectedCollections) {
    try {
      const products = await fetchCollectionProducts(collection.handle, PER_COLLECTION_CAP);
      productsByCollection.set(collection.handle, products);
      console.log(
        `Fetched ${products.length} product(s) from collection "${collection.handle}".`
      );

      for (const product of products) {
        if (!product?.handle) {
          continue;
        }

        productByHandle.set(product.handle, product);

        const categorySet = categoryHandlesByProduct.get(product.handle) || new Set<string>();
        categorySet.add(collection.handle);
        categoryHandlesByProduct.set(product.handle, categorySet);

        if (collection.handle === "best-sellers") {
          bestSellerHandles.add(product.handle);
        }
        if (collection.handle === "promotions") {
          promotionHandles.add(product.handle);
        }
      }
    } catch (error) {
      console.warn(
        `Skipping collection "${collection.handle}" due to fetch error: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
    }
  }

  const selectedProductHandles = pickRoundRobinProductHandles(
    selectedCollections,
    productsByCollection,
    PRODUCT_LIMIT
  );
  console.log(`Preparing import for ${selectedProductHandles.length} product(s).`);

  const tagsEnabled = canUseTagModel();
  if (!tagsEnabled) {
    console.warn("Tag/ProductTag models unavailable in Prisma client, tags import is disabled.");
  }

  for (const productHandle of selectedProductHandles) {
    const product = productByHandle.get(productHandle);
    if (!product) {
      counters.productsSkipped += 1;
      console.warn(`Skipping missing payload for handle "${productHandle}".`);
      continue;
    }

    try {
      const mainVariant = pickMainVariant(product.variants || []);
      if (!mainVariant) {
        counters.productsSkipped += 1;
        console.warn(`Skipping "${productHandle}" (no variant).`);
        continue;
      }

      const parsedPrice = parseMoney(mainVariant.price);
      if (parsedPrice === null || parsedPrice <= 0) {
        counters.productsSkipped += 1;
        console.warn(`Skipping "${productHandle}" (invalid price).`);
        continue;
      }

      const parsedCompareAt = parseMoney(mainVariant.compare_at_price);
      const regularPrice =
        parsedCompareAt !== null && parsedCompareAt > parsedPrice
          ? parsedCompareAt
          : parsedPrice;
      const salePrice =
        parsedCompareAt !== null && parsedCompareAt > parsedPrice
          ? parsedPrice
          : null;
      const effectivePrice = salePrice ?? regularPrice;
      const discountPercent =
        regularPrice > effectivePrice
          ? Math.round(((regularPrice - effectivePrice) / regularPrice) * 100)
          : 0;

      const categoryHandles = [...(categoryHandlesByProduct.get(product.handle) || [])];
      const isBestSeller = bestSellerHandles.has(product.handle);
      const isPromotion = promotionHandles.has(product.handle) || discountPercent > 0;
      const createdAt = product.created_at ? new Date(product.created_at) : null;
      const isNewArrival =
        Boolean(createdAt) &&
        Number.isFinite(createdAt?.getTime()) &&
        Date.now() - createdAt.getTime() <= 1000 * 60 * 60 * 24 * 90;

      const stock =
        typeof mainVariant.inventory_quantity === "number"
          ? Math.max(mainVariant.inventory_quantity, 0)
          : mainVariant.available
            ? 10
            : 0;

      const normalizedSku = (mainVariant.sku || "").trim() || `HP-HY-${product.id}`;
      const cleanDescription = stripHtml(product.body_html);
      const shortDescription = cleanDescription
        ? truncateText(cleanDescription, 220)
        : null;
      const seoKeywords = [
        "heypara",
        (product.vendor || "").trim(),
        ...categoryHandles,
      ]
        .map((entry) => entry.trim())
        .filter(Boolean)
        .join(", ");

      const brand = await upsertBrand(product.vendor);

      const existingProduct = await prisma.product.findUnique({
        where: {
          slug: product.handle,
        },
        select: {
          id: true,
        },
      });

      const buildProductPayload = (skuValue: string) => ({
        name: product.title.trim(),
        slug: product.handle,
        sku: skuValue,
        barcode: (mainVariant.barcode || "").trim() || null,
        shortDescription,
        fullDescription: cleanDescription || null,
        description: cleanDescription || null,
        price: effectivePrice,
        regularPrice,
        salePrice,
        discount: discountPercent,
        stock,
        status: isPromotion
          ? ProductStatus.sale
          : isBestSeller
            ? ProductStatus.hot
            : ProductStatus.new,
        isActive: Boolean(product.published_at),
        isFeatured: isBestSeller || discountPercent >= 20,
        isBestSeller,
        isNewArrival,
        isPromotion,
        seoTitle: product.title.trim(),
        seoDescription: shortDescription,
        seoKeywords: seoKeywords || null,
        brandId: brand?.id || null,
      });

      let persistedProduct:
        | {
            id: string;
            slug: string;
          }
        | null = null;

      const runUpsert = async (skuValue: string) => {
        const payload = buildProductPayload(skuValue);

        return prisma.product.upsert({
          where: {
            slug: product.handle,
          },
          create: payload,
          update: payload,
          select: {
            id: true,
            slug: true,
          },
        });
      };

      try {
        persistedProduct = await runUpsert(normalizedSku);
      } catch (error) {
        const isSkuConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002";

        if (!isSkuConflict) {
          throw error;
        }

        const fallbackSku = `HP-HY-${product.id}`;
        persistedProduct = await runUpsert(fallbackSku);
      }

      if (!persistedProduct) {
        throw new Error(`Unable to persist product "${product.handle}".`);
      }

      if (existingProduct) {
        counters.productsUpdated += 1;
      } else {
        counters.productsInserted += 1;
      }

      const categoryIds = categoryHandles
        .map((handle) => categoryIdByHandle.get(handle))
        .filter((categoryId): categoryId is string => Boolean(categoryId));

      if (categoryIds.length) {
        const productCategoryResult = await prisma.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            productId: persistedProduct.id,
            categoryId,
          })),
          skipDuplicates: true,
        });
        counters.productCategoryLinksAdded += productCategoryResult.count;
      }

      const sourceImages = (product.images || [])
        .map((image, index) => ({
          url: normalizeImageUrl(image.src),
          sortOrder: typeof image.position === "number" ? image.position - 1 : index,
          isPrimary: index === 0,
        }))
        .filter((image) => Boolean(image.url));

      if (sourceImages.length) {
        const existingImages = await prisma.productImage.findMany({
          where: {
            productId: persistedProduct.id,
          },
          select: {
            url: true,
          },
        });
        const existingUrls = new Set(existingImages.map((image) => image.url));
        const dedupe = new Set<string>();
        const imagesToCreate = sourceImages.filter((image) => {
          if (existingUrls.has(image.url) || dedupe.has(image.url)) {
            return false;
          }
          dedupe.add(image.url);
          return true;
        });

        if (imagesToCreate.length) {
          await prisma.productImage.createMany({
            data: imagesToCreate.map((image) => ({
              productId: persistedProduct.id,
              url: image.url,
              altText: product.title.trim(),
              sortOrder: Math.max(image.sortOrder, 0),
              isPrimary: image.isPrimary,
            })),
          });
          counters.imagesAdded += imagesToCreate.length;
        }
      }

      if (tagsEnabled) {
        const rawTags = parseTags(product.tags);
        if (rawTags.length) {
          const tagIds: string[] = [];

          for (const rawTag of rawTags) {
            const tag = await upsertTag(rawTag);
            if (tag) {
              tagIds.push(tag.id);
            }
          }

          if (tagIds.length) {
            const result = await prisma.productTag.createMany({
              data: tagIds.map((tagId) => ({
                productId: persistedProduct.id,
                tagId,
              })),
              skipDuplicates: true,
            });
            counters.productTagLinksAdded += result.count;
          }
        }
      }
    } catch (error) {
      counters.productsSkipped += 1;
      console.warn(
        `Skipping "${productHandle}" due to import error: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      );
    }
  }
}

async function main() {
  console.log(
    `Starting heypara import (categories=${CATEGORY_LIMIT}, products=${PRODUCT_LIMIT}, perCollectionCap=${PER_COLLECTION_CAP})...`
  );

  await importProducts();

  console.log("Import completed.");
  console.table(counters);
}

main()
  .catch((error) => {
    console.error("Heypara import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
