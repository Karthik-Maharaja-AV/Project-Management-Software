import { auth } from "@/lib/auth";
import { getProjectByKey } from "@/lib/services/project.service";
import { ProjectDashboard } from "@/components/dashboard/project-dashboard";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectKey: string }>;
}) {
  const { workspaceSlug, projectKey } = await params;
  const session = await auth();
  const { project } = await getProjectByKey(session!.user.id, workspaceSlug, projectKey);

  return <ProjectDashboard projectId={project.id} />;
}
