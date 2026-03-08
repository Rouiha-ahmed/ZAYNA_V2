"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  CreditCard,
  MapPin,
  Package2,
  Phone,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { updateOrderStatusAction } from "@/app/admin/actions";
import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { resolveImageUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

type OrderStageOption = {
  value: string;
  label: string;
};

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  totalPrice: number;
  status: string;
  adminStage: string;
  paymentStatus: string;
  paymentMethod: string;
  orderDate: string | Date;
  itemsCount: number;
  items: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    quantity: number;
    unitPrice: number;
  }>;
};

type AdminOrderManagementProps = {
  orders: AdminOrder[];
  stageOptions: OrderStageOption[];
  paymentMethodLabels: Record<string, string>;
};

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

const formatLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getTone = (value: string) => {
  if (["delivered", "paid"].includes(value)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (["pending", "processing", "partial", "confirmed", "preparing", "shipped"].includes(value)) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (["cancelled", "failed"].includes(value)) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
};

const StatusPill = ({ value, label }: { value: string; label?: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
      getTone(value)
    )}
  >
    {label || formatLabel(value)}
  </span>
);

const AdminOrderManagement = ({
  orders,
  stageOptions,
  paymentMethodLabels,
}: AdminOrderManagementProps) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  if (!orders.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-10 text-center text-sm text-slate-600">
        Aucune commande pour le moment.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {orders.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => setSelectedOrderId(order.id)}
            className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-[0_18px_40px_-34px_rgba(15,23,42,0.25)] transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  #{order.orderNumber.slice(-8).toUpperCase()}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {dateFormatter.format(new Date(order.orderDate))}
                </p>
              </div>
              <StatusPill value={order.adminStage} />
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>{order.customerName}</p>
              <p>{order.itemsCount} article(s)</p>
              <p className="font-semibold text-slate-900">{currencyFormatter.format(order.totalPrice)}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden md:block">
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
            {orders.map((order) => (
              <TableRow
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="cursor-pointer transition-colors hover:bg-shop_light_green/5"
              >
                <TableCell className="align-top">
                  <div>
                    <p className="font-semibold text-slate-900">
                      #{order.orderNumber.slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {dateFormatter.format(new Date(order.orderDate))}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div>
                    <p className="font-medium text-slate-800">{order.customerName}</p>
                    <p className="mt-1 text-xs text-slate-500">{order.email}</p>
                  </div>
                </TableCell>
                <TableCell className="align-top font-semibold text-slate-900">
                  {currencyFormatter.format(order.totalPrice)}
                </TableCell>
                <TableCell className="align-top">
                  <StatusPill value={order.adminStage} />
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-1">
                    <StatusPill value={order.paymentStatus} />
                    <p className="text-xs text-slate-500">
                      {paymentMethodLabels[order.paymentMethod] || formatLabel(order.paymentMethod)}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto rounded-[30px] border-white/70 bg-white p-0 shadow-[0_36px_90px_-44px_rgba(15,23,42,0.45)]">
          {selectedOrder ? (
            <div className="space-y-6 p-6 md:p-8">
              <DialogHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-shop_light_green/15 text-shop_btn_dark_green hover:bg-shop_light_green/15">
                    Detail de commande
                  </Badge>
                  <StatusPill value={selectedOrder.adminStage} />
                  <StatusPill value={selectedOrder.paymentStatus} />
                </div>
                <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                  Commande #{selectedOrder.orderNumber.slice(-8).toUpperCase()}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-slate-600">
                  Consultez les informations client, les produits commandes et mettez a jour le statut
                  sans ouvrir Prisma Studio.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <UserRound className="h-4 w-4 text-shop_btn_dark_green" />
                    Client
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p className="font-medium text-slate-900">{selectedOrder.customerName}</p>
                    <p>{selectedOrder.email}</p>
                    <p>{selectedOrder.phone || "Telephone non renseigne"}</p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <MapPin className="h-4 w-4 text-shop_btn_dark_green" />
                    Livraison
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p>{selectedOrder.address || "Adresse non renseignee"}</p>
                    <p>
                      {[selectedOrder.city, selectedOrder.state, selectedOrder.zip]
                        .filter(Boolean)
                        .join(", ") || "Ville non renseignee"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CreditCard className="h-4 w-4 text-shop_btn_dark_green" />
                    Paiement
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p>{paymentMethodLabels[selectedOrder.paymentMethod] || formatLabel(selectedOrder.paymentMethod)}</p>
                    <p className="font-medium text-slate-900">
                      {currencyFormatter.format(selectedOrder.totalPrice)}
                    </p>
                    <p>{dateFormatter.format(new Date(selectedOrder.orderDate))}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)]">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Package2 className="h-4 w-4 text-shop_btn_dark_green" />
                  Produits commandes
                </div>
                <div className="mt-4 space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-[22px] border border-slate-200 bg-slate-50/60 p-3"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white">
                        {item.imageUrl ? (
                          <Image
                            src={resolveImageUrl(item.imageUrl)}
                            alt={item.name}
                            fill
                            unoptimized
                            sizes="4rem"
                            className="object-contain p-2"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">{item.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>Quantite: {item.quantity}</span>
                          <span>Prix unitaire: {currencyFormatter.format(item.unitPrice)}</span>
                        </div>
                      </div>

                      <div className="text-right text-sm font-semibold text-slate-900">
                        {currencyFormatter.format(item.unitPrice * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <CalendarDays className="h-4 w-4 text-shop_btn_dark_green" />
                        Date
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {dateFormatter.format(new Date(selectedOrder.orderDate))}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <Phone className="h-4 w-4 text-shop_btn_dark_green" />
                        Contact
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedOrder.phone || "Non renseigne"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <ShoppingBag className="h-4 w-4 text-shop_btn_dark_green" />
                        Articles
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedOrder.itemsCount} article(s)
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  action={updateOrderStatusAction}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)]"
                >
                  <input type="hidden" name="id" value={selectedOrder.id} />
                  <p className="text-sm font-semibold text-slate-900">Mettre a jour la commande</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choisissez simplement l&apos;etape actuelle de la commande.
                  </p>

                  <div className="mt-4 space-y-3">
                    <label htmlFor={`order-status-${selectedOrder.id}`} className="text-sm font-medium text-slate-700">
                      Statut
                    </label>
                    <select
                      id={`order-status-${selectedOrder.id}`}
                      name="status"
                      defaultValue={selectedOrder.adminStage}
                      className="flex h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-shop_btn_dark_green focus:ring-4 focus:ring-shop_light_green/15"
                    >
                      {stageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <AdminSubmitButton
                    pendingLabel="Mise a jour..."
                    className="mt-5 h-11 w-full rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
                  >
                    Enregistrer
                  </AdminSubmitButton>
                </form>
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setSelectedOrderId(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminOrderManagement;
