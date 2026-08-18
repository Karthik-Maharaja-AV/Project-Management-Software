"use client";

import { TYPE_ICON, PRIORITY_ICON, findMeta, ISSUE_TYPES, ISSUE_PRIORITIES } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/lib/stores/ui-store";
import type { IssueDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export function IssueCard({ issue, className }: { issue: IssueDTO; className?: string }) {
  const openIssue = useUiStore((s) => s.openIssue);
  const TypeIcon = TYPE_ICON[issue.type];
  const PriorityIcon = PRIORITY_ICON[issue.priority];
  const priorityMeta = findMeta(ISSUE_PRIORITIES, issue.priority);
  const typeMeta = findMeta(ISSUE_TYPES, issue.type);

  return (
    <button
      onClick={() => openIssue(issue.key)}
      className={cn(
        "flex w-full flex-col gap-2 rounded-[var(--radius-md)] border border-border bg-surface-1 p-2.5 text-left shadow-[var(--shadow-sm)] transition-all hover:border-border-strong hover:shadow-[var(--shadow-md)]",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <TypeIcon className="size-3.5 shrink-0" style={{ color: typeMeta.color }} />
        <span className="font-mono text-[11px] text-text-tertiary">{issue.key}</span>
        {issue.priority !== "NO_PRIORITY" && (
          <PriorityIcon className="ml-auto size-3.5 shrink-0" style={{ color: priorityMeta.color }} />
        )}
      </div>
      <p className="line-clamp-3 text-[13px] leading-snug text-text-primary">{issue.title}</p>
      {issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {issue.labels.slice(0, 3).map((label) => (
            <Badge
              key={label.id}
              style={{ backgroundColor: `${label.color}22`, color: label.color }}
              className="border-transparent"
            >
              {label.name}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
          {issue.storyPoints != null && (
            <span className="flex size-4.5 items-center justify-center rounded-[4px] bg-surface-2 font-medium">
              {issue.storyPoints}
            </span>
          )}
          {issue._count.subtasks > 0 && <span>{issue._count.subtasks} sub</span>}
          {issue._count.comments > 0 && <span>{issue._count.comments} 💬</span>}
        </div>
        {issue.assignee ? (
          <Avatar name={issue.assignee.name} src={issue.assignee.avatarUrl} size="xs" />
        ) : (
          <span className="size-5 rounded-full border border-dashed border-border-strong" />
        )}
      </div>
    </button>
  );
}
