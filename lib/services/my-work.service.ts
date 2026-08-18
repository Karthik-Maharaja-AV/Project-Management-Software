import { prisma } from "@/lib/prisma";
import { requireWorkspaceRole } from "@/lib/authz";
import { ISSUE_INCLUDE } from "@/lib/services/issue.service";

function serializeIssue(issue: {
  number: number;
  project: { key: string; workspace: { slug: string } };
  labels: { label: unknown }[];
}) {
  const key = `${issue.project.key}-${issue.number}`;
  return {
    ...issue,
    key,
    labels: issue.labels.map((l) => l.label),
    url: `/${issue.project.workspace.slug}/${issue.project.key}/board?issue=${key}`,
  };
}

export async function getMyWork(userId: string, workspaceId: string) {
  await requireWorkspaceRole(userId, workspaceId, "GUEST");

  const assigned = await prisma.issue.findMany({
    where: {
      assigneeId: userId,
      archivedAt: null,
      project: { workspaceId },
    },
    include: ISSUE_INCLUDE,
    orderBy: [{ dueDate: "asc" }, { boardOrder: "asc" }],
  });

  const upcoming = assigned
    .filter((i) => i.dueDate && i.status !== "DONE")
    .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())
    .slice(0, 10);

  const recentlyViewedRaw = await prisma.recentlyViewed.findMany({
    where: { userId, issue: { project: { workspaceId } } },
    include: { issue: { include: ISSUE_INCLUDE } },
    orderBy: { viewedAt: "desc" },
    take: 10,
  });

  const myActivity = await prisma.activity.findMany({
    where: { actorId: userId, workspaceId },
    include: {
      actor: { select: { id: true, name: true, username: true, avatarUrl: true } },
      issue: { select: { number: true, title: true, project: { select: { key: true } } } },
      project: { select: { name: true, key: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  const grouped = {
    TODO: assigned.filter((i) => i.status === "TODO" || i.status === "BACKLOG").map(serializeIssue),
    IN_PROGRESS: assigned.filter((i) => i.status === "IN_PROGRESS").map(serializeIssue),
    IN_REVIEW: assigned.filter((i) => i.status === "IN_REVIEW").map(serializeIssue),
    DONE: assigned.filter((i) => i.status === "DONE").map(serializeIssue),
  };

  return {
    assigned: grouped,
    upcoming: upcoming.map(serializeIssue),
    recentlyViewed: recentlyViewedRaw.map((r) => serializeIssue(r.issue)),
    myActivity,
  };
}
