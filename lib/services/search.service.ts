import { prisma } from "@/lib/prisma";
import { requireWorkspaceRole } from "@/lib/authz";

export async function searchWorkspace(userId: string, workspaceId: string, query: string) {
  await requireWorkspaceRole(userId, workspaceId, "GUEST");
  const q = query.trim();
  if (!q) return { issues: [], projects: [], users: [], epics: [], labels: [] };

  const projects = await prisma.project.findMany({
    where: { workspaceId, archivedAt: null },
    select: { id: true, key: true, name: true, color: true },
  });
  const projectIds = projects.map((p) => p.id);
  const projectByKey = new Map(projects.map((p) => [p.key, p]));

  const keyMatch = q.toUpperCase().match(/^([A-Z0-9]+)-(\d+)$/);

  const issueWhere = keyMatch
    ? {
        projectId: projectByKey.get(keyMatch[1])?.id,
        number: Number(keyMatch[2]),
      }
    : {
        projectId: { in: projectIds },
        title: { contains: q, mode: "insensitive" as const },
      };

  const issues = keyMatch && !projectByKey.get(keyMatch[1])
    ? []
    : await prisma.issue.findMany({
        where: { ...issueWhere, archivedAt: null },
        include: { project: { select: { key: true, workspace: { select: { slug: true } } } } },
        take: 8,
      });

  const matchedProjects = projects.filter(
    (p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.key.toLowerCase().includes(q.toLowerCase()),
  );

  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      user: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
        ],
      },
    },
    include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
    take: 6,
  });

  const epics = await prisma.epic.findMany({
    where: { projectId: { in: projectIds }, name: { contains: q, mode: "insensitive" } },
    include: { project: { select: { key: true } } },
    take: 6,
  });

  const labels = await prisma.label.findMany({
    where: { projectId: { in: projectIds }, name: { contains: q, mode: "insensitive" } },
    include: { project: { select: { key: true } } },
    take: 6,
  });

  return {
    issues: issues.map((i) => ({
      id: i.id,
      key: `${i.project.key}-${i.number}`,
      title: i.title,
      status: i.status,
      type: i.type,
      url: `/${i.project.workspace.slug}/${i.project.key}/board?issue=${i.project.key}-${i.number}`,
    })),
    projects: matchedProjects,
    users: members.map((m) => m.user),
    epics: epics.map((e) => ({ id: e.id, name: e.name, color: e.color, projectKey: e.project.key })),
    labels: labels.map((l) => ({ id: l.id, name: l.name, color: l.color, projectKey: l.project.key })),
  };
}
