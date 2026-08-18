import { auth } from "@/lib/auth";
import { getProjectByKey } from "@/lib/services/project.service";
import { ProjectSettings } from "@/components/projects/project-settings";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectKey: string }>;
}) {
  const { workspaceSlug, projectKey } = await params;
  const session = await auth();
  const { workspace, project } = await getProjectByKey(session!.user.id, workspaceSlug, projectKey);

  return <ProjectSettings workspaceId={workspace.id} workspaceSlug={workspace.slug} project={project} />;
}
