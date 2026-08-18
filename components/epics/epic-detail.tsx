"use client";

import { useEpic } from "@/hooks/use-epics";
import { useUiStore } from "@/lib/stores/ui-store";
import { STATUS_ICON, findMeta, ISSUE_STATUSES } from "@/lib/constants";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/issues/markdown-content";
import { Plus } from "lucide-react";

type EpicIssue = {
  id: string;
  number: number;
  title: string;
  status: keyof typeof STATUS_ICON;
  storyPoints: number | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  labels: { id: string; name: string; color: string }[];
};

export function EpicDetail({ epicId }: { epicId: string }) {
  const { data: epic, isLoading } = useEpic(epicId);
  const openIssue = useUiStore((s) => s.openIssue);
  const openCreateIssue = useUiStore((s) => s.openCreateIssue);

  if (isLoading || !epic) {
    return (
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="size-3 rounded-full" style={{ backgroundColor: epic.color }} />
        <h1 className="text-xl font-semibold text-text-primary">{epic.name}</h1>
        <Badge className="ml-1">{epic.status.replace("_", " ").toLowerCase()}</Badge>
      </div>
      {epic.description && <MarkdownContent content={epic.description} className="mt-3" />}

      <div className="mt-5 rounded-[var(--radius-lg)] border border-border p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-text-primary">Progress</span>
          <span className="text-text-tertiary">
            {epic.progress.done}/{epic.progress.total} issues · {epic.progress.donePoints}/{epic.progress.totalPoints} pts
          </span>
        </div>
        <ProgressBar percent={epic.progress.percent} color={epic.color} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Issues</h2>
        <Button size="sm" variant="secondary" onClick={() => openCreateIssue({ epicId })}>
          <Plus className="size-3.5" /> Add issue
        </Button>
      </div>
      <div className="mt-2 overflow-hidden rounded-[var(--radius-lg)] border border-border">
        {epic.issues.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-text-tertiary">No issues in this epic yet.</p>
        ) : (
          epic.issues.map((issue: EpicIssue) => {
            const StatusIcon = STATUS_ICON[issue.status];
            const meta = findMeta(ISSUE_STATUSES, issue.status);
            return (
              <button
                key={issue.id}
                onClick={() => openIssue(`${epic.project.key}-${issue.number}`)}
                className="flex w-full items-center gap-2.5 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-surface-2"
              >
                <StatusIcon className="size-3.5 shrink-0" style={{ color: meta.color }} />
                <span className="font-mono text-[11px] text-text-tertiary">
                  {epic.project.key}-{issue.number}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-text-primary">{issue.title}</span>
                {issue.storyPoints != null && (
                  <span className="flex size-5 items-center justify-center rounded-[4px] bg-surface-2 text-[11px] text-text-secondary">
                    {issue.storyPoints}
                  </span>
                )}
                {issue.assignee && <Avatar name={issue.assignee.name} src={issue.assignee.avatarUrl} size="xs" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
