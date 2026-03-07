import CategoryProducts from "@/components/CategoryProducts";
import Container from "@/components/Container";
import Title from "@/components/Title";
import {
  getAllCategorySlugs,
  getCategories,
  getProductsByCategorySlug,
} from "@/lib/queries";
import React from "react";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();

  return slugs.map((slug) => ({ slug }));
}

const CategoryPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const [categories, initialProducts] = await Promise.all([
    getCategories(),
    getProductsByCategorySlug(slug),
  ]);

  return (
    <div className="py-10">
      <Container>
        <Title>
          Produits par categorie :{" "}
          <span className="font-bold text-green-600 capitalize tracking-wide">
            {slug && slug}
          </span>
        </Title>
        <CategoryProducts
          categories={categories}
          slug={slug}
          initialProducts={initialProducts}
        />
      </Container>
    </div>
  );
};

export default CategoryPage;

