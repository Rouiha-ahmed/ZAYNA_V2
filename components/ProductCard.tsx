import { Product } from "@/types";
import { urlFor } from "@/lib/image";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import PriceView from "./PriceView";
import Title from "./Title";
import ProductSideMenu from "./ProductSideMenu";
import AddToCartButton from "./AddToCartButton";

const ProductCard = ({ product }: { product: Product }) => {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[12px] border border-shop_light_green/20 bg-white shadow-[0_12px_24px_-22px_rgba(22,46,110,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-shop_light_green/45">
      <div className="relative overflow-hidden border-b border-shop_light_green/15 bg-shop_light_bg/60">
        <Link
          href={`/product/${product?.slug?.current}`}
          className="block aspect-square"
        >
          {product?.images?.[0] ? (
            <Image
              src={urlFor(product.images[0]).url()}
              alt={product?.name || "Produit"}
              width={500}
              height={500}
              sizes="(min-width: 1280px) 16rem, (min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
              className={`h-full w-full overflow-hidden bg-shop_light_bg/65 object-contain p-4 transition-transform duration-500 
              ${product?.stock !== 0 ? "group-hover:scale-105" : "opacity-50"}`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-lightColor">
              Image indisponible
            </div>
          )}
        </Link>
        <ProductSideMenu product={product} />
        <div className="absolute left-2 top-2 z-10">
          {product?.status === "sale" || (product.discount || 0) > 0 ? (
            <p className="rounded-md bg-shop_orange px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-white">
              Promo
            </p>
          ) : (
            <Link
              href={"/deal"}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-shop_orange/40 bg-white/90 text-shop_orange"
            >
              <Flame size={14} fill="#D4A017" className="text-shop_orange" />
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {product?.categories && (
          <p className="line-clamp-1 text-[11px] font-medium text-lightColor/90">
            {product.categories.map((cat) => cat).join(", ")}
          </p>
        )}
        <Title className="line-clamp-2 min-h-[2.6rem] text-[14px] font-semibold leading-[1.35] text-shop_dark_green">
          {product?.name}
        </Title>

        <PriceView
          price={product?.price}
          discount={product?.discount}
          regularPrice={product?.regularPrice}
          salePrice={product?.salePrice}
          className="text-base"
        />

        <p
          className={`text-[11px] font-medium ${product?.stock === 0 ? "text-red-600" : "text-shop_dark_green/80"}`}
        >
          {(product?.stock as number) > 0 ? `${product?.stock} en stock` : "Indisponible"}
        </p>

        <div className="mt-auto pt-1">
          <AddToCartButton
            product={product}
            className="mt-1 w-full rounded-lg border border-shop_dark_green bg-shop_dark_green text-white"
          />
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
