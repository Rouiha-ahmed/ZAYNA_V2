import Image from "next/image";
import Link from "next/link";

import { urlFor } from "@/lib/image";
import type { BRANDS_QUERYResult } from "@/types";

type HomeBrandsGridProps = {
  brands: BRANDS_QUERYResult;
};

export default function HomeBrandsGrid({ brands }: HomeBrandsGridProps) {
  if (!brands.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-shop_light_green/45 bg-white px-5 py-10 text-center text-sm text-lightColor">
        Les marques seront affichees ici une fois ajoutees dans votre catalogue.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {brands.map((brand) => {
        const slug = brand.slug?.current;
        return (
          <Link
            key={brand._id}
            href={slug ? `/brand/${slug}` : "/shop"}
            className="group flex h-[5.5rem] items-center justify-center rounded-[12px] border border-shop_light_green/20 bg-white px-4 shadow-[0_12px_24px_-22px_rgba(22,46,110,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:border-shop_light_green/55"
          >
            {brand.image ? (
              <Image
                src={urlFor(brand.image).url()}
                alt={brand.title || "Marque"}
                width={220}
                height={80}
                sizes="(min-width: 1024px) 12rem, 44vw"
                className="max-h-14 w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <span className="line-clamp-2 text-center text-sm font-bold text-shop_dark_green">
                {brand.title || "Marque"}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
