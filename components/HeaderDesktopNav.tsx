"use client";

import { cn } from "@/lib/utils";
import { ClerkLoaded, SignedIn, UserButton, useAuth } from "@clerk/nextjs";
import { LayoutDashboard, Logs } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import CartIcon from "./CartIcon";
import FavoriteButton from "./FavoriteButton";
import HeaderMenu from "./HeaderMenu";
import SearchBar from "./SearchBar";
import SignIn from "./SignIn";

const smoothTransition =
  "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

type NavigationContext = {
  ordersCount: number;
  isAdmin: boolean;
};

const HeaderDesktopNav = () => {
  const { isLoaded, userId } = useAuth();
  const [isSearchActive, setIsSearchActive] = useState(false);
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

  const isSignedIn = Boolean(userId);
  const { ordersCount, isAdmin } = navigationContext;

  return (
    <>
      <div
        className={cn(
          "hidden min-w-0 lg:flex lg:items-center lg:justify-center",
          smoothTransition,
          isSearchActive ? "-translate-x-5 xl:-translate-x-8" : "translate-x-0"
        )}
      >
        <HeaderMenu
          isSearchActive={isSearchActive}
          className={cn(smoothTransition, isSearchActive && "opacity-90")}
        />
      </div>

      <div
        className={cn(
          "hidden lg:flex lg:items-center lg:justify-end",
          smoothTransition,
          isSearchActive ? "translate-x-1.5" : "translate-x-0"
        )}
      >
        <div
          className={cn(
            "inline-flex items-center rounded-full border border-shop_light_green/30 bg-white/80 p-1.5 shadow-[0_14px_32px_-28px_rgba(22,46,110,1)] backdrop-blur-md",
            smoothTransition,
            isSearchActive &&
              "border-shop_dark_green/35 shadow-[0_20px_38px_-28px_rgba(22,46,110,1)]"
          )}
        >
          <SearchBar
            mode="desktop"
            onDesktopActiveChange={setIsSearchActive}
            className="mr-1"
          />

          <div
            className={cn(
              "flex items-center gap-2.5 xl:gap-3.5",
              smoothTransition,
              isSearchActive ? "translate-x-1.5" : "translate-x-0"
            )}
          >
            <CartIcon />
            <FavoriteButton />

            {isAdmin && (
              <Link
                href="/admin"
                className="group inline-flex h-9 items-center gap-2 rounded-full border border-shop_light_green/30 bg-white/90 px-3 text-sm font-medium text-lightColor shadow-[0_10px_24px_-20px_rgba(22,46,110,0.9)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-shop_light_green/70 hover:text-shop_dark_green"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden xl:inline">Admin</span>
              </Link>
            )}

            {isSignedIn && (
              <Link
                href={"/orders"}
                className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-shop_light_green/30 bg-white/90 text-lightColor shadow-[0_10px_24px_-20px_rgba(22,46,110,0.9)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-shop_light_green/70 hover:text-shop_dark_green"
              >
                <Logs className="h-4.5 w-4.5" />
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-shop_btn_dark_green px-1 text-[10px] font-semibold text-white">
                  {ordersCount}
                </span>
              </Link>
            )}

            <ClerkLoaded>
              <SignedIn>
                <div className="pl-0.5">
                  <UserButton />
                </div>
              </SignedIn>
              {!isSignedIn && <SignIn className="px-3.5" />}
            </ClerkLoaded>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 lg:hidden">
        <SearchBar mode="mobile" />
        <CartIcon className="h-8 w-8" iconClassName="h-4 w-4" />
        <FavoriteButton className="h-8 w-8" iconClassName="h-4 w-4" />

        {isAdmin && (
          <Link
            href="/admin"
            className="group inline-flex h-8 w-8 items-center justify-center rounded-full border border-shop_light_green/35 bg-white/90 text-lightColor"
          >
            <LayoutDashboard className="h-4 w-4 transition-colors duration-300 group-hover:text-shop_dark_green" />
          </Link>
        )}

        {isSignedIn && (
          <Link
            href={"/orders"}
            className="group relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-shop_light_green/35 bg-white/90 text-lightColor"
          >
            <Logs className="h-4 w-4 transition-colors duration-300 group-hover:text-shop_dark_green" />
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-shop_btn_dark_green px-1 text-[10px] font-semibold text-white">
              {ordersCount}
            </span>
          </Link>
        )}

        <ClerkLoaded>
          <SignedIn>
            <UserButton />
          </SignedIn>
          {!isSignedIn && <SignIn className="h-8 px-3 py-1 text-xs" />}
        </ClerkLoaded>
      </div>
    </>
  );
};

export default HeaderDesktopNav;
