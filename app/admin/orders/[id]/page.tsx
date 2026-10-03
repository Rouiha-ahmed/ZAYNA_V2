import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ReceiptText,
} from "lucide-react";

import {
  OrderAddressForm,
  OrderContactButtons,
  OrderNoteForm,
  OrderPrimaryAction,
  OrderReturnForm,
  OrderSecondaryActions,
} from "@/components/admin/orders/OrderDetailControls";
import {
  OrderCustomerSummary,
  OrderDeliverySummary,
  OrderDetailSurface as Surface,
  OrderItemsSummary,
  OrderPaymentSummary,
  OrderStatusBadge as StatusBadge,
  orderCurrency as currency,
  orderDateTime as dateTime,
  orderReference,
} from "@/components/admin/orders/OrderDetailShared";
import { getAdminOrderDetail } from "@/lib/orders/admin-data";
import { cn } from "@/lib/utils";

const formatDuration = (milliseconds: number | null) => {
  if (milliseconds === null) return "En cours";
  const hours = Math.max(0, Math.round(milliseconds / 3_600_000));
  return hours < 24 ? `${hours} h` : `${Math.floor(hours / 24)} j ${hours % 24} h`;
};

const metadataRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const rawReturnTo = resolvedSearchParams.returnTo;
  const requestedReturnTo = Array.isArray(rawReturnTo) ? rawReturnTo[0] : rawReturnTo;
  const returnTo = requestedReturnTo?.startsWith("/admin/orders")
    ? requestedReturnTo
    : "/admin/orders";
  const order = await getAdminOrderDetail(id);
  if (!order) notFound();

  const canMarkDelivered = order.fulfillmentStatus === "shipped" && ["in_transit", "out_for_delivery", "delayed"].includes(order.deliveryStatus);
  const canCancel = order.operatorRole !== "ORDER_AGENT" && order.status !== "cancelled" && order.deliveryStatus !== "delivered";

  return (
    <div className="space-y-6">
      <Link href={returnTo} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-shop_btn_dark_green"><ArrowLeft className="h-4 w-4" />Retour aux commandes</Link>

      <header className="flex flex-col gap-5 rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[0_26px_80px_-56px_rgba(15,23,42,0.42)] lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-slate-950">Commande {orderReference(order.orderNumber)}</h1>{order.operational.attentionLevel === "CRITICAL" ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"><AlertTriangle className="h-3.5 w-3.5" />Critique</span> : null}</div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500"><strong className="text-lg text-slate-950">{currency.format(order.totalPrice)}</strong><span>Créée le {dateTime.format(order.orderDate)}</span></div>
          <div className="mt-4 flex flex-wrap gap-2"><StatusBadge value={order.fulfillmentStatus} /><StatusBadge value={order.paymentStatus} /><StatusBadge value={order.deliveryStatus} />{order.paymentMethod === "cod" && order.paymentStatus !== "paid" ? <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">COD non encaissé</span> : null}</div>
        </div>
        <OrderSecondaryActions orderId={order.id} version={order.version} canMarkDelivered={canMarkDelivered} canCancel={canCancel} />
      </header>

      <OrderPrimaryAction orderId={order.id} version={order.version} nextAction={order.operational.nextAction} operatorRole={order.operatorRole} carrier={order.deliveryCompany} trackingNumber={order.trackingNumber} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <OrderItemsSummary
            items={order.items.map((item) => ({
              id: item.id,
              name: item.productNameSnapshot,
              price: item.productPriceSnapshot,
              imageUrl: item.productImageUrlSnapshot,
              quantity: item.quantity,
              sku: item.sku,
            }))}
            totalPrice={order.totalPrice}
            amountDiscount={order.amountDiscount}
            promoCode={order.promoCode}
          />

          <Surface title="Traitement et performance" icon={CalendarClock}>
            <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Commande reçue → préparée</p><p className="mt-2 font-semibold text-slate-900">{formatDuration(order.performance.preparationMs)}</p>{order.preparedAt ? <p className="mt-1 text-xs text-slate-500">Préparée le {dateTime.format(order.preparedAt)}</p> : null}</div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Commande reçue → livrée</p><p className="mt-2 font-semibold text-slate-900">{formatDuration(order.performance.deliveryMs)}</p>{order.deliveredAt ? <p className="mt-1 text-xs text-slate-500">Livrée le {dateTime.format(order.deliveredAt)}</p> : null}</div></div>
            {order.operational.sla ? <div className={cn("mt-3 rounded-2xl px-4 py-3 text-sm", order.operational.sla.isOverdue ? "bg-rose-50 text-rose-800" : "bg-blue-50 text-blue-800")}><strong>{order.operational.sla.isOverdue ? "SLA dépassé" : "SLA en cours"}</strong> · échéance {dateTime.format(order.operational.sla.dueAt)}</div> : null}
          </Surface>

          <Surface title={`Anomalies (${order.operational.issues.length})`} icon={AlertTriangle}>
            {order.operational.issues.length ? <div className="space-y-3">{order.operational.issues.map((issue) => <div key={issue.code} className={cn("rounded-2xl border px-4 py-3", issue.severity === "critical" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50")}><div className="flex items-start justify-between gap-3"><div><p className={cn("text-sm font-semibold", issue.severity === "critical" ? "text-rose-800" : "text-amber-800")}>{issue.message}</p><p className="mt-1 text-xs text-slate-600">Action recommandée : {issue.recommendedAction.toLowerCase().replaceAll("_", " ")}</p></div><span className="text-[10px] font-semibold uppercase tracking-wide">{issue.severity}</span></div></div>)}</div> : <div className="rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800"><CheckCircle2 className="mr-2 inline h-4 w-4" />Aucune anomalie détectée.</div>}
          </Surface>

          <Surface title="Timeline opérationnelle" icon={ReceiptText}>
            {order.events.length ? <ol className="relative ml-2 border-l border-slate-200 pl-6">{order.events.map((event) => { const metadata = metadataRecord(event.metadata); const previous = metadataRecord(metadata?.previous); const next = metadataRecord(metadata?.next); return <li key={event.id} className="relative pb-6 last:pb-0"><span className="absolute -left-[1.83rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500 ring-1 ring-blue-200" /><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-slate-900">{event.title}</p>{event.description ? <p className="mt-1 text-xs leading-5 text-slate-500">{event.description}</p> : null}{event.type === "ADDRESS_UPDATED" && previous && next ? <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><p><strong>Avant :</strong> {String(previous.address || "—")}, {String(previous.city || "—")}</p><p className="mt-1"><strong>Après :</strong> {String(next.address || "—")}, {String(next.city || "—")}</p></div> : null}<p className="mt-1 text-[11px] text-slate-400">{event.actorName || "Système"}</p></div><time className="shrink-0 text-[11px] text-slate-400">{dateTime.format(event.createdAt)}</time></div></li>; })}</ol> : <p className="text-sm text-slate-500">Aucun événement enregistré.</p>}
          </Surface>

          <Surface title={`Retours (${order.returns.length})`} icon={ReceiptText} action={order.deliveryStatus === "delivered" && order.operatorRole !== "ORDER_AGENT" ? <OrderReturnForm orderId={order.id} /> : undefined}>
            {order.returns.length ? <div className="space-y-3">{order.returns.map((orderReturn) => <div key={orderReturn.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><StatusBadge value={orderReturn.status} /><span className="text-xs text-slate-400">{dateTime.format(orderReturn.createdAt)}</span></div><p className="mt-3 text-sm text-slate-700">{orderReturn.reason}</p><p className="mt-2 text-xs text-slate-500">Remboursement : {orderReturn.refundStatus ? `${orderReturn.refundStatus}${orderReturn.refundAmount ? ` · ${currency.format(orderReturn.refundAmount)}` : ""}` : "aucune opération"}</p></div>)}</div> : <p className="text-sm text-slate-500">Aucun retour. Un retour ne déclenche jamais automatiquement un remboursement.</p>}
          </Surface>
        </div>

        <aside className="space-y-6">
          <OrderCustomerSummary
            name={order.shippingName || order.customerName}
            email={order.email}
            phone={order.shippingPhone}
            address={order.shippingAddress}
            city={order.shippingCity}
            state={order.shippingState}
            zip={order.shippingZip}
            userId={order.user?.id || null}
            action={order.operatorRole !== "ORDER_AGENT" || order.fulfillmentStatus !== "shipped" ? <OrderAddressForm order={{ id: order.id, name: order.shippingName || order.customerName, phone: order.shippingPhone || "", address: order.shippingAddress || "", city: order.shippingCity || "", state: order.shippingState || "", zip: order.shippingZip || "", shipped: order.fulfillmentStatus === "shipped" }} /> : undefined}
            after={<OrderContactButtons orderId={order.id} phone={order.shippingPhone} email={order.email} />}
          />

          <OrderPaymentSummary method={order.paymentMethod} status={order.paymentStatus} totalPrice={order.totalPrice} reference={order.stripePaymentIntentId} />

          <OrderDeliverySummary status={order.deliveryStatus} carrier={order.deliveryCompany} trackingNumber={order.trackingNumber} estimatedDeliveryAt={order.estimatedDeliveryAt} />

          <Surface title="Notes internes" icon={ReceiptText}>
            <OrderNoteForm orderId={order.id} />
            {order.notes.length ? <div className="mt-4 divide-y divide-slate-100">{order.notes.map((note) => <div key={note.id} className="py-3"><p className="text-sm leading-6 text-slate-700">{note.content}</p><p className="mt-1 text-[11px] text-slate-400">{note.createdBy} · {dateTime.format(note.createdAt)}</p></div>)}</div> : <p className="mt-4 text-xs text-slate-400">Aucune note pour le moment.</p>}
          </Surface>
        </aside>
      </div>
    </div>
  );
}
