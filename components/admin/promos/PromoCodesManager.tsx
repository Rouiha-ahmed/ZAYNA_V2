"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  TicketPercent,
} from "lucide-react";
import { useMemo, useState, useTransition, type FormEvent } from "react";

import {
  archivePromoCodeAction,
  duplicatePromoCodeAction,
  restorePromoCodeAction,
  setPromoActiveAction,
} from "@/app/admin/promos/actions";
import PromoCodeDrawer from "@/components/admin/promos/PromoCodeDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type {
  AdminPromoCodeItem,
  AdminPromoFilters,
  AdminPromoView,
} from "@/lib/promos/admin-data";
import { cn } from "@/lib/utils";

type PromoCodesData = {
  filters: AdminPromoFilters;
  metrics: Record<"total" | "active" | "expiring" | "scheduled" | "expired" | "inactive" | "attention" | "archived", number>;
  promoCodes: AdminPromoCodeItem[];
  selectedPromo: AdminPromoCodeItem | null;
  pagination: { currentPage: number; totalPages: number; pageSize: number; filteredCount: number };
};

const number = new Intl.NumberFormat("fr-MA");
const money = new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD", maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("fr-MA", { day: "numeric", month: "short", year: "numeric" });

const statusLabels = {
  ACTIVE: "Actif",
  EXPIRING_SOON: "Expire bientôt",
  SCHEDULED: "À venir",
  EXPIRED: "Expiré",
  INACTIVE: "Inactif",
  LIMIT_REACHED: "Limite atteinte",
  ARCHIVED: "Archivé",
} as const;

const statusTone = (status: AdminPromoCodeItem["status"]) => {
  if (status === "ACTIVE") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "EXPIRING_SOON" || status === "SCHEDULED") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (status === "EXPIRED" || status === "LIMIT_REACHED") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (status === "ARCHIVED") return "bg-violet-50 text-violet-700 ring-violet-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
};

function PromoStatusBadge({ status }: { status: AdminPromoCodeItem["status"] }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", statusTone(status))}>{statusLabels[status]}</span>;
}

const discountLabel = (promo: AdminPromoCodeItem) =>
  promo.discountType === "percentage"
    ? `-${number.format(promo.discountValue)} %`
    : `-${money.format(promo.discountValue)}`;

const validityLabel = (promo: AdminPromoCodeItem) => {
  if (promo.startsAt && promo.endsAt) return `${date.format(new Date(promo.startsAt))} → ${date.format(new Date(promo.endsAt))}`;
  if (promo.startsAt) return `Dès le ${date.format(new Date(promo.startsAt))}`;
  if (promo.endsAt) return `Jusqu’au ${date.format(new Date(promo.endsAt))}`;
  return "Sans échéance";
};

function PromoActions({
  promo,
  onEdit,
  onNotice,
}: {
  promo: AdminPromoCodeItem;
  onEdit: () => void;
  onNotice: (message: string, error?: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<{ success: boolean; message: string }>) => {
    startTransition(async () => {
      try {
        const response = await action();
        onNotice(response.message, !response.success);
        if (response.success) router.refresh();
      } catch (error) {
        onNotice(error instanceof Error ? error.message : "Action impossible.", true);
      }
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild><Button type="button" variant="outline" size="icon-sm" disabled={pending} className="rounded-xl" aria-label={`Actions pour ${promo.code}`}><MoreHorizontal className="h-4 w-4" /></Button></PopoverTrigger>
      <PopoverContent align="end" className="w-56 rounded-2xl p-2">
        {!promo.archivedAt ? <button type="button" onClick={onEdit} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><Pencil className="h-4 w-4" />Modifier</button> : null}
        {!promo.archivedAt ? <button type="button" onClick={() => run(() => duplicatePromoCodeAction(promo.id))} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" />Dupliquer</button> : null}
        {!promo.archivedAt ? <button type="button" onClick={() => run(() => setPromoActiveAction(promo.id, !promo.active))} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><Sparkles className="h-4 w-4" />{promo.active ? "Désactiver" : "Activer"}</button> : null}
        {promo.archivedAt ? (
          <button type="button" onClick={() => run(() => restorePromoCodeAction(promo.id))} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-violet-700 hover:bg-violet-50"><ArchiveRestore className="h-4 w-4" />Désarchiver</button>
        ) : (
          <button type="button" onClick={() => { if (window.confirm(`Archiver le code « ${promo.code} » ? Son historique sera conservé.`)) run(() => archivePromoCodeAction(promo.id)); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50"><Archive className="h-4 w-4" />Archiver</button>
        )}
      </PopoverContent>
    </Popover>
  );
}

const views: Array<{ value: AdminPromoView; label: string; metric: keyof PromoCodesData["metrics"] }> = [
  { value: "all", label: "Tous", metric: "total" },
  { value: "active", label: "Actifs", metric: "active" },
  { value: "scheduled", label: "À venir", metric: "scheduled" },
  { value: "expiring", label: "Expirent bientôt", metric: "expiring" },
  { value: "expired", label: "Expirés", metric: "expired" },
  { value: "inactive", label: "Inactifs", metric: "inactive" },
  { value: "attention", label: "À traiter", metric: "attention" },
  { value: "archived", label: "Archivés", metric: "archived" },
];

export default function PromoCodesManager({
  data,
  statusMessage,
  errorMessage,
}: {
  data: PromoCodesData;
  statusMessage?: string;
  errorMessage?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();
  const [query, setQuery] = useState(data.filters.query);
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);
  const drawer = searchParams.get("drawer");
  const selectedId = searchParams.get("promo");
  const selectedPromo = useMemo(() => {
    if (!selectedId) return null;
    return data.promoCodes.find((promo) => promo.id === selectedId) || (data.selectedPromo?.id === selectedId ? data.selectedPromo : null);
  }, [data.promoCodes, data.selectedPromo, selectedId]);
  const drawerOpen = drawer === "create" || drawer === "edit";

  const updateQuery = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(serializedSearchParams);
    next.delete("status");
    next.delete("error");
    next.delete("drawer");
    next.delete("promo");
    next.delete("page");
    for (const [key, value] of Object.entries(updates)) {
      if (!value || (key === "view" && value === "all") || (["type", "validity"].includes(key) && value === "all")) next.delete(key);
      else next.set(key, value);
    }
    router.push(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  };

  const openDrawer = (mode: "create" | "edit", promo?: AdminPromoCodeItem) => {
    const next = new URLSearchParams(serializedSearchParams);
    next.delete("status");
    next.delete("error");
    next.set("drawer", mode);
    if (promo) next.set("promo", promo.id); else next.delete("promo");
    window.history.pushState(null, "", `${pathname}?${next.toString()}`);
  };

  const closeDrawer = () => {
    const next = new URLSearchParams(serializedSearchParams);
    next.delete("drawer");
    next.delete("promo");
    window.history.replaceState(null, "", `${pathname}${next.size ? `?${next.toString()}` : ""}`);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    updateQuery({ q: query.trim() || null });
  };

  const pageHref = (page: number) => {
    const next = new URLSearchParams(serializedSearchParams);
    next.delete("drawer");
    next.delete("promo");
    if (page <= 1) next.delete("page"); else next.set("page", String(page));
    return `${pathname}${next.size ? `?${next.toString()}` : ""}`;
  };

  const exportParams = new URLSearchParams(serializedSearchParams);
  exportParams.delete("drawer");
  exportParams.delete("promo");
  exportParams.delete("page");
  const start = data.pagination.filteredCount ? (data.pagination.currentPage - 1) * data.pagination.pageSize + 1 : 0;
  const end = Math.min(data.pagination.currentPage * data.pagination.pageSize, data.pagination.filteredCount);
  const announce = (message: string, error = false) => setNotice({ message, error });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Gestion commerciale</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Codes promo</h1><p className="mt-2 text-sm text-slate-600">Créez, suivez et gérez les codes promotionnels de votre boutique.</p></div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="h-11 rounded-2xl bg-white"><a href={`/admin/promos/export${exportParams.size ? `?${exportParams.toString()}` : ""}`}><Download className="h-4 w-4" />Exporter</a></Button><Button type="button" onClick={() => openDrawer("create")} className="h-11 rounded-2xl bg-shop_btn_dark_green px-5 text-white hover:bg-shop_dark_green"><Plus className="h-4 w-4" />Ajouter un code promo</Button></div>
      </header>

      {statusMessage ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{statusMessage}</div> : null}
      {errorMessage ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{errorMessage}</div> : null}
      {notice ? <div role={notice.error ? "alert" : "status"} className={cn("rounded-2xl border px-4 py-3 text-sm", notice.error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>{notice.message}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Indicateurs codes promo">
        {([
          ["all", "total", "Total codes promo", TicketPercent, "bg-pink-50 text-pink-700"],
          ["active", "active", "Actifs", Sparkles, "bg-emerald-50 text-emerald-700"],
          ["expiring", "expiring", "Expirent bientôt", CalendarClock, "bg-amber-50 text-amber-700"],
          ["scheduled", "scheduled", "À venir", CalendarClock, "bg-blue-50 text-blue-700"],
          ["attention", "attention", "À traiter", ShieldAlert, "bg-rose-50 text-rose-700"],
        ] as const).map(([view, metric, label, Icon, tone]) => <button key={view} type="button" onClick={() => updateQuery({ view })} className={cn("rounded-[22px] border bg-white p-4 text-left shadow-[0_20px_55px_-44px_rgba(15,23,42,.4)] transition hover:-translate-y-0.5", data.filters.view === view ? "border-shop_btn_dark_green ring-2 ring-shop_light_green/20" : "border-slate-200")}><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{number.format(data.metrics[metric])}</p></div><span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", tone)}><Icon className="h-4 w-4" /></span></div></button>)}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_26px_80px_-56px_rgba(15,23,42,.42)]">
        <div className="border-b border-slate-200 px-4 pt-3">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Vues codes promo">{views.map((item) => <button key={item.value} type="button" onClick={() => updateQuery({ view: item.value })} aria-current={data.filters.view === item.value ? "page" : undefined} className={cn("whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold", data.filters.view === item.value ? "border-shop_btn_dark_green text-shop_btn_dark_green" : "border-transparent text-slate-500 hover:text-slate-800")}>{item.label}<span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{data.metrics[item.metric]}</span></button>)}</nav>
        </div>

        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[minmax(260px,1fr)_220px_220px]">
          <form onSubmit={submitSearch} className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un code promo…" className="h-11 rounded-2xl bg-slate-50 pl-11 pr-20" /><button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1.5 text-xs font-semibold text-shop_btn_dark_green hover:bg-white">Chercher</button></form>
          <select value={data.filters.type} onChange={(event) => updateQuery({ type: event.target.value })} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm"><option value="all">Tous les types</option><option value="percentage">Pourcentage</option><option value="fixed">Montant fixe</option></select>
          <select value={data.filters.validity} onChange={(event) => updateQuery({ validity: event.target.value })} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm"><option value="all">Toutes validités</option><option value="dated">Avec période</option><option value="no-end">Sans expiration</option></select>
        </div>

        {data.promoCodes.length ? <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-5 py-3">Code / campagne</th><th className="px-3 py-3">Remise</th><th className="px-3 py-3">Validité</th><th className="px-3 py-3">Utilisation</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Mise à jour</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-200">{data.promoCodes.map((promo) => <tr key={promo.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><button type="button" onClick={() => openDrawer("edit", promo)} disabled={Boolean(promo.archivedAt)} className="font-mono font-semibold text-blue-700 enabled:hover:underline disabled:text-slate-500">{promo.code}</button><p className="mt-1 max-w-52 truncate text-xs text-slate-500">{promo.title}</p></td><td className="px-3 py-4"><strong>{discountLabel(promo)}</strong><p className="mt-1 text-xs text-slate-500">Minimum {money.format(promo.minimumOrderAmount)}</p></td><td className="px-3 py-4 text-xs text-slate-600">{validityLabel(promo)}</td><td className="px-3 py-4"><span className="font-semibold text-slate-900">{number.format(promo.usedCount)}</span><span className="text-slate-400"> / {promo.usageLimit === null ? "∞" : number.format(promo.usageLimit)}</span></td><td className="px-3 py-4"><PromoStatusBadge status={promo.status} />{promo.status === "EXPIRING_SOON" && promo.endsAt ? <p className="mt-2 text-xs font-medium text-amber-700">Échéance {date.format(new Date(promo.endsAt))}</p> : null}</td><td className="px-3 py-4 text-xs text-slate-500">{date.format(new Date(promo.updatedAt))}</td><td className="px-5 py-4 text-right"><PromoActions promo={promo} onEdit={() => openDrawer("edit", promo)} onNotice={announce} /></td></tr>)}</tbody></table></div>
          <div className="divide-y divide-slate-200 md:hidden">{data.promoCodes.map((promo) => <article key={promo.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><button type="button" onClick={() => openDrawer("edit", promo)} disabled={Boolean(promo.archivedAt)} className="font-mono font-semibold text-blue-700 disabled:text-slate-500">{promo.code}</button><p className="mt-1 text-xs text-slate-500">{promo.title}</p></div><PromoActions promo={promo} onEdit={() => openDrawer("edit", promo)} onNotice={announce} /></div><div className="mt-3 flex items-center justify-between gap-3"><strong>{discountLabel(promo)}</strong><PromoStatusBadge status={promo.status} /></div><p className="mt-3 text-xs text-slate-500">{validityLabel(promo)} · {promo.usedCount} / {promo.usageLimit ?? "∞"} utilisation(s)</p></article>)}</div>
        </> : <div className="px-5 py-14 text-center"><TicketPercent className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-4 font-semibold text-slate-900">Aucun code promo pour le moment.</p><p className="mt-2 text-sm text-slate-500">Créez votre premier code pour proposer une remise à vos clients.</p><Button type="button" onClick={() => openDrawer("create")} className="mt-5 rounded-xl bg-shop_btn_dark_green text-white"><Plus className="h-4 w-4" />Ajouter un code promo</Button></div>}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>Affichage de {start} à {end} sur {data.pagination.filteredCount} codes</p><div className="flex items-center gap-2"><select value={data.pagination.pageSize} onChange={(event) => updateQuery({ pageSize: event.target.value })} className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs"><option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select><Button asChild variant="outline" size="icon-sm" className="rounded-xl"><Link href={pageHref(Math.max(1, data.pagination.currentPage - 1))} aria-disabled={data.pagination.currentPage <= 1}><ChevronLeft className="h-4 w-4" /></Link></Button><span className="rounded-xl bg-shop_btn_dark_green px-3 py-1.5 text-xs font-semibold text-white">{data.pagination.currentPage} / {data.pagination.totalPages}</span><Button asChild variant="outline" size="icon-sm" className="rounded-xl"><Link href={pageHref(Math.min(data.pagination.totalPages, data.pagination.currentPage + 1))} aria-disabled={data.pagination.currentPage >= data.pagination.totalPages}><ChevronRight className="h-4 w-4" /></Link></Button></div></div>
      </section>

      <PromoCodeDrawer key={`${drawer}-${selectedPromo?.id || "new"}`} open={drawerOpen} promo={drawer === "edit" ? selectedPromo : null} mode={drawer === "edit" ? "edit" : "create"} onOpenChange={(open) => !open && closeDrawer()} onSaved={(message) => { announce(message); router.refresh(); }} />
    </div>
  );
}
