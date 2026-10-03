"use client";

import Link from "next/link";
import {
  ExternalLink,
  Printer,
  ReceiptText,
  RefreshCw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  OrderContactButtons,
  OrderNoteForm,
  OrderPrimaryAction,
  OrderSecondaryActions,
} from "@/components/admin/orders/OrderDetailControls";
import {
  OrderCustomerSummary,
  OrderDeliverySummary,
  OrderDetailSurface,
  type OrderDetailItem,
  OrderItemsSummary,
  OrderPaymentSummary,
  OrderStatusBadge,
  orderDateTime,
  orderLabels,
  orderReference,
} from "@/components/admin/orders/OrderDetailShared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  OrderNextAction,
  OrderOperatorRole,
} from "@/lib/orders/domain";

export type OrderQuickViewOrder = {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  shippingName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  totalPrice: number;
  amountDiscount: number;
  promoCode: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  fulfillmentStatus: string;
  deliveryStatus: string;
  deliveryCompany: string | null;
  trackingNumber: string | null;
  orderDate: string;
  version: number;
  items: OrderDetailItem[];
  nextAction: OrderNextAction;
  operatorRole?: OrderOperatorRole;
  notes: Array<{
    id: string;
    content: string;
    createdBy: string;
    createdAt: string;
  }>;
};

export default function OrderQuickView({
  open,
  order,
  operatorRole,
  returnTo,
  onClose,
  onRetry,
}: {
  open: boolean;
  order: OrderQuickViewOrder | null;
  operatorRole: OrderOperatorRole;
  returnTo: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  const expandHref = order
    ? `/admin/orders/${order.id}?returnTo=${encodeURIComponent(returnTo)}`
    : returnTo;
  const canMarkDelivered = Boolean(
    order &&
      order.fulfillmentStatus === "shipped" &&
      ["in_transit", "out_for_delivery", "delayed"].includes(order.deliveryStatus)
  );
  const canCancel = Boolean(
    order &&
      operatorRole !== "ORDER_AGENT" &&
      order.status !== "cancelled" &&
      order.deliveryStatus !== "delivered"
  );

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-slate-950/20 backdrop-blur-[1px]"
        className="!bottom-0 !left-auto !right-0 !top-0 flex !h-dvh !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden !rounded-none border-y-0 border-r-0 border-l border-slate-200 bg-slate-50 p-0 shadow-2xl sm:!max-w-[480px] xl:!max-w-[520px]"
      >
        {order ? (
          <>
            <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3 pr-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <DialogTitle className="text-xl text-slate-950">
                      Commande {orderReference(order.orderNumber)}
                    </DialogTitle>
                    <OrderStatusBadge value={order.fulfillmentStatus} />
                  </div>
                  <DialogDescription className="mt-2">
                    Passée le {orderDateTime.format(new Date(order.orderDate))}
                  </DialogDescription>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild variant="ghost" size="icon-sm" className="rounded-xl" title="Ouvrir en grand">
                    <Link href={expandHref} aria-label="Ouvrir la commande en grand">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost" size="icon-sm" className="rounded-xl" aria-label="Fermer l’aperçu">
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogClose>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm" className="rounded-xl bg-white">
                  <a href={`/admin/orders/print?ids=${encodeURIComponent(order.id)}`} target="_blank" rel="noreferrer">
                    <Printer className="h-4 w-4" />Imprimer
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-xl bg-white">
                  <Link href={expandHref}><ExternalLink className="h-4 w-4" />Agrandir</Link>
                </Button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
              <div className="space-y-4">
                <OrderPrimaryAction
                  orderId={order.id}
                  version={order.version}
                  nextAction={order.nextAction}
                  operatorRole={operatorRole}
                  carrier={order.deliveryCompany}
                  trackingNumber={order.trackingNumber}
                />

                <OrderDetailSurface title="Statuts opérationnels" icon={SlidersHorizontal} compact>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 p-2"><p className="text-[10px] font-semibold uppercase text-slate-400">Traitement</p><p className="mt-1 text-xs font-semibold text-slate-800">{orderLabels[order.fulfillmentStatus] || order.fulfillmentStatus}</p></div>
                    <div className="rounded-xl bg-slate-50 p-2"><p className="text-[10px] font-semibold uppercase text-slate-400">Paiement</p><p className="mt-1 text-xs font-semibold text-slate-800">{orderLabels[order.paymentStatus] || order.paymentStatus}</p></div>
                    <div className="rounded-xl bg-slate-50 p-2"><p className="text-[10px] font-semibold uppercase text-slate-400">Livraison</p><p className="mt-1 text-xs font-semibold text-slate-800">{orderLabels[order.deliveryStatus] || order.deliveryStatus}</p></div>
                  </div>
                </OrderDetailSurface>

                <OrderCustomerSummary
                  name={order.shippingName || order.customerName}
                  email={order.email}
                  phone={order.phone}
                  address={order.address}
                  city={order.city}
                  state={order.state}
                  zip={order.zip}
                  userId={order.userId}
                  compact
                  after={<OrderContactButtons orderId={order.id} phone={order.phone} email={order.email} />}
                />

                <OrderItemsSummary
                  items={order.items}
                  totalPrice={order.totalPrice}
                  amountDiscount={order.amountDiscount}
                  promoCode={order.promoCode}
                  compact
                />

                <OrderPaymentSummary method={order.paymentMethod} status={order.paymentStatus} totalPrice={order.totalPrice} compact />
                <OrderDeliverySummary status={order.deliveryStatus} carrier={order.deliveryCompany} trackingNumber={order.trackingNumber} compact />

                <OrderDetailSurface title="Notes internes" icon={ReceiptText} compact>
                  <OrderNoteForm orderId={order.id} />
                  {order.notes.length ? (
                    <div className="mt-4 divide-y divide-slate-100">
                      {order.notes.map((note) => (
                        <div key={note.id} className="py-3">
                          <p className="text-sm leading-6 text-slate-700">{note.content}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{note.createdBy} · {orderDateTime.format(new Date(note.createdAt))}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-4 text-xs text-slate-400">Aucune note pour le moment.</p>}
                </OrderDetailSurface>

                <OrderSecondaryActions
                  orderId={order.id}
                  version={order.version}
                  canMarkDelivered={canMarkDelivered}
                  canCancel={canCancel}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <DialogTitle>Commande introuvable</DialogTitle>
            <DialogDescription className="mt-2">Impossible de charger cette commande sans modifier votre liste.</DialogDescription>
            <div className="mt-5 flex gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={onRetry}><RefreshCw className="h-4 w-4" />Réessayer</Button>
              <DialogClose asChild><Button type="button" className="rounded-xl bg-shop_btn_dark_green text-white">Fermer</Button></DialogClose>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
