import { auth } from "@/lib/auth";
import { getWorkspaceDetail } from "@/lib/services/workspace.service";
import { MembersSettings } from "@/components/workspace/members-settings";

export default async function MembersSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await auth();
  const { workspace, role } = await getWorkspaceDetail(session!.user.id, workspaceSlug);

  return (
    <MembersSettings
      workspaceId={workspace.id}
      currentUserId={session!.user.id}
      isOwner={role === "OWNER"}
      isAdmin={role === "OWNER" || role === "ADMIN"}
    />
  );
}
