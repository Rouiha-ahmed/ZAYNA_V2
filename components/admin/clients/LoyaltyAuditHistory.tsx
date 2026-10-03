import Link from "next/link";
import { History } from "lucide-react";

import type { getLoyaltyAuditHistory } from "@/lib/services/loyalty-audit";

type AuditItem = Awaited<ReturnType<typeof getLoyaltyAuditHistory>>[number];

const day = new Intl.DateTimeFormat("fr-MA", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const time = new Intl.DateTimeFormat("fr-MA", {
  hour: "2-digit",
  minute: "2-digit",
});

export default function LoyaltyAuditHistory({ items }: { items: AuditItem[] }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-[#0f1d42]">
        <History className="h-4 w-4" />
        Historique des modifications
      </h2>
      {items.length ? (
        <div className="mt-3 divide-y divide-slate-100">
          {items.map((item) => (
            <article key={item.id} className="py-4 first:pt-2">
              <p className="text-sm font-semibold leading-5 text-slate-900">{item.title}</p>
              {item.subject ? (
                <Link href={item.subject.href} className="mt-1 inline-flex text-xs font-semibold text-blue-700 hover:underline">
                  {item.subject.label} →
                </Link>
              ) : null}
              {item.details.length > 2 ? (
                <details className="mt-2 group">
                  <summary className="cursor-pointer list-none text-xs font-medium text-slate-600 hover:text-shop_btn_dark_green [&::-webkit-details-marker]:hidden">
                    {item.details.length} modifications · <span className="group-open:hidden">Voir les détails</span><span className="hidden group-open:inline">Masquer les détails</span>
                  </summary>
                  <ul className="mt-2 space-y-1.5 border-l-2 border-slate-100 pl-3">
                    {item.details.map((detail) => <li key={detail} className="text-xs leading-5 text-slate-600">{detail}</li>)}
                  </ul>
                </details>
              ) : item.details.length ? (
                <ul className="mt-2 space-y-1">
                  {item.details.map((detail) => <li key={detail} className="text-xs leading-5 text-slate-600">{detail}</li>)}
                </ul>
              ) : null}
              <p className="mt-2 text-[11px] text-slate-400">
                {item.actor} · {day.format(item.createdAt)} à {time.format(item.createdAt)}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Aucune modification enregistrée.</p>
      )}
    </section>
  );
}
