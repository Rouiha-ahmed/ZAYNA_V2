import Link from "next/link";

import HomeFeaturedCategories from "@/components/home/HomeFeaturedCategories";
import HomeSectionHeading from "@/components/home/HomeSectionHeading";
import type { HomepageDynamicSection } from "@/lib/homepage-sections";

type CategorySectionRendererProps = {
  section: HomepageDynamicSection;
};

export default function CategorySectionRenderer({ section }: CategorySectionRendererProps) {
  const categories = section.categories || [];

  if (!categories.length) {
    return null;
  }

  const action =
    section.ctaLabel && section.ctaLink ? (
      <Link
        href={section.ctaLink}
        className="inline-flex items-center rounded-md border border-shop_light_green/45 bg-white px-4 py-2 text-sm font-semibold text-shop_dark_green transition-colors hover:border-shop_dark_green hover:text-shop_btn_dark_green"
      >
        {section.ctaLabel}
      </Link>
    ) : null;

  return (
    <section id={section.key} className="scroll-mt-28">
      <HomeSectionHeading title={section.title} subtitle={section.subtitle} action={action} />
      <HomeFeaturedCategories categories={categories} />
    </section>
  );
}
