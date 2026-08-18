"use client";

import { Check, Rows3 } from "lucide-react";
import { useProjectSprints } from "@/hooks/use-sprints";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function SprintPicker({
  projectId,
  value,
  onChange,
  compact,
}: {
  projectId: string;
  value: { id: string; name: string } | null;
  onChange: (sprintId: string | null) => void;
  compact?: boolean;
}) {
  const { data: sprints } = useProjectSprints(projectId);
  const active = (sprints ?? []).filter((s: { status: string }) => s.status !== "COMPLETED");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-strong bg-surface-1 px-2 py-1 text-xs text-text-primary hover:bg-surface-2 transition-colors",
            compact && "border-none bg-transparent px-1 py-0.5",
          )}
        >
          <Rows3 className="size-3.5 shrink-0 text-text-tertiary" />
          {!compact && <span className="truncate">{value?.name ?? "No sprint"}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1">
        <button
          onClick={() => onChange(null)}
          className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
        >
          Backlog (no sprint)
          {!value && <Check className="ml-auto size-3.5 text-accent" />}
        </button>
        {active.map((sprint: { id: string; name: string; status: string }) => (
          <button
            key={sprint.id}
            onClick={() => onChange(sprint.id)}
            className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-primary hover:bg-surface-2 transition-colors"
          >
            <span className="truncate">{sprint.name}</span>
            {sprint.status === "ACTIVE" && (
              <span className="rounded-full bg-success-muted px-1.5 py-0.5 text-[10px] text-success">Active</span>
            )}
            {value?.id === sprint.id && <Check className="ml-auto size-3.5 text-accent" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
