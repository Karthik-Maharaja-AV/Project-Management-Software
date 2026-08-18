"use client";

import { useState } from "react";
import { ChevronRight, MoreHorizontal, Play, CheckCircle2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useCompleteSprint, useDeleteSprint, useStartSprint } from "@/hooks/use-sprints";
import { useUiStore } from "@/lib/stores/ui-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BacklogIssueRow } from "@/components/backlog/backlog-issue-row";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { IssueDTO } from "@/lib/types";

type SprintLike = {
  id: string;
  name: string;
  goal: string | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  startDate: string | null;
  endDate: string | null;
};

export function SprintSection({
  sprint,
  issues,
  projectId,
  selectedIds,
  onToggleSelect,
  onIssueSprintChange,
  defaultOpen = true,
}: {
  sprint: SprintLike;
  issues: IssueDTO[];
  projectId: string;
  selectedIds: Set<string>;
  onToggleSelect: (id: string, selected: boolean) => void;
  onIssueSprintChange: (issueId: string, sprintId: string | null) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const startSprint = useStartSprint(projectId);
  const completeSprint = useCompleteSprint(projectId);
  const deleteSprint = useDeleteSprint(projectId);
  const openCreateIssue = useUiStore((s) => s.openCreateIssue);

  const totalPoints = issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const donePoints = issues.filter((i) => i.status === "DONE").reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);
  const percent = issues.length === 0 ? 0 : Math.round((issues.filter((i) => i.status === "DONE").length / issues.length) * 100);

  return (
    <div className="mb-4 overflow-hidden rounded-[var(--radius-lg)] border border-border">
      <div className="flex items-center gap-2 bg-surface-1 px-3 py-2.5">
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5">
          <ChevronRight className={cn("size-3.5 text-text-tertiary transition-transform", open && "rotate-90")} />
          <span className="text-sm font-medium text-text-primary">{sprint.name}</span>
        </button>
        {sprint.status === "ACTIVE" && <Badge variant="success">Active</Badge>}
        {sprint.startDate && sprint.endDate && (
          <span className="text-xs text-text-tertiary">
            {format(new Date(sprint.startDate), "MMM d")} – {format(new Date(sprint.endDate), "MMM d")}
          </span>
        )}
        <span className="text-xs text-text-tertiary">
          {issues.length} issues · {donePoints}/{totalPoints} pts · {percent}%
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {sprint.status === "PLANNED" && (
            <Button size="sm" variant="secondary" onClick={() => startSprint.mutate(sprint.id)}>
              <Play className="size-3.5" /> Start sprint
            </Button>
          )}
          {sprint.status === "ACTIVE" && (
            <Button size="sm" variant="secondary" onClick={() => completeSprint.mutate(sprint.id)}>
              <CheckCircle2 className="size-3.5" /> Complete sprint
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-text-tertiary hover:bg-surface-2">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => openCreateIssue({ sprintId: sprint.id })}>Add issue</DropdownMenuItem>
              {sprint.status !== "ACTIVE" && (
                <DropdownMenuItem
                  className="text-danger focus:bg-danger-muted"
                  onSelect={() => deleteSprint.mutate(sprint.id)}
                >
                  <Trash2 className="size-3.5" /> Delete sprint
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {open && (
        <div>
          {issues.length === 0 ? (
            <p className="px-3 py-4 text-xs text-text-tertiary">No issues in this sprint yet.</p>
          ) : (
            issues.map((issue) => (
              <BacklogIssueRow
                key={issue.id}
                issue={issue}
                selected={selectedIds.has(issue.id)}
                onSelectChange={(s) => onToggleSelect(issue.id, s)}
                onSprintChange={(sprintId) => onIssueSprintChange(issue.id, sprintId)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
