"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { getCategoryIcon } from "@/lib/category-icons";
import { Category, Product } from "@/types";
import NoProductAvailable from "./NoProductAvailable";
import ProductCard from "./ProductCard";
import { Button } from "./ui/button";

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
  const [currentSlug, setCurrentSlug] = useState(slug);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCategoryChange = (newSlug: string) => {
    if (!newSlug || newSlug === currentSlug || isPending) {
      return;
    }

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
    setCurrentSlug(slug);
  }, [slug]);

  const showInlineLoading = isPending || currentSlug !== slug;

  return (
    <div className="flex flex-col items-start gap-5 py-5 md:flex-row">
      <div className="flex flex-col border md:min-w-40">
        {categories.map((item) => {
          const Icon = getCategoryIcon(item.title || "");
          const categorySlug = item.slug?.current || "";

          return (
            <Button
              key={item._id}
              type="button"
              onClick={() => handleCategoryChange(categorySlug)}
              className={`rounded-none border-0 border-b p-0 text-darkColor shadow-none transition-colors last:border-b-0 hover:bg-shop_orange hover:text-white hoverEffect capitalize ${categorySlug === currentSlug ? "border-shop_orange bg-shop_orange text-white" : "bg-transparent"} `}
            >
              <span className="inline-flex w-full items-center gap-2 px-2 text-left font-semibold">
                <Icon className="h-4 w-4" />
                {item.title}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="flex-1">
        {initialProducts.length > 0 ? (
          <>
            {showInlineLoading ? (
              <div className="mb-3 flex justify-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-shop_light_green/30 bg-white/90 px-3 py-1.5 text-xs font-medium text-shop_dark_green shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Changement de categorie...
                </div>
              </div>
            ) : null}

            <div
              className={`grid grid-cols-2 gap-2.5 transition-opacity md:grid-cols-3 lg:grid-cols-5 ${
                showInlineLoading ? "opacity-70" : "opacity-100"
              }`}
            >
              {initialProducts.map((product) => (
                <div key={product._id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <NoProductAvailable selectedTab={currentSlug} className="mt-0 w-full" />
        )}
      </div>
    </div>
  );
};

export default CategoryProducts;
