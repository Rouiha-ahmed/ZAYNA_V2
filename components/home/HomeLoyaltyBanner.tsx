import Image from "next/image";
import Link from "next/link";

import { resolveImageUrl } from "@/lib/image";

type HomeLoyaltyBannerProps = {
  badge: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  highlightText: string;
  imageUrl: string | null;
};

export default function HomeLoyaltyBanner({
  badge,
  title,
  description,
  ctaLabel,
  ctaHref,
  highlightText,
  imageUrl,
}: HomeLoyaltyBannerProps) {
  const resolvedImageUrl = resolveImageUrl(imageUrl || "");

  return (
    <section className="relative overflow-hidden rounded-[16px] border border-shop_light_green/22 bg-white shadow-[0_24px_46px_-40px_rgba(22,46,110,0.5)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(77,182,198,0.2),transparent_44%),radial-gradient(circle_at_bottom_left,rgba(22,46,110,0.12),transparent_45%)]" />

      <div className="relative grid items-center gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:px-9 md:py-8">
        <div className="space-y-4">
          <p className="inline-flex rounded-full border border-shop_light_green/45 bg-shop_light_bg px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-shop_dark_green">
            {badge}
          </p>
          <h2 className="max-w-2xl text-[1.7rem] font-bold tracking-[-0.02em] text-shop_dark_green md:text-[2.2rem]">
            {title}
          </h2>
          <p className="max-w-xl text-sm leading-7 text-lightColor">{description}</p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-md bg-shop_dark_green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-shop_btn_dark_green"
            >
              {ctaLabel}
            </Link>
            <span className="inline-flex rounded-lg bg-shop_light_bg px-4 py-2 text-xs font-semibold text-shop_dark_green md:text-sm">
              {highlightText}
            </span>
          </div>
        </div>

        <div className="relative min-h-52">
          {resolvedImageUrl ? (
            <Image
              src={resolvedImageUrl}
              alt={title}
              fill
              unoptimized
              sizes="(min-width: 1024px) 30rem, 100vw"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-shop_light_green/40 bg-white/70 text-sm text-lightColor">
              Image de fidelite indisponible
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
