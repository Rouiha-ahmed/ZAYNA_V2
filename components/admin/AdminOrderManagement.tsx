"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  CircleAlert,
  CreditCard,
  MapPin,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type OrderViewMode = "priority" | "all";

const actionableStages = new Set(["pending", "confirmed", "preparing", "shipped"]);

const stageDescriptions: Record<string, string> = {
  pending: "Commande recue. A verifier et valider par le bureau.",
  confirmed: "Commande confirmee. Le dossier peut passer en preparation.",
  preparing: "Preparation en cours. Controle stock et articles avant expedition.",
  shipped: "Commande expediee. Suivi livraison en cours.",
  delivered: "Commande terminee et cloturee.",
  cancelled: "Commande annulee. Controlez la raison et l'information client.",
};

const officeNotes: Record<string, string> = {
  pending: "Verifier paiement, coordonnees et faisabilite avant validation.",
  confirmed: "Envoyer vers la preparation et confirmer la disponibilite produit.",
  preparing: "Controler le picking puis passer a l'expedition.",
  shipped: "Surveiller la livraison jusqu'a reception.",
  delivered: "Commande finalisee, garder la trace pour le SAV.",
  cancelled: "Archiver le motif d'annulation et prevenir le client si necessaire.",
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

const MetricBox = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) => (
  <div className="rounded-[24px] border border-slate-200/90 bg-white/90 p-5 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.18)]">
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
      {label}
    </p>
    <p className="mt-3 text-lg font-semibold text-slate-950">{value}</p>
    {helper ? <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p> : null}
  </div>
);

const isActionableOrder = (order: AdminOrder) => actionableStages.has(order.adminStage);

const AdminOrderManagement = ({
  orders,
  stageOptions,
  paymentMethodLabels,
}: AdminOrderManagementProps) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<OrderViewMode>(
    orders.some(isActionableOrder) ? "priority" : "all"
  );
  const [draftStatus, setDraftStatus] = useState("");

  const priorityOrders = useMemo(() => orders.filter(isActionableOrder), [orders]);
  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );
  const effectiveViewMode =
    viewMode === "priority" && priorityOrders.length ? "priority" : "all";
  const visibleOrders = effectiveViewMode === "priority" ? priorityOrders : orders;
  const suggestedNextStage = useMemo(() => {
    if (!selectedOrder) {
      return null;
    }

    const currentIndex = stageOptions.findIndex(
      (option) => option.value === selectedOrder.adminStage
    );

    return currentIndex >= 0 && currentIndex < stageOptions.length - 1
      ? stageOptions[currentIndex + 1]
      : null;
  }, [selectedOrder, stageOptions]);

  const openOrder = (order: AdminOrder) => {
    setSelectedOrderId(order.id);
    setDraftStatus(order.adminStage);
  };

  const closeOrder = () => {
    setSelectedOrderId(null);
    setDraftStatus("");
  };

  if (!orders.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-10 text-center text-sm text-slate-600">
        Aucune commande pour le moment.
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 rounded-[30px] border border-slate-200 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.22)] md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">
              Bureau validation
            </Badge>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              File claire pour les commandes en attente
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Les commandes encore en circuit apparaissent ici avant la liste complete. Le bureau
              peut ouvrir une fiche directement pour verifier et valider.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricBox label="A traiter" value={String(priorityOrders.length)} />
            <MetricBox
              label="Toutes"
              value={String(orders.length)}
              helper="Volume total des commandes chargees."
            />
            <MetricBox
              label="Livrees"
              value={String(orders.filter((order) => order.adminStage === "delivered").length)}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          {priorityOrders.length ? (
            priorityOrders.slice(0, 6).map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => openOrder(order)}
                className="group rounded-[26px] border border-slate-200 bg-white p-4 text-left shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)] transition-all hover:-translate-y-0.5 hover:border-shop_light_green/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      #{order.orderNumber.slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-600">{order.customerName}</p>
                  </div>
                  <StatusPill value={order.adminStage} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    {dateFormatter.format(new Date(order.orderDate))}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    {currencyFormatter.format(order.totalPrice)}
                  </span>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  {officeNotes[order.adminStage] || "Ouvrez la fiche pour verifier cette commande."}
                </p>
                <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-shop_light_green/35 bg-shop_light_green/10 px-3 py-1.5 text-xs font-semibold text-shop_btn_dark_green">
                  Ouvrir la fiche
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))
          ) : (
            <div className="xl:col-span-2 2xl:col-span-3 rounded-[26px] border border-dashed border-emerald-300 bg-emerald-50/70 px-5 py-8 text-center">
              <p className="text-sm font-semibold text-emerald-900">
                Aucune commande prioritaire pour le moment.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setViewMode("priority")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              viewMode === "priority"
                ? "bg-shop_btn_dark_green text-white"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            A valider ({priorityOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              viewMode === "all"
                ? "bg-shop_btn_dark_green text-white"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Toutes ({orders.length})
          </button>
        </div>
        <p className="text-sm text-slate-500">
          {visibleOrders.length} commande(s) dans la vue courante.
        </p>
      </div>

      <div className="space-y-4 md:hidden">
        {visibleOrders.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => openOrder(order)}
            className={cn(
              "w-full rounded-[24px] border bg-white p-4 text-left shadow-[0_18px_40px_-34px_rgba(15,23,42,0.25)]",
              isActionableOrder(order) ? "border-amber-200" : "border-slate-200"
            )}
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
              <p className="font-semibold text-slate-900">
                {currencyFormatter.format(order.totalPrice)}
              </p>
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
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleOrders.map((order) => (
              <TableRow
                key={order.id}
                onClick={() => openOrder(order)}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-shop_light_green/5",
                  isActionableOrder(order) && "bg-amber-50/25"
                )}
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
                <TableCell className="align-top text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      openOrder(order);
                    }}
                    className="rounded-full border-slate-200 bg-white"
                  >
                    Ouvrir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && closeOrder()}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] sm:w-[80vw] sm:max-w-[80vw] overflow-y-auto rounded-[34px] border-white/70 bg-white p-0 shadow-[0_36px_90px_-44px_rgba(15,23,42,0.45)]">
          {selectedOrder ? (
            <div className="space-y-7 p-6 md:p-8">
              <DialogHeader className="space-y-4">
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
                <DialogDescription className="max-w-3xl text-sm leading-6 text-slate-600">
                  Fiche claire pour le bureau: client, livraison, articles et changement de statut
                  dans le meme ecran.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,249,255,0.8))] p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Synthese de la commande
                    </p>
                    <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
                      Une vue plus aeree pour verifier la commande sans bloc serre ni bouton
                      etouffe.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {officeNotes[selectedOrder.adminStage] ||
                        "Utilisez cette fiche pour verifier l'etape reelle de la commande."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill value={selectedOrder.adminStage} label={formatLabel(selectedOrder.adminStage)} />
                    <StatusPill value={selectedOrder.paymentStatus} label={formatLabel(selectedOrder.paymentStatus)} />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricBox
                    label="Date"
                    value={dateFormatter.format(new Date(selectedOrder.orderDate))}
                  />
                  <MetricBox
                    label="Contact"
                    value={selectedOrder.phone || "Non renseigne"}
                    helper="Numero direct pour validation."
                  />
                  <MetricBox
                    label="Articles"
                    value={`${selectedOrder.itemsCount} article(s)`}
                    helper="Quantite totale a controler."
                  />
                  <MetricBox
                    label="Montant"
                    value={currencyFormatter.format(selectedOrder.totalPrice)}
                    helper={
                      paymentMethodLabels[selectedOrder.paymentMethod] ||
                      formatLabel(selectedOrder.paymentMethod)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <UserRound className="h-4 w-4 text-shop_btn_dark_green" />
                    Client
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                    <p className="font-medium text-slate-900">{selectedOrder.customerName}</p>
                    <p>{selectedOrder.email}</p>
                    <p>{selectedOrder.phone || "Telephone non renseigne"}</p>
                  </div>
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <MapPin className="h-4 w-4 text-shop_btn_dark_green" />
                    Livraison
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                    <p>{selectedOrder.address || "Adresse non renseignee"}</p>
                    <p>
                      {[selectedOrder.city, selectedOrder.state, selectedOrder.zip]
                        .filter(Boolean)
                        .join(", ") || "Ville non renseignee"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CreditCard className="h-4 w-4 text-shop_btn_dark_green" />
                    Paiement
                  </div>
                  <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                    <p>{paymentMethodLabels[selectedOrder.paymentMethod] || formatLabel(selectedOrder.paymentMethod)}</p>
                    <div className="pt-1">
                      <StatusPill value={selectedOrder.paymentStatus} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] md:p-6">
                <p className="text-lg font-semibold tracking-tight text-slate-950">
                  Produits commandes
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Controlez les quantites et montants avant validation.
                </p>
                <div className="mt-5 space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center"
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

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_48px_-40px_rgba(15,23,42,0.2)]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <CircleAlert className="h-4 w-4 text-amber-600" />
                    Lecture operationnelle
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <MetricBox
                      label="Etape actuelle"
                      value={formatLabel(selectedOrder.adminStage)}
                      helper={stageDescriptions[selectedOrder.adminStage]}
                    />
                    <MetricBox
                      label="Prochaine etape"
                      value={suggestedNextStage?.label || "Stade final"}
                      helper={
                        suggestedNextStage
                          ? stageDescriptions[suggestedNextStage.value]
                          : "Aucune progression supplementaire attendue."
                      }
                    />
                  </div>
                </div>

                <form
                  action={updateOrderStatusAction}
                  className="flex h-full flex-col rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_48px_-38px_rgba(15,23,42,0.24)]"
                >
                  <input type="hidden" name="id" value={selectedOrder.id} />
                  <input type="hidden" name="status" value={draftStatus} />

                  <div className="rounded-[24px] border border-shop_light_green/25 bg-shop_light_green/8 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-shop_btn_dark_green/70">
                      Changement de statut
                    </p>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                      Action du bureau
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Choisissez l&apos;etape cible. Le bloc d&apos;action est garde en bas avec plus
                      d&apos;espace pour eviter l&apos;effet serre.
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    {stageOptions.map((option) => {
                      const isCurrent = selectedOrder.adminStage === option.value;
                      const isSelected = draftStatus === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDraftStatus(option.value)}
                          className={cn(
                            "w-full rounded-[24px] border p-4 text-left transition-all",
                            isSelected
                              ? "border-shop_btn_dark_green bg-shop_light_green/10"
                              : "border-slate-200 bg-slate-50/75 hover:border-shop_light_green/40 hover:bg-white"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">{option.label}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {stageDescriptions[option.value] || "Etape de suivi."}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              {isCurrent ? (
                                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                                  Actuel
                                </span>
                              ) : null}
                              <span
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded-full border",
                                  isSelected
                                    ? "border-shop_btn_dark_green bg-shop_btn_dark_green"
                                    : "border-slate-300 bg-white"
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full bg-white",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    Le bureau doit verifier le client, le stock et le paiement avant validation.
                  </div>

                  <div className="mt-auto border-t border-slate-200 pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeOrder}
                        className="h-12 flex-1 rounded-2xl"
                      >
                        Fermer
                      </Button>
                      <AdminSubmitButton
                        pendingLabel="Mise a jour..."
                        className="h-12 flex-1 rounded-2xl bg-shop_btn_dark_green text-white hover:bg-shop_dark_green"
                      >
                        Enregistrer le statut
                      </AdminSubmitButton>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      La file prioritaire sera mise a jour apres validation.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminOrderManagement;
