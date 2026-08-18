import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthzError } from "@/lib/authz";
import { getWorkspaceDetail, listUserWorkspaces } from "@/lib/services/workspace.service";
import { listProjects } from "@/lib/services/project.service";
import { AppShell } from "@/components/layout/app-shell";

async function loadWorkspaceData(userId: string, workspaceSlug: string) {
  try {
    const { workspace } = await getWorkspaceDetail(userId, workspaceSlug);
    const [workspaces, projects] = await Promise.all([
      listUserWorkspaces(userId),
      listProjects(userId, workspace.id),
    ]);
    return { workspace, workspaces, projects };
  } catch (err) {
    if (err instanceof AuthzError) return null;
    throw err;
  }
}

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const data = await loadWorkspaceData(session.user.id, workspaceSlug);
  if (!data) notFound();

  return (
    <AppShell workspace={data.workspace} workspaces={data.workspaces} projects={data.projects}>
      {children}
    </AppShell>
  );
}
