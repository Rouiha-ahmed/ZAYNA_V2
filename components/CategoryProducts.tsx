"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { getCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { Category, Product } from "@/types";
import NoProductAvailable from "./NoProductAvailable";
import ProductCard from "./ProductCard";

interface Props {
  categories: Category[];
  slug: string;
  initialProducts?: Product[];
}

const CategoryProducts = ({ categories, slug, initialProducts = [] }: Props) => {
  const [currentSlug, setCurrentSlug] = useState(slug);
  const [products, setProducts] = useState(initialProducts);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length === 60);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCategoryChange = (newSlug: string) => {
    if (!newSlug || newSlug === currentSlug || isPending) return;
    startTransition(() => {
      setCurrentSlug(newSlug);
      router.push(`/category/${newSlug}`, { scroll: false });
    });
  };

  useEffect(() => {
    categories.forEach((category) => {
      const nextSlug = category.slug?.current;
      if (nextSlug) router.prefetch(`/category/${nextSlug}`);
    });
  }, [categories, router]);

  useEffect(() => {
    setCurrentSlug(slug);
    setProducts(initialProducts);
    setHasMore(initialProducts.length === 60);
  }, [initialProducts, slug]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        categories: slug,
        limit: "60",
        page: String(Math.floor(products.length / 60)),
      });
      const response = await fetch(`/api/products/search?${params.toString()}`);
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const nextProducts = (await response.json()) as Product[];
      setProducts((current) => [...current, ...nextProducts]);
      setHasMore(nextProducts.length === 60);
    } catch (error) {
      console.error("Category pagination error", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const showInlineLoading = isPending || currentSlug !== slug;

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      {/* Sidebar */}
      <aside className="w-full shrink-0 md:w-52">
        <div className="overflow-hidden rounded-[20px] border border-shop_light_green/20 bg-white shadow-[0_8px_28px_-18px_rgba(22,46,110,0.18)]">
          <div className="border-b border-shop_light_green/15 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-shop_light_green">
              Categories
            </p>
          </div>
          <nav className="p-2">
            {categories.map((item) => {
              const Icon = getCategoryIcon(item.title || "");
              const categorySlug = item.slug?.current || "";
              const isActive = categorySlug === currentSlug;

              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => handleCategoryChange(categorySlug)}
                  disabled={isPending}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left text-sm font-semibold capitalize transition-all duration-200",
                    isActive
                      ? "bg-shop_btn_dark_green text-white shadow-[0_6px_18px_-8px_rgba(22,46,110,0.5)]"
                      : "text-shop_dark_green hover:bg-shop_light_green/10 hover:text-shop_btn_dark_green"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-shop_light_green" : "text-shop_light_green/70"
                    )}
                  />
                  {item.title}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Products grid */}
      <div className="min-w-0 flex-1">
        {showInlineLoading && (
          <div className="mb-4 flex justify-center md:justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-shop_light_green/30 bg-white px-4 py-1.5 text-xs font-medium text-shop_dark_green shadow-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-shop_light_green" />
              Chargement...
            </div>
          </div>
        )}

        {products.length > 0 ? (
          <>
            <div
              className={cn(
                "grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
                showInlineLoading ? "opacity-50" : "opacity-100"
              )}
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
          <NoProductAvailable selectedTab={currentSlug} className="mt-0 w-full" />
        )}
      </div>
    </div>
  );
};

export default CategoryProducts;
