"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { STATUS_ICON, findMeta, ISSUE_STATUSES } from "@/lib/constants";
import { useCreateIssue } from "@/hooks/use-issues";
import { useUiStore } from "@/lib/stores/ui-store";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import type { IssueDTO } from "@/lib/types";

export function SubtasksList({ issue }: { issue: IssueDTO }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const createIssue = useCreateIssue(issue.projectId);
  const openIssue = useUiStore((s) => s.openIssue);

  async function submit() {
    if (!title.trim()) return;
    await createIssue.mutateAsync({
      projectId: issue.projectId,
      title: title.trim(),
      parentId: issue.id,
    });
    setTitle("");
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-1">
      {issue.subtasks.map((sub) => {
        const StatusIcon = STATUS_ICON[sub.status];
        const meta = findMeta(ISSUE_STATUSES, sub.status);
        return (
          <button
            key={sub.id}
            onClick={() => openIssue(`${issue.project.key}-${sub.number}`)}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] px-1.5 py-1.5 text-left text-[13px] hover:bg-surface-2 transition-colors"
          >
            <StatusIcon className="size-3.5 shrink-0" style={{ color: meta.color }} />
            <span className="font-mono text-[11px] text-text-tertiary">
              {issue.project.key}-{sub.number}
            </span>
            <span className="min-w-0 flex-1 truncate text-text-primary">{sub.title}</span>
            {sub.assignee && <Avatar name={sub.assignee.name} src={sub.assignee.avatarUrl} size="xs" />}
          </button>
        );
      })}

      {adding ? (
        <Input
          autoFocus
          placeholder="Subtask title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setAdding(false);
          }}
          onBlur={() => !title.trim() && setAdding(false)}
          className="h-8 text-[13px]"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-[var(--radius-sm)] px-1.5 py-1.5 text-[13px] text-text-tertiary hover:bg-surface-2 hover:text-text-primary transition-colors"
        >
          <Plus className="size-3.5" /> Add subtask
        </button>
      )}
    </div>
  );
}
