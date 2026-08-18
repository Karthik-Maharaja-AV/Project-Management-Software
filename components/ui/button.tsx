import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-foreground hover:bg-accent-hover shadow-[var(--shadow-sm)]",
        secondary:
          "bg-surface-2 text-text-primary border border-border-strong hover:bg-surface-3",
        ghost: "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
        outline:
          "border border-border-strong text-text-primary hover:bg-surface-2 bg-transparent",
        danger: "bg-danger text-white hover:brightness-110",
        link: "text-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-7 px-2.5 text-xs rounded-[var(--radius-sm)]",
        md: "h-8.5 px-3.5 rounded-[var(--radius-sm)]",
        lg: "h-10 px-5 text-[15px] rounded-[var(--radius-md)]",
        icon: "size-8 rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
