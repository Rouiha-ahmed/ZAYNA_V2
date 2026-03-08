import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { getAdminIdentity, getAdminShellMetrics } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const identity = await getAdminIdentity();

  if (!identity.userId) {
    redirect("/");
  }

  if (!identity.isAdmin) {
    return (
      <div
        className="min-h-screen px-4 py-8 text-slate-900 md:px-6 lg:px-8"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(77, 182, 198, 0.16), transparent 28%), linear-gradient(180deg, #f7fafc 0%, #edf5f7 45%, #f5f7f8 100%)",
        }}
      >
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
          <div className="flex w-full flex-col gap-6 rounded-[30px] border border-amber-200 bg-amber-50/95 p-8 text-shop_btn_dark_green shadow-[0_30px_90px_-58px_rgba(16,38,84,0.4)]">
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
        </div>
      </div>
    );
  }

  const shellMetrics = await getAdminShellMetrics();

  return (
    <AdminShell
      displayName={identity.displayName || identity.email || "Admin"}
      email={identity.email}
      pendingOrders={shellMetrics.pendingOrders}
      lowStockProducts={shellMetrics.lowStockProducts}
      expiringPromoCodes={shellMetrics.expiringPromoCodes}
    >
      <div className="space-y-6">
        {identity.usesDevelopmentFallback ? (
          <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-[0_20px_44px_-34px_rgba(245,158,11,0.55)]">
            Acces admin actif en mode developpement car `ADMIN_EMAILS` et
            `ADMIN_USER_IDS` ne sont pas definis. Configurez-les avant toute
            mise en production.
          </div>
        ) : null}
        {children}
      </div>
    </AdminShell>
  );
}
