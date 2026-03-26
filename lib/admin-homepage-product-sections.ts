import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { getAdminDataTag, requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const adminDataTag = getAdminDataTag();
const homepageProductSectionEntities = [
  "HomepageProductSection",
  "HomepageProductSectionItem",
];

const isHomepageProductSectionSchemaError = (error: unknown) => {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2021" && error.code !== "P2022") {
    return false;
  }

  const meta = error.meta as Prisma.JsonObject | undefined;
  const rawTable =
    (typeof meta?.table === "string" && meta.table) ||
    (typeof meta?.column === "string" && meta.column) ||
    "";

  return homepageProductSectionEntities.some((entity) => rawTable.includes(entity));
};

const hasHomepageProductSectionDelegates = () => {
  const raw = prisma as unknown as Record<string, unknown>;
  const sectionDelegate = raw["homepageProductSection"] as
    | {
        findMany?: unknown;
      }
    | undefined;
  const itemDelegate = raw["homepageProductSectionItem"] as
    | {
        findMany?: unknown;
      }
    | undefined;

  return Boolean(
    sectionDelegate &&
      typeof sectionDelegate.findMany === "function" &&
      itemDelegate &&
      typeof itemDelegate.findMany === "function"
  );
};

const isMissingHomepageProductSectionDelegateError = (error: unknown) => {
  if (!(error instanceof TypeError)) {
    return false;
  }

  const message = String(error.message || "").toLowerCase();
  return (
    message.includes("findmany") &&
    (message.includes("undefined") ||
      message.includes("homepageproductsection") ||
      message.includes("homepageproductsectionitem"))
  );
};

export type AdminHomepageProductSection = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  isActive: boolean;
  order: number;
  productIds: string[];
  products: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    order: number;
  }>;
};

export type AdminHomepageProductSectionsData = {
  isSchemaReady: boolean;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  }>;
  sections: AdminHomepageProductSection[];
};

async function fetchAdminHomepageProductSectionsData(): Promise<AdminHomepageProductSectionsData> {
  const products = await prisma.product.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
    },
    take: 400,
  });

  if (!hasHomepageProductSectionDelegates()) {
    return {
      isSchemaReady: false,
      products,
      sections: [],
    };
  }

  let sections: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    slug: string;
    isActive: boolean;
    order: number;
    items: Array<{
      id: string;
      order: number;
      product: {
        id: string;
        name: string;
        slug: string;
        isActive: boolean;
      };
    }>;
  }> = [];
  let isSchemaReady = true;

  try {
    sections = await prisma.homepageProductSection.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        items: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    if (
      !isHomepageProductSectionSchemaError(error) &&
      !isMissingHomepageProductSectionDelegateError(error)
    ) {
      throw error;
    }
    isSchemaReady = false;
  }

  return {
    isSchemaReady,
    products,
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      subtitle: section.subtitle,
      slug: section.slug,
      isActive: section.isActive,
      order: section.order,
      productIds: section.items.map((item) => item.product.id),
      products: section.items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        isActive: item.product.isActive,
        order: item.order,
      })),
    })),
  };
}

const getCachedAdminHomepageProductSectionsData = unstable_cache(
  fetchAdminHomepageProductSectionsData,
  ["admin-homepage-product-sections-data"],
  {
    tags: [adminDataTag],
    revalidate: 120,
  }
);

export async function getAdminHomepageProductSectionsData(): Promise<AdminHomepageProductSectionsData> {
  await requireAdmin();
  return getCachedAdminHomepageProductSectionsData();
}
