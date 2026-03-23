import type { ReactNode } from "react";

type HomeSectionHeadingProps = {
  title: string;
  subtitle?: string | null;
  action?: ReactNode;
};

export default function HomeSectionHeading({
  title,
  subtitle,
  action,
}: HomeSectionHeadingProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 md:mb-7">
      <div className="space-y-1">
        <h2 className="text-[1.5rem] font-bold tracking-[-0.02em] text-shop_dark_green md:text-[1.85rem]">
          {title}
        </h2>
        {subtitle ? (
          <p className="max-w-2xl text-[14px] leading-6 text-lightColor">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
