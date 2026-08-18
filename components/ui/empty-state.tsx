import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-border-strong px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex size-11 items-center justify-center rounded-full bg-surface-2 text-text-tertiary">
          <Icon className="size-5" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && <p className="max-w-sm text-sm text-text-tertiary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
