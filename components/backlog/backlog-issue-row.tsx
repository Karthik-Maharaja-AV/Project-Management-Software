"use client";

import { STATUS_ICON, TYPE_ICON, PRIORITY_ICON, findMeta, ISSUE_STATUSES, ISSUE_TYPES, ISSUE_PRIORITIES } from "@/lib/constants";
import { useUiStore } from "@/lib/stores/ui-store";
import { SprintPicker } from "@/components/issues/sprint-picker";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { IssueDTO } from "@/lib/types";

export function BacklogIssueRow({
  issue,
  selected,
  onSelectChange,
  onSprintChange,
}: {
  issue: IssueDTO;
  selected: boolean;
  onSelectChange: (selected: boolean) => void;
  onSprintChange: (sprintId: string | null) => void;
}) {
  const openIssue = useUiStore((s) => s.openIssue);
  const StatusIcon = STATUS_ICON[issue.status];
  const TypeIcon = TYPE_ICON[issue.type];
  const PriorityIcon = PRIORITY_ICON[issue.priority];
  const statusMeta = findMeta(ISSUE_STATUSES, issue.status);
  const typeMeta = findMeta(ISSUE_TYPES, issue.type);
  const priorityMeta = findMeta(ISSUE_PRIORITIES, issue.priority);

  return (
    <div className="group flex items-center gap-2.5 border-b border-border px-3 py-2 last:border-b-0 hover:bg-surface-2">
      <Checkbox checked={selected} onCheckedChange={onSelectChange} />
      <StatusIcon className="size-3.5 shrink-0" style={{ color: statusMeta.color }} />
      <TypeIcon className="size-3.5 shrink-0" style={{ color: typeMeta.color }} />
      <button onClick={() => openIssue(issue.key)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span className="font-mono text-[11px] text-text-tertiary">{issue.key}</span>
        <span className="truncate text-[13px] text-text-primary">{issue.title}</span>
      </button>
      {issue.epic && (
        <Badge style={{ backgroundColor: `${issue.epic.color}22`, color: issue.epic.color }} className="border-transparent">
          {issue.epic.name}
        </Badge>
      )}
      {issue.labels.slice(0, 2).map((label) => (
        <Badge key={label.id} style={{ backgroundColor: `${label.color}22`, color: label.color }} className="border-transparent">
          {label.name}
        </Badge>
      ))}
      {issue.storyPoints != null && (
        <span className="flex size-5 items-center justify-center rounded-[4px] bg-surface-2 text-[11px] font-medium text-text-secondary">
          {issue.storyPoints}
        </span>
      )}
      {issue.priority !== "NO_PRIORITY" && <PriorityIcon className="size-3.5 shrink-0" style={{ color: priorityMeta.color }} />}
      {issue.assignee ? (
        <Avatar name={issue.assignee.name} src={issue.assignee.avatarUrl} size="xs" />
      ) : (
        <span className="size-5 rounded-full border border-dashed border-border-strong" />
      )}
      <div className="opacity-0 group-hover:opacity-100">
        <SprintPicker projectId={issue.projectId} value={issue.sprint} onChange={onSprintChange} compact />
      </div>
    </div>
  );
}
