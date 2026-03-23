import {
  Headset,
  ShieldCheck,
  Truck,
  Wallet,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

import type { StorefrontTrustItem } from "@/lib/storefront";

const iconMap: Record<string, LucideIcon> = {
  truck: Truck,
  shield: ShieldCheck,
  headset: Headset,
  wallet: Wallet,
  return: RotateCcw,
};

type HomeTrustGridProps = {
  items: StorefrontTrustItem[];
};

export default function HomeTrustGrid({ items }: HomeTrustGridProps) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = iconMap[item.icon] || ShieldCheck;

        return (
          <article
            key={item.id}
            className="rounded-[12px] border border-shop_light_green/20 bg-white p-4 shadow-[0_10px_22px_-20px_rgba(22,46,110,0.38)] transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-shop_light_bg text-shop_dark_green">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <h3 className="mt-3 text-[15px] font-bold text-shop_dark_green">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-lightColor">{item.description}</p>
          </article>
        );
      })}
    </div>
  );
}
