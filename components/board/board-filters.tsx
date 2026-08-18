"use client";

import { Search, X } from "lucide-react";
import { Check, Filter } from "lucide-react";
import { ISSUE_PRIORITIES, ISSUE_TYPES, PRIORITY_ICON, TYPE_ICON } from "@/lib/constants";
import { useProjectMembers } from "@/hooks/use-project-members";
import { useProjectLabels } from "@/hooks/use-labels";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type BoardFilterState = {
  search: string;
  assigneeIds: string[];
  priorities: string[];
  types: string[];
  labelIds: string[];
};

export const EMPTY_FILTERS: BoardFilterState = { search: "", assigneeIds: [], priorities: [], types: [], labelIds: [] };

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function BoardFilters({
  projectId,
  filters,
  onChange,
}: {
  projectId: string;
  filters: BoardFilterState;
  onChange: (filters: BoardFilterState) => void;
}) {
  const { data: members } = useProjectMembers(projectId);
  const { data: labels } = useProjectLabels(projectId);

  const activeCount =
    filters.assigneeIds.length + filters.priorities.length + filters.types.length + filters.labelIds.length;

  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
      <div className="relative w-56">
        <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" />
        <Input
          placeholder="Filter issues…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="h-8 pl-7 text-xs"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-strong px-2 py-1 text-xs text-text-secondary hover:bg-surface-2">
            <Avatar name="?" size="xs" />
            Assignee
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1">
          {(members ?? []).map((m) => (
            <button
              key={m.userId}
              onClick={() => onChange({ ...filters, assigneeIds: toggle(filters.assigneeIds, m.userId) })}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-surface-2"
            >
              <Avatar name={m.user.name} src={m.user.avatarUrl} size="xs" />
              <span className="truncate">{m.user.name}</span>
              {filters.assigneeIds.includes(m.userId) && <Check className="ml-auto size-3.5 text-accent" />}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-strong px-2 py-1 text-xs text-text-secondary hover:bg-surface-2">
            <Filter className="size-3.5" />
            Priority
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1">
          {ISSUE_PRIORITIES.map((p) => {
            const Icon = PRIORITY_ICON[p.value];
            return (
              <button
                key={p.value}
                onClick={() => onChange({ ...filters, priorities: toggle(filters.priorities, p.value) })}
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-surface-2"
              >
                <Icon className="size-3.5" style={{ color: p.color }} />
                {p.label}
                {filters.priorities.includes(p.value) && <Check className="ml-auto size-3.5 text-accent" />}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-strong px-2 py-1 text-xs text-text-secondary hover:bg-surface-2">
            <Filter className="size-3.5" />
            Type
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1">
          {ISSUE_TYPES.map((t) => {
            const Icon = TYPE_ICON[t.value];
            return (
              <button
                key={t.value}
                onClick={() => onChange({ ...filters, types: toggle(filters.types, t.value) })}
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-surface-2"
              >
                <Icon className="size-3.5" style={{ color: t.color }} />
                {t.label}
                {filters.types.includes(t.value) && <Check className="ml-auto size-3.5 text-accent" />}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-strong px-2 py-1 text-xs text-text-secondary hover:bg-surface-2">
            <Filter className="size-3.5" />
            Label
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1">
          {(labels ?? []).map((l) => (
            <button
              key={l.id}
              onClick={() => onChange({ ...filters, labelIds: toggle(filters.labelIds, l.id) })}
              className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm hover:bg-surface-2"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="truncate">{l.name}</span>
              {filters.labelIds.includes(l.id) && <Check className="ml-auto size-3.5 text-accent" />}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)} className={cn("text-text-tertiary")}>
          <X className="size-3.5" /> Clear ({activeCount})
        </Button>
      )}
    </div>
  );
}

export function applyFilters<T extends {
  title: string;
  assigneeId: string | null;
  priority: string;
  type: string;
  labels: { id: string }[];
}>(issues: T[], filters: BoardFilterState): T[] {
  return issues.filter((issue) => {
    if (filters.search && !issue.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.assigneeIds.length && !(issue.assigneeId && filters.assigneeIds.includes(issue.assigneeId))) return false;
    if (filters.priorities.length && !filters.priorities.includes(issue.priority)) return false;
    if (filters.types.length && !filters.types.includes(issue.type)) return false;
    if (filters.labelIds.length && !issue.labels.some((l) => filters.labelIds.includes(l.id))) return false;
    return true;
  });
}
