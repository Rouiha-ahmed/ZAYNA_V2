"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar, { buildAdminSidebarItems } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  displayName: string;
  email: string | null;
  pendingOrders: number;
  lowStockProducts: number;
  expiringPromoCodes: number;
  children: ReactNode;
};

const expandedPaddingClass = "lg:pl-[17.5rem]";
const collapsedPaddingClass = "lg:pl-[6.5rem]";

export default function AdminShell({
  displayName,
  email,
  pendingOrders,
  lowStockProducts,
  expiringPromoCodes,
  children,
}: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const items = useMemo(
    () =>
      buildAdminSidebarItems({
        pendingOrders,
        expiringPromoCodes,
      }),
    [expiringPromoCodes, pendingOrders]
  );

  useEffect(() => {
    const sectionIds = items.map((item) => item.id);
    const updateFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && sectionIds.includes(hash)) {
        setActiveSection(hash);
      }
    };

    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) {
      return () => window.removeEventListener("hashchange", updateFromHash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries[0]?.target?.id) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.15, 0.35, 0.55],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("hashchange", updateFromHash);
      observer.disconnect();
    };
  }, [items]);

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(77, 182, 198, 0.16), transparent 28%), linear-gradient(180deg, #f7fafc 0%, #edf5f7 45%, #f5f7f8 100%)",
      }}
    >
      <AdminSidebar
        items={items}
        activeSection={activeSection}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        displayName={displayName}
        email={email}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
        onMobileOpenChange={setMobileOpen}
      />

      <div
        className={cn(
          "min-h-screen transition-[padding] duration-300 ease-out",
          expandedPaddingClass,
          collapsed && collapsedPaddingClass
        )}
      >
        <AdminHeader
          items={items}
          activeSection={activeSection}
          displayName={displayName}
          pendingOrders={pendingOrders}
          lowStockProducts={lowStockProducts}
          expiringPromoCodes={expiringPromoCodes}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="px-4 pb-8 pt-6 md:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
