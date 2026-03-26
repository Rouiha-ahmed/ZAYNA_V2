import Link from "next/link";

import HomeSectionHeading from "@/components/home/HomeSectionHeading";
import type { HomepageDynamicSection } from "@/lib/homepage-sections";

type LinksGroupRendererProps = {
  section: HomepageDynamicSection;
};

export default function LinksGroupRenderer({ section }: LinksGroupRendererProps) {
  const links = section.links || [];

  if (!links.length) {
    return null;
  }

  return (
    <section id={section.key} className="scroll-mt-28">
      <HomeSectionHeading title={section.title} subtitle={section.subtitle} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((linkItem) => (
          <Link
            key={linkItem.id}
            href={linkItem.href}
            target={linkItem.openInNewTab ? "_blank" : undefined}
            rel={linkItem.openInNewTab ? "noopener noreferrer" : undefined}
            className="rounded-[14px] border border-shop_light_green/22 bg-white px-4 py-3 text-sm font-medium text-shop_dark_green transition-colors hover:border-shop_dark_green hover:text-shop_btn_dark_green"
          >
            {linkItem.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
