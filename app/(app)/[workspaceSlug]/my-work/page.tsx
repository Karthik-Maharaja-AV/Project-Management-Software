import { auth } from "@/lib/auth";
import { getWorkspaceDetail } from "@/lib/services/workspace.service";
import { MyWorkView } from "@/components/my-work/my-work-view";

export default async function MyWorkPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await auth();
  const { workspace } = await getWorkspaceDetail(session!.user.id, workspaceSlug);

  return <MyWorkView workspaceId={workspace.id} />;
}
