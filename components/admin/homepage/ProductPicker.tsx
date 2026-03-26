"use client";

import { useMemo, useState } from "react";

type ProductPickerProps = {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  }>;
  selectedIds: string[];
  onChange: (next: string[]) => void;
};

export default function ProductPicker({
  products,
  selectedIds,
  onChange,
}: ProductPickerProps) {
  const [search, setSearch] = useState("");
  const byId = useMemo(
    () =>
      new Map(
        products.map((product) => [product.id, product] as const)
      ),
    [products]
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) =>
      `${product.name} ${product.slug}`.toLowerCase().includes(normalizedSearch)
    );
  }, [products, search]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedProducts = useMemo(
    () =>
      selectedIds
        .map((id) => byId.get(id))
        .filter((item): item is ProductPickerProps["products"][number] => Boolean(item)),
    [byId, selectedIds]
  );

  const addProduct = (id: string) => {
    if (selectedSet.has(id)) {
      return;
    }
    onChange([...selectedIds, id]);
  };

  const removeProduct = (id: string) => {
    onChange(selectedIds.filter((productId) => productId !== id));
  };

  const moveProduct = (id: string, direction: "up" | "down") => {
    const index = selectedIds.findIndex((item) => item === id);
    if (index < 0) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedIds.length) {
      return;
    }

    const next = [...selectedIds];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Produits selectionnes ({selectedProducts.length})
        </p>

        {selectedProducts.length ? (
          <div className="space-y-2">
            {selectedProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="w-6 text-xs font-semibold text-slate-500">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-slate-800">{product.name}</span>
                <button
                  type="button"
                  onClick={() => moveProduct(product.id, "up")}
                  disabled={index === 0}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Monter ${product.name}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveProduct(product.id, "down")}
                  disabled={index === selectedProducts.length - 1}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Descendre ${product.name}`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Aucun produit selectionne pour le moment.
          </p>
        )}
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher un produit..."
        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-shop_btn_dark_green focus:ring-4 focus:ring-shop_light_green/15"
      />

      <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
        {filtered.length ? (
          filtered.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-xl border border-transparent bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:border-shop_btn_dark_green/20"
            >
              <span className="min-w-0 flex-1 truncate">{product.name}</span>
              {!product.isActive ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  Inactif
                </span>
              ) : null}
              {selectedSet.has(product.id) ? (
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700"
                >
                  Retirer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => addProduct(product.id)}
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"
                >
                  Ajouter
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="px-2 py-2 text-xs text-slate-500">Aucun produit trouve.</p>
        )}
      </div>
    </div>
  );
}
