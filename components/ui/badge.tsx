import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 w-fit",
  {
    variants: {
      variant: {
        default: "bg-surface-2 text-text-secondary border-border-strong",
        accent: "bg-accent-muted text-accent-muted-foreground border-transparent",
        success: "bg-success-muted text-success border-transparent",
        danger: "bg-danger-muted text-danger border-transparent",
        warning: "bg-warning-muted text-warning border-transparent",
        info: "bg-info-muted text-info border-transparent",
        outline: "bg-transparent text-text-secondary border-border-strong",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
