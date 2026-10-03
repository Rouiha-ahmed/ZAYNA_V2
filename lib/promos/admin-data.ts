import type { PaymentMethod, Prisma, PromoDiscountType } from "@prisma/client";

import {
  getPromoCodeStatus,
  type PromoCodeRecord,
  type PromoCodeStatus,
} from "@/lib/promo";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export type AdminPromoView =
  | "all"
  | "active"
  | "scheduled"
  | "expiring"
  | "expired"
  | "inactive"
  | "attention"
  | "archived";

export type AdminPromoFilters = {
  view: AdminPromoView;
  query: string;
  type: "all" | PromoDiscountType;
  validity: "all" | "dated" | "no-end";
  page: number;
  pageSize: 10 | 20 | 50;
};

const firstParam = (
  params: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
};

export function parseAdminPromoFilters(
  params: Record<string, string | string[] | undefined>
): AdminPromoFilters {
  const requestedView = firstParam(params, "view");
  const views: AdminPromoView[] = [
    "all",
    "active",
    "scheduled",
    "expiring",
    "expired",
    "inactive",
    "attention",
    "archived",
  ];
  const requestedType = firstParam(params, "type");
  const requestedValidity = firstParam(params, "validity");
  const requestedPage = Number.parseInt(firstParam(params, "page") || "1", 10);
  const requestedPageSize = Number.parseInt(firstParam(params, "pageSize") || "20", 10);

  return {
    view: views.includes(requestedView as AdminPromoView)
      ? (requestedView as AdminPromoView)
      : "all",
    query: (firstParam(params, "q") || "").trim().slice(0, 100),
    type: ["percentage", "fixed"].includes(requestedType || "")
      ? (requestedType as PromoDiscountType)
      : "all",
    validity: ["dated", "no-end"].includes(requestedValidity || "")
      ? (requestedValidity as "dated" | "no-end")
      : "all",
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: [10, 50].includes(requestedPageSize)
      ? (requestedPageSize as 10 | 50)
      : 20,
  };
}

const promoSelect = {
  id: true,
  title: true,
  code: true,
  active: true,
  discountType: true,
  discountValue: true,
  minimumOrderAmount: true,
  allowedPaymentMethods: true,
  startsAt: true,
  endsAt: true,
  usageLimit: true,
  usedCount: true,
  archivedAt: true,
  archivedBy: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PromoCodeSelect;

type PromoRecord = Prisma.PromoCodeGetPayload<{ select: typeof promoSelect }>;

const domainRecord = (promo: PromoRecord): PromoCodeRecord => ({
  _id: promo.id,
  code: promo.code,
  active: promo.active,
  discountType: promo.discountType,
  discountValue: Number(promo.discountValue),
  minimumOrderAmount: Number(promo.minimumOrderAmount),
  allowedPaymentMethods: promo.allowedPaymentMethods,
  startsAt: promo.startsAt,
  endsAt: promo.endsAt,
  usageLimit: promo.usageLimit ?? undefined,
  usedCount: promo.usedCount,
  archivedAt: promo.archivedAt,
});

const mapPromo = (promo: PromoRecord, now: Date) => ({
  id: promo.id,
  title: promo.title,
  code: promo.code,
  active: promo.active,
  discountType: promo.discountType,
  discountValue: Number(promo.discountValue),
  minimumOrderAmount: Number(promo.minimumOrderAmount),
  allowedPaymentMethods: promo.allowedPaymentMethods as PaymentMethod[],
  startsAt: promo.startsAt?.toISOString() || null,
  endsAt: promo.endsAt?.toISOString() || null,
  usageLimit: promo.usageLimit,
  usedCount: promo.usedCount,
  archivedAt: promo.archivedAt?.toISOString() || null,
  archivedBy: promo.archivedBy,
  createdAt: promo.createdAt.toISOString(),
  updatedAt: promo.updatedAt.toISOString(),
  status: getPromoCodeStatus(domainRecord(promo), now),
});

export type AdminPromoCodeItem = ReturnType<typeof mapPromo>;

const matchesView = (status: PromoCodeStatus, view: AdminPromoView) => {
  if (view === "all") return status !== "ARCHIVED";
  if (view === "active") return status === "ACTIVE" || status === "EXPIRING_SOON";
  if (view === "scheduled") return status === "SCHEDULED";
  if (view === "expiring") return status === "EXPIRING_SOON";
  if (view === "expired") return status === "EXPIRED";
  if (view === "inactive") return status === "INACTIVE";
  if (view === "attention") return status === "LIMIT_REACHED";
  return status === "ARCHIVED";
};

const buildWhere = (filters: AdminPromoFilters): Prisma.PromoCodeWhereInput => ({
  ...(filters.query
    ? {
        OR: [
          { code: { contains: filters.query, mode: "insensitive" as const } },
          { title: { contains: filters.query, mode: "insensitive" as const } },
        ],
      }
    : {}),
  ...(filters.type === "all" ? {} : { discountType: filters.type }),
  ...(filters.validity === "dated"
    ? { OR: [{ startsAt: { not: null } }, { endsAt: { not: null } }] }
    : filters.validity === "no-end"
      ? { endsAt: null }
      : {}),
});

export async function getAdminPromoCodesData(
  filters: AdminPromoFilters,
  selectedPromoId?: string
) {
  await requireAdmin();
  const now = new Date();
  const [allRecords, filteredRecords, selectedRecord] = await Promise.all([
    prisma.promoCode.findMany({ select: promoSelect, orderBy: { updatedAt: "desc" } }),
    prisma.promoCode.findMany({
      where: buildWhere(filters),
      select: promoSelect,
      orderBy: { updatedAt: "desc" },
    }),
    selectedPromoId
      ? prisma.promoCode.findUnique({ where: { id: selectedPromoId }, select: promoSelect })
      : Promise.resolve(null),
  ]);

  const all = allRecords.map((promo) => mapPromo(promo, now));
  const matching = filteredRecords
    .map((promo) => mapPromo(promo, now))
    .filter((promo) => matchesView(promo.status, filters.view));
  const totalPages = Math.max(1, Math.ceil(matching.length / filters.pageSize));
  const currentPage = Math.min(filters.page, totalPages);
  const start = (currentPage - 1) * filters.pageSize;

  const count = (view: AdminPromoView) =>
    all.filter((promo) => matchesView(promo.status, view)).length;

  return {
    filters,
    metrics: {
      total: count("all"),
      active: count("active"),
      expiring: count("expiring"),
      scheduled: count("scheduled"),
      expired: count("expired"),
      inactive: count("inactive"),
      attention: count("attention"),
      archived: count("archived"),
    },
    promoCodes: matching.slice(start, start + filters.pageSize),
    selectedPromo: selectedRecord ? mapPromo(selectedRecord, now) : null,
    pagination: {
      currentPage,
      totalPages,
      pageSize: filters.pageSize,
      filteredCount: matching.length,
    },
  };
}

export async function getPromoCodesForExport(filters: AdminPromoFilters) {
  await requireAdmin();
  const now = new Date();
  const records = await prisma.promoCode.findMany({
    where: buildWhere(filters),
    select: promoSelect,
    orderBy: { updatedAt: "desc" },
  });
  return records
    .map((promo) => mapPromo(promo, now))
    .filter((promo) => matchesView(promo.status, filters.view));
}
