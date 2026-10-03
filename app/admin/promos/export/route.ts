import { NextResponse } from "next/server";

import {
  getPromoCodesForExport,
  parseAdminPromoFilters,
} from "@/lib/promos/admin-data";

const csvCell = (value: string | number) => {
  let safe = String(value);
  if (/^[=+\-@]/.test(safe)) safe = `'${safe}`;
  return `"${safe.replaceAll('"', '""')}"`;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = parseAdminPromoFilters(
    Object.fromEntries(url.searchParams.entries())
  );
  const promos = await getPromoCodesForExport(filters);
  const rows: Array<Array<string | number>> = [
    ["Code", "Campagne", "Type", "Valeur", "Minimum commande", "Début", "Fin", "Utilisations", "Limite", "Statut", "Mise à jour"],
    ...promos.map((promo) => [
      promo.code,
      promo.title,
      promo.discountType,
      promo.discountValue,
      promo.minimumOrderAmount,
      promo.startsAt || "",
      promo.endsAt || "",
      promo.usedCount,
      promo.usageLimit ?? "",
      promo.status,
      promo.updatedAt,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="codes-promo-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
