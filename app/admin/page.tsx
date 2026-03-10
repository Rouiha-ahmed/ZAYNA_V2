import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  Clock3,
  Layers3,
  Package2,
  Percent,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

import {
  AdminPageHero,
  EmptyState,
  MediaThumb,
  StatusPill,
  adminCurrencyFormatter,
  adminDateFormatter,
  adminSurfaceClassName,
  formatTier,
} from "@/components/admin/AdminPagePrimitives";
import AdminRevenueChart from "@/components/admin/dashboard/AdminRevenueChart";
import AdminStageRing from "@/components/admin/dashboard/AdminStageRing";
import AdminTopProductsList from "@/components/admin/dashboard/AdminTopProductsList";
import { Badge } from "@/components/ui/badge";
import { getAdminOverviewData } from "@/lib/admin-pages";
import { cn } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const compactNumberFormatter = new Intl.NumberFormat("fr-MA", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const getWindowChange = (values: number[]) => {
  const midpoint = Math.ceil(values.length / 2);
  const previousWindow = sum(values.slice(0, midpoint));
  const currentWindow = sum(values.slice(midpoint));

  if (previousWindow === 0) {
    return currentWindow > 0 ? 100 : 0;
  }

  return ((currentWindow - previousWindow) / previousWindow) * 100;
};

const formatSignedPercent = (value: number) => {
  const rounded = Math.round(value);

  if (rounded > 0) {
    return `+${rounded}%`;
  }

  return `${rounded}%`;
};

const getTrendClassName = (value: number, invert = false) => {
  if (value === 0) {
    return "bg-slate-100 text-slate-700 ring-slate-200";
  }

  const isGood = invert ? value < 0 : value > 0;

  return isGood
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : "bg-rose-50 text-rose-700 ring-rose-200";
};

const getQueryValue = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [resolvedSearchParams, data] = await Promise.all([
    searchParams,
    getAdminOverviewData(),
  ]);
  const statusMessage = getQueryValue(resolvedSearchParams, "status");
  const errorMessage = getQueryValue(resolvedSearchParams, "error");

  const revenueTrend = getWindowChange(data.revenueSeries.map((point) => point.revenue));
  const orderTrend = getWindowChange(data.revenueSeries.map((point) => point.orders));
  const latestWeekSeries = data.revenueSeries.slice(-7);
  const latestWeekRevenue = sum(latestWeekSeries.map((point) => point.revenue));
  const latestWeekOrders = sum(latestWeekSeries.map((point) => point.orders));
  const latestWeekLabel =
    latestWeekSeries[0] && latestWeekSeries[latestWeekSeries.length - 1]
      ? `${latestWeekSeries[0].label} -> ${latestWeekSeries[latestWeekSeries.length - 1].label}`
      : "Semaine glissante";
  const openRate = data.metrics.totalOrders
    ? (data.metrics.pendingOrders / data.metrics.totalOrders) * 100
    : 0;
  const stockPressure = data.metrics.totalProducts
    ? (data.metrics.lowStockProducts / data.metrics.totalProducts) * 100
    : 0;
  const alertsCount = data.metrics.lowStockProducts + data.metrics.expiringPromoCodes;
  const revenuePerCategory = data.metrics.totalCategories
    ? data.metrics.totalProducts / data.metrics.totalCategories
    : 0;

  const highlightCards = [
    {
      label: "Revenus encaisses",
      value: adminCurrencyFormatter.format(data.metrics.totalRevenue),
      note: `${formatSignedPercent(revenueTrend)} vs 7 jours precedents`,
      helper: `${adminCurrencyFormatter.format(latestWeekRevenue)} sur la derniere fenetre.`,
      icon: CircleDollarSign,
      accent:
        "from-[#1677ff]/16 via-[#1677ff]/5 to-transparent border-sky-100/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(239,246,255,0.88))]",
      iconTone: "bg-[#1677ff] text-white shadow-[0_18px_34px_-16px_rgba(22,119,255,0.55)]",
      badgeClassName: getTrendClassName(revenueTrend),
    },
    {
      label: "Commandes ouvertes",
      value: compactNumberFormatter.format(data.metrics.pendingOrders),
      note: `${Math.round(openRate)}% du volume total`,
      helper: `${latestWeekOrders} commandes creees sur les 7 derniers jours.`,
      icon: ShoppingBag,
      accent:
        "from-[#11b8a5]/18 via-[#11b8a5]/6 to-transparent border-teal-100/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,253,250,0.92))]",
      iconTone: "bg-[#11b8a5] text-white shadow-[0_18px_34px_-16px_rgba(17,184,165,0.52)]",
      badgeClassName: getTrendClassName(orderTrend, false),
    },
    {
      label: "Catalogue actif",
      value: compactNumberFormatter.format(data.metrics.totalProducts),
      note: `${data.metrics.totalCategories} categories · ${data.metrics.totalBrands} marques`,
      helper: `${revenuePerCategory.toFixed(1)} produits par categorie en moyenne.`,
      icon: Package2,
      accent:
        "from-[#7c69ee]/18 via-[#7c69ee]/6 to-transparent border-violet-100/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(245,243,255,0.92))]",
      iconTone: "bg-[#7c69ee] text-white shadow-[0_18px_34px_-16px_rgba(124,105,238,0.52)]",
      badgeClassName: "bg-violet-50 text-violet-700 ring-violet-200",
    },
    {
      label: "Points de vigilance",
      value: compactNumberFormatter.format(alertsCount),
      note: `${data.metrics.lowStockProducts} stock faible · ${data.metrics.expiringPromoCodes} promos proches`,
      helper: `${Math.round(stockPressure)}% du catalogue est en surveillance stock.`,
      icon: AlertTriangle,
      accent:
        "from-[#f59e0b]/16 via-[#ef4444]/5 to-transparent border-amber-100/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,251,235,0.92))]",
      iconTone: "bg-[#f59e0b] text-white shadow-[0_18px_34px_-16px_rgba(245,158,11,0.5)]",
      badgeClassName:
        alertsCount > 0
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
  ] as const;

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHero
        badge="Admin premium"
        title="Un dashboard plus net, plus clinique et vraiment pilote par la data."
        description="Zayna garde sa structure admin existante, mais l'accueil devient une vraie console de supervision: revenus, commandes, stock sensible, promos et profils clients sont lisibles en quelques secondes."
        actions={
          <>
            <Link
              href="/admin/orders"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-shop_btn_dark_green transition-transform hover:-translate-y-0.5"
            >
              Ouvrir les commandes
            </Link>
            <Link
              href="/admin/products#new-product"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              Ajouter un produit
            </Link>
            <Link
              href="/admin/promos#new-promo"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              Lancer une promo
            </Link>
          </>
        }
        aside={
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white/90" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/68">
                Capteurs prioritaires
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="rounded-[24px] border border-white/10 bg-black/15 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/58">
                  A traiter
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.metrics.pendingOrders}</p>
                <p className="mt-2 text-xs text-white/68">Commandes encore en circuit operatoire.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/15 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/58">
                  Stock sensible
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.metrics.lowStockProducts}</p>
                <p className="mt-2 text-xs text-white/68">Produits a reapprovisionner rapidement.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/15 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/58">
                  Promos proches
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">{data.metrics.expiringPromoCodes}</p>
                <p className="mt-2 text-xs text-white/68">Codes promo a verifier cette semaine.</p>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/58">
                    Cadence recente
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">{latestWeekLabel}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                    orderTrend >= 0
                      ? "bg-emerald-400/12 text-emerald-50 ring-emerald-200/22"
                      : "bg-rose-400/12 text-rose-50 ring-rose-200/22"
                  )}
                >
                  {formatSignedPercent(orderTrend)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/72">
                {latestWeekOrders} commandes creees et {adminCurrencyFormatter.format(latestWeekRevenue)} encaisses
                sur la fenetre glissante la plus recente.
              </p>
            </div>
          </div>
        }
      />

      {statusMessage ? (
        <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlightCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className={cn(
                adminSurfaceClassName,
                "group relative overflow-hidden border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_36px_80px_-52px_rgba(15,23,42,0.45)]",
                card.accent
              )}
            >
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.8),transparent_65%)] opacity-80" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {card.label}
                  </p>
                  <p className="text-3xl font-semibold tracking-tight text-slate-950">
                    {card.value}
                  </p>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                      card.badgeClassName
                    )}
                  >
                    {card.note}
                  </span>
                </div>

                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-translate-y-0.5",
                    card.iconTone
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <p className="relative mt-4 text-sm leading-6 text-slate-600">{card.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(350px,0.95fr)]">
        <div className={cn(adminSurfaceClassName, "overflow-hidden border-sky-100/80 p-6")}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50">Commerce pulse</Badge>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Revenus et cadence des commandes
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Une lecture 14 jours pour voir si le flux du dashboard accelere, ralentit ou demande une action
                immediate.
              </p>
            </div>

            <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Fenetre courante
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{latestWeekLabel}</p>
            </div>
          </div>

          <div className="mt-6">
            <AdminRevenueChart data={data.revenueSeries} />
          </div>
        </div>

        <div className="space-y-6">
          <div className={cn(adminSurfaceClassName, "p-6")}>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-shop_btn_dark_green" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Distribution
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  Etats des commandes
                </h2>
              </div>
            </div>

            <div className="mt-5">
              <AdminStageRing data={data.orderStageBreakdown} />
            </div>
          </div>

          <div className={cn(adminSurfaceClassName, "p-6")}>
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-shop_btn_dark_green" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Best-sellers
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  Produits qui tirent le flux
                </h2>
              </div>
            </div>

            <div className="mt-5">
              <AdminTopProductsList items={data.topProducts} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
        <div className={cn(adminSurfaceClassName, "p-6")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-shop_btn_dark_green" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Execution
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  Commandes recentes
                </h2>
              </div>
            </div>

            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-shop_btn_dark_green transition-colors hover:border-shop_light_green/30 hover:bg-shop_light_green/10"
            >
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {data.recentOrders.length ? (
              data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4 shadow-[0_22px_44px_-34px_rgba(15,23,42,0.22)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{order.customerName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        #{order.orderNumber.slice(-8).toUpperCase()} · {adminDateFormatter.format(order.orderDate)}
                      </p>
                    </div>
                    <StatusPill value={order.adminStage} />
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-600">
                        {order.items[0]?.name || "Commande multi-produits"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{order.itemsCount} article(s)</p>
                    </div>
                    <p className="text-base font-semibold text-slate-950">
                      {adminCurrencyFormatter.format(order.totalPrice)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{order.email}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{order.paymentMethod}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="md:col-span-2">
                <EmptyState
                  title="Aucune commande recente"
                  description="Les nouvelles ventes apparaitront ici automatiquement."
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className={cn(adminSurfaceClassName, "p-6")}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-shop_btn_dark_green" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Surveillance
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  Stock faible
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {data.lowStockItems.length ? (
                data.lowStockItems.map((item) => {
                  const progress = Math.max(Math.round((item.stock / 5) * 100), item.stock > 0 ? 16 : 6);

                  return (
                    <div
                      key={item.id}
                      className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <MediaThumb src={item.imageUrl} alt={item.name} icon={Package2} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="truncate font-medium text-slate-900">{item.name}</p>
                            <StatusPill
                              value={item.stock === 0 ? "out" : "pending"}
                              label={item.stock === 0 ? "Rupture" : `${item.stock} restant(s)`}
                            />
                          </div>
                          <div className="mt-3 h-2.5 rounded-full bg-slate-200">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                item.stock === 0
                                  ? "bg-rose-500"
                                  : item.stock <= 2
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  title="Stock confortable"
                  description="Tous les produits ont actuellement un niveau de stock sain."
                />
              )}
            </div>
          </div>

          <div className={cn(adminSurfaceClassName, "p-6")}>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-shop_btn_dark_green" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Clients
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  Profils recents
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {data.recentCustomers.length ? (
                data.recentCustomers.slice(0, 4).map((customer) => (
                  <div
                    key={customer.id}
                    className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{customer.fullName}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{customer.email}</p>
                      </div>
                      <StatusPill value={customer.loyaltyTier} label={formatTier(customer.loyaltyTier)} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                        {customer.orderCount} commande(s)
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                        {adminCurrencyFormatter.format(customer.totalSpent)}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                        {customer.loyaltyPoints} pts
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Aucun profil actif"
                  description="Les profils clients apparaitront ici apres les premieres commandes."
                />
              )}
            </div>
          </div>

          <div className={cn(adminSurfaceClassName, "p-6")}>
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-shop_btn_dark_green" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Actions
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                  Raccourcis utiles
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                {
                  href: "/admin/orders",
                  label: "Commandes",
                  description: "Traiter les nouvelles ventes",
                  icon: Clock3,
                },
                {
                  href: "/admin/products#new-product",
                  label: "Produits",
                  description: "Ajouter ou corriger le catalogue",
                  icon: Package2,
                },
                {
                  href: "/admin/categories#new-category",
                  label: "Categories",
                  description: "Reorganiser les univers",
                  icon: Layers3,
                },
                {
                  href: "/admin/promos#new-promo",
                  label: "Promotions",
                  description: "Lancer une offre rapide",
                  icon: Percent,
                },
              ].map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group rounded-[24px] border border-slate-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,249,255,0.72))] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-shop_light_green/30 hover:shadow-[0_22px_40px_-34px_rgba(15,23,42,0.28)]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#e0f2fe,#d1fae5)] text-shop_btn_dark_green">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 font-medium text-slate-900">{action.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{action.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
