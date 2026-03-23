"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { resolveImageUrl } from "@/lib/image";
import type { StorefrontHeroSlide } from "@/lib/storefront";

type HomeHeroCarouselProps = {
  slides: StorefrontHeroSlide[];
  autoplayMs: number;
};

export default function HomeHeroCarousel({ slides, autoplayMs }: HomeHeroCarouselProps) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || slides.length < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, Math.max(autoplayMs, 2000));

    return () => {
      window.clearInterval(interval);
    };
  }, [api, autoplayMs, slides.length]);

  if (!slides.length) {
    return null;
  }

  return (
    <section className="pt-2 md:pt-3">
      <Carousel
        setApi={setApi}
        opts={{
          loop: slides.length > 1,
          align: "start",
        }}
        className="group relative"
      >
        <CarouselContent>
          {slides.map((slide) => {
            const imageUrl = resolveImageUrl(slide.imageUrl || "");

            return (
              <CarouselItem key={slide.id}>
                <article className="relative overflow-hidden rounded-[16px] border border-shop_light_green/22 bg-white shadow-[0_24px_48px_-42px_rgba(22,46,110,0.52)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(77,182,198,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(22,46,110,0.08),transparent_45%)]" />

                  <div className="relative grid min-h-[360px] items-center gap-6 p-6 md:grid-cols-[1.06fr_0.94fr] md:gap-10 md:px-10 md:py-9 lg:min-h-[410px]">
                    <div className="space-y-4 md:space-y-5">
                      {slide.badge ? (
                        <p className="inline-flex rounded-full border border-shop_light_green/35 bg-shop_light_bg px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-shop_dark_green">
                          {slide.badge}
                        </p>
                      ) : null}
                      <h1 className="max-w-2xl text-[2rem] font-bold tracking-[-0.03em] text-shop_dark_green md:text-[2.55rem] lg:text-[2.95rem]">
                        {slide.title}
                      </h1>
                      {slide.subtitle ? (
                        <p className="max-w-xl text-sm leading-7 text-lightColor md:text-[15px]">
                          {slide.subtitle}
                        </p>
                      ) : null}

                      {slide.ctaLabel && slide.ctaHref ? (
                        <div className="pt-2">
                          <Link
                            href={slide.ctaHref}
                            className="inline-flex items-center justify-center rounded-md bg-shop_dark_green px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-shop_btn_dark_green"
                          >
                            {slide.ctaLabel}
                          </Link>
                        </div>
                      ) : null}
                    </div>

                    <div className="relative min-h-56 md:min-h-[320px]">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={slide.altText || slide.title}
                          fill
                          unoptimized
                          sizes="(min-width: 1024px) 34rem, 100vw"
                          className="object-contain object-right md:object-center"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-shop_light_green/40 bg-shop_light_bg/55 text-sm font-medium text-lightColor">
                          Image indisponible
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {slides.length > 1 ? (
          <>
            <CarouselPrevious className="left-3 top-1/2 hidden -translate-y-1/2 border-shop_light_green/50 bg-white/90 text-shop_dark_green hover:bg-white md:inline-flex" />
            <CarouselNext className="right-3 top-1/2 hidden -translate-y-1/2 border-shop_light_green/50 bg-white/90 text-shop_dark_green hover:bg-white md:inline-flex" />

            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  className={`h-2 rounded-full transition-all ${selectedIndex === index ? "w-7 bg-shop_dark_green" : "w-2 bg-shop_light_green/55 hover:bg-shop_light_green"}`}
                  aria-label={`Aller au slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </Carousel>
    </section>
  );
}
