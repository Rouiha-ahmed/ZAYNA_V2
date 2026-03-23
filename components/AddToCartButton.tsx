"use client";
import { Product } from "@/types";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import useStore from "@/store";
import toast from "react-hot-toast";
import PriceFormatter from "./PriceFormatter";
import QuantityButtons from "./QuantityButtons";

interface Props {
  product: Product;
  className?: string;
}

const AddToCartButton = ({ product, className }: Props) => {
  const addItem = useStore((state) => state.addItem);
  const getItemCount = useStore((state) => state.getItemCount);
  const hasHydrated = useStore((state) => state.hasHydrated);
  const itemCount = hasHydrated ? getItemCount(product._id) : 0;
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if ((product.stock as number) > itemCount) {
      addItem(product);
      toast.success(
        `${product.name?.substring(0, 12)}... ajoute avec succes !`
      );
    } else {
      toast.error("Impossible d'ajouter plus que le stock disponible");
    }
  };
  return (
    <div className="w-full h-12 flex items-center">
      {itemCount ? (
        <div className="text-sm w-full">
          <div className="flex items-center justify-between">
            <span className="text-xs text-darkColor/80">Quantite</span>
            <QuantityButtons product={product} />
          </div>
          <div className="flex items-center justify-between border-t pt-1">
            <span className="text-xs font-semibold">Sous-total</span>
            <PriceFormatter
              amount={product.price ? product.price * itemCount : 0}
            />
          </div>
        </div>
      ) : (
        <Button
          onClick={handleAddToCart}
          disabled={!hasHydrated || isOutOfStock}
          className={cn(
            "h-10 w-full rounded-md border border-shop_dark_green bg-shop_dark_green px-3 text-sm font-semibold tracking-normal text-white shadow-none hover:border-shop_btn_dark_green hover:bg-shop_btn_dark_green hoverEffect",
            className
          )}
        >
          <ShoppingBag className="hidden sm:inline-flex h-4 w-4 shrink-0" />
          <span className="text-center whitespace-normal sm:whitespace-nowrap">
            {!hasHydrated
              ? "Chargement..."
              : isOutOfStock
                ? "Rupture de stock"
                : "Ajouter au panier"}
          </span>
        </Button>
      )}
    </div>
  );
};

export default AddToCartButton;
