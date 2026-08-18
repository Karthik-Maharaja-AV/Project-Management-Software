"use client";

import { useState } from "react";
import { CheckCircle2, ListTodo, Bug, AlertTriangle, Plus, FolderKanban } from "lucide-react";
import { useWorkspaceDashboard } from "@/hooks/use-dashboard";
import { ISSUE_STATUSES, ISSUE_PRIORITIES } from "@/lib/constants";
import { StatTile } from "@/components/ui/stat-tile";
import { BarList } from "@/components/dashboard/bar-list";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { WorkloadList } from "@/components/dashboard/workload-list";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProjectCardData } from "@/lib/types";

export function WorkspaceDashboard({
  workspaceId,
  workspaceSlug,
  projects,
}: {
  workspaceId: string;
  workspaceSlug: string;
  projects: ProjectCardData[];
}) {
  const { data, isLoading } = useWorkspaceDashboard(workspaceId);
  const [createOpen, setCreateOpen] = useState(false);

  if (projects.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FolderKanban}
          title="Your workspace is empty"
          description="Create your first project to start tracking issues, sprints, and epics with your team."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> Create your first project
            </Button>
          }
        />
        <CreateProjectDialog workspaceId={workspaceId} workspaceSlug={workspaceSlug} open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const statusItems = ISSUE_STATUSES.map((s) => ({
    key: s.value,
    label: s.label,
    color: s.color,
    count: data.byStatus.find((b: { key: string }) => b.key === s.value)?.count ?? 0,
  }));
  const priorityItems = ISSUE_PRIORITIES.map((p) => ({
    key: p.value,
    label: p.label,
    color: p.color,
    count: data.byPriority.find((b: { key: string }) => b.key === p.value)?.count ?? 0,
  }));

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Total issues" value={data.overview.total} icon={ListTodo} />
        <StatTile label="Completed" value={data.overview.completed} icon={CheckCircle2} tone="success" />
        <StatTile label="In progress" value={data.overview.inProgress} icon={ListTodo} />
        <StatTile label="Bugs" value={data.overview.bugs} icon={Bug} />
        <StatTile label="Overdue" value={data.overview.overdue} icon={AlertTriangle} tone={data.overview.overdue > 0 ? "danger" : "default"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Issues by status</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList items={statusItems} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Issues by priority</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList items={priorityItems} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed over the last 14 days</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={data.completedOverTime} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workload (open issues)</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkloadList workload={data.workload} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityList activity={data.recentActivity} />
          </CardContent>
        </Card>
      </div>

      {data.activeSprints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active sprints</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.activeSprints.map((s: { id: string; name: string; project: { name: string; key: string }; total: number; done: number }) => (
              <Link
                key={s.id}
                href={`/${workspaceSlug}/${s.project.key}/sprints/${s.id}`}
                className="rounded-[var(--radius-md)] border border-border p-3 hover:bg-surface-2"
              >
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-text-primary">
                    {s.name} <span className="text-text-tertiary">· {s.project.name}</span>
                  </span>
                  <span className="text-text-tertiary">
                    {s.done}/{s.total}
                  </span>
                </div>
                <ProgressBar percent={s.total ? (s.done / s.total) * 100 : 0} />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Projects</h2>
          <Button size="sm" variant="secondary" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" /> New project
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/${workspaceSlug}/${project.key}/board`}>
              <Card className="h-full p-4 transition-shadow hover:shadow-[var(--shadow-md)]">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-sm font-bold text-white"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.icon || project.key[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{project.name}</p>
                    <p className="font-mono text-xs text-text-tertiary">{project.key}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-text-tertiary">
                  <Badge>{project._count.issues} issues</Badge>
                  <Badge>{project._count.members} members</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <CreateProjectDialog workspaceId={workspaceId} workspaceSlug={workspaceSlug} open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
