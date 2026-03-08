import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, Layers3, Package2, Percent, ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getAdminIdentity } from "@/lib/admin";

const adminSections = [
  { href: "/admin#dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin#orders", label: "Commandes", icon: ShoppingBag },
  { href: "/admin#products", label: "Produits", icon: Package2 },
  { href: "/admin#categories", label: "Categories", icon: Layers3 },
  { href: "/admin#brands", label: "Marques", icon: Store },
  { href: "/admin#promos", label: "Codes promo", icon: Percent },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const identity = await getAdminIdentity();

  if (!identity.userId) {
    redirect("/");
  }

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(77, 182, 198, 0.16), transparent 28%), linear-gradient(180deg, #f7fafc 0%, #edf5f7 45%, #f5f7f8 100%)",
      }}
    >
      <div className="mx-auto flex max-w-[1700px] gap-6 px-4 py-4 md:px-6 lg:px-8">
        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-4 space-y-4">
            <div className="overflow-hidden rounded-[28px] border border-shop_light_green/20 bg-[#102654] text-white shadow-[0_28px_80px_-42px_rgba(16,38,84,0.85)]">
              <div
                className="p-6"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, rgba(77, 182, 198, 0.28), transparent 55%), linear-gradient(180deg, #17336f 0%, #102654 100%)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                    <ShieldCheck className="h-6 w-6 text-shop_light_green" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/65">
                      Espace Admin
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                      Zayna Control Room
                    </h1>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-white/75">
                  Suivez vos ventes, alimentez votre catalogue et gardez les promotions
                  sous controle sans quitter l&apos;application.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge className="bg-white/10 text-white hover:bg-white/10">
                    {identity.displayName || identity.email || "Admin"}
                  </Badge>
                  {identity.email && (
                    <Badge className="bg-shop_light_green/20 text-shop_light_green hover:bg-shop_light_green/20">
                      {identity.email}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_28px_80px_-52px_rgba(16,38,84,0.35)] backdrop-blur">
              <p className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-shop_btn_dark_green/60">
                Navigation
              </p>
              <nav className="mt-3 space-y-1">
                {adminSections.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-shop_light_green/10 hover:text-shop_btn_dark_green"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-shop_light_green/10 text-shop_btn_dark_green">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[0_28px_80px_-52px_rgba(16,38,84,0.35)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-shop_btn_dark_green">
                    Retour boutique
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Ouvrez la vitrine publique pour verifier le rendu des changements.
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-shop_light_green/30 bg-shop_light_green/10 text-shop_btn_dark_green transition-colors hover:bg-shop_light_green/20"
                >
                  <Store className="h-4.5 w-4.5" />
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="rounded-[30px] border border-white/70 bg-white/80 p-4 shadow-[0_32px_90px_-58px_rgba(16,38,84,0.45)] backdrop-blur md:p-6">
            {!identity.isAdmin ? (
              <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-[28px] border border-amber-200 bg-amber-50/90 p-8 text-shop_btn_dark_green">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-amber-700/70">
                      Acces refuse
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold">
                      Votre compte n&apos;est pas encore autorise pour l&apos;admin.
                    </h2>
                  </div>
                </div>

                <div className="space-y-3 text-sm leading-6 text-slate-700">
                  <p>
                    Ajoutez votre email Clerk dans `ADMIN_EMAILS` ou votre identifiant
                    Clerk dans `ADMIN_USER_IDS` dans le fichier `.env`.
                  </p>
                  <p>
                    Exemple: <code>ADMIN_EMAILS=&quot;admin@example.com&quot;</code> ou{" "}
                    <code>ADMIN_USER_IDS=&quot;user_123&quot;</code>.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-2xl bg-shop_btn_dark_green px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-shop_dark_green"
                  >
                    Retour a la boutique
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {identity.usesDevelopmentFallback && (
                  <div className="mb-6 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Acces admin actif en mode developpement car `ADMIN_EMAILS` et
                    `ADMIN_USER_IDS` ne sont pas definis. Configurez-les avant toute
                    mise en production.
                  </div>
                )}
                {children}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
