import {
  InventoryMovementReason,
  Prisma,
  PrismaClient,
  ProductLifecycleStatus,
  ProductStatus,
} from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();
const SOURCE_NAME = "heypara-excel";
const PRODUCT_SHEET = "Produits";
const SUMMARY_SHEET = "Synthèse";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const IMAGE_COLUMNS = [
  "Photo principale",
  ...Array.from({ length: 10 }, (_, index) => `Photo ${index + 2}`),
] as const;
const REQUIRED_COLUMNS = [
  "ID produit",
  "ID variante",
  "Ligne principale",
  "Handle",
  "Titre",
  "Variante",
  "Marque",
  "Type",
  "Tags",
  "SKU",
  "Descriptif",
  "Prix actuel (DH)",
  "Prix barré (DH)",
  "Remise (%)",
  "Disponible",
  "URL fiche",
  ...IMAGE_COLUMNS,
] as const;

type ExcelRow = Record<string, unknown>;

type ImportIssue = {
  row: number;
  severity: "error" | "warning";
  field: string;
  message: string;
  value?: unknown;
};

type ParsedProduct = {
  row: number;
  id: string;
  sourceProductId: string;
  sourceVariantId: string;
  sourceSku: string | null;
  sku: string;
  slug: string;
  name: string;
  brand: string;
  category: string | null;
  tags: string[];
  description: string;
  currentPrice: number;
  regularPrice: number;
  salePrice: number | null;
  discount: number;
  available: boolean;
  stock: number;
  sourceUrl: string;
  images: string[];
};

type CliOptions = {
  file: string;
  report: string;
  replace: boolean;
};

const text = (value: unknown) =>
  value === null || value === undefined ? "" : String(value).trim();

const normalizedKey = (value: string) => value.normalize("NFKC").toLocaleLowerCase();

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

const shortHash = (value: string) =>
  createHash("sha256").update(value).digest("hex").slice(0, 10);

const parseCli = (): CliOptions => {
  const args = process.argv.slice(2);
  const valueAfter = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const inputFile = valueAfter("--file");
  if (!inputFile) {
    throw new Error(
      "Missing --file. Usage: npm run import:catalogue-xlsx -- --file /path/to/catalogue.xlsx [--replace]",
    );
  }
  const file = path.resolve(inputFile);
  const report = path.resolve(
    valueAfter("--report") || path.join("reports", "catalogue-import-report.json"),
  );
  return { file, report, replace: args.includes("--replace") };
};

const isHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const parseAvailable = (value: unknown) => {
  const normalized = text(value).toLocaleLowerCase();
  if (["oui", "yes", "true", "1"].includes(normalized)) return true;
  if (["non", "no", "false", "0"].includes(normalized)) return false;
  return null;
};

const parseTags = (value: unknown) => {
  const seen = new Set<string>();
  return text(value)
    .split(/[,;|]/)
    .map((entry) => entry.trim())
    .filter((entry) => {
      if (!entry) return false;
      const key = normalizedKey(entry);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const readWorkbook = (file: string) => {
  const bytes = readFileSync(file);
  const checksum = createHash("sha256").update(bytes).digest("hex");
  const workbook = XLSX.read(bytes, { type: "buffer", raw: true });
  if (!workbook.SheetNames.includes(PRODUCT_SHEET)) {
    throw new Error(`Required sheet ${JSON.stringify(PRODUCT_SHEET)} is missing.`);
  }
  const worksheet = workbook.Sheets[PRODUCT_SHEET];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    raw: true,
  });
  const headers = (matrix[0] || []).map(text);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missingColumns.length) {
    throw new Error(`Missing required column(s): ${missingColumns.join(", ")}`);
  }
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
    defval: null,
    raw: true,
  });
  const summaryRows = workbook.SheetNames.includes(SUMMARY_SHEET)
    ? XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[SUMMARY_SHEET], {
        defval: null,
        raw: true,
      })
    : [];
  const summaryTotal = summaryRows.find(
    (row) => normalizedKey(text(row["Marque"])) === "total",
  );
  return {
    checksum,
    headers,
    rows,
    sheetNames: workbook.SheetNames,
    summaryProductTotal: summaryTotal ? Number(summaryTotal["Nb produits"]) : null,
  };
};

const parseProducts = (rows: ExcelRow[]) => {
  const issues: ImportIssue[] = [];
  const sourceIdRows = new Map<string, number>();
  const slugRows = new Map<string, number>();
  const skuCounts = new Map<string, number>();

  for (const row of rows) {
    const sourceSku = text(row["SKU"]);
    if (sourceSku) {
      const key = normalizedKey(sourceSku);
      skuCounts.set(key, (skuCounts.get(key) || 0) + 1);
    }
  }

  const products: ParsedProduct[] = [];
  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const rowErrors: ImportIssue[] = [];
    const requiredText = (column: string) => {
      const value = text(row[column]);
      if (!value) {
        rowErrors.push({
          row: rowNumber,
          severity: "error",
          field: column,
          message: "Required value is missing.",
        });
      }
      return value;
    };

    const sourceProductId = requiredText("ID produit");
    const sourceVariantId = requiredText("ID variante");
    const name = requiredText("Titre");
    const brand = requiredText("Marque");
    const rawHandle = requiredText("Handle");
    const slug = slugify(rawHandle);
    const currentPrice = Number(row["Prix actuel (DH)"]);
    if (!Number.isFinite(currentPrice) || currentPrice < 0 || currentPrice > 99_999_999.99) {
      rowErrors.push({
        row: rowNumber,
        severity: "error",
        field: "Prix actuel (DH)",
        message: "Price must be a non-negative number that fits Decimal(10,2).",
        value: row["Prix actuel (DH)"],
      });
    }
    const available = parseAvailable(row["Disponible"]);
    if (available === null) {
      rowErrors.push({
        row: rowNumber,
        severity: "error",
        field: "Disponible",
        message: "Availability must be Oui/Non (or an equivalent boolean).",
        value: row["Disponible"],
      });
    }
    const sourceUrl = requiredText("URL fiche");
    if (sourceUrl && !isHttpUrl(sourceUrl)) {
      rowErrors.push({
        row: rowNumber,
        severity: "error",
        field: "URL fiche",
        message: "Product URL is not a valid HTTP(S) URL.",
        value: sourceUrl,
      });
    }
    const images = IMAGE_COLUMNS.map((column) => text(row[column])).filter(Boolean);
    for (const imageUrl of images) {
      if (!isHttpUrl(imageUrl)) {
        rowErrors.push({
          row: rowNumber,
          severity: "error",
          field: "Images",
          message: "Image URL is not a valid HTTP(S) URL.",
          value: imageUrl,
        });
      }
    }
    if (!images.length) {
      issues.push({
        row: rowNumber,
        severity: "warning",
        field: "Photo principale",
        message: "Product has no image.",
      });
    }
    if (sourceProductId) {
      const firstRow = sourceIdRows.get(sourceProductId);
      if (firstRow) {
        rowErrors.push({
          row: rowNumber,
          severity: "error",
          field: "ID produit",
          message: `Duplicate source product ID; first seen on row ${firstRow}.`,
          value: sourceProductId,
        });
      } else {
        sourceIdRows.set(sourceProductId, rowNumber);
      }
    }
    if (slug) {
      const firstRow = slugRows.get(slug);
      if (firstRow) {
        rowErrors.push({
          row: rowNumber,
          severity: "error",
          field: "Handle",
          message: `Duplicate normalized handle; first seen on row ${firstRow}.`,
          value: rawHandle,
        });
      } else {
        slugRows.set(slug, rowNumber);
      }
    }

    const sourceSku = text(row["SKU"]) || null;
    const skuKey = sourceSku ? normalizedKey(sourceSku) : "";
    const sku = !sourceSku
      ? `HEY-MISSING-${sourceProductId || rowNumber}`
      : (skuCounts.get(skuKey) || 0) > 1
        ? `${sourceSku}-${sourceProductId || rowNumber}`
        : sourceSku;
    if (!sourceSku) {
      issues.push({
        row: rowNumber,
        severity: "warning",
        field: "SKU",
        message: `Missing source SKU; generated ${sku}.`,
      });
    } else if ((skuCounts.get(skuKey) || 0) > 1) {
      issues.push({
        row: rowNumber,
        severity: "warning",
        field: "SKU",
        message: `Duplicate source SKU retained in sourceSku; operational SKU is ${sku}.`,
        value: sourceSku,
      });
    }

    const category = text(row["Type"]) || null;
    if (!category) {
      issues.push({
        row: rowNumber,
        severity: "warning",
        field: "Type",
        message: "No category was supplied; no category relation will be invented.",
      });
    }
    if (text(row["Variante"])) {
      issues.push({
        row: rowNumber,
        severity: "warning",
        field: "Variante",
        message: "Variant label is present, but this workbook format has one main row per product.",
        value: row["Variante"],
      });
    }

    issues.push(...rowErrors);
    if (rowErrors.length) continue;

    const crossedPrice = Number(row["Prix barré (DH)"]);
    const hasSale = Number.isFinite(crossedPrice) && crossedPrice > currentPrice;
    const regularPrice = hasSale ? crossedPrice : currentPrice;
    const rawDiscount = Number(row["Remise (%)"]);
    const discount = hasSale
      ? Math.max(
          1,
          Math.min(
            100,
            Math.round(
              Number.isFinite(rawDiscount)
                ? rawDiscount * 100
                : ((regularPrice - currentPrice) / regularPrice) * 100,
            ),
          ),
        )
      : 0;
    products.push({
      row: rowNumber,
      id: `heypara-${sourceProductId}`,
      sourceProductId,
      sourceVariantId,
      sourceSku,
      sku,
      slug,
      name,
      brand,
      category,
      tags: parseTags(row["Tags"]),
      description: text(row["Descriptif"]),
      currentPrice,
      regularPrice,
      salePrice: hasSale ? currentPrice : null,
      discount,
      available: available as boolean,
      // The source has availability only, not a numeric quantity. One is the
      // smallest truthful in-stock proxy; zero represents unavailable.
      stock: available ? 1 : 0,
      sourceUrl,
      images: [...new Set(images)],
    });
  }

  return { products, issues, skuCounts };
};

const allocateSlugs = (values: string[]) => {
  const result = new Map<string, string>();
  const owners = new Map<string, string>();
  for (const value of values) {
    const key = normalizedKey(value);
    if (result.has(key)) continue;
    const base = slugify(value);
    const owner = owners.get(base);
    const slug = owner && owner !== key ? `${base}-${shortHash(value)}` : base;
    owners.set(slug, key);
    result.set(key, slug);
  }
  return result;
};

const chunks = <T>(values: T[], size: number) => {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
};

const insertMany = async <T>(
  values: T[],
  action: (batch: T[]) => Promise<unknown>,
  size = 500,
) => {
  for (const batch of chunks(values, size)) await action(batch);
};

const clearProductIds = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(clearProductIds);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      key === "productIds" && Array.isArray(nested) ? [] : clearProductIds(nested),
    ]),
  );
};

const assertLocalDatabase = async () => {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL is not set.");
  const parsed = new URL(rawUrl);
  const hostname = parsed.hostname.toLocaleLowerCase();
  const databaseFromUrl = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const sanitizedUrl = `${parsed.protocol}//${encodeURIComponent(parsed.username)}${
    parsed.username ? ":***@" : ""
  }${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
  const envLooksLocal = LOCAL_HOSTS.has(hostname) && !/railway/i.test(rawUrl);
  console.log("Database safety confirmation:");
  console.log(`  DATABASE_URL: ${sanitizedUrl}`);
  console.log(`  Host: ${parsed.hostname}`);
  console.log(`  Database: ${databaseFromUrl}`);
  console.log(`  Local host allowlist match: ${envLooksLocal ? "YES" : "NO"}`);
  console.log(`  Railway marker found: ${/railway/i.test(rawUrl) ? "YES" : "NO"}`);
  if (!envLooksLocal) {
    throw new Error("Refusing to continue: DATABASE_URL is not unequivocally local.");
  }
  const [connection] = await prisma.$queryRaw<
    Array<{ database: string; serverAddress: string | null; serverPort: number | null }>
  >`SELECT current_database() AS "database", inet_server_addr()::text AS "serverAddress", inet_server_port() AS "serverPort"`;
  if (!connection || connection.database !== databaseFromUrl) {
    throw new Error("Connected database does not match the database named in DATABASE_URL.");
  }
  const serverAddress = connection.serverAddress?.replace(/\/(?:32|128)$/, "") || null;
  if (serverAddress && !["127.0.0.1", "::1"].includes(serverAddress)) {
    throw new Error(
      `Refusing to continue: PostgreSQL reports non-loopback server ${connection.serverAddress}.`,
    );
  }
  console.log(
    `  PostgreSQL confirmed: ${connection.database} at ${connection.serverAddress || "local socket"}:${connection.serverPort || parsed.port || "default"}`,
  );
  return { sanitizedUrl, ...connection };
};

const getDatabaseStats = async () => {
  const [
    products,
    variants,
    images,
    productCategories,
    productTags,
    inventoryMovements,
    brands,
    categories,
    tags,
    orderItems,
    linkedOrderItems,
    homepageSectionProducts,
    homepageProductSectionItems,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.productImage.count(),
    prisma.productCategory.count(),
    prisma.productTag.count(),
    prisma.inventoryMovement.count(),
    prisma.brand.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.orderItem.count(),
    prisma.orderItem.count({ where: { productId: { not: null } } }),
    prisma.homepageSectionProduct.count(),
    prisma.homepageProductSectionItem.count(),
  ]);
  const aggregates = await prisma.product.aggregate({
    _min: { price: true, regularPrice: true, stock: true },
    _max: { price: true, regularPrice: true, stock: true },
    _sum: { stock: true },
  });
  return {
    products,
    variants,
    images,
    productCategories,
    productTags,
    inventoryMovements,
    brands,
    categories,
    tags,
    orderItems,
    linkedOrderItems,
    homepageSectionProducts,
    homepageProductSectionItems,
    aggregates: {
      minimumPrice: aggregates._min.price?.toString() || null,
      maximumPrice: aggregates._max.price?.toString() || null,
      minimumRegularPrice: aggregates._min.regularPrice?.toString() || null,
      maximumRegularPrice: aggregates._max.regularPrice?.toString() || null,
      minimumStock: aggregates._min.stock,
      maximumStock: aggregates._max.stock,
      totalStock: aggregates._sum.stock,
    },
  };
};

const replaceCatalogue = async (products: ParsedProduct[], checksum: string) => {
  const brands = [...new Set(products.map((product) => product.brand))];
  const categories = [
    ...new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value))),
  ];
  const tags = [...new Set(products.flatMap((product) => product.tags))];
  const brandSlugs = allocateSlugs(brands);
  const categorySlugs = allocateSlugs(categories);
  const tagSlugs = allocateSlugs(tags);
  const brandIds = new Map(
    brands.map((brand) => [normalizedKey(brand), `brand-${brandSlugs.get(normalizedKey(brand))}`]),
  );
  const categoryIds = new Map(
    categories.map((category) => [
      normalizedKey(category),
      `category-${categorySlugs.get(normalizedKey(category))}`,
    ]),
  );
  const tagIds = new Map(
    tags.map((tag) => [normalizedKey(tag), `tag-${tagSlugs.get(normalizedKey(tag))}`]),
  );

  return prisma.$transaction(
    async (tx) => {
      const workspaceRows = await tx.homepageWorkspace.findMany();
      const sectionRows = await tx.homepageSection.findMany({
        select: { id: true, config: true },
      });
      const deleted = {
        homepageSectionProducts: (await tx.homepageSectionProduct.deleteMany()).count,
        homepageProductSectionItems: (await tx.homepageProductSectionItem.deleteMany()).count,
        productRelated: (await tx.productRelated.deleteMany()).count,
        productTags: (await tx.productTag.deleteMany()).count,
        productCategories: (await tx.productCategory.deleteMany()).count,
        productImages: (await tx.productImage.deleteMany()).count,
        productVariants: (await tx.productVariant.deleteMany()).count,
        inventoryMovements: (await tx.inventoryMovement.deleteMany()).count,
        orderItemLinksCleared: (
          await tx.orderItem.updateMany({
            where: { productId: { not: null } },
            data: { productId: null },
          })
        ).count,
        products: (await tx.product.deleteMany()).count,
      };
      await tx.category.updateMany({ data: { parentId: null } });
      Object.assign(deleted, {
        tags: (await tx.tag.deleteMany()).count,
        categories: (await tx.category.deleteMany()).count,
        brands: (await tx.brand.deleteMany()).count,
      });

      for (const workspace of workspaceRows) {
        await tx.homepageWorkspace.update({
          where: { id: workspace.id },
          data: {
            draft: clearProductIds(workspace.draft) as Prisma.InputJsonValue,
            published: clearProductIds(workspace.published) as Prisma.InputJsonValue,
          },
        });
      }
      for (const section of sectionRows) {
        const config = clearProductIds(section.config);
        await tx.homepageSection.update({
          where: { id: section.id },
          data: { config: config as Prisma.InputJsonValue },
        });
      }

      await tx.brand.createMany({
        data: brands.map((brand) => ({
          id: brandIds.get(normalizedKey(brand)) as string,
          title: brand,
          slug: brandSlugs.get(normalizedKey(brand)) as string,
          isActive: true,
        })),
      });
      if (categories.length) {
        await tx.category.createMany({
          data: categories.map((category) => ({
            id: categoryIds.get(normalizedKey(category)) as string,
            title: category,
            slug: categorySlugs.get(normalizedKey(category)) as string,
            featured: true,
            isActive: true,
          })),
        });
      }
      if (tags.length) {
        await tx.tag.createMany({
          data: tags.map((tag) => ({
            id: tagIds.get(normalizedKey(tag)) as string,
            title: tag,
            slug: tagSlugs.get(normalizedKey(tag)) as string,
          })),
        });
      }

      await insertMany(
        products,
        (batch) =>
          tx.product.createMany({
            data: batch.map((product) => ({
              id: product.id,
              name: product.name,
              slug: product.slug,
              description: product.description || null,
              shortDescription: product.description.slice(0, 300) || null,
              fullDescription: product.description || null,
              price: product.currentPrice.toFixed(2),
              regularPrice: product.regularPrice.toFixed(2),
              salePrice: product.salePrice?.toFixed(2) || null,
              discount: product.discount,
              stock: product.stock,
              status: product.discount > 0 ? ProductStatus.sale : ProductStatus.new,
              lifecycleStatus: ProductLifecycleStatus.ACTIVE,
              isActive: true,
              isFeatured: false,
              isBestSeller: false,
              isNewArrival: true,
              isPromotion: product.discount > 0,
              sku: product.sku,
              brandId: brandIds.get(normalizedKey(product.brand)),
              seoTitle: product.name,
              seoDescription: product.description.slice(0, 160) || null,
              seoKeywords: product.tags.join(", ") || null,
              sourceName: SOURCE_NAME,
              sourceProductId: product.sourceProductId,
              sourceVariantId: product.sourceVariantId,
              sourceSku: product.sourceSku,
              sourceUrl: product.sourceUrl,
              sourceAvailable: product.available,
            })),
          }),
        400,
      );

      const imageRows = products.flatMap((product) =>
        product.images.map((url, index) => ({
          id: randomUUID(),
          productId: product.id,
          url,
          altText: index === 0 ? product.name : `${product.name} - image ${index + 1}`,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      );
      await insertMany(
        imageRows,
        (batch) => tx.productImage.createMany({ data: batch }),
        750,
      );

      const categoryRows = products.flatMap((product) =>
        product.category
          ? [
              {
                productId: product.id,
                categoryId: categoryIds.get(normalizedKey(product.category)) as string,
              },
            ]
          : [],
      );
      if (categoryRows.length) {
        await insertMany(
          categoryRows,
          (batch) => tx.productCategory.createMany({ data: batch }),
          1_000,
        );
      }
      const tagRows = products.flatMap((product) =>
        product.tags.map((tag) => ({
          productId: product.id,
          tagId: tagIds.get(normalizedKey(tag)) as string,
        })),
      );
      if (tagRows.length) {
        await insertMany(
          tagRows,
          (batch) => tx.productTag.createMany({ data: batch }),
          1_000,
        );
      }

      await insertMany(
        products,
        (batch) =>
          tx.inventoryMovement.createMany({
            data: batch.map((product) => ({
              id: randomUUID(),
              productId: product.id,
              previousQuantity: 0,
              quantityDelta: product.stock,
              newQuantity: product.stock,
              reason: InventoryMovementReason.IMPORT,
              note: `Excel replacement import ${checksum.slice(0, 12)}; availability mapped to ${product.stock}.`,
              idempotencyKey: `excel:${checksum}:${product.sourceProductId}`,
            })),
          }),
        500,
      );

      return {
        deleted,
        inserted: {
          products: products.length,
          variants: 0,
          images: imageRows.length,
          brands: brands.length,
          categories: categories.length,
          tags: tags.length,
          productCategories: categoryRows.length,
          productTags: tagRows.length,
          inventoryMovements: products.length,
        },
      };
    },
    { maxWait: 20_000, timeout: 300_000 },
  );
};

const main = async () => {
  const options = parseCli();
  const connection = await assertLocalDatabase();
  const workbook = readWorkbook(options.file);
  const parsed = parseProducts(workbook.rows);
  const errors = parsed.issues.filter((issue) => issue.severity === "error");
  const warnings = parsed.issues.filter((issue) => issue.severity === "warning");
  const duplicateSkuGroups = [...parsed.skuCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([sku, count]) => ({ sku, count }))
    .sort((left, right) => right.count - left.count || left.sku.localeCompare(right.sku));
  const before = await getDatabaseStats();
  const report: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    mode: options.replace ? "replace" : "dry-run",
    source: {
      file: options.file,
      sha256: workbook.checksum,
      sheets: workbook.sheetNames,
      productColumns: workbook.headers,
      productRows: workbook.rows.length,
      summaryProductTotal: workbook.summaryProductTotal,
    },
    database: connection,
    mapping: {
      availability: "Oui => stock 1; Non => stock 0 (the workbook has no numeric quantity)",
      variants:
        "No ProductVariant rows: this workbook contains one main row per product and every Variante value is blank; source variant IDs are retained on Product.sourceVariantId.",
      categories:
        "Type => Category and ProductCategory when supplied; this workbook has no Type values, so no categories are invented.",
      duplicateSkus:
        "Exact values are retained in Product.sourceSku; Product.sku receives a deterministic source-product-ID suffix where uniqueness is required.",
    },
    validation: {
      parsedProducts: parsed.products.length,
      rejectedRows: errors.length,
      warningCount: warnings.length,
      missingSourceSkuRows: parsed.products.filter((product) => !product.sourceSku).length,
      duplicateSkuGroupCount: duplicateSkuGroups.length,
      duplicateSkuGroups,
      productsWithoutCategory: parsed.products.filter((product) => !product.category).length,
      productsWithImages: parsed.products.filter((product) => product.images.length > 0).length,
      totalImageUrls: parsed.products.reduce((sum, product) => sum + product.images.length, 0),
      availableProducts: parsed.products.filter((product) => product.available).length,
      unavailableProducts: parsed.products.filter((product) => !product.available).length,
      promotionalProducts: parsed.products.filter((product) => product.discount > 0).length,
      errors,
      warnings,
    },
    before,
  };

  console.log(`Workbook: ${options.file}`);
  console.log(`Workbook SHA-256: ${workbook.checksum}`);
  console.log(`Rows: ${workbook.rows.length}; parsed: ${parsed.products.length}; rejected: ${errors.length}`);
  console.log(`Duplicate SKU groups: ${duplicateSkuGroups.length}; missing SKUs: ${parsed.products.filter((product) => !product.sourceSku).length}`);
  console.log(`Categories supplied: ${new Set(parsed.products.map((product) => product.category).filter(Boolean)).size}`);
  console.log(`Images: ${parsed.products.reduce((sum, product) => sum + product.images.length, 0)}`);

  if (!options.replace) {
    console.log("Dry run only. Pass --replace to perform the atomic local replacement.");
  } else {
    console.log("Starting atomic replacement on the confirmed local database...");
    const mutation = await replaceCatalogue(parsed.products, workbook.checksum);
    const nextCachePath = path.resolve(".next", "cache");
    const nextCacheCleared = existsSync(nextCachePath);
    if (nextCacheCleared) {
      rmSync(nextCachePath, { recursive: true, force: true });
    }
    const after = await getDatabaseStats();
    const databaseSourceRows = await prisma.product.count({
      where: { sourceName: SOURCE_NAME },
    });
    const databaseMissingRequired = await prisma.product.count({
      where: {
        OR: [{ name: "" }, { sku: "" }, { slug: "" }],
      },
    });
    const databaseDuplicateOperationalSkus = await prisma.$queryRaw<
      Array<{ sku: string; count: bigint }>
    >`SELECT "sku", COUNT(*) AS "count" FROM "Product" GROUP BY "sku" HAVING COUNT(*) > 1`;
    Object.assign(report, {
      mutation,
      after,
      localNextCacheCleared: nextCacheCleared,
      verification: {
        expectedProducts: parsed.products.length,
        databaseProductsFromSource: databaseSourceRows,
        databaseMissingRequired,
        databaseDuplicateOperationalSkus: databaseDuplicateOperationalSkus.map((row) => ({
          sku: row.sku,
          count: Number(row.count),
        })),
        productCountMatches:
          after.products === parsed.products.length &&
          databaseSourceRows === parsed.products.length,
        imageCountMatches:
          after.images === parsed.products.reduce((sum, product) => sum + product.images.length, 0),
        orderCountPreserved: after.orderItems === before.orderItems,
        oldOrderProductLinksCleared: after.linkedOrderItems === 0,
      },
    });
    console.log("Replacement committed successfully.");
    console.log(
      nextCacheCleared
        ? "Cleared the generated local Next.js cache; restart/rebuild the local app."
        : "No generated local Next.js cache was present.",
    );
    console.log(JSON.stringify({ mutation, after, verification: report.verification }, null, 2));
  }

  mkdirSync(path.dirname(options.report), { recursive: true });
  writeFileSync(options.report, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Report written to ${options.report}`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
