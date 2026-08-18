import { auth } from "@/lib/auth";
import { getProjectByKey } from "@/lib/services/project.service";
import { SprintDetail } from "@/components/sprints/sprint-detail";

export default async function SprintPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectKey: string; sprintId: string }>;
}) {
  const { workspaceSlug, projectKey, sprintId } = await params;
  const session = await auth();
  const { project } = await getProjectByKey(session!.user.id, workspaceSlug, projectKey);

  return <SprintDetail projectId={project.id} sprintId={sprintId} />;
}
