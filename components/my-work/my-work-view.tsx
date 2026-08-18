"use client";

import { useMyWork } from "@/hooks/use-dashboard";
import { useUiStore } from "@/lib/stores/ui-store";
import { STATUS_ICON, findMeta, ISSUE_STATUSES } from "@/lib/constants";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { User, Clock, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { IssueDTO } from "@/lib/types";

const GROUPS: { key: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"; label: string }[] = [
  { key: "TODO", label: "Todo" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "DONE", label: "Completed" },
];

function MiniIssueRow({ issue }: { issue: IssueDTO }) {
  const openIssue = useUiStore((s) => s.openIssue);
  const TypeIcon = STATUS_ICON[issue.status];
  const meta = findMeta(ISSUE_STATUSES, issue.status);
  return (
    <button
      onClick={() => openIssue(issue.key)}
      className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-[13px] hover:bg-surface-2"
    >
      <TypeIcon className="size-3.5 shrink-0" style={{ color: meta.color }} />
      <span className="font-mono text-[11px] text-text-tertiary">{issue.key}</span>
      <span className="min-w-0 flex-1 truncate text-text-primary">{issue.title}</span>
    </button>
  );
}

export function MyWorkView({ workspaceId }: { workspaceId: string }) {
  const { data, isLoading } = useMyWork(workspaceId);
  const openIssue = useUiStore((s) => s.openIssue);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  const totalAssigned = GROUPS.reduce((sum, g) => sum + data.assigned[g.key].length, 0);

  return (
    <div className="flex flex-col gap-5 p-6">
      <h1 className="text-lg font-semibold text-text-primary">My Work</h1>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-text-primary">Assigned to me</h2>
        {totalAssigned === 0 ? (
          <EmptyState icon={User} title="Nothing assigned to you" description="Issues assigned to you will show up here." className="py-8" />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {GROUPS.map((group) => (
              <Card key={group.key}>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs">{group.label}</CardTitle>
                  <span className="text-xs text-text-tertiary">{data.assigned[group.key].length}</span>
                </CardHeader>
                <CardContent className="flex flex-col gap-0.5 pt-0">
                  {data.assigned[group.key].length === 0 ? (
                    <p className="px-2 py-2 text-xs text-text-tertiary">Nothing here.</p>
                  ) : (
                    data.assigned[group.key].map((issue: IssueDTO) => <MiniIssueRow key={issue.id} issue={issue} />)
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Clock className="size-3.5" /> Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5">
            {data.upcoming.length === 0 ? (
              <p className="text-sm text-text-tertiary">Nothing due soon.</p>
            ) : (
              data.upcoming.map((issue: IssueDTO) => (
                <button
                  key={issue.id}
                  onClick={() => openIssue(issue.key)}
                  className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-[13px] hover:bg-surface-2"
                >
                  <span className="font-mono text-[11px] text-text-tertiary">{issue.key}</span>
                  <span className="min-w-0 flex-1 truncate text-text-primary">{issue.title}</span>
                  {issue.dueDate && (
                    <span className="shrink-0 text-[11px] text-text-tertiary">
                      {formatDistanceToNow(new Date(issue.dueDate), { addSuffix: true })}
                    </span>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Eye className="size-3.5" /> Recently viewed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5">
            {data.recentlyViewed.length === 0 ? (
              <p className="text-sm text-text-tertiary">Nothing viewed yet.</p>
            ) : (
              data.recentlyViewed.map((issue: IssueDTO) => <MiniIssueRow key={issue.id} issue={issue} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityList activity={data.myActivity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
