import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "default" | "danger" | "success";
  className?: string;
}) {
  return (
    <div className={cn("rounded-[var(--radius-lg)] border border-border bg-surface-1 p-4", className)}>
      <div className="flex items-center gap-2 text-text-tertiary">
        {Icon && <Icon className="size-3.5" />}
        <span className="text-xs">{label}</span>
      </div>
      <p
        className={cn(
          "mt-1.5 text-2xl font-semibold",
          tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
