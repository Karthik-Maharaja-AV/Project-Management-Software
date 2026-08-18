import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthzError } from "@/lib/authz";
import { ApiError } from "@/lib/errors";
import { getProjectByKey } from "@/lib/services/project.service";
import { ProjectHeader } from "@/components/layout/project-header";

async function loadProjectData(userId: string, workspaceSlug: string, projectKey: string) {
  try {
    return await getProjectByKey(userId, workspaceSlug, projectKey);
  } catch (err) {
    if (err instanceof AuthzError || err instanceof ApiError) return null;
    throw err;
  }
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string; projectKey: string }>;
}) {
  const { workspaceSlug, projectKey } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const data = await loadProjectData(session.user.id, workspaceSlug, projectKey);
  if (!data) notFound();

  return (
    <div className="flex h-full flex-col">
      <ProjectHeader workspaceSlug={data.workspace.slug} project={data.project} />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
