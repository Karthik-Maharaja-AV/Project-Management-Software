import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-skeleton rounded-[var(--radius-sm)] bg-surface-2", className)}
      {...props}
    />
  );
}
