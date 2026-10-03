import Link from "next/link";
import { Clock3, Layers3, Package2, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminSurfaceClassName } from "@/components/admin/AdminPagePrimitives";
import AdminResetDataButton from "./AdminResetDataButton";

const shortcuts = [
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
    href: "/admin/promos?drawer=create",
    label: "Promotions",
    description: "Lancer une offre rapide",
    icon: Percent,
  },
] as const;

export default function AdminShortcutsCard() {
  return (
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
        {shortcuts.map((action) => {
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

      <div className="mt-4">
        <AdminResetDataButton />
      </div>
    </div>
  );
}
