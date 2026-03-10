import { Prisma, type OrderStatus, type PaymentStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";

import {
  adminOrderStageOptions,
  getAdminDataTag,
  getAdminOrderStage,
  requireAdmin,
  type AdminDashboardData,
} from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const adminDataTag = getAdminDataTag();
const sevenDaysFromNow = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const fourteenDaysAgo = () => {
  const date = new Date();

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - 13);

  return date;
};
const timelineLabelFormatter = new Intl.DateTimeFormat("fr-MA", {
  weekday: "short",
  day: "2-digit",
});

const decimalToNumber = (value: Prisma.Decimal | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === "number" ? value : Number(value);
};

const toDate = (value: Date | string | null) => (value ? new Date(value) : null);

const getUtcDateKey = (value: Date) =>
  `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(
    value.getUTCDate()
  ).padStart(2, "0")}`;

const buildRevenueSeries = (
  orders: Array<{
    orderDate: Date;
    paymentStatus: PaymentStatus;
    totalPrice: Prisma.Decimal | number;
  }>
) => {
  const start = fourteenDaysAgo();
  const series = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(start);

    date.setUTCDate(start.getUTCDate() + index);

    return {
      date: getUtcDateKey(date),
      label: timelineLabelFormatter.format(date),
      revenue: 0,
      orders: 0,
    };
  });
  const seriesByDate = new Map(series.map((entry) => [entry.date, entry]));

  orders.forEach((order) => {
    const key = getUtcDateKey(order.orderDate);
    const bucket = seriesByDate.get(key);

    if (!bucket) {
      return;
    }

    bucket.orders += 1;

    if (order.paymentStatus === "paid") {
      bucket.revenue += decimalToNumber(order.totalPrice);
    }
  });

  return series;
};

const buildOrderStageBreakdown = (counts: Partial<Record<OrderStatus, number>>) =>
  adminOrderStageOptions.map((option) => {
    const count =
      option.value === "pending"
        ? counts.pending || 0
        : option.value === "confirmed"
          ? counts.processing || 0
          : option.value === "preparing"
            ? counts.paid || 0
            : option.value === "shipped"
              ? (counts.shipped || 0) + (counts.out_for_delivery || 0)
              : option.value === "delivered"
                ? counts.delivered || 0
                : counts.cancelled || 0;

    return {
      status: option.value,
      label: option.label,
      count,
    };
  });

const buildOrderCountsMap = (
  groups: Array<{
    status: OrderStatus;
    _count: {
      status: number;
    };
  }>
) =>
  groups.reduce<Partial<Record<OrderStatus, number>>>((accumulator, item) => {
    accumulator[item.status] = item._count.status;
    return accumulator;
  }, {});

const getPendingOrdersCount = (
  breakdown: AdminDashboardData["orderStageBreakdown"]
) =>
  breakdown
    .filter((item) =>
      ["pending", "confirmed", "preparing", "shipped"].includes(item.status)
    )
    .reduce((sum, item) => sum + item.count, 0);

const mapOrders = (
  orders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    email: string;
    shippingPhone: string | null;
    shippingAddress: string | null;
    shippingCity: string | null;
    shippingState: string | null;
    shippingZip: string | null;
    totalPrice: Prisma.Decimal | number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: AdminDashboardData["orders"][number]["paymentMethod"];
    orderDate: Date;
    items: Array<{
      id: string;
      productNameSnapshot: string;
      productImageUrlSnapshot: string | null;
      productPriceSnapshot: Prisma.Decimal | number;
      quantity: number;
    }>;
  }>
): AdminDashboardData["orders"] =>
  orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    email: order.email,
    phone: order.shippingPhone,
    address: order.shippingAddress,
    city: order.shippingCity,
    state: order.shippingState,
    zip: order.shippingZip,
    totalPrice: decimalToNumber(order.totalPrice),
    status: order.status,
    adminStage: getAdminOrderStage(order.status),
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    orderDate: order.orderDate,
    itemsCount: order.items.length,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.productNameSnapshot,
      imageUrl: item.productImageUrlSnapshot,
      quantity: item.quantity,
      unitPrice: decimalToNumber(item.productPriceSnapshot),
    })),
  }));

const mapCustomers = (
  customers: Array<{
    id: string;
    fullName: string;
    email: string;
    loyaltyTier: AdminDashboardData["customers"][number]["loyaltyTier"];
    loyaltyPoints: number;
    installmentsEligible: boolean;
    createdAt: Date;
    orders: Array<{
      orderDate: Date;
      paymentStatus: PaymentStatus;
      totalPrice: Prisma.Decimal | number;
    }>;
    _count: {
      orders: number;
    };
  }>
): AdminDashboardData["customers"] =>
  customers.map((customer) => {
    const paidOrders = customer.orders.filter((order) => order.paymentStatus === "paid");

    return {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      loyaltyTier: customer.loyaltyTier,
      loyaltyPoints: customer.loyaltyPoints,
      installmentsEligible: customer.installmentsEligible,
      orderCount: customer._count.orders,
      totalSpent: paidOrders.reduce(
        (sum, order) => sum + decimalToNumber(order.totalPrice),
        0
      ),
      lastOrderDate: customer.orders[0]?.orderDate || null,
      createdAt: customer.createdAt,
    };
  });

const mapLowStockItems = (
  items: Array<{
    id: string;
    name: string;
    stock: number;
    images: Array<{
      url: string;
    }>;
  }>
): AdminDashboardData["lowStockItems"] =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    stock: item.stock,
    imageUrl: item.images[0]?.url || null,
  }));

const mapCategories = (
  categories: Array<{
    id: string;
    title: string;
    description: string | null;
    featured: boolean;
    imageUrl: string | null;
    updatedAt: Date;
    _count: {
      products: number;
    };
  }>
): AdminDashboardData["categories"] =>
  categories.map((category) => ({
    id: category.id,
    title: category.title,
    description: category.description,
    featured: category.featured,
    productCount: category._count.products,
    imageUrl: category.imageUrl,
    updatedAt: category.updatedAt,
  }));

const mapBrands = (
  brands: Array<{
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    updatedAt: Date;
    _count: {
      products: number;
    };
  }>
): AdminDashboardData["brands"] =>
  brands.map((brand) => ({
    id: brand.id,
    title: brand.title,
    description: brand.description,
    productCount: brand._count.products,
    imageUrl: brand.imageUrl,
    updatedAt: brand.updatedAt,
  }));

const mapProducts = (
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    price: Prisma.Decimal | number;
    discount: number;
    stock: number;
    status: AdminDashboardData["products"][number]["status"];
    isFeatured: boolean;
    brandId: string | null;
    updatedAt: Date;
    brand: {
      title: string;
    } | null;
    images: Array<{
      url: string;
    }>;
    categories: Array<{
      category: {
        id: string;
        title: string;
      };
    }>;
  }>
): AdminDashboardData["products"] =>
  products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: decimalToNumber(product.price),
    discount: product.discount,
    stock: product.stock,
    status: product.status,
    isFeatured: product.isFeatured,
    brandId: product.brandId,
    brandTitle: product.brand?.title || null,
    categoryIds: product.categories.map((item) => item.category.id),
    categoryTitles: product.categories.map((item) => item.category.title),
    imageUrl: product.images[0]?.url || null,
    imageUrls: product.images.map((image) => image.url),
    imagesCount: product.images.length,
    updatedAt: product.updatedAt,
  }));

const mapPromoCodes = (
  promoCodes: Array<{
    id: string;
    title: string;
    code: string;
    active: boolean;
    discountType: AdminDashboardData["promoCodes"][number]["discountType"];
    discountValue: Prisma.Decimal | number;
    endsAt: Date | null;
    updatedAt: Date;
  }>
): AdminDashboardData["promoCodes"] =>
  promoCodes.map((promo) => ({
    id: promo.id,
    title: promo.title,
    code: promo.code,
    active: promo.active,
    discountType: promo.discountType,
    discountValue: decimalToNumber(promo.discountValue),
    endsAt: promo.endsAt,
    updatedAt: promo.updatedAt,
  }));

const normalizeOrders = (orders: AdminDashboardData["orders"]) =>
  orders.map((order) => ({
    ...order,
    orderDate: new Date(order.orderDate),
  }));

const normalizeCustomers = (customers: AdminDashboardData["customers"]) =>
  customers.map((customer) => ({
    ...customer,
    lastOrderDate: toDate(customer.lastOrderDate),
    createdAt: new Date(customer.createdAt),
  }));

const normalizeCategories = (categories: AdminDashboardData["categories"]) =>
  categories.map((category) => ({
    ...category,
    updatedAt: new Date(category.updatedAt),
  }));

const normalizeBrands = (brands: AdminDashboardData["brands"]) =>
  brands.map((brand) => ({
    ...brand,
    updatedAt: new Date(brand.updatedAt),
  }));

const normalizeProducts = (products: AdminDashboardData["products"]) =>
  products.map((product) => ({
    ...product,
    updatedAt: new Date(product.updatedAt),
  }));

const normalizePromoCodes = (promoCodes: AdminDashboardData["promoCodes"]) =>
  promoCodes.map((promo) => ({
    ...promo,
    endsAt: toDate(promo.endsAt),
    updatedAt: new Date(promo.updatedAt),
  }));

export type AdminOverviewData = {
  metrics: AdminDashboardData["metrics"];
  orderStageBreakdown: AdminDashboardData["orderStageBreakdown"];
  recentOrders: AdminDashboardData["orders"];
  recentCustomers: AdminDashboardData["customers"];
  lowStockItems: AdminDashboardData["lowStockItems"];
  revenueSeries: Array<{
    date: string;
    label: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    name: string;
    unitsSold: number;
    ordersCount: number;
  }>;
};

async function fetchAdminOverviewData(): Promise<AdminOverviewData> {
  const [
    totalOrders,
    totalProducts,
    totalCategories,
    totalBrands,
    activePromoCodes,
    totalCustomers,
    paidRevenueAggregate,
    orderStatusGroups,
    recentOrders,
    lowStockItems,
    recentCustomers,
    expiringPromoCodes,
    recentRevenueOrders,
    topProducts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.promoCode.count({
      where: {
        active: true,
      },
    }),
    prisma.user.count(),
    prisma.order.aggregate({
      where: {
        paymentStatus: "paid",
      },
      _sum: {
        totalPrice: true,
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    }),
    prisma.order.findMany({
      orderBy: {
        orderDate: "desc",
      },
      include: {
        items: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            productNameSnapshot: true,
            productImageUrlSnapshot: true,
            productPriceSnapshot: true,
            quantity: true,
          },
        },
      },
      take: 6,
    }),
    prisma.product.findMany({
      where: {
        stock: {
          lte: 5,
        },
      },
      orderBy: [
        {
          stock: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
          take: 1,
        },
      },
      take: 6,
    }),
    prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        orders: {
          orderBy: {
            orderDate: "desc",
          },
          select: {
            orderDate: true,
            paymentStatus: true,
            totalPrice: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      take: 6,
    }),
    prisma.promoCode.count({
      where: {
        active: true,
        endsAt: {
          gte: new Date(),
          lte: sevenDaysFromNow(),
        },
      },
    }),
    prisma.order.findMany({
      where: {
        orderDate: {
          gte: fourteenDaysAgo(),
        },
      },
      orderBy: {
        orderDate: "asc",
      },
      select: {
        orderDate: true,
        paymentStatus: true,
        totalPrice: true,
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productNameSnapshot"],
      _sum: {
        quantity: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    }),
  ]);

  const orderStageBreakdown = buildOrderStageBreakdown(
    buildOrderCountsMap(orderStatusGroups)
  );

  return {
    metrics: {
      totalRevenue: decimalToNumber(paidRevenueAggregate._sum.totalPrice),
      totalOrders,
      pendingOrders: getPendingOrdersCount(orderStageBreakdown),
      totalProducts,
      totalCategories,
      totalBrands,
      activePromoCodes,
      expiringPromoCodes,
      lowStockProducts: lowStockItems.length,
      totalCustomers,
    },
    orderStageBreakdown,
    recentOrders: mapOrders(recentOrders),
    recentCustomers: mapCustomers(recentCustomers),
    lowStockItems: mapLowStockItems(lowStockItems),
    revenueSeries: buildRevenueSeries(recentRevenueOrders),
    topProducts: topProducts.map((item) => ({
      name: item.productNameSnapshot,
      unitsSold: item._sum.quantity || 0,
      ordersCount: item._count._all,
    })),
  };
}

const getCachedAdminOverviewData = unstable_cache(
  fetchAdminOverviewData,
  ["admin-overview-data"],
  {
    tags: [adminDataTag],
    revalidate: 120,
  }
);

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  await requireAdmin();
  const data = await getCachedAdminOverviewData();

  return {
    ...data,
    recentOrders: normalizeOrders(data.recentOrders),
    recentCustomers: normalizeCustomers(data.recentCustomers),
  };
}

export type AdminOrdersPageData = {
  metrics: {
    totalOrders: number;
    pendingOrders: number;
    paidOrders: number;
    totalRevenue: number;
  };
  orderStageBreakdown: AdminDashboardData["orderStageBreakdown"];
  paymentStatusBreakdown: AdminDashboardData["paymentStatusBreakdown"];
  orders: AdminDashboardData["orders"];
};

async function fetchAdminOrdersPageData(): Promise<AdminOrdersPageData> {
  const [totalOrders, paidRevenueAggregate, orderStatusGroups, paymentStatusGroups, orders] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: {
          paymentStatus: "paid",
        },
        _sum: {
          totalPrice: true,
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      }),
      prisma.order.groupBy({
        by: ["paymentStatus"],
        _count: {
          paymentStatus: true,
        },
      }),
      prisma.order.findMany({
        orderBy: {
          orderDate: "desc",
        },
        include: {
          items: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              productNameSnapshot: true,
              productImageUrlSnapshot: true,
              productPriceSnapshot: true,
              quantity: true,
            },
          },
        },
        take: 60,
      }),
    ]);

  const orderStageBreakdown = buildOrderStageBreakdown(
    buildOrderCountsMap(orderStatusGroups)
  );

  return {
    metrics: {
      totalOrders,
      pendingOrders: getPendingOrdersCount(orderStageBreakdown),
      paidOrders:
        paymentStatusGroups.find((item) => item.paymentStatus === "paid")?._count
          .paymentStatus || 0,
      totalRevenue: decimalToNumber(paidRevenueAggregate._sum.totalPrice),
    },
    orderStageBreakdown,
    paymentStatusBreakdown: paymentStatusGroups.map((item) => ({
      status: item.paymentStatus,
      count: item._count.paymentStatus,
    })),
    orders: mapOrders(orders),
  };
}

const getCachedAdminOrdersPageData = unstable_cache(
  fetchAdminOrdersPageData,
  ["admin-orders-page-data"],
  {
    tags: [adminDataTag],
    revalidate: 120,
  }
);

export async function getAdminOrdersPageData(): Promise<AdminOrdersPageData> {
  await requireAdmin();
  const data = await getCachedAdminOrdersPageData();

  return {
    ...data,
    orders: normalizeOrders(data.orders),
  };
}

export type AdminProductsPageData = {
  metrics: {
    totalProducts: number;
    featuredProducts: number;
    lowStockProducts: number;
    totalBrands: number;
    totalCategories: number;
  };
  products: AdminDashboardData["products"];
  brands: AdminDashboardData["brands"];
  categories: AdminDashboardData["categories"];
  lowStockItems: AdminDashboardData["lowStockItems"];
};

async function fetchAdminProductsPageData(): Promise<AdminProductsPageData> {
  const [
    totalProducts,
    featuredProducts,
    lowStockProducts,
    totalBrands,
    totalCategories,
    products,
    brands,
    categories,
    lowStockItems,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({
      where: {
        isFeatured: true,
      },
    }),
    prisma.product.count({
      where: {
        stock: {
          lte: 5,
        },
      },
    }),
    prisma.brand.count(),
    prisma.category.count(),
    prisma.product.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        brand: {
          select: {
            title: true,
          },
        },
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        categories: {
          include: {
            category: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      take: 24,
    }),
    prisma.brand.findMany({
      orderBy: {
        title: "asc",
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: {
        title: "asc",
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      where: {
        stock: {
          lte: 5,
        },
      },
      orderBy: [
        {
          stock: "asc",
        },
        {
          updatedAt: "desc",
        },
      ],
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
          take: 1,
        },
      },
      take: 6,
    }),
  ]);

  return {
    metrics: {
      totalProducts,
      featuredProducts,
      lowStockProducts,
      totalBrands,
      totalCategories,
    },
    products: mapProducts(products),
    brands: mapBrands(brands),
    categories: mapCategories(categories),
    lowStockItems: mapLowStockItems(lowStockItems),
  };
}

const getCachedAdminProductsPageData = unstable_cache(
  fetchAdminProductsPageData,
  ["admin-products-page-data"],
  {
    tags: [adminDataTag],
    revalidate: 120,
  }
);

export async function getAdminProductsPageData(): Promise<AdminProductsPageData> {
  await requireAdmin();
  const data = await getCachedAdminProductsPageData();

  return {
    ...data,
    products: normalizeProducts(data.products),
    brands: normalizeBrands(data.brands),
    categories: normalizeCategories(data.categories),
  };
}

export type AdminCategoriesPageData = {
  metrics: {
    totalCategories: number;
    featuredCategories: number;
    totalProducts: number;
  };
  categories: AdminDashboardData["categories"];
};

async function fetchAdminCategoriesPageData(): Promise<AdminCategoriesPageData> {
  const [totalCategories, featuredCategories, totalProducts, categories] = await Promise.all([
    prisma.category.count(),
    prisma.category.count({
      where: {
        featured: true,
      },
    }),
    prisma.product.count(),
    prisma.category.findMany({
      orderBy: {
        title: "asc",
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    }),
  ]);

  return {
    metrics: {
      totalCategories,
      featuredCategories,
      totalProducts,
    },
    categories: mapCategories(categories),
  };
}

const getCachedAdminCategoriesPageData = unstable_cache(
  fetchAdminCategoriesPageData,
  ["admin-categories-page-data"],
  {
    tags: [adminDataTag],
    revalidate: 120,
  }
);

export async function getAdminCategoriesPageData(): Promise<AdminCategoriesPageData> {
  await requireAdmin();
  const data = await getCachedAdminCategoriesPageData();

  return {
    ...data,
    categories: normalizeCategories(data.categories),
  };
}

export type AdminBrandsPageData = {
  metrics: {
    totalBrands: number;
    activeBrands: number;
    totalProducts: number;
    brandlessProducts: number;
  };
  brands: AdminDashboardData["brands"];
};

async function fetchAdminBrandsPageData(): Promise<AdminBrandsPageData> {
  const [totalBrands, totalProducts, brandlessProducts, brands] = await Promise.all([
    prisma.brand.count(),
    prisma.product.count(),
    prisma.product.count({
      where: {
        brandId: null,
      },
    }),
    prisma.brand.findMany({
      orderBy: {
        title: "asc",
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    }),
  ]);

  const mappedBrands = mapBrands(brands);

  return {
    metrics: {
      totalBrands,
      activeBrands: mappedBrands.filter((brand) => brand.productCount > 0).length,
      totalProducts,
      brandlessProducts,
    },
    brands: mappedBrands,
  };
}

const getCachedAdminBrandsPageData = unstable_cache(
  fetchAdminBrandsPageData,
  ["admin-brands-page-data"],
  {
    tags: [adminDataTag],
    revalidate: 120,
  }
);

export async function getAdminBrandsPageData(): Promise<AdminBrandsPageData> {
  await requireAdmin();
  const data = await getCachedAdminBrandsPageData();

  return {
    ...data,
    brands: normalizeBrands(data.brands),
  };
}

export type AdminPromoCodesPageData = {
  metrics: {
    totalPromoCodes: number;
    activePromoCodes: number;
    expiringPromoCodes: number;
    averageDiscountValue: number;
  };
  promoCodes: AdminDashboardData["promoCodes"];
  expiringPromoIds: string[];
};

async function fetchAdminPromoCodesPageData(): Promise<AdminPromoCodesPageData> {
  const expiringThreshold = sevenDaysFromNow().getTime();
  const [totalPromoCodes, activePromoCodes, expiringPromoCodes, averageDiscount, promoCodes] =
    await Promise.all([
      prisma.promoCode.count(),
      prisma.promoCode.count({
        where: {
          active: true,
        },
      }),
      prisma.promoCode.count({
        where: {
          active: true,
          endsAt: {
            gte: new Date(),
            lte: sevenDaysFromNow(),
          },
        },
      }),
      prisma.promoCode.aggregate({
        _avg: {
          discountValue: true,
        },
      }),
      prisma.promoCode.findMany({
        orderBy: {
          updatedAt: "desc",
        },
        take: 30,
      }),
    ]);

  return {
    metrics: {
      totalPromoCodes,
      activePromoCodes,
      expiringPromoCodes,
      averageDiscountValue: decimalToNumber(averageDiscount._avg.discountValue),
    },
    promoCodes: mapPromoCodes(promoCodes),
    expiringPromoIds: promoCodes
      .filter(
        (promo) =>
          promo.active &&
          Boolean(promo.endsAt) &&
          (promo.endsAt as Date).getTime() <= expiringThreshold
      )
      .map((promo) => promo.id),
  };
}

const getCachedAdminPromoCodesPageData = unstable_cache(
  fetchAdminPromoCodesPageData,
  ["admin-promo-page-data"],
  {
    tags: [adminDataTag],
    revalidate: 120,
  }
);

export async function getAdminPromoCodesPageData(): Promise<AdminPromoCodesPageData> {
  await requireAdmin();
  const data = await getCachedAdminPromoCodesPageData();

  return {
    ...data,
    promoCodes: normalizePromoCodes(data.promoCodes),
  };
}
