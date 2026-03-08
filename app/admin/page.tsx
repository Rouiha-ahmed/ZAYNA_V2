import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
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
  Store,
  Users,
} from "lucide-react";

import {
  createBrandAction,
  createCategoryAction,
  createProductAction,
  createPromoCodeAction,
  deleteBrandAction,
  deleteCategoryAction,
  deleteProductAction,
  deletePromoCodeAction,
  updateBrandAction,
  updateCategoryAction,
  updateProductAction,
  updatePromoCodeAction,
} from "@/app/admin/actions";
import AdminDeleteButton from "@/components/admin/AdminDeleteButton";
import AdminOrderManagement from "@/components/admin/AdminOrderManagement";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import ImageDropInput from "@/components/admin/ImageDropInput";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminOrderStageOptions, getAdminDashboardData, paymentMethodOptions } from "@/lib/admin";
import { resolveImageUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const currencyFormatter = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("fr-MA", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const selectClassName =
  "flex h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-shop_btn_dark_green focus:ring-4 focus:ring-shop_light_green/15";

const surfaceClassName =
  "rounded-[30px] border border-white/80 bg-white/90 shadow-[0_26px_80px_-56px_rgba(15,23,42,0.42)] backdrop-blur";

const getQueryValue = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

const formatDateInput = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : "");

const formatLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatTier = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const getStatusTone = (value: string) => {
  if (["delivered", "paid"].includes(value)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (["pending", "confirmed", "preparing", "shipped", "partial"].includes(value)) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (["cancelled", "failed"].includes(value)) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
};

const metricCards = [
  { key: "totalOrders", label: "Commandes", icon: ShoppingBag, tone: "bg-sky-50 text-sky-700 ring-sky-200" },
  { key: "totalRevenue", label: "Revenus", icon: CircleDollarSign, tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { key: "pendingOrders", label: "A traiter", icon: Clock3, tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  { key: "totalProducts", label: "Produits", icon: Package2, tone: "bg-violet-50 text-violet-700 ring-violet-200" },
  { key: "totalCategories", label: "Categories", icon: Layers3, tone: "bg-orange-50 text-orange-700 ring-orange-200" },
  { key: "totalBrands", label: "Marques", icon: Store, tone: "bg-cyan-50 text-cyan-700 ring-cyan-200" },
  { key: "activePromoCodes", label: "Promos actives", icon: Percent, tone: "bg-pink-50 text-pink-700 ring-pink-200" },
  { key: "totalCustomers", label: "Clients", icon: Users, tone: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
] as const;

const Field = ({
  label,
  htmlFor,
  helper,
  children,
}: {
  label: string;
  htmlFor?: string;
  helper?: string;
  children: ReactNode;
}) => (
  <div className="space-y-2">
    <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-900">
      {label}
    </label>
    {children}
    {helper ? <p className="text-xs leading-5 text-slate-500">{helper}</p> : null}
  </div>
);

const SectionHeading = ({
  badge,
  title,
  description,
  action,
}: {
  badge: string;
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div className="space-y-2">
      <Badge className="bg-shop_light_green/15 text-shop_btn_dark_green hover:bg-shop_light_green/15">
        {badge}
      </Badge>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
    {action}
  </div>
);

const StatusPill = ({ value, label }: { value: string; label?: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
      getStatusTone(value)
    )}
  >
    {label || formatLabel(value)}
  </span>
);

const MetricCard = ({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  tone: string;
}) => (
  <div className={cn(surfaceClassName, "overflow-hidden p-5")}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      </div>
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset", tone)}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <p className="mt-4 text-sm text-slate-600">{helper}</p>
  </div>
);

const MediaThumb = ({
  src,
  alt,
  icon: Icon,
}: {
  src: string | null;
  alt: string;
  icon: LucideIcon;
}) => (
  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
    {src ? (
      <Image
        src={resolveImageUrl(src)}
        alt={alt}
        fill
        unoptimized
        sizes="5rem"
        className="object-contain p-2"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-slate-300">
        <Icon className="h-6 w-6" />
      </div>
    )}
  </div>
);

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-10 text-center">
    <p className="text-sm font-semibold text-slate-900">{title}</p>
    <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
  </div>
);

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const statusMessage = getQueryValue(resolvedSearchParams, "status");
  const errorMessage = getQueryValue(resolvedSearchParams, "error");
  const data = await getAdminDashboardData();

  const expiringPromoCount = data.metrics.expiringPromoCodes;
  const paymentMethodLabels = Object.fromEntries(
    paymentMethodOptions.map((option) => [option.value, option.label])
  );
  const recentOrdersPreview = data.orders.slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="lg:hidden">
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2 px-1">
            {[
              ["#dashboard", "Dashboard"],
              ["#orders", "Commandes"],
              ["#products", "Produits"],
              ["#categories", "Categories"],
              ["#brands", "Marques"],
              ["#promos", "Promos"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section
        id="dashboard"
        className="overflow-hidden rounded-[34px] border border-shop_light_green/15 text-white shadow-[0_34px_110px_-58px_rgba(16,38,84,1)]"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(16, 38, 84, 1), rgba(24, 54, 114, 0.96) 45%, rgba(77, 182, 198, 0.9) 150%)",
        }}
      >
        <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_320px] md:p-8">
          <div>
            <Badge className="bg-white/12 text-white hover:bg-white/12">Admin simplifie</Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
              Gere la boutique avec une interface claire, sans champs techniques.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/76 md:text-base">
              Ajoute des produits, categories, marques et codes promo depuis un tableau de bord
              simple. Les images sont compressees automatiquement pour garder la boutique rapide.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#orders"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-shop_btn_dark_green transition-transform hover:-translate-y-0.5"
              >
                Voir les commandes
              </Link>
              <Link
                href="#products"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                Ajouter un produit
              </Link>
              <Link
                href="#promos"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                Lancer une promo
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">A surveiller</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                  Commandes a traiter
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.metrics.pendingOrders}</p>
              </div>
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                  Stock faible
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.metrics.lowStockProducts}</p>
              </div>
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                  Promos qui expirent vite
                </p>
                <p className="mt-2 text-3xl font-semibold">{expiringPromoCount}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
        {metricCards.map((card) => {
          const value =
            card.key === "totalRevenue"
              ? currencyFormatter.format(data.metrics.totalRevenue)
              : new Intl.NumberFormat("fr-MA").format(data.metrics[card.key]);

          return (
            <MetricCard
              key={card.key}
              icon={card.icon}
              label={card.label}
              value={value}
              helper="Mis a jour directement depuis votre base de donnees."
              tone={card.tone}
            />
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)_minmax(0,0.95fr)]">
        <div className={cn(surfaceClassName, "p-6")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Apercu commandes
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
                Dernieres ventes
              </h2>
            </div>
            <Link
              href="#orders"
              className="inline-flex items-center gap-2 text-sm font-semibold text-shop_btn_dark_green"
            >
              Gerer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {recentOrdersPreview.length ? (
              recentOrdersPreview.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-slate-50/75 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{order.customerName}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>#{order.orderNumber.slice(-8).toUpperCase()}</span>
                      <span>{dateFormatter.format(order.orderDate)}</span>
                      <span>{order.itemsCount} article(s)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {currencyFormatter.format(order.totalPrice)}
                    </p>
                    <div className="mt-2">
                      <StatusPill value={order.adminStage} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Aucune commande recente"
                description="Les nouvelles ventes s'afficheront ici automatiquement."
              />
            )}
          </div>
        </div>

        <div className={cn(surfaceClassName, "p-6")}>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-shop_btn_dark_green" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Clients
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                Derniers clients actifs
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.customers.length ? (
              data.customers.slice(0, 6).map((customer) => (
                <div
                  key={customer.id}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{customer.fullName}</p>
                      <p className="mt-1 text-xs text-slate-500">{customer.email}</p>
                    </div>
                    <StatusPill value={customer.loyaltyTier} label={formatTier(customer.loyaltyTier)} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span>{customer.orderCount} commande(s)</span>
                    <span>{currencyFormatter.format(customer.totalSpent)}</span>
                    <span>{customer.loyaltyPoints} pts</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Aucun client"
                description="Les clients apparaitront ici apres leurs premieres commandes."
              />
            )}
          </div>
        </div>

        <div className={cn(surfaceClassName, "p-6")}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-shop_btn_dark_green" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Actions rapides
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                Sante de la boutique
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {[
              { href: "#products", label: "Ajouter un produit", detail: "Nouveau produit avec photos optimisees" },
              { href: "#categories", label: "Creer une categorie", detail: "Organiser le catalogue plus facilement" },
              { href: "#brands", label: "Ajouter une marque", detail: "Mettre en avant vos partenaires" },
              { href: "#promos", label: "Creer une promo", detail: "Lancer une remise en quelques secondes" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/75 p-4 transition-colors hover:border-shop_btn_dark_green/20 hover:bg-white"
              >
                <div>
                  <p className="font-medium text-slate-900">{action.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{action.detail}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-shop_btn_dark_green" />
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              Points de vigilance
            </div>
            <div className="mt-3 space-y-2 text-sm text-amber-900/80">
              <p>{data.metrics.lowStockProducts} produit(s) avec stock faible</p>
              <p>{expiringPromoCount} promo(s) a verifier sous 7 jours</p>
            </div>
          </div>
        </div>
      </section>

      <section id="orders" className="space-y-6">
        <SectionHeading
          badge="Commandes"
          title="Suivi des commandes"
          description="Consultez les commandes, ouvrez le detail en un clic et changez simplement leur etape."
          action={
            <Link
              href="#dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-shop_btn_dark_green"
            >
              Retour au haut
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {data.orderStageBreakdown.map((item) => (
            <div key={item.status} className={cn(surfaceClassName, "p-4")}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {item.count}
              </p>
            </div>
          ))}
        </div>

        <div className={cn(surfaceClassName, "p-5 md:p-6")}>
          <AdminOrderManagement
            orders={data.orders}
            stageOptions={adminOrderStageOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            paymentMethodLabels={paymentMethodLabels}
          />
        </div>
      </section>

      <section id="products" className="space-y-6">
        <SectionHeading
          badge="Produits"
          title="Catalogue produits"
          description="Ajoutez et modifiez les produits sans voir les champs techniques. Les photos sont redimensionnees et compressees automatiquement."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className={cn(surfaceClassName, "p-6")}>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-950">Ajouter un produit</h3>
              <p className="text-sm leading-6 text-slate-600">
                Remplissez uniquement les informations utiles pour la boutique. Aucun slug, ID ou
                chemin de fichier n&apos;est affiche.
              </p>
            </div>

            {data.categories.length ? (
              <form action={createProductAction} className="mt-6 space-y-5">
                <Field label="Nom du produit" htmlFor="product-name">
                  <Input id="product-name" name="name" placeholder="Ex: Creme solaire SPF 50" />
                </Field>

                <Field label="Description courte" htmlFor="product-description">
                  <Textarea
                    id="product-description"
                    name="description"
                    placeholder="Description simple visible sur la fiche produit."
                    className="min-h-28 rounded-2xl border-slate-200 bg-slate-50"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Prix (MAD)" htmlFor="product-price">
                    <Input
                      id="product-price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="149.00"
                      className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                    />
                  </Field>
                  <Field label="Promotion (%)" htmlFor="product-discount" helper="Laissez 0 sans promotion.">
                    <Input
                      id="product-discount"
                      name="discount"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      defaultValue="0"
                      className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                    />
                  </Field>
                  <Field label="Stock" htmlFor="product-stock">
                    <Input
                      id="product-stock"
                      name="stock"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="25"
                      className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                    />
                  </Field>
                </div>

                <Field label="Marque" htmlFor="product-brand">
                  <select id="product-brand" name="brandId" defaultValue="" className={selectClassName}>
                    <option value="">Aucune marque</option>
                    {data.brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.title}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900">Categories</p>
                  <div className="grid gap-2 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2">
                    {data.categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center gap-3 rounded-2xl border border-transparent bg-white px-3 py-3 text-sm text-slate-700 transition-colors hover:border-shop_btn_dark_green/15"
                      >
                        <input
                          type="checkbox"
                          name="categoryIds"
                          value={category.id}
                          className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                        />
                        <span>{category.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                  />
                  Mettre ce produit en avant sur la boutique
                </label>

                <ImageDropInput
                  id="product-images"
                  name="imageFiles"
                  label="Photos du produit"
                  helper="Les photos seront compressees, converties en WebP et redimensionnees automatiquement."
                  multiple
                  maxFiles={6}
                />

                <AdminSubmitButton
                  pendingLabel="Ajout..."
                  className="h-11 w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
                >
                  Ajouter le produit
                </AdminSubmitButton>
              </form>
            ) : (
              <EmptyState
                title="Ajoutez d'abord une categorie"
                description="Un produit doit appartenir a au moins une categorie avant d'etre ajoute."
              />
            )}
          </div>

          <div className={cn(surfaceClassName, "p-6")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Produits existants</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Les derniers produits ajoutes et modifies apparaissent ici.
                </p>
              </div>
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                {data.products.length} produit(s)
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              {data.products.length ? (
                data.products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.25)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <MediaThumb src={product.imageUrl} alt={product.name} icon={Boxes} />
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold text-slate-950">{product.name}</h4>
                            {product.isFeatured ? (
                              <StatusPill value="featured" label="Mis en avant" />
                            ) : null}
                            {product.discount > 0 ? (
                              <StatusPill value="sale" label={`Promo ${product.discount}%`} />
                            ) : null}
                            {product.stock <= 5 ? (
                              <StatusPill
                                value={product.stock === 0 ? "cancelled" : "pending"}
                                label={product.stock === 0 ? "Rupture" : "Stock faible"}
                              />
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-600">
                            {product.brandTitle || "Sans marque"} • {product.categoryTitles.join(", ")}
                          </p>
                          {product.description ? (
                            <p className="max-w-2xl text-sm leading-6 text-slate-500">
                              {product.description}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            <span>{currencyFormatter.format(product.price)}</span>
                            <span>{product.stock} en stock</span>
                            <span>{product.imagesCount} photo(s)</span>
                            <span>Maj {dateFormatter.format(product.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <AdminDeleteButton confirmMessage={`Supprimer le produit "${product.name}" ?`} />
                      </form>
                    </div>

                    <details className="mt-5 rounded-[24px] border border-slate-200 bg-white">
                      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-shop_btn_dark_green [&::-webkit-details-marker]:hidden">
                        Modifier le produit
                      </summary>
                      <div className="border-t border-slate-200 p-5">
                        <form action={updateProductAction} className="space-y-5">
                          <input type="hidden" name="id" value={product.id} />

                          <Field label="Nom du produit" htmlFor={`product-name-${product.id}`}>
                            <Input
                              id={`product-name-${product.id}`}
                              name="name"
                              defaultValue={product.name}
                              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                            />
                          </Field>

                          <Field label="Description courte" htmlFor={`product-description-${product.id}`}>
                            <Textarea
                              id={`product-description-${product.id}`}
                              name="description"
                              defaultValue={product.description || ""}
                              className="min-h-24 rounded-2xl border-slate-200 bg-slate-50"
                            />
                          </Field>

                          <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="Prix (MAD)" htmlFor={`product-price-${product.id}`}>
                              <Input
                                id={`product-price-${product.id}`}
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={product.price}
                                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                              />
                            </Field>
                            <Field label="Promotion (%)" htmlFor={`product-discount-${product.id}`}>
                              <Input
                                id={`product-discount-${product.id}`}
                                name="discount"
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                defaultValue={product.discount}
                                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                              />
                            </Field>
                            <Field label="Stock" htmlFor={`product-stock-${product.id}`}>
                              <Input
                                id={`product-stock-${product.id}`}
                                name="stock"
                                type="number"
                                min="0"
                                step="1"
                                defaultValue={product.stock}
                                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                              />
                            </Field>
                          </div>

                          <Field label="Marque" htmlFor={`product-brand-${product.id}`}>
                            <select
                              id={`product-brand-${product.id}`}
                              name="brandId"
                              defaultValue={product.brandId || ""}
                              className={selectClassName}
                            >
                              <option value="">Aucune marque</option>
                              {data.brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                  {brand.title}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-slate-900">Categories</p>
                            <div className="grid gap-2 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2">
                              {data.categories.map((category) => (
                                <label
                                  key={category.id}
                                  className="flex items-center gap-3 rounded-2xl border border-transparent bg-white px-3 py-3 text-sm text-slate-700 transition-colors hover:border-shop_btn_dark_green/15"
                                >
                                  <input
                                    type="checkbox"
                                    name="categoryIds"
                                    value={category.id}
                                    defaultChecked={product.categoryIds.includes(category.id)}
                                    className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                                  />
                                  <span>{category.title}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              name="isFeatured"
                              defaultChecked={product.isFeatured}
                              className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                            />
                            Mettre ce produit en avant
                          </label>

                          <ImageDropInput
                            id={`product-images-${product.id}`}
                            name="imageFiles"
                            label="Remplacer les photos"
                            helper="Si vous ajoutez de nouvelles photos, elles remplaceront la galerie actuelle."
                            multiple
                            maxFiles={6}
                            existingImageUrls={product.imageUrls.map((imageUrl) => resolveImageUrl(imageUrl))}
                          />

                          <AdminSubmitButton
                            pendingLabel="Enregistrement..."
                            className="h-11 rounded-2xl bg-shop_btn_dark_green px-6 text-white hover:bg-shop_dark_green"
                          >
                            Enregistrer les modifications
                          </AdminSubmitButton>
                        </form>
                      </div>
                    </details>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Aucun produit"
                  description="Ajoutez votre premier produit pour commencer a remplir la boutique."
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="space-y-6">
        <SectionHeading
          badge="Categories"
          title="Organisation du catalogue"
          description="Creez et modifiez les categories visibles sur la boutique sans toucher aux champs techniques."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className={cn(surfaceClassName, "p-6")}>
            <h3 className="text-xl font-semibold text-slate-950">Ajouter une categorie</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Donnez un nom clair, ajoutez une image et activez la mise en avant si besoin.
            </p>

            <form action={createCategoryAction} className="mt-6 space-y-5">
              <Field label="Nom de la categorie" htmlFor="category-title">
                <Input
                  id="category-title"
                  name="title"
                  placeholder="Ex: Hygiene bucco-dentaire"
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                />
              </Field>

              <Field label="Petite description" htmlFor="category-description">
                <Textarea
                  id="category-description"
                  name="description"
                  placeholder="Expliquez rapidement ce que contient cette categorie."
                  className="min-h-24 rounded-2xl border-slate-200 bg-slate-50"
                />
              </Field>

              <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="featured"
                  className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                />
                Afficher cette categorie parmi les mises en avant
              </label>

              <ImageDropInput
                id="category-image"
                name="imageFile"
                label="Image de categorie"
                helper="L'image sera optimisee automatiquement pour un chargement plus rapide."
              />

              <AdminSubmitButton
                pendingLabel="Ajout..."
                className="h-11 w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
              >
                Ajouter la categorie
              </AdminSubmitButton>
            </form>
          </div>

          <div className={cn(surfaceClassName, "p-6")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Categories existantes</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Modifiez la presentation de vos rayons en quelques clics.
                </p>
              </div>
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                {data.categories.length} categorie(s)
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              {data.categories.length ? (
                data.categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.25)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <MediaThumb src={category.imageUrl} alt={category.title} icon={Layers3} />
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold text-slate-950">{category.title}</h4>
                            {category.featured ? <StatusPill value="featured" label="Mise en avant" /> : null}
                          </div>
                          <p className="text-sm text-slate-600">{category.productCount} produit(s)</p>
                          {category.description ? (
                            <p className="max-w-2xl text-sm leading-6 text-slate-500">
                              {category.description}
                            </p>
                          ) : null}
                          <p className="text-xs text-slate-500">Maj {dateFormatter.format(category.updatedAt)}</p>
                        </div>
                      </div>

                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={category.id} />
                        <AdminDeleteButton
                          confirmMessage={`Supprimer la categorie "${category.title}" ?`}
                        />
                      </form>
                    </div>

                    <details className="mt-5 rounded-[24px] border border-slate-200 bg-white">
                      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-shop_btn_dark_green [&::-webkit-details-marker]:hidden">
                        Modifier la categorie
                      </summary>
                      <div className="border-t border-slate-200 p-5">
                        <form action={updateCategoryAction} className="space-y-5">
                          <input type="hidden" name="id" value={category.id} />

                          <Field label="Nom de la categorie" htmlFor={`category-title-${category.id}`}>
                            <Input
                              id={`category-title-${category.id}`}
                              name="title"
                              defaultValue={category.title}
                              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                            />
                          </Field>

                          <Field label="Petite description" htmlFor={`category-description-${category.id}`}>
                            <Textarea
                              id={`category-description-${category.id}`}
                              name="description"
                              defaultValue={category.description || ""}
                              className="min-h-24 rounded-2xl border-slate-200 bg-slate-50"
                            />
                          </Field>

                          <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              name="featured"
                              defaultChecked={category.featured}
                              className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                            />
                            Afficher cette categorie parmi les mises en avant
                          </label>

                          <ImageDropInput
                            id={`category-image-${category.id}`}
                            name="imageFile"
                            label="Changer l'image"
                            existingImageUrls={
                              category.imageUrl ? [resolveImageUrl(category.imageUrl)] : []
                            }
                          />

                          <AdminSubmitButton
                            pendingLabel="Enregistrement..."
                            className="h-11 rounded-2xl bg-shop_btn_dark_green px-6 text-white hover:bg-shop_dark_green"
                          >
                            Enregistrer les modifications
                          </AdminSubmitButton>
                        </form>
                      </div>
                    </details>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Aucune categorie"
                  description="Ajoutez vos premieres categories pour organiser la boutique."
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="brands" className="space-y-6">
        <SectionHeading
          badge="Marques"
          title="Gestion des marques"
          description="Ajoutez les logos et presentations de vos marques pour renforcer la lisibilite du catalogue."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className={cn(surfaceClassName, "p-6")}>
            <h3 className="text-xl font-semibold text-slate-950">Ajouter une marque</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ajoutez un nom, une courte presentation et le logo de la marque.
            </p>

            <form action={createBrandAction} className="mt-6 space-y-5">
              <Field label="Nom de la marque" htmlFor="brand-title">
                <Input
                  id="brand-title"
                  name="title"
                  placeholder="Ex: Vichy"
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                />
              </Field>

              <Field label="Petite description" htmlFor="brand-description">
                <Textarea
                  id="brand-description"
                  name="description"
                  placeholder="Quelques mots pour presenter la marque."
                  className="min-h-24 rounded-2xl border-slate-200 bg-slate-50"
                />
              </Field>

              <ImageDropInput
                id="brand-image"
                name="imageFile"
                label="Logo de la marque"
                helper="Le logo sera optimise automatiquement pour une meilleure vitesse."
              />

              <AdminSubmitButton
                pendingLabel="Ajout..."
                className="h-11 w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
              >
                Ajouter la marque
              </AdminSubmitButton>
            </form>
          </div>

          <div className={cn(surfaceClassName, "p-6")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Marques existantes</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Mettez a jour la presentation de chaque marque depuis ce tableau.
                </p>
              </div>
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                {data.brands.length} marque(s)
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              {data.brands.length ? (
                data.brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.25)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <MediaThumb src={brand.imageUrl} alt={brand.title} icon={Store} />
                        <div className="space-y-2">
                          <h4 className="text-lg font-semibold text-slate-950">{brand.title}</h4>
                          <p className="text-sm text-slate-600">{brand.productCount} produit(s)</p>
                          {brand.description ? (
                            <p className="max-w-2xl text-sm leading-6 text-slate-500">
                              {brand.description}
                            </p>
                          ) : null}
                          <p className="text-xs text-slate-500">Maj {dateFormatter.format(brand.updatedAt)}</p>
                        </div>
                      </div>

                      <form action={deleteBrandAction}>
                        <input type="hidden" name="id" value={brand.id} />
                        <AdminDeleteButton confirmMessage={`Supprimer la marque "${brand.title}" ?`} />
                      </form>
                    </div>

                    <details className="mt-5 rounded-[24px] border border-slate-200 bg-white">
                      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-shop_btn_dark_green [&::-webkit-details-marker]:hidden">
                        Modifier la marque
                      </summary>
                      <div className="border-t border-slate-200 p-5">
                        <form action={updateBrandAction} className="space-y-5">
                          <input type="hidden" name="id" value={brand.id} />

                          <Field label="Nom de la marque" htmlFor={`brand-title-${brand.id}`}>
                            <Input
                              id={`brand-title-${brand.id}`}
                              name="title"
                              defaultValue={brand.title}
                              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                            />
                          </Field>

                          <Field label="Petite description" htmlFor={`brand-description-${brand.id}`}>
                            <Textarea
                              id={`brand-description-${brand.id}`}
                              name="description"
                              defaultValue={brand.description || ""}
                              className="min-h-24 rounded-2xl border-slate-200 bg-slate-50"
                            />
                          </Field>

                          <ImageDropInput
                            id={`brand-image-${brand.id}`}
                            name="imageFile"
                            label="Changer le logo"
                            existingImageUrls={brand.imageUrl ? [resolveImageUrl(brand.imageUrl)] : []}
                          />

                          <AdminSubmitButton
                            pendingLabel="Enregistrement..."
                            className="h-11 rounded-2xl bg-shop_btn_dark_green px-6 text-white hover:bg-shop_dark_green"
                          >
                            Enregistrer les modifications
                          </AdminSubmitButton>
                        </form>
                      </div>
                    </details>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Aucune marque"
                  description="Ajoutez vos marques principales pour enrichir la navigation de la boutique."
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="promos" className="space-y-6">
        <SectionHeading
          badge="Promotions"
          title="Codes promo"
          description="Creez des remises simples a activer ou desactiver sans passer par des reglages techniques."
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className={cn(surfaceClassName, "p-6")}>
            <h3 className="text-xl font-semibold text-slate-950">Ajouter un code promo</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Donnez un nom a la campagne, choisissez le code visible par le client et fixez la remise.
            </p>

            <form action={createPromoCodeAction} className="mt-6 space-y-5">
              <Field label="Nom de la promo" htmlFor="promo-title">
                <Input
                  id="promo-title"
                  name="title"
                  placeholder="Ex: Offre Ramadan"
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                />
              </Field>

              <Field label="Code promo" htmlFor="promo-code" helper="Ce code sera saisi par le client au panier.">
                <Input
                  id="promo-code"
                  name="code"
                  placeholder="RAMADAN15"
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Reduction (%)" htmlFor="promo-discount">
                  <Input
                    id="promo-discount"
                    name="discountValue"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    placeholder="15"
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                  />
                </Field>
                <Field label="Date d'expiration" htmlFor="promo-end">
                  <Input
                    id="promo-end"
                    name="endsAt"
                    type="date"
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                />
                Activer ce code promo des maintenant
              </label>

              <AdminSubmitButton
                pendingLabel="Ajout..."
                className="h-11 w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
              >
                Ajouter le code promo
              </AdminSubmitButton>
            </form>
          </div>

          <div className={cn(surfaceClassName, "p-6")}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-950">Promos existantes</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Activez, desactivez ou ajustez rapidement les remises en cours.
                </p>
              </div>
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                {data.promoCodes.length} code(s)
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              {data.promoCodes.length ? (
                data.promoCodes.map((promo) => (
                  <div
                    key={promo.id}
                    className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.25)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-semibold text-slate-950">{promo.title}</h4>
                          <StatusPill
                            value={promo.active ? "delivered" : "pending"}
                            label={promo.active ? "Actif" : "Inactif"}
                          />
                        </div>
                        <p className="text-sm font-medium text-slate-700">{promo.code}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <span>{promo.discountValue}% de remise</span>
                          <span>
                            {promo.endsAt ? `Expire le ${dateFormatter.format(promo.endsAt)}` : "Sans date d'expiration"}
                          </span>
                          <span>Maj {dateFormatter.format(promo.updatedAt)}</span>
                        </div>
                      </div>

                      <form action={deletePromoCodeAction}>
                        <input type="hidden" name="id" value={promo.id} />
                        <AdminDeleteButton confirmMessage={`Supprimer le code promo "${promo.code}" ?`} />
                      </form>
                    </div>

                    <details className="mt-5 rounded-[24px] border border-slate-200 bg-white">
                      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-shop_btn_dark_green [&::-webkit-details-marker]:hidden">
                        Modifier la promo
                      </summary>
                      <div className="border-t border-slate-200 p-5">
                        <form action={updatePromoCodeAction} className="space-y-5">
                          <input type="hidden" name="id" value={promo.id} />

                          <Field label="Nom de la promo" htmlFor={`promo-title-${promo.id}`}>
                            <Input
                              id={`promo-title-${promo.id}`}
                              name="title"
                              defaultValue={promo.title}
                              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                            />
                          </Field>

                          <Field label="Code promo" htmlFor={`promo-code-${promo.id}`}>
                            <Input
                              id={`promo-code-${promo.id}`}
                              name="code"
                              defaultValue={promo.code}
                              className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                            />
                          </Field>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Reduction (%)" htmlFor={`promo-discount-${promo.id}`}>
                              <Input
                                id={`promo-discount-${promo.id}`}
                                name="discountValue"
                                type="number"
                                min="1"
                                max="100"
                                step="1"
                                defaultValue={promo.discountValue}
                                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                              />
                            </Field>
                            <Field label="Date d'expiration" htmlFor={`promo-end-${promo.id}`}>
                              <Input
                                id={`promo-end-${promo.id}`}
                                name="endsAt"
                                type="date"
                                defaultValue={formatDateInput(promo.endsAt)}
                                className="h-11 rounded-2xl border-slate-200 bg-slate-50"
                              />
                            </Field>
                          </div>

                          <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              name="active"
                              defaultChecked={promo.active}
                              className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                            />
                            Laisser ce code actif
                          </label>

                          <AdminSubmitButton
                            pendingLabel="Enregistrement..."
                            className="h-11 rounded-2xl bg-shop_btn_dark_green px-6 text-white hover:bg-shop_dark_green"
                          >
                            Enregistrer les modifications
                          </AdminSubmitButton>
                        </form>
                      </div>
                    </details>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Aucune promo"
                  description="Creez votre premier code promo pour lancer une campagne."
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
