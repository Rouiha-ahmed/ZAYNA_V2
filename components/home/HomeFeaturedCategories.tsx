import Image from "next/image";
import Link from "next/link";

import { BadgePercent, ChevronRight } from "lucide-react";

import { getCategoryIcon } from "@/lib/category-icons";
import { urlFor } from "@/lib/image";
import type { Category } from "@/types";

type HomeFeaturedCategoriesProps = {
  categories: Category[];
};

export default function HomeFeaturedCategories({ categories }: HomeFeaturedCategoriesProps) {
  if (!categories.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-shop_light_green/45 bg-white px-5 py-10 text-center text-sm text-lightColor">
        Aucune categorie mise en avant pour le moment.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.title || "");
        const slug = category.slug?.current;

        return (
          <Link
            key={category._id}
            href={slug ? `/category/${slug}` : "/shop"}
            className="group overflow-hidden rounded-[14px] border border-shop_light_green/20 bg-white shadow-[0_14px_28px_-24px_rgba(22,46,110,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:border-shop_light_green/45"
          >
            <div className="relative h-24 overflow-hidden bg-shop_light_bg/60">
              {category.image ? (
                <Image
                  src={urlFor(category.image).url()}
                  alt={category.title || "Categorie"}
                  fill
                  sizes="(min-width: 1280px) 21rem, (min-width: 640px) 50vw, 100vw"
                  className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-shop_dark_green/80">
                  <Icon className="h-8 w-8" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 p-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 text-[13px] font-bold text-shop_dark_green">
                  {category.title || "Categorie"}
                </h3>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-shop_light_bg text-shop_dark_green transition-colors duration-300 group-hover:bg-shop_dark_green group-hover:text-white">
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-shop_light_bg px-2 py-1 text-[10px] font-semibold text-shop_dark_green">
                <BadgePercent className="h-3 w-3" />
                {category.productCount || 0} produit(s)
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
