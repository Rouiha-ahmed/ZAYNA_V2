import { Prisma, PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { findSimilarCategory } from "../lib/categories";
import {
  CATALOGUE_TAXONOMY,
  classifyProduct,
  taxonomyBySlug,
} from "../lib/product-category-classifier";

const SOURCE_REPORT_DIR = path.resolve("reports");
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

type CliOptions = {
  apply: boolean;
  preferIpv6: boolean;
  reportPrefix: string;
};

const parseCli = (): CliOptions => {
  const args = process.argv.slice(2);
  const valueAfter = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  return {
    apply: args.includes("--apply"),
    preferIpv6: args.includes("--prefer-ipv6-loopback"),
    reportPrefix: path.resolve(
      valueAfter("--report-prefix") ||
        path.join(SOURCE_REPORT_DIR, "product-category-backfill"),
    ),
  };
};

const options = parseCli();
const rawDatabaseUrl = process.env.DATABASE_URL;
if (!rawDatabaseUrl) throw new Error("DATABASE_URL is not set.");
const configuredUrl = new URL(rawDatabaseUrl);
const runtimeUrl = new URL(rawDatabaseUrl);
if (options.preferIpv6 && configuredUrl.hostname === "localhost") {
  runtimeUrl.hostname = "[::1]";
}
const prisma = new PrismaClient({ datasources: { db: { url: runtimeUrl.toString() } } });

const assertLocalDatabase = async () => {
  const host = configuredUrl.hostname.toLocaleLowerCase();
  const database = decodeURIComponent(configuredUrl.pathname.replace(/^\//, ""));
  const safeUrl = `${configuredUrl.protocol}//${encodeURIComponent(configuredUrl.username)}${
    configuredUrl.username ? ":***@" : ""
  }${configuredUrl.hostname}${configuredUrl.port ? `:${configuredUrl.port}` : ""}${configuredUrl.pathname}`;
  const local = LOCAL_HOSTS.has(host) && !/railway/i.test(rawDatabaseUrl);
  console.log("Database safety confirmation:");
  console.log(`  DATABASE_URL: ${safeUrl}`);
  console.log(`  Local host: ${local ? "YES" : "NO"}`);
  console.log(`  Railway marker: ${/railway/i.test(rawDatabaseUrl) ? "YES" : "NO"}`);
  if (!local) throw new Error("Refusing to run category backfill on a non-local database.");
  const [connection] = await prisma.$queryRaw<
    Array<{ database: string; serverAddress: string | null; serverPort: number | null }>
  >`SELECT current_database() AS "database", inet_server_addr()::text AS "serverAddress", inet_server_port() AS "serverPort"`;
  const serverAddress = connection?.serverAddress?.replace(/\/(?:32|128)$/, "") || null;
  if (!connection || connection.database !== database || (serverAddress && !["127.0.0.1", "::1"].includes(serverAddress))) {
    throw new Error("Refusing to run: the live PostgreSQL connection is not the configured local database.");
  }
  console.log(`  PostgreSQL: ${connection.database} at ${connection.serverAddress}:${connection.serverPort}`);
  return { safeUrl, ...connection };
};

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const uniqueSlug = async (tx: Prisma.TransactionClient, desired: string, excludeId?: string) => {
  let slug = desired;
  let suffix = 2;
  while (
    await tx.category.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${desired}-${suffix++}`;
  }
  return slug;
};

const main = async () => {
  const connection = await assertLocalDatabase();
  const [products, existingCategories, existingRelationCount] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        fullDescription: true,
        lifecycleStatus: true,
        isActive: true,
        brand: { select: { title: true } },
        tags: { select: { tag: { select: { title: true } } } },
        categories: {
          select: {
            category: {
              select: {
                id: true,
                title: true,
                slug: true,
                parentId: true,
                isActive: true,
                archivedAt: true,
              },
            },
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { range: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        parentId: true,
        isActive: true,
        archivedAt: true,
      },
    }),
    prisma.productCategory.count(),
  ]);

  const rows = products.map((product) => {
    const activeCategories = product.categories
      .map(({ category }) => category)
      .filter((category) => category.isActive && !category.archivedAt);
    if (activeCategories.length) {
      return {
        productId: product.id,
        product: product.name,
        brand: product.brand?.title || "",
        lifecycleStatus: product.lifecycleStatus,
        currentCategories: activeCategories.map((category) => category.title),
        proposedCategorySlugs: activeCategories.map((category) => category.slug),
        proposedCategories: activeCategories.map((category) => category.title),
        action: "KEEP" as const,
        confidence: "HIGH" as const,
        reason: "Existing active category relation preserved",
        evidence: activeCategories.map((category) => category.title),
      };
    }
    const classification = classifyProduct({
      name: product.name,
      slug: product.slug,
      description: product.fullDescription || product.description,
      tags: product.tags.map(({ tag }) => tag.title),
    });
    return {
      productId: product.id,
      product: product.name,
      brand: product.brand?.title || "",
      lifecycleStatus: product.lifecycleStatus,
      currentCategories: product.categories.map(({ category }) => category.title),
      proposedCategorySlugs: classification.categorySlugs,
      proposedCategories: classification.categorySlugs.map(
        (slug) => taxonomyBySlug.get(slug)?.title || slug,
      ),
      action: classification.categorySlugs.length ? ("ASSIGN" as const) : ("REVIEW" as const),
      confidence: classification.confidence,
      reason: classification.reason,
      evidence: classification.evidence,
    };
  });

  const usedSlugs = new Set(rows.flatMap((row) => row.action === "ASSIGN" ? row.proposedCategorySlugs : []));
  for (const slug of [...usedSlugs]) {
    const parentSlug = taxonomyBySlug.get(slug)?.parentSlug;
    if (parentSlug) usedSlugs.add(parentSlug);
  }
  const requiredTaxonomy = CATALOGUE_TAXONOMY.filter((category) => usedSlugs.has(category.slug));
  const categoriesToCreate = requiredTaxonomy.filter(
    (category) => !findSimilarCategory(category.title, existingCategories),
  );
  const reviewRows = rows.filter((row) => row.action === "REVIEW");
  const assignRows = rows.filter((row) => row.action === "ASSIGN");
  const keepRows = rows.filter((row) => row.action === "KEEP");
  const activeReviewRows = reviewRows.filter((row) => row.lifecycleStatus === "ACTIVE");
  const totals = {
    totalProducts: rows.length,
    existingCategories: existingCategories.length,
    existingRelations: existingRelationCount,
    alreadyCategorized: keepRows.length,
    toAssign: assignRows.length,
    categoriesRequired: requiredTaxonomy.length,
    categoriesToCreate: categoriesToCreate.length,
    ambiguousReview: reviewRows.length,
    activeAmbiguousReview: activeReviewRows.length,
    highConfidenceAssignments: assignRows.filter((row) => row.confidence === "HIGH").length,
    mediumConfidenceAssignments: assignRows.filter((row) => row.confidence === "MEDIUM").length,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    mode: options.apply ? "apply" : "dry-run",
    database: connection,
    architecture: {
      relation: "many-to-many",
      joinModel: "ProductCategory",
      hierarchyField: "Category.parentId",
      maximumLevels: 2,
    },
    totals,
    existingCategoryRecords: existingCategories,
    categoriesRequired: requiredTaxonomy,
    categoriesToCreate,
    rows,
  };

  mkdirSync(path.dirname(options.reportPrefix), { recursive: true });
  const suffix = options.apply ? "applied" : "dry-run";
  const jsonPath = `${options.reportPrefix}-${suffix}.json`;
  const csvPath = `${options.reportPrefix}-${suffix}.csv`;
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  const csvRows = [
    ["Product ID", "Product", "Brand", "Current Category", "Proposed Category", "Action", "Confidence", "Reason"],
    ...rows.map((row) => [
      row.productId,
      row.product,
      row.brand,
      row.currentCategories.join(" | "),
      row.proposedCategories.join(" | "),
      row.action,
      row.confidence,
      row.reason,
    ]),
  ];
  writeFileSync(csvPath, `${csvRows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, "utf8");

  console.log(JSON.stringify(totals, null, 2));
  console.log(`${options.apply ? "Apply" : "Dry-run"} report JSON: ${jsonPath}`);
  console.log(`${options.apply ? "Apply" : "Dry-run"} report CSV: ${csvPath}`);
  if (reviewRows.length) {
    console.log("Review sample:");
    console.table(reviewRows.slice(0, 30).map((row) => ({
      id: row.productId,
      product: row.product,
      brand: row.brand,
      reason: row.reason,
    })));
  }
  if (!options.apply) {
    console.log("Simulation only. Re-run with --apply after reviewing the reports.");
    return;
  }

  const mutation = await prisma.$transaction(async (tx) => {
    const databaseCategories = await tx.category.findMany({
      select: { id: true, title: true, slug: true, parentId: true, isActive: true, archivedAt: true },
    });
    const categoryIdByTaxonomySlug = new Map<string, string>();
    let createdCategories = 0;
    let reusedCategories = 0;
    for (const definition of requiredTaxonomy.filter((category) => !category.parentSlug)) {
      const existing = findSimilarCategory(definition.title, databaseCategories);
      if (existing) {
        if (existing.archivedAt || !existing.isActive) {
          await tx.category.update({
            where: { id: existing.id },
            data: { archivedAt: null, archivedBy: null, isActive: true },
          });
        }
        categoryIdByTaxonomySlug.set(definition.slug, existing.id);
        reusedCategories += 1;
      } else {
        const created = await tx.category.create({
          data: {
            title: definition.title,
            slug: await uniqueSlug(tx, definition.slug),
            description: definition.description,
            range: definition.order,
            featured: Boolean(definition.featured),
            isActive: true,
          },
          select: { id: true, title: true, slug: true, parentId: true, isActive: true, archivedAt: true },
        });
        databaseCategories.push(created);
        categoryIdByTaxonomySlug.set(definition.slug, created.id);
        createdCategories += 1;
      }
    }
    for (const definition of requiredTaxonomy.filter((category) => category.parentSlug)) {
      const parentId = categoryIdByTaxonomySlug.get(definition.parentSlug as string);
      if (!parentId) throw new Error(`Missing parent category ${definition.parentSlug}.`);
      const existing = findSimilarCategory(definition.title, databaseCategories);
      if (existing) {
        await tx.category.update({
          where: { id: existing.id },
          data: {
            parentId,
            archivedAt: null,
            archivedBy: null,
            isActive: true,
          },
        });
        categoryIdByTaxonomySlug.set(definition.slug, existing.id);
        reusedCategories += 1;
      } else {
        const created = await tx.category.create({
          data: {
            title: definition.title,
            slug: await uniqueSlug(tx, definition.slug),
            description: definition.description,
            range: definition.order,
            featured: false,
            isActive: true,
            parentId,
          },
          select: { id: true, title: true, slug: true, parentId: true, isActive: true, archivedAt: true },
        });
        databaseCategories.push(created);
        categoryIdByTaxonomySlug.set(definition.slug, created.id);
        createdCategories += 1;
      }
    }

    const relationData = assignRows.flatMap((row) =>
      row.proposedCategorySlugs.map((slug) => {
        const categoryId = categoryIdByTaxonomySlug.get(slug);
        if (!categoryId) throw new Error(`No database category for ${slug}.`);
        return { productId: row.productId, categoryId };
      }),
    );
    let createdRelations = 0;
    for (let index = 0; index < relationData.length; index += 1_000) {
      const batch = relationData.slice(index, index + 1_000);
      createdRelations += (await tx.productCategory.createMany({ data: batch, skipDuplicates: true })).count;
    }
    return { createdCategories, reusedCategories, createdRelations };
  }, { maxWait: 20_000, timeout: 180_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  const [categorizedProducts, uncategorizedActiveProducts, relationCount, duplicateRelations] = await Promise.all([
    prisma.product.count({ where: { categories: { some: { category: { isActive: true, archivedAt: null } } } } }),
    prisma.product.count({ where: { lifecycleStatus: "ACTIVE", isActive: true, categories: { none: { category: { isActive: true, archivedAt: null } } } } }),
    prisma.productCategory.count(),
    prisma.$queryRaw<Array<{ productId: string; categoryId: string; count: bigint }>>`
      SELECT "productId", "categoryId", COUNT(*) AS "count"
      FROM "ProductCategory"
      GROUP BY "productId", "categoryId"
      HAVING COUNT(*) > 1
    `,
  ]);
  const verification = {
    ...mutation,
    categorizedProducts,
    uncategorizedActiveProducts,
    relationCount,
    duplicateRelations: duplicateRelations.map((row) => ({ ...row, count: Number(row.count) })),
    reportChecksum: createHash("sha256").update(JSON.stringify(rows)).digest("hex"),
  };
  writeFileSync(
    jsonPath,
    `${JSON.stringify({ ...report, verification }, null, 2)}\n`,
    "utf8",
  );
  console.log("Apply completed:");
  console.log(JSON.stringify(verification, null, 2));
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
