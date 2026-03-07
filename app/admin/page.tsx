import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  Layers3,
  Package2,
  Percent,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  Users,
} from "lucide-react";

import {
  createCategoryAction,
  createBrandAction,
  createProductAction,
  createPromoCodeAction,
  deleteCategoryAction,
  deleteBrandAction,
  deleteProductAction,
  deletePromoCodeAction,
} from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminDashboardData,
  paymentMethodOptions,
  productStatusOptions,
  promoDiscountTypeOptions,
} from "@/lib/admin";
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

const statusMessages: Record<string, string> = {
  "category-created": "La categorie a ete ajoutee.",
  "brand-created": "La marque a ete ajoutee.",
  "product-created": "Le produit a ete ajoute.",
  "promo-created": "Le code promo a ete ajoute.",
  "category-deleted": "La categorie a ete supprimee.",
  "brand-deleted": "La marque a ete supprimee.",
  "product-deleted": "Le produit a ete supprime.",
  "promo-deleted": "Le code promo a ete supprime.",
};

const metricCards = [
  {
    key: "totalRevenue",
    label: "Revenus encaisses",
    icon: CircleDollarSign,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    key: "totalOrders",
    label: "Commandes",
    icon: ShoppingBag,
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  {
    key: "totalProducts",
    label: "Produits",
    icon: Package2,
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  {
    key: "totalCategories",
    label: "Categories",
    icon: Layers3,
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  {
    key: "activePromoCodes",
    label: "Promos actives",
    icon: Percent,
    tone: "bg-pink-50 text-pink-700 ring-pink-200",
  },
  {
    key: "totalCustomers",
    label: "Clients",
    icon: Users,
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
] as const;

const getQueryValue = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

const formatMetricValue = (key: (typeof metricCards)[number]["key"], value: number) => {
  if (key === "totalRevenue") {
    return currencyFormatter.format(value);
  }

  return new Intl.NumberFormat("fr-MA").format(value);
};

const formatStatusLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatPaymentLabel = (value: string) =>
  paymentMethodOptions.find((item) => item.value === value)?.label || value;

const formatTierLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const getOrderTone = (value: string) => {
  if (["paid", "delivered"].includes(value)) {
    return "success";
  }
  if (["pending", "processing", "partial"].includes(value)) {
    return "warning";
  }
  if (["failed", "cancelled"].includes(value)) {
    return "danger";
  }

  return "info";
};

const StatusBadge = ({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) => {
  const className =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : tone === "danger"
          ? "bg-rose-50 text-rose-700 ring-rose-200"
          : tone === "info"
            ? "bg-sky-50 text-sky-700 ring-sky-200"
            : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        className
      )}
    >
      {children}
    </span>
  );
};

const Field = ({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) => (
  <div className="space-y-2">
    <Label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">
      {label}
    </Label>
    {children}
    {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
  </div>
);

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const status = getQueryValue(resolvedSearchParams, "status");
  const error = getQueryValue(resolvedSearchParams, "error");
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-8" id="dashboard">
      <section className="overflow-hidden rounded-[30px] border border-shop_light_green/15 bg-[linear-gradient(135deg,rgba(22,46,110,0.98),rgba(31,60,136,0.95)_52%,rgba(77,182,198,0.85)_140%)] text-white shadow-[0_34px_110px_-58px_rgba(16,38,84,1)]">
        <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_260px] md:p-8">
          <div>
            <Badge className="bg-white/12 text-white hover:bg-white/12">
              Tableau de bord central
            </Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
              Pilotez votre boutique, vos promotions et votre catalogue depuis un seul espace.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/76 md:text-base">
              Les formulaires ci-dessous ecrivent directement dans Prisma. Toute
              creation apparait ensuite dans la boutique publique, la recherche, les
              listes par categorie et les pages produit.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-shop_btn_dark_green transition-transform hover:-translate-y-0.5"
              >
                Voir la boutique
              </Link>
              <Link
                href="#brands"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                Ajouter une marque
              </Link>
              <Link
                href="#products"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
              >
                Ajouter un produit
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles className="h-5 w-5 text-shop_light_green" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                  A surveiller
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  Alertes rapides
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                  Commandes en attente
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {data.metrics.pendingOrders}
                </p>
              </div>
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                  Produits stock bas
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {data.metrics.lowStockProducts}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {status && statusMessages[status] ? (
        <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessages[status]}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const value = data.metrics[card.key];

          return (
            <Card
              key={card.key}
              className="overflow-hidden rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]"
            >
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {card.label}
                    </CardDescription>
                    <CardTitle className="mt-3 text-3xl tracking-tight text-slate-900">
                      {formatMetricValue(card.key, value)}
                    </CardTitle>
                  </div>
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset",
                      card.tone
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm leading-6 text-slate-600">
                  Mise a jour en direct depuis la base PostgreSQL de votre boutique.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Suivi commercial
            </CardDescription>
            <CardTitle className="text-2xl text-slate-900">
              Commandes a suivre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {data.orderStatusBreakdown.map((item) => (
                <div
                  key={item.status}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {formatStatusLabel(item.status)}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {item.count}
                  </p>
                </div>
              ))}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="align-top">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {order.orderNumber.slice(-10)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dateFormatter.format(order.orderDate)} - {order.itemsCount} article(s)
                        </p>
                        {order.shippingCity ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Ville: {order.shippingCity}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <p className="font-medium text-slate-800">{order.customerName}</p>
                      <p className="mt-1 text-xs text-slate-500">{order.email}</p>
                    </TableCell>
                    <TableCell className="align-top font-semibold text-slate-900">
                      {currencyFormatter.format(order.totalPrice)}
                    </TableCell>
                    <TableCell className="align-top">
                      <StatusBadge tone={getOrderTone(order.status)}>
                        {formatStatusLabel(order.status)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <StatusBadge tone={getOrderTone(order.paymentStatus)}>
                          {formatStatusLabel(order.paymentStatus)}
                        </StatusBadge>
                        <p className="text-xs text-slate-500">
                          {formatPaymentLabel(order.paymentMethod)}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Relation client
            </CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
              <Users className="h-5 w-5 text-shop_btn_dark_green" />
              Clients recents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.customers.length ? (
              data.customers.map((customer) => (
                <div
                  key={customer.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{customer.fullName}</p>
                      <p className="mt-1 text-xs text-slate-500">{customer.email}</p>
                    </div>
                    <StatusBadge tone="info">
                      {formatTierLabel(customer.loyaltyTier)}
                    </StatusBadge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span>{customer.orderCount} commande(s)</span>
                    <span>{currencyFormatter.format(customer.totalSpent)}</span>
                    <span>{customer.loyaltyPoints} pts</span>
                    {customer.installmentsEligible ? (
                      <span>Paiement en plusieurs fois actif</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {customer.lastOrderDate
                      ? `Derniere commande le ${dateFormatter.format(customer.lastOrderDate)}`
                      : `Inscrit le ${dateFormatter.format(customer.createdAt)}`}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-600">
                Aucun client enregistre pour le moment.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Vigilance stock
            </CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Produits a risque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lowStockItems.length ? (
              data.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">/{item.slug}</p>
                  </div>
                  <StatusBadge tone={item.stock === 0 ? "danger" : "warning"}>
                    {item.stock === 0 ? "Rupture" : `${item.stock} restant(s)`}
                  </StatusBadge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-4 text-sm text-emerald-800">
                Aucun produit n&apos;est actuellement en stock bas.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Paiement
            </CardDescription>
            <CardTitle className="text-2xl text-slate-900">
              Etats de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {data.paymentStatusBreakdown.map((item) => (
              <div
                key={item.status}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {formatStatusLabel(item.status)}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {item.count}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="categories" className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Catalogue
            </CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
              <Layers3 className="h-5 w-5 text-shop_btn_dark_green" />
              Ajouter une categorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={createCategoryAction}
              encType="multipart/form-data"
              className="space-y-4"
            >
              <Field label="Titre" htmlFor="category-title">
                <Input id="category-title" name="title" placeholder="Ex: Soins capillaires" />
              </Field>
              <Field
                label="Slug"
                htmlFor="category-slug"
                hint="Laissez vide pour le generer a partir du titre."
              >
                <Input id="category-slug" name="slug" placeholder="soins-capillaires" />
              </Field>
              <Field label="Description" htmlFor="category-description">
                <Textarea
                  id="category-description"
                  name="description"
                  placeholder="Texte court qui decrit la categorie."
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Range"
                  htmlFor="category-range"
                  hint="Valeur numerique affichee a cote de la categorie."
                >
                  <Input id="category-range" name="range" type="number" min="0" placeholder="49" />
                </Field>
                <Field
                  label="Image URL"
                  htmlFor="category-imageUrl"
                  hint="Option 1: collez une URL ou un chemin local."
                >
                  <Input
                    id="category-imageUrl"
                    name="imageUrl"
                    placeholder="/api/assets/categories/mon-image.png"
                  />
                </Field>
              </div>
              <Field
                label="Image a uploader"
                htmlFor="category-imageFile"
                hint="Option 2: envoyez directement une image depuis votre ordinateur."
              >
                <Input
                  id="category-imageFile"
                  name="imageFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                />
              </Field>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="featured"
                  className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                />
                Afficher cette categorie comme categorie mise en avant
              </label>
              <AdminSubmitButton
                pendingLabel="Creation..."
                className="w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
              >
                Ajouter la categorie
              </AdminSubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Etat actuel
            </CardDescription>
            <CardTitle className="text-2xl text-slate-900">
              Categories existantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Mise en avant</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">{category.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Maj {dateFormatter.format(category.updatedAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {category.slug}
                    </TableCell>
                    <TableCell>{category.productCount}</TableCell>
                    <TableCell>
                      <StatusBadge tone={category.featured ? "success" : "default"}>
                        {category.featured ? "Oui" : "Non"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteCategoryAction} className="inline-flex">
                        <input type="hidden" name="id" value={category.id} />
                        <AdminSubmitButton
                          size="sm"
                          variant="destructive"
                          pendingLabel="Suppression..."
                        >
                          Supprimer
                        </AdminSubmitButton>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section id="brands" className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Catalogue
            </CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
              <Store className="h-5 w-5 text-shop_btn_dark_green" />
              Ajouter une marque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={createBrandAction}
              encType="multipart/form-data"
              className="space-y-4"
            >
              <Field label="Titre" htmlFor="brand-title">
                <Input id="brand-title" name="title" placeholder="Ex: La Roche-Posay" />
              </Field>
              <Field
                label="Slug"
                htmlFor="brand-slug"
                hint="Laissez vide pour le generer a partir du titre."
              >
                <Input id="brand-slug" name="slug" placeholder="la-roche-posay" />
              </Field>
              <Field label="Description" htmlFor="brand-description">
                <Textarea
                  id="brand-description"
                  name="description"
                  placeholder="Texte court qui decrit la marque."
                />
              </Field>
              <Field
                label="Logo / image URL"
                htmlFor="brand-imageUrl"
                hint="Option 1: collez une URL ou un chemin local."
              >
                <Input
                  id="brand-imageUrl"
                  name="imageUrl"
                  placeholder="/api/assets/brands/brand_1.png"
                />
              </Field>
              <Field
                label="Image a uploader"
                htmlFor="brand-imageFile"
                hint="Option 2: envoyez directement le logo depuis votre ordinateur."
              >
                <Input
                  id="brand-imageFile"
                  name="imageFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                />
              </Field>
              <AdminSubmitButton
                pendingLabel="Creation..."
                className="w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
              >
                Ajouter la marque
              </AdminSubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Etat actuel
            </CardDescription>
            <CardTitle className="text-2xl text-slate-900">
              Marques existantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marque</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Produits</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-slate-900">{brand.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Maj {dateFormatter.format(brand.updatedAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">
                      {brand.slug}
                    </TableCell>
                    <TableCell>{brand.productCount}</TableCell>
                    <TableCell>
                      <StatusBadge tone={brand.imageUrl ? "success" : "default"}>
                        {brand.imageUrl ? "Image definie" : "Sans image"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteBrandAction} className="inline-flex">
                        <input type="hidden" name="id" value={brand.id} />
                        <AdminSubmitButton
                          size="sm"
                          variant="destructive"
                          pendingLabel="Suppression..."
                        >
                          Supprimer
                        </AdminSubmitButton>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section id="products" className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Catalogue
            </CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
              <Boxes className="h-5 w-5 text-shop_btn_dark_green" />
              Ajouter un produit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={createProductAction}
              encType="multipart/form-data"
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nom du produit" htmlFor="product-name">
                  <Input id="product-name" name="name" placeholder="Ex: Creme hydratante intense" />
                </Field>
                <Field
                  label="Slug"
                  htmlFor="product-slug"
                  hint="Laissez vide pour le generer automatiquement."
                >
                  <Input id="product-slug" name="slug" placeholder="creme-hydratante-intense" />
                </Field>
              </div>

              <Field label="Description" htmlFor="product-description">
                <Textarea
                  id="product-description"
                  name="description"
                  placeholder="Description courte visible sur la page produit."
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Prix (MAD)" htmlFor="product-price">
                  <Input id="product-price" name="price" type="number" min="0" step="0.01" placeholder="149.00" />
                </Field>
                <Field label="Remise (%)" htmlFor="product-discount">
                  <Input id="product-discount" name="discount" type="number" min="0" step="1" placeholder="10" />
                </Field>
                <Field label="Stock" htmlFor="product-stock">
                  <Input id="product-stock" name="stock" type="number" min="0" step="1" placeholder="25" />
                </Field>
                <Field label="Statut" htmlFor="product-status">
                  <select
                    id="product-status"
                    name="status"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    defaultValue="new"
                  >
                    {productStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Marque" htmlFor="product-brand">
                <select
                  id="product-brand"
                  name="brandId"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  defaultValue=""
                >
                  <option value="">Sans marque</option>
                  {data.brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.title}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Images"
                htmlFor="product-images"
                hint="Option 1: une URL par ligne. La premiere image sera utilisee en carte produit."
              >
                <Textarea
                  id="product-images"
                  name="imageUrls"
                  placeholder={"/api/assets/products/product_1.png\nhttps://example.com/image-2.jpg"}
                  className="min-h-28"
                />
              </Field>
              <Field
                label="Images a uploader"
                htmlFor="product-imageFiles"
                hint="Option 2: selectionnez une ou plusieurs images depuis votre ordinateur."
              >
                <Input
                  id="product-imageFiles"
                  name="imageFiles"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                />
              </Field>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">
                  Categories du produit
                </Label>
                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/75 p-4 md:grid-cols-2">
                  {data.categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-3 rounded-2xl border border-transparent bg-white/70 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-shop_light_green/35"
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

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isFeatured"
                  className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                />
                Mettre ce produit en avant
              </label>

              <AdminSubmitButton
                pendingLabel="Creation..."
                className="w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
              >
                Ajouter le produit
              </AdminSubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Etat actuel
            </CardDescription>
            <CardTitle className="text-2xl text-slate-900">
              Produits recents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="align-top">
                      <div>
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <p className="mt-1 text-xs text-slate-500">/{product.slug}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {product.categoryTitles.map((category) => (
                            <Badge
                              key={`${product.id}-${category}`}
                              variant="outline"
                              className="rounded-full border-shop_light_green/30 bg-shop_light_green/5 text-[11px] text-shop_btn_dark_green"
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
                        {(product.brandTitle || product.imageUrl) && (
                          <p className="mt-2 text-xs text-slate-500">
                            {product.brandTitle ? `Marque: ${product.brandTitle}` : "Sans marque"}
                            {product.imageUrl ? " - Image definie" : " - Sans image"}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top font-semibold text-slate-900">
                      {currencyFormatter.format(product.price)}
                    </TableCell>
                    <TableCell className="align-top">
                      <StatusBadge tone={product.stock <= 5 ? "warning" : "success"}>
                        {product.stock}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="align-top">
                      <StatusBadge
                        tone={
                          product.status === "sale"
                            ? "danger"
                            : product.status === "hot"
                              ? "warning"
                              : "info"
                        }
                      >
                        {formatStatusLabel(product.status)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deleteProductAction} className="inline-flex">
                        <input type="hidden" name="id" value={product.id} />
                        <AdminSubmitButton
                          size="sm"
                          variant="destructive"
                          pendingLabel="Suppression..."
                        >
                          Supprimer
                        </AdminSubmitButton>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section id="promos" className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Promotions
            </CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
              <Tags className="h-5 w-5 text-shop_btn_dark_green" />
              Ajouter un code promo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPromoCodeAction} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Titre" htmlFor="promo-title">
                  <Input id="promo-title" name="title" placeholder="Offre Ramadan" />
                </Field>
                <Field
                  label="Code"
                  htmlFor="promo-code"
                  hint="Laissez vide pour le generer a partir du titre."
                >
                  <Input id="promo-code" name="code" placeholder="RAMADAN-15" />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Type" htmlFor="promo-type">
                  <select
                    id="promo-type"
                    name="discountType"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    defaultValue="percentage"
                  >
                    {promoDiscountTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Valeur" htmlFor="promo-value">
                  <Input id="promo-value" name="discountValue" type="number" min="0" step="0.01" placeholder="15" />
                </Field>
                <Field label="Minimum panier" htmlFor="promo-min">
                  <Input id="promo-min" name="minimumOrderAmount" type="number" min="0" step="0.01" placeholder="300" />
                </Field>
                <Field label="Limite d'usage" htmlFor="promo-limit">
                  <Input id="promo-limit" name="usageLimit" type="number" min="1" step="1" placeholder="100" />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Debut" htmlFor="promo-start">
                  <Input id="promo-start" name="startsAt" type="datetime-local" />
                </Field>
                <Field label="Fin" htmlFor="promo-end">
                  <Input id="promo-end" name="endsAt" type="datetime-local" />
                </Field>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">
                  Moyens de paiement autorises
                </Label>
                <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/75 p-4 md:grid-cols-2">
                  {paymentMethodOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 rounded-2xl border border-transparent bg-white/70 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-shop_light_green/35"
                    >
                      <input
                        type="checkbox"
                        name="allowedPaymentMethods"
                        value={option.value}
                        className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                        defaultChecked={option.value !== "installments"}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
                />
                Activer le code promo des sa creation
              </label>

              <AdminSubmitButton
                pendingLabel="Creation..."
                className="w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
              >
                Ajouter le code promo
              </AdminSubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
          <CardHeader>
            <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Etat actuel
            </CardDescription>
            <CardTitle className="text-2xl text-slate-900">
              Codes promo actifs et archives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promo</TableHead>
                  <TableHead>Reduction</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.promoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="align-top">
                      <div>
                        <p className="font-semibold text-slate-900">{promo.title}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{promo.code}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          Paiements:{" "}
                          {promo.allowedPaymentMethods.map(formatPaymentLabel).join(", ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900">
                          {promo.discountType === "percentage"
                            ? `${promo.discountValue}%`
                            : currencyFormatter.format(promo.discountValue)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Min. {currencyFormatter.format(promo.minimumOrderAmount)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1 text-sm">
                        <p className="font-medium text-slate-800">
                          {promo.usedCount}
                          {promo.usageLimit ? ` / ${promo.usageLimit}` : " usages"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {promo.endsAt
                            ? `Expire le ${dateFormatter.format(promo.endsAt)}`
                            : "Sans date limite"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <StatusBadge tone={promo.active ? "success" : "default"}>
                        {promo.active ? "Actif" : "Inactif"}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={deletePromoCodeAction} className="inline-flex">
                        <input type="hidden" name="id" value={promo.id} />
                        <AdminSubmitButton
                          size="sm"
                          variant="destructive"
                          pendingLabel="Suppression..."
                        >
                          Supprimer
                        </AdminSubmitButton>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-[30px] border border-shop_light_green/20 bg-[linear-gradient(135deg,rgba(77,182,198,0.12),rgba(255,255,255,0.86)_38%,rgba(212,160,23,0.1))] p-6 shadow-[0_26px_80px_-56px_rgba(16,38,84,0.5)]">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-shop_btn_dark_green/65">
              Flux de publication
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              Comment vos donnees admin apparaissent dans la boutique
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Les categories alimentent l&apos;accueil, la page boutique et les pages
              `/category/[slug]`. Les marques alimentent la page boutique et les
              filtres par marque. Les produits alimentent les grilles, la recherche,
              les filtres et les pages `/product/[slug]`. Les codes promo sont utilises
              pendant le checkout.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/80 p-5">
            <p className="text-sm font-semibold text-shop_btn_dark_green">
              Raccourcis utiles
            </p>
            <Separator className="my-4" />
            <div className="space-y-3 text-sm">
              <Link href="/" className="block text-slate-700 transition-colors hover:text-shop_btn_dark_green">
                Boutique publique
              </Link>
              <Link href="/shop" className="block text-slate-700 transition-colors hover:text-shop_btn_dark_green">
                Catalogue complet
              </Link>
              <Link href="/deal" className="block text-slate-700 transition-colors hover:text-shop_btn_dark_green">
                Produits tendance / promo
              </Link>
              <Link href="#brands" className="block text-slate-700 transition-colors hover:text-shop_btn_dark_green">
                Gestion des marques
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
