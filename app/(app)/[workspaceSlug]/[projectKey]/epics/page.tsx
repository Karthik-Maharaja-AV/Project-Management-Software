import { auth } from "@/lib/auth";
import { getProjectByKey } from "@/lib/services/project.service";
import { EpicsList } from "@/components/epics/epics-list";

export default async function EpicsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectKey: string }>;
}) {
  const { workspaceSlug, projectKey } = await params;
  const session = await auth();
  const { project } = await getProjectByKey(session!.user.id, workspaceSlug, projectKey);

  return <EpicsList projectId={project.id} />;
}
