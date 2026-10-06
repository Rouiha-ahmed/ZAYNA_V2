"use client";
import { BRANDS_QUERYResult, Category, Product } from "@/types";
import { startTransition, useCallback, useEffect, useRef, useState, useTransition } from "react";
import Container from "./Container";
import Title from "./Title";
import CategoryList from "./shop/CategoryList";
import BrandList from "./shop/BrandList";
import PriceList from "./shop/PriceList";
import SortSelect from "./shop/SortSelect";
import { Loader2 } from "lucide-react";
import NoProductAvailable from "./NoProductAvailable";
import ProductCard from "./ProductCard";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import type { SortOption } from "@/lib/queries";

interface Props {
  categories: Category[];
  brands: BRANDS_QUERYResult;
  initialProducts: Product[];
  initialSelectedCategory?: string | null;
  initialSelectedBrand?: string | null;
  initialSelectedPrice?: string | null;
  initialSearchTerm?: string;
}

const PAGE_SIZE = 60;

const getShopCacheKey = ({
  selectedCategories,
  selectedBrands,
  selectedPrice,
  searchTerm,
  sortBy,
}: {
  selectedCategories: string[];
  selectedBrands: string[];
  selectedPrice?: string | null;
  searchTerm?: string;
  sortBy?: SortOption;
}) =>
  JSON.stringify({
    selectedCategories: [...selectedCategories].sort(),
    selectedBrands: [...selectedBrands].sort(),
    selectedPrice: selectedPrice || "",
    searchTerm: searchTerm || "",
    sortBy: sortBy || "relevance",
  });

const parsePriceRange = (selectedPrice: string | null) => {
  if (!selectedPrice) return { minPrice: null, maxPrice: null };
  const [min, max] = selectedPrice.split("-").map(Number);
  return {
    minPrice: Number.isFinite(min) ? min : null,
    maxPrice: Number.isFinite(max) ? max : null,
  };
};

const Shop = ({
  categories,
  brands,
  initialProducts,
  initialSelectedCategory = null,
  initialSelectedBrand = null,
  initialSelectedPrice = null,
  initialSearchTerm = "",
}: Props) => {
  const [isFilterPending, startFilterTransition] = useTransition();
  const searchTerm = initialSearchTerm.trim();

  const initCategories = initialSelectedCategory ? [initialSelectedCategory] : [];
  const initBrands = initialSelectedBrand ? [initialSelectedBrand] : [];

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initCategories);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initBrands);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(initialSelectedPrice);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  const initialCacheKey = getShopCacheKey({
    selectedCategories: initCategories,
    selectedBrands: initBrands,
    selectedPrice: initialSelectedPrice,
    searchTerm,
    sortBy: "relevance",
  });
  const cacheRef = useRef(new Map<string, Product[]>([[initialCacheKey, initialProducts]]));
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length === PAGE_SIZE);
  const requestIdRef = useRef(0);

  const cacheKey = getShopCacheKey({ selectedCategories, selectedBrands, selectedPrice, searchTerm, sortBy });

  useEffect(() => {
    setSelectedCategories(initialSelectedCategory ? [initialSelectedCategory] : []);
  }, [initialSelectedCategory]);
  useEffect(() => {
    setSelectedBrands(initialSelectedBrand ? [initialSelectedBrand] : []);
  }, [initialSelectedBrand]);
  useEffect(() => { setSelectedPrice(initialSelectedPrice); }, [initialSelectedPrice]);

  useEffect(() => {
    cacheRef.current.set(initialCacheKey, initialProducts);
    setProducts(initialProducts);
    setHasMore(initialProducts.length === PAGE_SIZE);
    setLoading(false);
  }, [initialCacheKey, initialProducts]);

  const fetchProducts = useCallback(async () => {
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setProducts(cached);
      setHasMore(cached.length === PAGE_SIZE);
      setLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);

    try {
      const { minPrice, maxPrice } = parsePriceRange(selectedPrice);
      const params = new URLSearchParams();
      if (selectedCategories.length) params.set("categories", selectedCategories.join(","));
      if (selectedBrands.length) params.set("brands", selectedBrands.join(","));
      if (searchTerm) params.set("q", searchTerm);
      if (sortBy && sortBy !== "relevance") params.set("sort", sortBy);
      params.set("limit", String(PAGE_SIZE));
      params.set("page", "0");
      if (minPrice !== null && maxPrice !== null) {
        params.set("minPrice", String(minPrice));
        params.set("maxPrice", String(maxPrice));
      }

      const data = await fetchWithRetry(
        async () => {
          const res = await fetch(`/api/products/search?${params.toString()}`);
          if (!res.ok) throw new Error(`Failed: ${res.status}`);
          return (await res.json()) as Product[];
        },
        { retries: 1, retryDelayMs: 400 }
      );

      if (requestIdRef.current === requestId) {
        cacheRef.current.set(cacheKey, data || []);
        setProducts(data || []);
        setHasMore((data || []).length === PAGE_SIZE);
      }
    } catch (error) {
      if (requestIdRef.current === requestId) {
        console.error("Shop fetch error", error);
        setProducts([]);
      }
    } finally {
      if (requestIdRef.current === requestId) setLoading(false);
    }
  }, [cacheKey, searchTerm, selectedBrands, selectedCategories, selectedPrice, sortBy]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { minPrice, maxPrice } = parsePriceRange(selectedPrice);
      const params = new URLSearchParams();
      if (selectedCategories.length) params.set("categories", selectedCategories.join(","));
      if (selectedBrands.length) params.set("brands", selectedBrands.join(","));
      if (searchTerm) params.set("q", searchTerm);
      if (sortBy && sortBy !== "relevance") params.set("sort", sortBy);
      if (minPrice !== null && maxPrice !== null) {
        params.set("minPrice", String(minPrice));
        params.set("maxPrice", String(maxPrice));
      }
      params.set("limit", String(PAGE_SIZE));
      params.set("page", String(Math.floor(products.length / PAGE_SIZE)));
      const response = await fetch(`/api/products/search?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const nextProducts = (await response.json()) as Product[];
      setProducts((current) => [...current, ...nextProducts]);
      setHasMore(nextProducts.length === PAGE_SIZE);
    } catch (error) {
      console.error("Shop pagination error", error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, products.length, searchTerm, selectedBrands, selectedCategories, selectedPrice, sortBy]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleCategory = (slug: string) => {
    startFilterTransition(() => {
      setSelectedCategories((prev) =>
        prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      );
    });
  };

  const toggleBrand = (slug: string) => {
    startFilterTransition(() => {
      setSelectedBrands((prev) =>
        prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
      );
    });
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedPrice !== null ||
    !!searchTerm;

  const showInitialLoader = loading && !products.length;
  const showInlineLoading = (loading || isFilterPending) && products.length > 0;

  const activeBadges = [
    ...selectedCategories.map((s) => ({
      label: categories.find((c) => c.slug?.current === s)?.title || s,
      onRemove: () => startFilterTransition(() => setSelectedCategories((p) => p.filter((x) => x !== s))),
    })),
    ...selectedBrands.map((s) => ({
      label: brands.find((b) => b.slug?.current === s)?.title || s,
      onRemove: () => startFilterTransition(() => setSelectedBrands((p) => p.filter((x) => x !== s))),
    })),
  ];

  return (
    <div className="border-t border-shop_light_green/15">
      <Container className="mt-5">
        {/* Header row */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Title className="text-lg uppercase tracking-wide">
            Trouvez les produits selon vos besoins
          </Title>
          {hasActiveFilters && (
            <button
              onClick={() => {
                startTransition(() => {
                  setSelectedCategories([]);
                  setSelectedBrands([]);
                  setSelectedPrice(null);
                });
              }}
              className="text-sm font-medium text-shop_dark_green underline underline-offset-2 hover:text-shop_btn_dark_green"
            >
              Reinitialiser les filtres
            </button>
          )}
        </div>

        {/* Active filter badges */}
        {activeBadges.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeBadges.map((badge) => (
              <span
                key={badge.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-shop_light_green/30 bg-shop_btn_dark_green/8 px-3 py-1 text-xs font-semibold text-shop_btn_dark_green"
              >
                {badge.label}
                <button
                  onClick={badge.onRemove}
                  className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-shop_btn_dark_green/15 hover:bg-shop_btn_dark_green/30"
                >
                  <svg viewBox="0 0 8 8" className="h-2 w-2 stroke-shop_btn_dark_green stroke-2">
                    <line x1="1" y1="1" x2="7" y2="7" /><line x1="7" y1="1" x2="1" y2="7" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-5 border-t border-shop_light_green/15 md:flex-row">
          {/* Sidebar */}
          <aside className="min-w-0 pb-5 md:w-60 md:shrink-0 md:border-r md:border-shop_light_green/20">
            <CategoryList
              categories={categories}
              selectedCategories={selectedCategories}
              onToggle={toggleCategory}
              onReset={() => startFilterTransition(() => setSelectedCategories([]))}
            />
            <BrandList
              brands={brands}
              selectedBrands={selectedBrands}
              onToggle={toggleBrand}
              onReset={() => startFilterTransition(() => setSelectedBrands([]))}
            />
            <PriceList
              setSelectedPrice={(v) => startFilterTransition(() => setSelectedPrice(v))}
              selectedPrice={selectedPrice}
            />
          </aside>

          {/* Products */}
          <div className="min-w-0 flex-1 pt-5">
            <div className="mb-3">
              <SortSelect
                value={sortBy}
                onChange={(v) => startFilterTransition(() => setSortBy(v))}
                total={products.length}
              />
            </div>
            <div className="relative min-w-0 pr-2">
              {showInitialLoader ? (
                <div className="flex flex-col items-center justify-center gap-3 p-20">
                  <Loader2 className="h-10 w-10 animate-spin text-shop_light_green" />
                  <p className="font-semibold tracking-wide text-shop_dark_green">
                    Chargement des produits...
                  </p>
                </div>
              ) : products.length > 0 ? (
                <>
                  {showInlineLoading && (
                    <div className="mb-3 flex justify-end">
                      <div className="inline-flex items-center gap-2 rounded-full border border-shop_light_green/30 bg-white/90 px-3 py-1.5 text-xs font-medium text-shop_dark_green shadow-sm">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-shop_light_green" />
                        Mise a jour...
                      </div>
                    </div>
                  )}
                  <div
                    className={`grid grid-cols-2 gap-2.5 transition-opacity md:grid-cols-3 lg:grid-cols-4 ${showInlineLoading ? "opacity-60" : "opacity-100"}`}
                  >
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="inline-flex min-w-40 items-center justify-center gap-2 rounded-full bg-shop_btn_dark_green px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                        Charger plus
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <NoProductAvailable className="bg-white mt-0" />
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Shop;
