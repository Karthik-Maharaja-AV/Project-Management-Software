"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const HASH_COLORS = [
  "#e2661c",
  "#6b7fd7",
  "#9256d9",
  "#1f8a9e",
  "#1f8a5f",
  "#d1403a",
  "#b7791f",
  "#2563a8",
];

function hashColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return HASH_COLORS[Math.abs(hash) % HASH_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizeClasses = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-16 text-xl",
};

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full ring-1 ring-border select-none",
        sizeClasses[size],
        className,
      )}
    >
      {src && (
        <AvatarPrimitive.Image src={src} alt={name} className="h-full w-full object-cover" />
      )}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center font-semibold text-white"
        style={{ backgroundColor: hashColor(name || "?") }}
        delayMs={src ? 300 : 0}
      >
        {initials(name || "?")}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
