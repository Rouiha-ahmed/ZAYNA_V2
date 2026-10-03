import PromoCodesManager from "@/components/admin/promos/PromoCodesManager";
import {
  getAdminPromoCodesData,
  parseAdminPromoFilters,
} from "@/lib/promos/admin-data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const firstParam = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string
) => {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
};

export default async function AdminPromosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filters = parseAdminPromoFilters(params);
  const data = await getAdminPromoCodesData(filters, firstParam(params, "promo"));

  return (
    <PromoCodesManager
      data={data}
      statusMessage={firstParam(params, "status")}
      errorMessage={firstParam(params, "error")}
    />
  );
}
