import { EmptyState } from "@/components/admin/AdminPagePrimitives";

type TopProduct = {
  name: string;
  unitsSold: number;
  ordersCount: number;
};

type AdminTopProductsListProps = {
  items: TopProduct[];
};

export default function AdminTopProductsList({
  items,
}: AdminTopProductsListProps) {
  const maxUnits = Math.max(...items.map((item) => item.unitsSold), 1);

  if (!items.length) {
    return (
      <EmptyState
        title="Aucun best-seller"
        description="Les produits les plus commandes apparaitront ici des les premieres ventes."
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const width = Math.max(Math.round((item.unitsSold / maxUnits) * 100), 12);

        return (
          <div
            key={`${item.name}-${index}`}
            className="rounded-[24px] border border-slate-200/80 bg-white/92 p-4 shadow-[0_22px_44px_-34px_rgba(15,23,42,0.28)]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#e0f2fe,#d1fae5)] text-sm font-semibold text-slate-900">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.ordersCount} commande(s) impliquee(s)
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    {item.unitsSold} unites
                  </span>
                </div>

                <div className="mt-3 h-2.5 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#1677ff,#11b8a5)]"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
