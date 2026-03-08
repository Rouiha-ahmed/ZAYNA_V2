"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

type AdminUserButtonProps = {
  size?: "sm" | "md";
  className?: string;
};

const sizeClassNames = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
} as const;

const ClientUserButton = dynamic(
  () => import("./AdminUserButtonClient"),
  {
    ssr: false,
  }
);

export default function AdminUserButton({
  size = "md",
  className,
}: AdminUserButtonProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        sizeClassNames[size],
        className
      )}
    >
      <ClientUserButton size={size} className={className} />
    </div>
  );
}
