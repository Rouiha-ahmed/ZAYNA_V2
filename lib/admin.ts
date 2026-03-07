import {
  Prisma,
  LoyaltyTier,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  PromoDiscountType,
} from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const splitEnvList = (value: string | undefined) =>
  new Set(
    (value || "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );

const adminEmailSet = () => splitEnvList(process.env.ADMIN_EMAILS);
const adminUserIdSet = () => splitEnvList(process.env.ADMIN_USER_IDS);

const decimalToNumber = (value: Prisma.Decimal | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === "number" ? value : Number(value);
};

const primaryEmailFromUser = (user: Awaited<ReturnType<typeof currentUser>>) => {
  if (!user) {
    return null;
  }

  return (
    user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress ||
    user.emailAddresses[0]?.emailAddress ||
    null
  );
};

export const productStatusOptions = [
  { value: "new", label: "Nouveau" },
  { value: "hot", label: "Tendance" },
  { value: "sale", label: "Promo" },
] as const satisfies ReadonlyArray<{ value: ProductStatus; label: string }>;

export const promoDiscountTypeOptions = [
  { value: "percentage", label: "Pourcentage" },
  { value: "fixed", label: "Montant fixe" },
] as const satisfies ReadonlyArray<{
  value: PromoDiscountType;
  label: string;
}>;

export const paymentMethodOptions = [
  { value: "cod", label: "Paiement a la livraison" },
  { value: "cmi_card", label: "Carte bancaire" },
  { value: "installments", label: "Paiement en plusieurs fois" },
] as const satisfies ReadonlyArray<{
  value: PaymentMethod;
  label: string;
}>;

export type AdminIdentity = {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  accessConfigured: boolean;
  usesDevelopmentFallback: boolean;
};

export const getAdminIdentity = async (): Promise<AdminIdentity> => {
  const { userId } = await auth();

  if (!userId) {
    return {
      userId: null,
      email: null,
      displayName: null,
      isAdmin: false,
      accessConfigured: adminEmailSet().size > 0 || adminUserIdSet().size > 0,
      usesDevelopmentFallback: false,
    };
  }

  const user = await currentUser();
  const email = primaryEmailFromUser(user);
  const displayName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    email ||
    userId;

  const emails = adminEmailSet();
  const userIds = adminUserIdSet();
  const accessConfigured = emails.size > 0 || userIds.size > 0;
  const isConfiguredAdmin =
    userIds.has(userId.toLowerCase()) || (email ? emails.has(email.toLowerCase()) : false);
  const usesDevelopmentFallback =
    !accessConfigured && process.env.NODE_ENV !== "production";

  return {
    userId,
    email,
    displayName,
    isAdmin: accessConfigured ? isConfiguredAdmin : usesDevelopmentFallback,
    accessConfigured,
    usesDevelopmentFallback,
  };
};

export const requireAdmin = async () => {
  const identity = await getAdminIdentity();

  if (!identity.userId) {
    redirect("/");
  }

  if (!identity.isAdmin) {
    redirect("/admin");
  }

  return identity;
};

export type AdminDashboardData = {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    totalProducts: number;
    totalCategories: number;
    activePromoCodes: number;
    lowStockProducts: number;
    totalCustomers: number;
  };
  categories: Array<{
    id: string;
    title: string;
    slug: string;
    featured: boolean;
    productCount: number;
    updatedAt: Date;
  }>;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    status: ProductStatus;
    brandTitle: string | null;
    categoryTitles: string[];
    imageUrl: string | null;
    updatedAt: Date;
  }>;
  promoCodes: Array<{
    id: string;
    title: string;
    code: string;
    active: boolean;
    discountType: PromoDiscountType;
    discountValue: number;
    minimumOrderAmount: number;
    usageLimit: number | null;
    usedCount: number;
    allowedPaymentMethods: PaymentMethod[];
    endsAt: Date | null;
    updatedAt: Date;
  }>;
  brands: Array<{
    id: string;
    title: string;
    slug: string;
    imageUrl: string | null;
    productCount: number;
    updatedAt: Date;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    email: string;
    totalPrice: number;
    status: string;
    paymentStatus: string;
    paymentMethod: PaymentMethod;
    orderDate: Date;
    itemsCount: number;
    shippingCity: string | null;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    stock: number;
    slug: string;
  }>;
  orderStatusBreakdown: Array<{
    status: OrderStatus;
    count: number;
  }>;
  paymentStatusBreakdown: Array<{
    status: PaymentStatus;
    count: number;
  }>;
  customers: Array<{
    id: string;
    fullName: string;
    email: string;
    loyaltyTier: LoyaltyTier;
    loyaltyPoints: number;
    installmentsEligible: boolean;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: Date | null;
    createdAt: Date;
  }>;
};

export const getAdminDashboardData = async (): Promise<AdminDashboardData> => {
  await requireAdmin();

  const [
    totalOrders,
    pendingOrders,
    totalProducts,
    totalCategories,
    activePromoCodes,
    totalCustomers,
    lowStockProductsCount,
    paidRevenueAggregate,
    categories,
    products,
    promoCodes,
    brands,
    recentOrders,
    lowStockItems,
    orderStatusBreakdown,
    paymentStatusBreakdown,
    customers,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: {
        status: {
          in: ["pending", "processing", "out_for_delivery"],
        },
      },
    }),
    prisma.product.count(),
    prisma.category.count(),
    prisma.promoCode.count({
      where: {
        active: true,
      },
    }),
    prisma.user.count(),
    prisma.product.count({
      where: {
        stock: {
          lte: 5,
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: "paid",
      },
      _sum: {
        totalPrice: true,
      },
    }),
    prisma.category.findMany({
      orderBy: {
        updatedAt: "desc",
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
          take: 1,
        },
        categories: {
          include: {
            category: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      take: 20,
    }),
    prisma.promoCode.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    }),
    prisma.brand.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      take: 20,
    }),
    prisma.order.findMany({
      orderBy: {
        orderDate: "desc",
      },
      include: {
        items: {
          select: {
            id: true,
          },
        },
      },
      take: 12,
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
      select: {
        id: true,
        name: true,
        stock: true,
        slug: true,
      },
      take: 8,
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
      take: 10,
    }),
  ]);

  return {
    metrics: {
      totalRevenue: decimalToNumber(paidRevenueAggregate._sum.totalPrice),
      totalOrders,
      pendingOrders,
      totalProducts,
      totalCategories,
      activePromoCodes,
      lowStockProducts: lowStockProductsCount,
      totalCustomers,
    },
    categories: categories.map((category) => ({
      id: category.id,
      title: category.title,
      slug: category.slug,
      featured: category.featured,
      productCount: category._count.products,
      updatedAt: category.updatedAt,
    })),
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: decimalToNumber(product.price),
      stock: product.stock,
      status: product.status,
      brandTitle: product.brand?.title || null,
      categoryTitles: product.categories.map((item) => item.category.title),
      imageUrl: product.images[0]?.url || null,
      updatedAt: product.updatedAt,
    })),
    promoCodes: promoCodes.map((promo) => ({
      id: promo.id,
      title: promo.title,
      code: promo.code,
      active: promo.active,
      discountType: promo.discountType,
      discountValue: decimalToNumber(promo.discountValue),
      minimumOrderAmount: decimalToNumber(promo.minimumOrderAmount),
      usageLimit: promo.usageLimit,
      usedCount: promo.usedCount,
      allowedPaymentMethods: promo.allowedPaymentMethods,
      endsAt: promo.endsAt,
      updatedAt: promo.updatedAt,
    })),
    brands: brands.map((brand) => ({
      id: brand.id,
      title: brand.title,
      slug: brand.slug,
      imageUrl: brand.imageUrl,
      productCount: brand._count.products,
      updatedAt: brand.updatedAt,
    })),
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      email: order.email,
      totalPrice: decimalToNumber(order.totalPrice),
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      orderDate: order.orderDate,
      itemsCount: order.items.length,
      shippingCity: order.shippingCity,
    })),
    lowStockItems,
    orderStatusBreakdown: orderStatusBreakdown.map((item) => ({
      status: item.status,
      count: item._count.status,
    })),
    paymentStatusBreakdown: paymentStatusBreakdown.map((item) => ({
      status: item.paymentStatus,
      count: item._count.paymentStatus,
    })),
    customers: customers.map((customer) => {
      const paidOrders = customer.orders.filter((order) => order.paymentStatus === "paid");
      const totalSpent = paidOrders.reduce(
        (sum, order) => sum + decimalToNumber(order.totalPrice),
        0
      );

      return {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        loyaltyTier: customer.loyaltyTier,
        loyaltyPoints: customer.loyaltyPoints,
        installmentsEligible: customer.installmentsEligible,
        orderCount: customer._count.orders,
        totalSpent,
        lastOrderDate: customer.orders[0]?.orderDate || null,
        createdAt: customer.createdAt,
      };
    }),
  };
};
