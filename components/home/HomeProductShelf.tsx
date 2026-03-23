import ProductCard from "@/components/ProductCard";
import type { Product } from "@/types";

type HomeProductShelfProps = {
  products: Product[];
  emptyMessage: string;
};

export default function HomeProductShelf({
  products,
  emptyMessage,
}: HomeProductShelfProps) {
  if (!products.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-shop_light_green/45 bg-white px-5 py-10 text-center text-sm text-lightColor">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
