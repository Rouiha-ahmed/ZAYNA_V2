import Container from "@/components/Container";
import HomeBanner from "@/components/HomeBanner";
import LoyaltyCardPromo from "@/components/LoyaltyCardPromo";
import ProductGrid from "@/components/ProductGrid";
import ShopByBrands from "@/components/ShopByBrands";
import { getHomeTabCategories } from "@/lib/catalog";
import { getAllBrands, getCategories, getProductsByCategoryId } from "@/lib/queries";

import React from "react";

export const revalidate = 300;

const Home = async () => {
  const [categories, brands] = await Promise.all([
    getCategories(undefined, 30),
    getAllBrands(),
  ]);
  const tabCategories = getHomeTabCategories(categories);
  const initialCategoryId = tabCategories[0]?._id || "";
  const initialProducts = initialCategoryId
    ? await getProductsByCategoryId(initialCategoryId)
    : [];

  return (
    <Container className="bg-shop-light-pink">
      <HomeBanner />
      <LoyaltyCardPromo />
      <ProductGrid
        categories={categories}
        initialProducts={initialProducts}
        initialCategoryId={initialCategoryId}
      />
      <ShopByBrands brands={brands} />
    </Container>
  );
};

export default Home;

