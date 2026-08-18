import { auth } from "@/lib/auth";
import { getProjectByKey } from "@/lib/services/project.service";
import { KanbanBoard } from "@/components/board/kanban-board";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectKey: string }>;
}) {
  const { workspaceSlug, projectKey } = await params;
  const session = await auth();
  const { project } = await getProjectByKey(session!.user.id, workspaceSlug, projectKey);

  return <KanbanBoard projectId={project.id} />;
}
