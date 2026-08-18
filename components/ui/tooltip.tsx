"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-[var(--radius-sm)] border border-border-strong bg-surface-3 px-2 py-1 text-xs text-text-primary shadow-[var(--shadow-md)]",
          "data-[state=delayed-open]:animate-fade-in",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
