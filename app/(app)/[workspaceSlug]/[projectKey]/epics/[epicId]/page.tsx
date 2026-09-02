import { EpicDetail } from "@/components/epics/epic-detail";

export default async function EpicPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; epicId: string }>;
}) {
  const { workspaceSlug, epicId } = await params;
  return <EpicDetail epicId={epicId} workspaceSlug={workspaceSlug} />;
}
