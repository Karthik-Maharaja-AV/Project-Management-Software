import { prisma } from "@/lib/prisma";
import { requireWorkspaceRole, requireProjectAccess } from "@/lib/authz";
import { subDays, startOfDay, format } from "date-fns";

const STATUS_VALUES = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
const PRIORITY_VALUES = ["URGENT", "HIGH", "MEDIUM", "LOW", "NO_PRIORITY"] as const;

function countBy<T extends string>(rows: { value: T }[], values: readonly T[]) {
  const counts = Object.fromEntries(values.map((v) => [v, 0])) as Record<T, number>;
  for (const row of rows) counts[row.value] += 1;
  return values.map((v) => ({ key: v, count: counts[v] }));
}

function completedOverTime(doneDates: Date[], days: number) {
  const buckets = new Map<string, number>();
  const start = startOfDay(subDays(new Date(), days - 1));
  for (let i = 0; i < days; i++) {
    buckets.set(format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd"), 0);
  }
  for (const date of doneDates) {
    if (date < start) continue;
    const key = format(date, "yyyy-MM-dd");
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

export async function getWorkspaceDashboard(userId: string, workspaceId: string, days = 14) {
  await requireWorkspaceRole(userId, workspaceId, "GUEST");

  const projects = await prisma.project.findMany({ where: { workspaceId, archivedAt: null }, select: { id: true } });
  const projectIds = projects.map((p) => p.id);

  const issues = await prisma.issue.findMany({
    where: { projectId: { in: projectIds }, archivedAt: null },
    select: {
      status: true,
      priority: true,
      type: true,
      dueDate: true,
      updatedAt: true,
      assigneeId: true,
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  const now = new Date();
  const total = issues.length;
  const completed = issues.filter((i) => i.status === "DONE").length;
  const inProgress = issues.filter((i) => i.status === "IN_PROGRESS").length;
  const bugs = issues.filter((i) => i.type === "BUG").length;
  const overdue = issues.filter((i) => i.dueDate && i.dueDate < now && i.status !== "DONE").length;

  const activeSprints = await prisma.sprint.findMany({
    where: { projectId: { in: projectIds }, status: "ACTIVE" },
    include: {
      project: { select: { name: true, key: true } },
      issues: { select: { status: true } },
    },
  });

  const workloadMap = new Map<string, { user: { id: string; name: string; avatarUrl: string | null }; count: number }>();
  for (const issue of issues) {
    if (!issue.assignee || issue.status === "DONE") continue;
    const existing = workloadMap.get(issue.assignee.id);
    if (existing) existing.count += 1;
    else workloadMap.set(issue.assignee.id, { user: issue.assignee, count: 1 });
  }

  const activity = await prisma.activity.findMany({
    where: { workspaceId },
    include: {
      actor: { select: { id: true, name: true, username: true, avatarUrl: true } },
      issue: { select: { number: true, title: true, project: { select: { key: true } } } },
      project: { select: { name: true, key: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return {
    overview: { total, completed, inProgress, bugs, overdue, projectCount: projectIds.length },
    byStatus: countBy(issues.map((i) => ({ value: i.status })), STATUS_VALUES),
    byPriority: countBy(issues.map((i) => ({ value: i.priority })), PRIORITY_VALUES),
    completedOverTime: completedOverTime(
      issues.filter((i) => i.status === "DONE").map((i) => i.updatedAt),
      days,
    ),
    workload: [...workloadMap.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    activeSprints: activeSprints.map((s) => ({
      id: s.id,
      name: s.name,
      project: s.project,
      total: s.issues.length,
      done: s.issues.filter((i) => i.status === "DONE").length,
    })),
    recentActivity: activity,
  };
}

export async function getProjectDashboard(userId: string, projectId: string, days = 14) {
  await requireProjectAccess(userId, projectId, "GUEST");

  const issues = await prisma.issue.findMany({
    where: { projectId, archivedAt: null },
    select: {
      status: true,
      priority: true,
      type: true,
      dueDate: true,
      createdAt: true,
      updatedAt: true,
      storyPoints: true,
      assigneeId: true,
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  const now = new Date();
  const total = issues.length;
  const completed = issues.filter((i) => i.status === "DONE").length;
  const inProgress = issues.filter((i) => i.status === "IN_PROGRESS").length;
  const bugs = issues.filter((i) => i.type === "BUG").length;
  const features = issues.filter((i) => i.type === "FEATURE").length;
  const overdue = issues.filter((i) => i.dueDate && i.dueDate < now && i.status !== "DONE").length;

  const doneIssues = issues.filter((i) => i.status === "DONE");
  const avgCompletionMs =
    doneIssues.length === 0
      ? null
      : doneIssues.reduce((sum, i) => sum + (i.updatedAt.getTime() - i.createdAt.getTime()), 0) / doneIssues.length;

  const completedSprints = await prisma.sprint.findMany({
    where: { projectId, status: "COMPLETED" },
    include: { issues: { select: { status: true, storyPoints: true } } },
    orderBy: { endDate: "desc" },
    take: 6,
  });

  const workloadMap = new Map<string, { user: { id: string; name: string; avatarUrl: string | null }; count: number }>();
  for (const issue of issues) {
    if (!issue.assignee || issue.status === "DONE") continue;
    const existing = workloadMap.get(issue.assignee.id);
    if (existing) existing.count += 1;
    else workloadMap.set(issue.assignee.id, { user: issue.assignee, count: 1 });
  }

  return {
    overview: { total, completed, inProgress, bugs, features, overdue, avgCompletionMs },
    byStatus: countBy(issues.map((i) => ({ value: i.status })), STATUS_VALUES),
    byPriority: countBy(issues.map((i) => ({ value: i.priority })), PRIORITY_VALUES),
    completedOverTime: completedOverTime(doneIssues.map((i) => i.updatedAt), days),
    workload: [...workloadMap.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    velocity: completedSprints
      .reverse()
      .map((s) => ({
        name: s.name,
        points: s.issues.filter((i) => i.status === "DONE").reduce((sum, i) => sum + (i.storyPoints ?? 0), 0),
      })),
  };
}
