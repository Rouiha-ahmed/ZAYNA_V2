"use client";
import { BRANDS_QUERYResult, Category, Product } from "@/types";
import React, { startTransition, useCallback, useEffect, useRef, useState, useTransition } from "react";
import Container from "./Container";
import Title from "./Title";
import CategoryList from "./shop/CategoryList";
import { useRouter } from "next/navigation";
import BrandList from "./shop/BrandList";
import PriceList from "./shop/PriceList";
import { Loader2 } from "lucide-react";
import NoProductAvailable from "./NoProductAvailable";
import ProductCard from "./ProductCard";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

interface Props {
  categories: Category[];
  brands: BRANDS_QUERYResult;
  initialProducts: Product[];
  initialSelectedCategory?: string | null;
  initialSelectedBrand?: string | null;
  initialSelectedPrice?: string | null;
  initialSearchTerm?: string;
}

const getShopCacheKey = ({
  selectedCategory,
  selectedBrand,
  selectedPrice,
  searchTerm,
}: {
  selectedCategory?: string | null;
  selectedBrand?: string | null;
  selectedPrice?: string | null;
  searchTerm?: string;
}) =>
  JSON.stringify({
    selectedCategory: selectedCategory || "",
    selectedBrand: selectedBrand || "",
    selectedPrice: selectedPrice || "",
    searchTerm: searchTerm || "",
  });

const parsePriceRange = (selectedPrice: string | null) => {
  if (!selectedPrice) {
    return {
      minPrice: null,
      maxPrice: null,
    };
  }

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
  const router = useRouter();
  const [isFilterPending, startFilterTransition] = useTransition();
  const searchTerm = initialSearchTerm.trim();
  const initialCacheKey = getShopCacheKey({
    selectedCategory: initialSelectedCategory,
    selectedBrand: initialSelectedBrand,
    selectedPrice: initialSelectedPrice,
    searchTerm,
  });
  const cacheRef = useRef(new Map<string, Product[]>([[initialCacheKey, initialProducts]]));
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialSelectedCategory
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(
    initialSelectedBrand
  );
  const [selectedPrice, setSelectedPrice] = useState<string | null>(
    initialSelectedPrice
  );
  const requestIdRef = useRef(0);
  const cacheKey = getShopCacheKey({
    selectedCategory,
    selectedBrand,
    selectedPrice,
    searchTerm,
  });

  useEffect(() => {
    setSelectedCategory(initialSelectedCategory);
  }, [initialSelectedCategory]);

  useEffect(() => {
    setSelectedBrand(initialSelectedBrand);
  }, [initialSelectedBrand]);

  useEffect(() => {
    setSelectedPrice(initialSelectedPrice);
  }, [initialSelectedPrice]);

  useEffect(() => {
    cacheRef.current.set(initialCacheKey, initialProducts);
    setProducts(initialProducts);
    setLoading(false);
  }, [initialCacheKey, initialProducts]);

  const fetchProducts = useCallback(async () => {
    const cachedProducts = cacheRef.current.get(cacheKey);
    if (cachedProducts) {
      setProducts(cachedProducts);
      setLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    try {
      const { minPrice, maxPrice } = parsePriceRange(selectedPrice);

      const params = new URLSearchParams();
      if (selectedCategory) {
        params.set("category", selectedCategory);
      }
      if (selectedBrand) {
        params.set("brand", selectedBrand);
      }
      if (searchTerm) {
        params.set("q", searchTerm);
      }
      if (minPrice !== null && maxPrice !== null) {
        params.set("minPrice", String(minPrice));
        params.set("maxPrice", String(maxPrice));
      }

      const data = await fetchWithRetry(
        async () => {
          const res = await fetch(`/api/products/search?${params.toString()}`, {
            cache: "no-store",
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch products: ${res.status}`);
          }

          return (await res.json()) as Product[];
        },
        { retries: 1, retryDelayMs: 400 }
      );
      if (requestIdRef.current === requestId) {
        cacheRef.current.set(cacheKey, data || []);
        setProducts(data || []);
      }
    } catch (error) {
      if (requestIdRef.current === requestId) {
        console.log("Shop product fetching Error", error);
        setProducts([]);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [cacheKey, searchTerm, selectedBrand, selectedCategory, selectedPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const showInitialLoader = loading && !products.length;
  const showInlineLoading = (loading || isFilterPending) && products.length > 0;

  const handleCategoryChange = (value: string | null) => {
    startFilterTransition(() => {
      setSelectedCategory(value);
    });
  };

  const handleBrandChange = (value: string | null) => {
    startFilterTransition(() => {
      setSelectedBrand(value);
    });
  };

  const handlePriceChange = (value: string | null) => {
    startFilterTransition(() => {
      setSelectedPrice(value);
    });
  };

  return (
    <div className="border-t">
      <Container className="mt-5">
        <div className="sticky top-0 z-10 mb-5">
          <div className="flex items-center justify-between">
            <Title className="text-lg uppercase tracking-wide">
              Trouvez les produits selon vos besoins
            </Title>
            {(selectedCategory !== null ||
              selectedBrand !== null ||
              selectedPrice !== null ||
              !!searchTerm) && (
              <button
                onClick={() => {
                  startTransition(() => {
                    setSelectedCategory(null);
                    setSelectedBrand(null);
                    setSelectedPrice(null);
                  });
                  if (searchTerm) {
                    router.push("/shop");
                  }
                }}
                className="text-shop_dark_green underline text-sm mt-2 font-medium hover:text-darkRed hoverEffect"
              >
                Reinitialiser les filtres
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-5 border-t border-t-shop_dark_green/50">
          <div className="md:sticky md:top-20 md:self-start md:h-[calc(100vh-160px)] md:overflow-y-auto md:min-w-64 pb-5 md:border-r border-r-shop_btn_dark_green/50 scrollbar-hide">
            <CategoryList
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={handleCategoryChange}
            />
            <BrandList
              brands={brands}
              setSelectedBrand={handleBrandChange}
              selectedBrand={selectedBrand}
            />
            <PriceList
              setSelectedPrice={handlePriceChange}
              selectedPrice={selectedPrice}
            />
          </div>
          <div className="flex-1 pt-5">
            <div className="relative h-[calc(100vh-160px)] overflow-y-auto pr-2 scrollbar-hide">
              {showInitialLoader ? (
                <div className="p-20 flex flex-col gap-2 items-center justify-center bg-white">
                  <Loader2 className="w-10 h-10 text-shop_dark_green animate-spin" />
                  <p className="font-semibold tracking-wide text-base">
                    Chargement des produits . . .
                  </p>
                </div>
              ) : products?.length > 0 ? (
                <>
                  {showInlineLoading ? (
                    <div className="sticky top-0 z-10 mb-3 flex justify-end">
                      <div className="inline-flex items-center gap-2 rounded-full border border-shop_light_green/30 bg-white/90 px-3 py-1.5 text-xs font-medium text-shop_dark_green shadow-sm">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Mise a jour des produits...
                      </div>
                    </div>
                  ) : null}
                  <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 transition-opacity ${showInlineLoading ? "opacity-70" : "opacity-100"}`}>
                    {products?.map((product) => (
                      <ProductCard key={product?._id} product={product} />
                    ))}
                  </div>
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

