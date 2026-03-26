"use client";

import { useMemo, useState } from "react";

import AdminSubmitButton from "@/components/admin/AdminSubmitButton";
import { Field } from "@/components/admin/AdminPagePrimitives";
import ProductPicker from "@/components/admin/homepage/ProductPicker";
import type { AdminHomepageProductSection } from "@/lib/admin-homepage-product-sections";

type HomepageProductSectionFormProps = {
  mode: "create" | "edit";
  section?: AdminHomepageProductSection;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  }>;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  pendingLabel: string;
};

export default function HomepageProductSectionForm({
  mode,
  section,
  products,
  action,
  submitLabel,
  pendingLabel,
}: HomepageProductSectionFormProps) {
  const [productIds, setProductIds] = useState<string[]>(section?.productIds || []);
  const productIdsJson = useMemo(() => JSON.stringify(productIds), [productIds]);
  const defaultOrderValue = section?.order ?? 35;

  return (
    <form action={action} className="space-y-5">
      {section ? <input type="hidden" name="id" value={section.id} /> : null}
      <input type="hidden" name="productIdsJson" value={productIdsJson} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Titre">
          <input
            name="title"
            defaultValue={section?.title || ""}
            placeholder="Nos coups de coeur"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-shop_btn_dark_green focus:ring-4 focus:ring-shop_light_green/15"
          />
        </Field>

        <Field label="Slug / key">
          <input
            name="slug"
            defaultValue={section?.slug || ""}
            placeholder="nos-coups-de-coeur"
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-shop_btn_dark_green focus:ring-4 focus:ring-shop_light_green/15"
          />
        </Field>
      </div>

      <Field label="Sous-titre">
        <textarea
          name="subtitle"
          defaultValue={section?.subtitle || ""}
          className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-shop_btn_dark_green focus:ring-4 focus:ring-shop_light_green/15"
        />
      </Field>

      <Field label="Ordre">
        <input
          type="number"
          name="order"
          min={0}
          max={500}
          defaultValue={defaultOrderValue}
          className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-shop_btn_dark_green focus:ring-4 focus:ring-shop_light_green/15"
        />
      </Field>

      <Field label="Produits">
        <ProductPicker products={products} selectedIds={productIds} onChange={setProductIds} />
      </Field>

      <label className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={section?.isActive ?? true}
          className="h-4 w-4 rounded border-slate-300 text-shop_btn_dark_green"
        />
        Section active
      </label>

      <AdminSubmitButton
        pendingLabel={pendingLabel}
        className="h-11 rounded-2xl bg-shop_btn_dark_green px-6 text-white hover:bg-shop_dark_green"
      >
        {submitLabel}
      </AdminSubmitButton>

      {mode === "create" ? (
        <p className="text-xs text-slate-500">
          Astuce: utilisez un slug stable pour retrouver facilement cette section.
        </p>
      ) : null}
    </form>
  );
}
