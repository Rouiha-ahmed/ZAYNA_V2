import {
  CircleDollarSign,
  Clock3,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

import AdminOrderManagement from "@/components/admin/AdminOrderManagement";
import {
  AdminPageHero,
  MetricCard,
  SectionHeading,
  StatusPill,
  adminCurrencyFormatter,
  adminSurfaceClassName,
} from "@/components/admin/AdminPagePrimitives";
import { Badge } from "@/components/ui/badge";
import {
  adminOrderStageOptions,
  paymentMethodOptions,
} from "@/lib/admin";
import { getAdminOrdersPageData } from "@/lib/admin-pages";
import { cn } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const getQueryValue = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [resolvedSearchParams, data] = await Promise.all([
    searchParams,
    getAdminOrdersPageData(),
  ]);
  const statusMessage = getQueryValue(resolvedSearchParams, "status");
  const errorMessage = getQueryValue(resolvedSearchParams, "error");
  const paymentMethodLabels = Object.fromEntries(
    paymentMethodOptions.map((option) => [option.value, option.label])
  );

  return (
    <div className="space-y-8 lg:space-y-10">
      <AdminPageHero
        badge="Commandes"
        title="Un espace dedie au suivi des ventes et du service client."
        description="Ouvrez les details d'une commande, verifiez les coordonnees client et mettez a jour son avancement sans quitter l'ecran. Cette page ne charge que les donnees utiles aux commandes."
        aside={
          <>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">
              Synthese rapide
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                  Commandes totales
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.metrics.totalOrders}</p>
              </div>
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                  A traiter
                </p>
                <p className="mt-2 text-3xl font-semibold">{data.metrics.pendingOrders}</p>
              </div>
              <div className="rounded-2xl bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                  Revenus encaisses
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {adminCurrencyFormatter.format(data.metrics.totalRevenue)}
                </p>
              </div>
            </div>
          </>
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
        <MetricCard
          icon={ShoppingBag}
          label="Commandes"
          value={new Intl.NumberFormat("fr-MA").format(data.metrics.totalOrders)}
          helper="Toutes les commandes enregistrees dans la boutique."
          tone="bg-sky-50 text-sky-700 ring-sky-200"
        />
        <MetricCard
          icon={Clock3}
          label="A traiter"
          value={new Intl.NumberFormat("fr-MA").format(data.metrics.pendingOrders)}
          helper="Commandes en attente, preparation ou expedition."
          tone="bg-amber-50 text-amber-700 ring-amber-200"
        />
        <MetricCard
          icon={CreditCard}
          label="Paiements valides"
          value={new Intl.NumberFormat("fr-MA").format(data.metrics.paidOrders)}
          helper="Commandes dont le paiement est marque comme regle."
          tone="bg-emerald-50 text-emerald-700 ring-emerald-200"
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Revenus"
          value={adminCurrencyFormatter.format(data.metrics.totalRevenue)}
          helper="Montant cumule des commandes payees."
          tone="bg-violet-50 text-violet-700 ring-violet-200"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={cn(adminSurfaceClassName, "p-6")}>
          <SectionHeading
            badge="Pipeline"
            title="Suivi des etapes de commande"
            description="Visualisez ou se trouvent les commandes avant d'ouvrir le detail."
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.orderStageBreakdown.map((item) => (
              <div
                key={item.status}
                className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <Badge className="bg-white text-slate-700 hover:bg-white">
                    {item.count}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(adminSurfaceClassName, "p-6")}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Paiement
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Etats des paiements
          </h2>
          <div className="mt-5 space-y-3">
            {data.paymentStatusBreakdown.map((item) => (
              <div
                key={item.status}
                className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50/75 px-4 py-3"
              >
                <StatusPill value={item.status} />
                <span className="text-sm font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="orders-list" className="space-y-6">
        <SectionHeading
          badge="Liste complete"
          title="Ouvrir et traiter une commande"
          description="La file prioritaire met d'abord en avant les commandes a valider par le bureau, puis la liste complete permet d'ouvrir la fiche detaillee, verifier les articles et changer le statut."
        />

        <div className={cn(adminSurfaceClassName, "p-5 md:p-6")}>
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
    </div>
  );
}
