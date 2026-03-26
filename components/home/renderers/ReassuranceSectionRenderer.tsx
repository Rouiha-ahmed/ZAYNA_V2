import HomeSectionHeading from "@/components/home/HomeSectionHeading";
import HomeTrustGrid from "@/components/home/HomeTrustGrid";
import type { HomepageDynamicSection } from "@/lib/homepage-sections";

type ReassuranceSectionRendererProps = {
  section: HomepageDynamicSection;
};

export default function ReassuranceSectionRenderer({
  section,
}: ReassuranceSectionRendererProps) {
  const items = section.trustItems || [];

  if (!items.length) {
    return null;
  }

  return (
    <section id={section.key} className="scroll-mt-28">
      <HomeSectionHeading title={section.title} subtitle={section.subtitle} />
      <HomeTrustGrid items={items} />
    </section>
  );
}
