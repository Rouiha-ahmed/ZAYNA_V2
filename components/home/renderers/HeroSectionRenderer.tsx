import HomeHeroCarousel from "@/components/home/HomeHeroCarousel";
import type { HomepageDynamicSection } from "@/lib/homepage-sections";

type HeroSectionRendererProps = {
  section: HomepageDynamicSection;
};

export default function HeroSectionRenderer({ section }: HeroSectionRendererProps) {
  const slides = section.heroSlides || [];

  if (!slides.length) {
    return null;
  }

  const autoplayMs =
    typeof section.config.autoplayMs === "number" && section.config.autoplayMs >= 2000
      ? Math.trunc(section.config.autoplayMs)
      : 5000;

  return (
    <section id={section.key} className="scroll-mt-28">
      <HomeHeroCarousel slides={slides} autoplayMs={autoplayMs} />
    </section>
  );
}
