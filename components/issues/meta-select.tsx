"use client";

import type { LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type MetaOption = { value: string; label: string; color: string };

export function MetaTrigger({
  icon: Icon,
  color,
  label,
  className,
  compact,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-strong bg-surface-1 px-2 py-1 text-xs text-text-primary hover:bg-surface-2 transition-colors",
        compact && "border-none bg-transparent px-1 py-0.5",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" style={{ color }} />
      {!compact && <span className="truncate">{label}</span>}
    </button>
  );
}

export function MetaSelect({
  options,
  value,
  onChange,
  icons,
  triggerLabel,
  compact,
  className,
}: {
  options: MetaOption[];
  value: string;
  onChange: (value: string) => void;
  icons: Record<string, LucideIcon>;
  triggerLabel?: string;
  compact?: boolean;
  className?: string;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  const CurrentIcon = icons[current.value];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span>
          <MetaTrigger
            icon={CurrentIcon}
            color={current.color}
            label={triggerLabel ?? current.label}
            compact={compact}
            className={className}
          />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1">
        {options.map((opt) => {
          const OptIcon = icons[opt.value];
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-primary hover:bg-surface-2 transition-colors",
                opt.value === value && "bg-surface-2",
              )}
            >
              <OptIcon className="size-3.5" style={{ color: opt.color }} />
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
