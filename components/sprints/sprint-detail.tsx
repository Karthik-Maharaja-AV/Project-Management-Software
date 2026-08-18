"use client";

import { format } from "date-fns";
import { CheckCircle2, Play } from "lucide-react";
import { useSprint, useStartSprint, useCompleteSprint } from "@/hooks/use-sprints";
import { useUiStore } from "@/lib/stores/ui-store";
import { STATUS_ICON, findMeta, ISSUE_STATUSES } from "@/lib/constants";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SprintIssue = {
  id: string;
  number: number;
  title: string;
  status: keyof typeof STATUS_ICON;
  storyPoints: number | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
};

export function SprintDetail({ projectId, sprintId }: { projectId: string; sprintId: string }) {
  const { data: sprint, isLoading } = useSprint(sprintId);
  const startSprint = useStartSprint(projectId);
  const completeSprint = useCompleteSprint(projectId);
  const openIssue = useUiStore((s) => s.openIssue);

  if (isLoading || !sprint) {
    return (
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const statusCounts = ISSUE_STATUSES.map((s) => ({
    ...s,
    count: sprint.issues.filter((i: SprintIssue) => i.status === s.value).length,
  }));

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-text-primary">{sprint.name}</h1>
        {sprint.status === "ACTIVE" && <Badge variant="success">Active</Badge>}
        {sprint.status === "COMPLETED" && <Badge>Completed</Badge>}
        {sprint.status === "PLANNED" && <Badge variant="outline">Planned</Badge>}
        <div className="ml-auto flex gap-2">
          {sprint.status === "PLANNED" && (
            <Button size="sm" onClick={() => startSprint.mutate(sprintId)}>
              <Play className="size-3.5" /> Start sprint
            </Button>
          )}
          {sprint.status === "ACTIVE" && (
            <Button size="sm" onClick={() => completeSprint.mutate(sprintId)}>
              <CheckCircle2 className="size-3.5" /> Complete sprint
            </Button>
          )}
        </div>
      </div>
      {sprint.goal && <p className="mt-2 text-sm text-text-secondary">{sprint.goal}</p>}
      {sprint.startDate && sprint.endDate && (
        <p className="mt-1 text-xs text-text-tertiary">
          {format(new Date(sprint.startDate), "MMM d, yyyy")} – {format(new Date(sprint.endDate), "MMM d, yyyy")}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-semibold text-text-primary">{sprint.progress.total}</p>
            <p className="text-xs text-text-tertiary">Total issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-semibold text-success">{sprint.progress.done}</p>
            <p className="text-xs text-text-tertiary">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-semibold text-text-primary">{sprint.progress.total - sprint.progress.done}</p>
            <p className="text-xs text-text-tertiary">Remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-semibold text-text-primary">{sprint.progress.percent}%</p>
            <p className="text-xs text-text-tertiary">Complete</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 rounded-[var(--radius-lg)] border border-border p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-text-primary">Story points</span>
          <span className="text-text-tertiary">
            {sprint.progress.donePoints}/{sprint.progress.totalPoints} pts
          </span>
        </div>
        <ProgressBar percent={sprint.progress.percent} />
        <div className="mt-4 flex flex-col gap-2">
          {statusCounts.map((s) => (
            <div key={s.value} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-text-tertiary">{s.label}</span>
              <ProgressBar percent={sprint.progress.total ? (s.count / sprint.progress.total) * 100 : 0} color={s.color} className="flex-1" />
              <span className="w-6 text-right text-text-tertiary">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-text-primary">Issues</h2>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        {sprint.issues.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-text-tertiary">No issues in this sprint.</p>
        ) : (
          sprint.issues.map((issue: SprintIssue) => {
            const StatusIcon = STATUS_ICON[issue.status];
            const meta = findMeta(ISSUE_STATUSES, issue.status);
            return (
              <button
                key={issue.id}
                onClick={() => openIssue(`${sprint.project.key}-${issue.number}`)}
                className="flex w-full items-center gap-2.5 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-surface-2"
              >
                <StatusIcon className="size-3.5 shrink-0" style={{ color: meta.color }} />
                <span className="font-mono text-[11px] text-text-tertiary">
                  {sprint.project.key}-{issue.number}
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
