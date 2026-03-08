"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Menu, Store } from "lucide-react";

import AdminUserButton from "@/components/admin/AdminUserButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminSidebarItem } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";

type AdminHeaderProps = {
  items: AdminSidebarItem[];
  activeSection: string;
  displayName: string;
  pendingOrders: number;
  lowStockProducts: number;
  expiringPromoCodes: number;
  onOpenMobileMenu: () => void;
};

const alertCardClassName =
  "hidden min-w-[8.5rem] rounded-[20px] border px-3 py-2.5 text-left shadow-[0_20px_42px_-36px_rgba(15,23,42,0.35)] xl:block";

export default function AdminHeader({
  items,
  activeSection,
  displayName,
  pendingOrders,
  lowStockProducts,
  expiringPromoCodes,
  onOpenMobileMenu,
}: AdminHeaderProps) {
  const activeItem = items.find((item) => item.id === activeSection) || items[0];

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-[rgba(247,250,252,0.88)] backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6 lg:px-8">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Ouvrir le menu admin"
          className="rounded-2xl border-slate-200 bg-white/90 lg:hidden"
          onClick={onOpenMobileMenu}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-shop_light_green/15 text-shop_btn_dark_green hover:bg-shop_light_green/15">
              {activeItem.label}
            </Badge>
            <span className="hidden text-xs font-medium uppercase tracking-[0.22em] text-slate-400 sm:inline">
              Zayna Admin
            </span>
          </div>
          <div className="mt-2 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-950 md:text-[2rem]">
                {activeItem.label}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">
                {activeItem.description}
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-0">
              <Link
                href={activeItem.href}
                className="inline-flex items-center gap-2 rounded-2xl border border-shop_light_green/30 bg-white/90 px-3 py-2 text-sm font-semibold text-shop_btn_dark_green transition-colors hover:bg-shop_light_green/10"
              >
                Aller a la section
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-shop_btn_dark_green px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-shop_dark_green"
              >
                <Store className="h-4 w-4" />
                Boutique
              </Link>
            </div>
          </div>
        </div>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <div
            className={cn(
              alertCardClassName,
              "border-amber-200 bg-white text-amber-900",
              pendingOrders === 0 && "opacity-75"
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700/70">
              A traiter
            </p>
            <p className="mt-1 text-lg font-semibold">{pendingOrders}</p>
          </div>
          <div
            className={cn(
              alertCardClassName,
              "border-emerald-200 bg-white text-emerald-900",
              lowStockProducts === 0 && "opacity-75"
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/70">
              Stock faible
            </p>
            <p className="mt-1 text-lg font-semibold">{lowStockProducts}</p>
          </div>
          <div
            className={cn(
              alertCardClassName,
              "border-rose-200 bg-white text-rose-900",
              expiringPromoCodes === 0 && "opacity-75"
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700/70">
              Promos a verifier
            </p>
            <p className="mt-1 text-lg font-semibold">{expiringPromoCodes}</p>
          </div>
          <div className="flex items-center gap-3 rounded-[22px] border border-white/80 bg-white/92 px-3 py-2 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.35)]">
            <div className="hidden text-right xl:block">
              <p className="text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500">Session admin active</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 p-1">
              <AdminUserButton size="md" />
            </div>
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-white/92 p-1 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.35)] lg:hidden">
          <AdminUserButton size="sm" />
        </div>
      </div>

      {(pendingOrders > 0 || lowStockProducts > 0 || expiringPromoCodes > 0) && (
        <div className="border-t border-white/60 bg-white/55 px-4 py-2 lg:hidden">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              {pendingOrders} a traiter
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
              {lowStockProducts} stock faible
            </span>
            <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-800 ring-1 ring-inset ring-rose-200">
              {expiringPromoCodes} promos proches
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
