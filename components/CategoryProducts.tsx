"use client";
import { Category, Product } from "@/types";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import NoProductAvailable from "./NoProductAvailable";
import ProductCard from "./ProductCard";
import { getCategoryIcon } from "@/lib/category-icons";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
interface Props {
  categories: Category[];
  slug: string;
  initialProducts?: Product[];
}

const CategoryProducts = ({
  categories,
  slug,
  initialProducts = [],
}: Props) => {
  const cacheRef = useRef(
    new Map<string, Product[]>(slug ? [[slug, initialProducts]] : [])
  );
  const [currentSlug, setCurrentSlug] = useState(slug);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const handleCategoryChange = (newSlug: string) => {
    if (newSlug === currentSlug) return; // Prevent unnecessary updates
    startTransition(() => {
      setCurrentSlug(newSlug);
      router.push(`/category/${newSlug}`, { scroll: false });
    });
  };

  useEffect(() => {
    categories.forEach((category) => {
      const nextSlug = category.slug?.current;
      if (nextSlug) {
        router.prefetch(`/category/${nextSlug}`);
      }
    });
  }, [categories, router]);

  useEffect(() => {
    cacheRef.current.set(slug, initialProducts);
    setCurrentSlug(slug);
    setProducts(initialProducts);
    setLoading(false);
  }, [initialProducts, slug]);

  useEffect(() => {
    if (!currentSlug) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const cachedProducts = cacheRef.current.get(currentSlug);
    if (cachedProducts) {
      setProducts(cachedProducts);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchWithRetry(
          async () => {
            const response = await fetch(
              `/api/products/search?category=${encodeURIComponent(currentSlug)}`,
              {
                cache: "no-store",
              }
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch products: ${response.status}`);
            }

            return (await response.json()) as Product[];
          },
          { retries: 1, retryDelayMs: 400 }
        );

        if (!cancelled) {
          cacheRef.current.set(currentSlug, data || []);
          setProducts(data || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching products:", error);
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  const showInitialLoader = loading && !products.length;
  const showInlineLoading = (loading || isPending) && products.length > 0;

  return (
    <div className="py-5 flex flex-col md:flex-row items-start gap-5">
      <div className="flex flex-col md:min-w-40 border">
        {categories.map((item) => {
          const Icon = getCategoryIcon(item.title || "");

          return (
            <Button
              onClick={() => handleCategoryChange(item.slug?.current as string)}
              key={item._id}
              className={`bg-transparent border-0 p-0 rounded-none text-darkColor shadow-none hover:bg-shop_orange hover:text-white font-semibold hoverEffect border-b last:border-b-0 transition-colors capitalize ${item.slug?.current === currentSlug && "bg-shop_orange text-white border-shop_orange"}`}
            >
              <p className="w-full text-left px-2 inline-flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {item.title}
              </p>
            </Button>
          );
        })}
      </div>
      <div className="flex-1">
        {showInitialLoader ? (
          <div className="flex flex-col items-center justify-center py-10 min-h-80 space-y-4 text-center bg-gray-100 rounded-lg w-full">
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Chargement des produits...</span>
            </div>
          </div>
        ) : products.length > 0 ? (
          <>
            {showInlineLoading ? (
              <div className="mb-3 flex justify-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-shop_light_green/30 bg-white/90 px-3 py-1.5 text-xs font-medium text-shop_dark_green shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Changement de categorie...
                </div>
              </div>
            ) : null}
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 transition-opacity ${showInlineLoading ? "opacity-70" : "opacity-100"}`}>
              {products.map((product: Product) => (
                <AnimatePresence key={product._id}>
                  <motion.div>
                    <ProductCard product={product} />
                  </motion.div>
                </AnimatePresence>
              ))}
            </div>
          </>
        ) : (
          <NoProductAvailable
            selectedTab={currentSlug}
            className="mt-0 w-full"
          />
        )}
      </div>
    </div>
  );
};

export default CategoryProducts;

