"use client";

import { CheckCircle2, ListTodo, Bug, AlertTriangle, Sparkles, Timer } from "lucide-react";
import { useProjectDashboard } from "@/hooks/use-dashboard";
import { ISSUE_STATUSES, ISSUE_PRIORITIES } from "@/lib/constants";
import { StatTile } from "@/components/ui/stat-tile";
import { BarList } from "@/components/dashboard/bar-list";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { WorkloadList } from "@/components/dashboard/workload-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatDuration(ms: number | null) {
  if (ms == null) return "—";
  const days = ms / (1000 * 60 * 60 * 24);
  if (days < 1) return `${Math.round(ms / (1000 * 60 * 60))}h`;
  return `${days.toFixed(1)}d`;
}

export function ProjectDashboard({ projectId }: { projectId: string }) {
  const { data, isLoading } = useProjectDashboard(projectId);

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

  const maxVelocity = Math.max(1, ...data.velocity.map((v: { points: number }) => v.points));

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total issues" value={data.overview.total} icon={ListTodo} />
        <StatTile label="Completed" value={data.overview.completed} icon={CheckCircle2} tone="success" />
        <StatTile label="In progress" value={data.overview.inProgress} icon={ListTodo} />
        <StatTile label="Bugs vs features" value={`${data.overview.bugs} / ${data.overview.features}`} icon={Bug} />
        <StatTile label="Overdue" value={data.overview.overdue} icon={AlertTriangle} tone={data.overview.overdue > 0 ? "danger" : "default"} />
        <StatTile label="Avg. completion" value={formatDuration(data.overview.avgCompletionMs)} icon={Timer} />
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
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Sprint velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.velocity.length === 0 ? (
              <p className="text-sm text-text-tertiary">Complete a sprint to see velocity here.</p>
            ) : (
              <div className="flex items-end gap-2" style={{ height: 100 }}>
                {data.velocity.map((v: { name: string; points: number }) => (
                  <div key={v.name} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full max-w-6 rounded-t-[4px] bg-accent"
                      style={{ height: `${Math.max(4, (v.points / maxVelocity) * 80)}px` }}
                    />
                    <span className="text-[10px] text-text-tertiary">{v.points}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
