import HomeLoyaltyBanner from "@/components/home/HomeLoyaltyBanner";
import type { HomepageDynamicSection } from "@/lib/homepage-sections";

type BannerSectionRendererProps = {
  section: HomepageDynamicSection;
};

const readConfigText = (
  config: Record<string, unknown>,
  key: string,
  fallback: string
) => {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value : fallback;
};

const readConfigNullableText = (
  config: Record<string, unknown>,
  key: string,
  fallback: string | null
) => {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value : fallback;
};

export default function BannerSectionRenderer({ section }: BannerSectionRendererProps) {
  return (
    <section id={section.key} className="scroll-mt-28">
      <HomeLoyaltyBanner
        badge={readConfigText(section.config, "badge", section.title)}
        title={readConfigText(section.config, "title", section.title)}
        description={readConfigText(section.config, "description", section.subtitle || "")}
        ctaLabel={readConfigText(section.config, "ctaLabel", section.ctaLabel || "En savoir plus")}
        ctaHref={readConfigText(section.config, "ctaHref", section.ctaLink || "/#contact")}
        highlightText={readConfigText(section.config, "highlightText", "")}
        imageUrl={readConfigNullableText(section.config, "imageUrl", null)}
      />
    </section>
  );
}
