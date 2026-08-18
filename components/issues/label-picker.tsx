"use client";

import { useState } from "react";
import { Check, Plus, Tag } from "lucide-react";
import { useCreateLabel, useProjectLabels } from "@/hooks/use-labels";
import { randomLabelColor } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LabelDTO } from "@/lib/types";

export function LabelPicker({
  projectId,
  value,
  onChange,
  compact,
}: {
  projectId: string;
  value: LabelDTO[];
  onChange: (labelIds: string[]) => void;
  compact?: boolean;
}) {
  const { data: labels } = useProjectLabels(projectId);
  const createLabel = useCreateLabel(projectId);
  const [search, setSearch] = useState("");

  const selectedIds = new Set(value.map((l) => l.id));
  const filtered = (labels ?? []).filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));
  const exactMatch = (labels ?? []).some((l) => l.name.toLowerCase() === search.trim().toLowerCase());

  function toggle(labelId: string) {
    const next = selectedIds.has(labelId)
      ? [...selectedIds].filter((id) => id !== labelId)
      : [...selectedIds, labelId];
    onChange(next);
  }

  async function createAndAdd() {
    if (!search.trim()) return;
    const color = randomLabelColor();
    const label = await createLabel.mutateAsync({ name: search.trim(), color });
    onChange([...selectedIds, label.id]);
    setSearch("");
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex flex-wrap items-center gap-1 rounded-[var(--radius-sm)] border border-border-strong bg-surface-1 px-2 py-1 text-xs hover:bg-surface-2 transition-colors">
          {value.length === 0 ? (
            <>
              <Tag className="size-3.5 text-text-tertiary" />
              {!compact && <span className="text-text-tertiary">Labels</span>}
            </>
          ) : (
            value.map((l) => (
              <Badge key={l.id} style={{ backgroundColor: `${l.color}22`, color: l.color }} className="border-transparent">
                {l.name}
              </Badge>
            ))
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1">
        <div className="p-1 pb-1.5">
          <Input
            autoFocus
            placeholder="Search or create label…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filtered.map((label) => (
            <button
              key={label.id}
              onClick={() => toggle(label.id)}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-text-primary hover:bg-surface-2 transition-colors"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: label.color }} />
              <span className="truncate">{label.name}</span>
              {selectedIds.has(label.id) && <Check className="ml-auto size-3.5 text-accent" />}
            </button>
          ))}
        </div>
        {search.trim() && !exactMatch && (
          <button
            onClick={createAndAdd}
            className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-accent hover:bg-surface-2 transition-colors"
          >
            <Plus className="size-3.5" /> Create &quot;{search.trim()}&quot;
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
