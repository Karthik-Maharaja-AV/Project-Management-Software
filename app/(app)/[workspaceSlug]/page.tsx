import { auth } from "@/lib/auth";
import { getWorkspaceDetail } from "@/lib/services/workspace.service";
import { listProjects } from "@/lib/services/project.service";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";

export default async function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await auth();
  const { workspace } = await getWorkspaceDetail(session!.user.id, workspaceSlug);
  const projects = await listProjects(session!.user.id, workspace.id);

  return <WorkspaceDashboard workspaceId={workspace.id} workspaceSlug={workspace.slug} projects={projects} />;
}
