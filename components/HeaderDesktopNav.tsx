"use client";

import { useHydrated } from "@/hooks";
import { UserButton, useAuth } from "@clerk/nextjs";
import { LayoutDashboard, Logs } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import CartIcon from "./CartIcon";
import FavoriteButton from "./FavoriteButton";
import SearchBar from "./SearchBar";
import SignIn from "./SignIn";

type NavigationContext = {
  ordersCount: number;
  isAdmin: boolean;
};

const iconButtonClassName =
  "group relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-shop_light_green/25 bg-white text-lightColor shadow-[0_10px_20px_-18px_rgba(22,46,110,0.5)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-shop_light_green/65 hover:text-shop_dark_green";

const HeaderDesktopNav = () => {
  const { isLoaded, userId } = useAuth();
  const mounted = useHydrated();
  const [navigationContext, setNavigationContext] = useState<NavigationContext>({
    ordersCount: 0,
    isAdmin: false,
  });

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!userId) {
      setNavigationContext({
        ordersCount: 0,
        isAdmin: false,
      });
      return;
    }

    let cancelled = false;

    const loadNavigationContext = async () => {
      try {
        const response = await fetch("/api/navigation", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch navigation context: ${response.status}`);
        }

        const data = (await response.json()) as NavigationContext;

        if (!cancelled) {
          setNavigationContext({
            ordersCount: data.ordersCount || 0,
            isAdmin: Boolean(data.isAdmin),
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load navigation context:", error);
          setNavigationContext({
            ordersCount: 0,
            isAdmin: false,
          });
        }
      }
    };

    loadNavigationContext();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);

  const isAuthReady = mounted && isLoaded;
  const isSignedIn = isAuthReady && Boolean(userId);
  const { ordersCount, isAdmin } = navigationContext;

  return (
    <>
      <div className="hidden items-center gap-2 lg:flex">
        <CartIcon className={iconButtonClassName} iconClassName="h-4.5 w-4.5" />
        <FavoriteButton className={iconButtonClassName} iconClassName="h-4.5 w-4.5" />

        {isSignedIn ? (
          <Link href="/orders" className={iconButtonClassName}>
            <Logs className="h-4.5 w-4.5" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-shop_btn_dark_green px-1 text-[10px] font-semibold text-white">
              {ordersCount}
            </span>
          </Link>
        ) : null}

        {isAdmin ? (
          <Link
            href="/admin"
            className="group inline-flex h-10 items-center gap-2 rounded-lg border border-shop_light_green/25 bg-white px-3 text-sm font-semibold text-shop_dark_green shadow-[0_10px_20px_-18px_rgba(22,46,110,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:border-shop_light_green/70"
          >
            <LayoutDashboard className="h-4 w-4" />
            Admin
          </Link>
        ) : null}

        {isAuthReady ? (
          isSignedIn ? (
            <div className="ml-1 rounded-lg border border-shop_light_green/20 bg-white p-1 shadow-[0_10px_20px_-18px_rgba(22,46,110,0.5)]">
              <UserButton />
            </div>
          ) : (
            <SignIn className="h-10 rounded-lg border border-shop_light_green/25 bg-white px-3 text-sm font-semibold text-shop_dark_green shadow-[0_10px_20px_-18px_rgba(22,46,110,0.5)]" />
          )
        ) : (
          <div className="h-10 w-24 rounded-lg border border-shop_light_green/20 bg-white/75" />
        )}
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <SearchBar mode="mobile" />
        <CartIcon className="h-9 w-9 rounded-xl" iconClassName="h-4 w-4" />
        <FavoriteButton className="h-9 w-9 rounded-xl" iconClassName="h-4 w-4" />

        {isAdmin ? (
          <Link
            href="/admin"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-shop_light_green/35 bg-white/90 text-lightColor"
          >
            <LayoutDashboard className="h-4 w-4" />
          </Link>
        ) : null}

        {isSignedIn ? (
          <Link
            href="/orders"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-shop_light_green/35 bg-white/90 text-lightColor"
          >
            <Logs className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-shop_btn_dark_green px-1 text-[10px] font-semibold text-white">
              {ordersCount}
            </span>
          </Link>
        ) : null}

        {isAuthReady ? (
          isSignedIn ? (
            <UserButton />
          ) : (
            <SignIn className="h-9 rounded-xl px-3 py-1 text-xs" />
          )
        ) : (
          <div className="h-9 w-9 rounded-xl border border-shop_light_green/20 bg-white/70" />
        )}
      </div>
    </>
  );
};

export default HeaderDesktopNav;
