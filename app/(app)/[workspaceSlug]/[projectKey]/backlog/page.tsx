import { auth } from "@/lib/auth";
import { getProjectByKey } from "@/lib/services/project.service";
import { BacklogView } from "@/components/backlog/backlog-view";

export default async function BacklogPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectKey: string }>;
}) {
  const { workspaceSlug, projectKey } = await params;
  const session = await auth();
  const { project } = await getProjectByKey(session!.user.id, workspaceSlug, projectKey);

  return <BacklogView projectId={project.id} />;
}
