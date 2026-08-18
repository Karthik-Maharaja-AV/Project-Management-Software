"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { STATUS_ICON, findMeta, ISSUE_STATUSES } from "@/lib/constants";
import { DraggableIssueCard } from "@/components/board/draggable-issue-card";
import { Input } from "@/components/ui/input";
import { useCreateIssue } from "@/hooks/use-issues";
import { cn } from "@/lib/utils";
import type { IssueDTO } from "@/lib/types";
import type { IssueStatus } from "@prisma/client";

export function BoardColumn({
  status,
  issues,
  projectId,
}: {
  status: IssueStatus;
  issues: IssueDTO[];
  projectId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${status}` });
  const meta = findMeta(ISSUE_STATUSES, status);
  const Icon = STATUS_ICON[status];
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const createIssue = useCreateIssue(projectId);

  async function submit() {
    if (!title.trim()) return;
    await createIssue.mutateAsync({ projectId, title: title.trim(), status });
    setTitle("");
    setAdding(false);
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      <div className="flex items-center gap-1.5 px-1 pb-2">
        <Icon className="size-3.5" style={{ color: meta.color }} />
        <span className="text-[13px] font-medium text-text-primary">{meta.label}</span>
        <span className="text-[13px] text-text-tertiary">{issues.length}</span>
        <button
          onClick={() => setAdding(true)}
          className="ml-auto flex size-5 items-center justify-center rounded text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[var(--radius-md)] p-1.5 transition-colors",
          isOver && "bg-accent-muted/40",
        )}
      >
        {adding && (
          <Input
            autoFocus
            placeholder="Issue title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") setAdding(false);
            }}
            onBlur={() => !title.trim() && setAdding(false)}
            className="h-8 bg-surface-1 text-[13px]"
          />
        )}
        <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {issues.map((issue) => (
            <DraggableIssueCard key={issue.id} issue={issue} />
          ))}
        </SortableContext>
        {issues.length === 0 && !adding && (
          <div className="rounded-[var(--radius-md)] border border-dashed border-border px-2 py-6 text-center text-xs text-text-tertiary">
            No issues
          </div>
        )}
      </div>
    </div>
  );
}
