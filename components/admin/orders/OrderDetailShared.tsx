import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CreditCard, MapPin, Package2, Truck, UserRound } from "lucide-react";
import type { ReactNode } from "react";

import { resolveImageUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

export const orderCurrency = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  maximumFractionDigits: 2,
});

export const orderDateTime = new Intl.DateTimeFormat("fr-MA", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const orderReference = (value: string) =>
  `#${value.slice(-8).toUpperCase()}`;

export const orderLabels: Record<string, string> = {
  to_prepare: "À préparer",
  preparing: "En préparation",
  ready: "Prête",
  shipped: "Expédiée",
  cancelled: "Annulée",
  pending: "En attente",
  partial: "Partiel",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
  not_assigned: "Non expédiée",
  in_transit: "En transit",
  out_for_delivery: "En livraison",
  delivered: "Livrée",
  delayed: "Retard",
  returned: "Retournée",
  cod: "Paiement à la livraison (COD)",
  cmi_card: "Carte bancaire",
  installments: "Paiement en plusieurs fois",
  requested: "Demandé",
  approved: "Approuvé",
  received: "Reçu",
  inspected: "Inspecté",
  closed: "Clôturé",
  rejected: "Refusé",
};

const statusTone = (value: string) => {
  if (["paid", "delivered", "closed"].includes(value))
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (["to_prepare", "preparing", "pending", "partial", "ready", "delayed", "requested"].includes(value))
    return "bg-amber-50 text-amber-700 ring-amber-200";
  if (["shipped", "in_transit", "out_for_delivery", "approved", "received", "inspected"].includes(value))
    return "bg-blue-50 text-blue-700 ring-blue-200";
  if (["cancelled", "failed", "returned", "refunded", "rejected"].includes(value))
    return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
};

export function OrderStatusBadge({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        statusTone(value)
      )}
    >
      {label || orderLabels[value] || value}
    </span>
  );
}

export function OrderDetailSurface({
  title,
  icon: Icon,
  action,
  children,
  id,
  compact = false,
}: {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
  compact?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "border border-slate-200 bg-white",
        compact
          ? "rounded-2xl p-4"
          : "rounded-[26px] border-white/80 p-5 shadow-[0_24px_70px_-56px_rgba(15,23,42,0.42)]"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-shop_btn_dark_green">
            <Icon className="h-4 w-4" />
          </span>
          <h2 className="font-semibold text-slate-950">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export type OrderDetailItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  sku: string | null;
};

export function OrderItemsSummary({
  items,
  totalPrice,
  amountDiscount,
  promoCode,
  compact = false,
}: {
  items: OrderDetailItem[];
  totalPrice: number;
  amountDiscount: number;
  promoCode: string | null;
  compact?: boolean;
}) {
  const articlesTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const articlesCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const visibleItems = compact ? items.slice(0, 4) : items;

  return (
    <OrderDetailSurface
      title={`Articles (${articlesCount})`}
      icon={Package2}
      compact={compact}
    >
      <div className="divide-y divide-slate-100">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 py-4 first:pt-0 last:pb-0",
              !compact && "gap-4"
            )}
          >
            <div
              className={cn(
                "relative shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50",
                compact ? "h-12 w-12" : "h-16 w-16"
              )}
            >
              {item.imageUrl ? (
                <Image
                  src={resolveImageUrl(item.imageUrl)}
                  alt={item.name}
                  fill
                  unoptimized
                  sizes={compact ? "3rem" : "4rem"}
                  className="object-contain p-2"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-slate-300">
                  <Package2 className="h-5 w-5" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.sku ? `SKU ${item.sku} · ` : ""}x{item.quantity}
              </p>
              {!compact ? (
                <p className="mt-1 text-xs text-slate-500">
                  {orderCurrency.format(item.price)} / unité
                </p>
              ) : null}
            </div>
            <strong className="shrink-0 text-sm text-slate-900">
              {orderCurrency.format(item.price * item.quantity)}
            </strong>
          </div>
        ))}
      </div>
      {compact && items.length > visibleItems.length ? (
        <p className="mt-3 text-xs font-semibold text-blue-700">
          + {items.length - visibleItems.length} autre(s) article(s)
        </p>
      ) : null}
      <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Articles ({articlesCount})</span>
          <span>{orderCurrency.format(articlesTotal)}</span>
        </div>
        {amountDiscount > 0 ? (
          <div className="flex justify-between text-emerald-700">
            <span>Remise {promoCode ? `(${promoCode})` : ""}</span>
            <span>- {orderCurrency.format(amountDiscount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-slate-600">
          <span>Livraison</span>
          <span>Incluse</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Sous-total</span>
          <span>{orderCurrency.format(totalPrice)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-semibold text-slate-950">
          <span>Total</span>
          <span>{orderCurrency.format(totalPrice)}</span>
        </div>
      </div>
    </OrderDetailSurface>
  );
}

export function OrderCustomerSummary({
  name,
  email,
  phone,
  address,
  city,
  state,
  zip,
  userId,
  action,
  after,
  compact = false,
}: {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  userId: string | null;
  action?: ReactNode;
  after?: ReactNode;
  compact?: boolean;
}) {
  return (
    <OrderDetailSurface title="Client et livraison" icon={UserRound} action={action} compact={compact} id="client">
      <div className="space-y-2 text-sm">
        <p className="font-semibold text-slate-900">{name}</p>
        <p className="text-slate-600">{phone || "Téléphone manquant"}</p>
        <p className="break-all text-slate-600">{email}</p>
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-slate-600">
          <MapPin className="mr-2 inline h-4 w-4" />
          {address || "Adresse manquante"}
          <br />
          <span className="ml-6">
            {[city, state, zip].filter(Boolean).join(" · ") || "Ville manquante"}
          </span>
        </div>
        {userId ? (
          <Link href={`/admin/clients/${userId}`} className="inline-block text-xs font-semibold text-blue-700 hover:underline">
            Voir le profil client →
          </Link>
        ) : null}
      </div>
      {after ? <div className="mt-4">{after}</div> : null}
    </OrderDetailSurface>
  );
}

export function OrderPaymentSummary({
  method,
  status,
  totalPrice,
  reference,
  compact = false,
}: {
  method: string;
  status: string;
  totalPrice: number;
  reference?: string | null;
  compact?: boolean;
}) {
  return (
    <OrderDetailSurface title="Paiement" icon={CreditCard} compact={compact}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Méthode</span><strong className="text-right">{orderLabels[method] || method}</strong></div>
        <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Statut</span><OrderStatusBadge value={status} /></div>
        <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Montant</span><strong>{orderCurrency.format(totalPrice)}</strong></div>
        {reference ? <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Référence</span><code className="text-xs">••••{reference.slice(-8)}</code></div> : null}
        {method === "cod" && status !== "paid" ? <p className="rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-700">COD en attente d&apos;encaissement. La préparation reste autorisée.</p> : null}
      </div>
    </OrderDetailSurface>
  );
}

export function OrderDeliverySummary({
  status,
  carrier,
  trackingNumber,
  estimatedDeliveryAt,
  compact = false,
}: {
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  estimatedDeliveryAt?: Date | string | null;
  compact?: boolean;
}) {
  return (
    <OrderDetailSurface title="Livraison" icon={Truck} compact={compact}>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-3"><span className="text-slate-500">Statut</span><OrderStatusBadge value={status} /></div>
        <div className="flex justify-between gap-3"><span className="text-slate-500">Transporteur</span><strong className="text-right">{carrier || "Non assigné"}</strong></div>
        <div className="flex justify-between gap-3"><span className="text-slate-500">Tracking</span><strong className="max-w-48 truncate">{trackingNumber || "À venir"}</strong></div>
        {estimatedDeliveryAt ? <div className="flex justify-between gap-3"><span className="text-slate-500">Livraison estimée</span><strong>{orderDateTime.format(new Date(estimatedDeliveryAt))}</strong></div> : null}
      </div>
    </OrderDetailSurface>
  );
}
