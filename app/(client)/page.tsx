import Link from "next/link";

import Container from "@/components/Container";
import HomeBrandsGrid from "@/components/home/HomeBrandsGrid";
import HomeFeaturedCategories from "@/components/home/HomeFeaturedCategories";
import HomeHeroCarousel from "@/components/home/HomeHeroCarousel";
import HomeLoyaltyBanner from "@/components/home/HomeLoyaltyBanner";
import HomeNewsletter from "@/components/home/HomeNewsletter";
import HomeProductShelf from "@/components/home/HomeProductShelf";
import HomeSectionHeading from "@/components/home/HomeSectionHeading";
import HomeTrustGrid from "@/components/home/HomeTrustGrid";
import { getStorefrontHomeData } from "@/lib/storefront";

export const revalidate = 300;

export default async function HomePage() {
  const data = await getStorefrontHomeData();
  const settings = data.settings;

  return (
    <div className="bg-shop_light_bg/35">
      <Container className="space-y-10 pb-12 pt-4 md:space-y-16 md:pb-16 md:pt-6">
        {data.hasError ? (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Certaines sections n&apos;ont pas pu etre chargees depuis la base de donnees. Un
            affichage de secours est utilise.
          </div>
        ) : null}

        <HomeHeroCarousel
          slides={data.heroSlides}
          autoplayMs={settings.heroAutoplayMs}
        />

        <section id="categories" className="scroll-mt-28">
          <HomeSectionHeading
            title={settings.featuredCategoriesTitle}
            subtitle={settings.featuredCategoriesSubtitle}
            action={
              <Link
                href="/shop"
                className="inline-flex items-center rounded-md border border-shop_light_green/45 bg-white px-4 py-2 text-sm font-semibold text-shop_dark_green transition-colors hover:border-shop_dark_green hover:text-shop_btn_dark_green"
              >
                Voir tout
              </Link>
            }
          />
          <HomeFeaturedCategories categories={data.featuredCategories} />
        </section>

        <section>
          <HomeSectionHeading
            title={settings.promotionsTitle}
            subtitle={settings.promotionsSubtitle}
            action={
              <Link
                href="/deal"
                className="inline-flex items-center rounded-md bg-shop_dark_green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-shop_btn_dark_green"
              >
                Voir les deals
              </Link>
            }
          />
          <HomeProductShelf
            products={data.promotionalProducts}
            emptyMessage="Aucune promotion disponible actuellement."
          />
        </section>

        <section>
          <HomeSectionHeading
            title={settings.bestSellersTitle}
            subtitle={settings.bestSellersSubtitle}
          />
          <HomeProductShelf
            products={data.bestSellerProducts}
            emptyMessage="Les meilleures ventes apparaitront ici apres les premieres commandes."
          />
        </section>

        <section>
          <HomeSectionHeading
            title={settings.newArrivalsTitle}
            subtitle={settings.newArrivalsSubtitle}
          />
          <HomeProductShelf
            products={data.newArrivalProducts}
            emptyMessage="Aucune nouveaute n'est disponible pour le moment."
          />
        </section>

        <section>
          <HomeSectionHeading
            title={settings.brandsTitle}
            subtitle={settings.brandsSubtitle}
          />
          <HomeBrandsGrid brands={data.brands} />
        </section>

        <section>
          <HomeSectionHeading
            title={settings.trustTitle}
            subtitle={settings.trustSubtitle}
          />
          <HomeTrustGrid items={data.trustItems} />
        </section>

        <HomeLoyaltyBanner
          badge={settings.loyaltyBadge}
          title={settings.loyaltyTitle}
          description={settings.loyaltyDescription}
          ctaLabel={settings.loyaltyCtaLabel}
          ctaHref={settings.loyaltyCtaHref}
          highlightText={settings.loyaltyHighlightText}
          imageUrl={settings.loyaltyImageUrl}
        />

        <HomeNewsletter
          title={settings.newsletterTitle}
          description={settings.newsletterDescription}
          placeholder={settings.newsletterPlaceholder}
          buttonLabel={settings.newsletterButtonLabel}
          successMessage={settings.newsletterSuccessMessage}
          errorMessage={settings.newsletterErrorMessage}
        />
      </Container>
    </div>
  );
}
