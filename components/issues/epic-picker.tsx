"use client";

import { Check, Layers } from "lucide-react";
import { useProjectEpics } from "@/hooks/use-epics";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function EpicPicker({
  projectId,
  value,
  onChange,
  compact,
}: {
  projectId: string;
  value: { id: string; name: string; color: string } | null;
  onChange: (epicId: string | null) => void;
  compact?: boolean;
}) {
  const { data: epics } = useProjectEpics(projectId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-strong bg-surface-1 px-2 py-1 text-xs text-text-primary hover:bg-surface-2 transition-colors",
            compact && "border-none bg-transparent px-1 py-0.5",
          )}
        >
          <Layers className="size-3.5 shrink-0" style={{ color: value?.color ?? "var(--text-tertiary)" }} />
          {!compact && <span className="truncate">{value?.name ?? "No epic"}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1">
        <button
          onClick={() => onChange(null)}
          className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
        >
          No epic
          {!value && <Check className="ml-auto size-3.5 text-accent" />}
        </button>
        {(epics ?? []).map((epic: { id: string; name: string; color: string }) => (
          <button
            key={epic.id}
            onClick={() => onChange(epic.id)}
            className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-primary hover:bg-surface-2 transition-colors"
          >
            <span className="size-2.5 rounded-full" style={{ backgroundColor: epic.color }} />
            <span className="truncate">{epic.name}</span>
            {value?.id === epic.id && <Check className="ml-auto size-3.5 text-accent" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
