import { EpicDetail } from "@/components/epics/epic-detail";

export default async function EpicPage({
  params,
}: {
  params: Promise<{ epicId: string }>;
}) {
  const { epicId } = await params;
  return <EpicDetail epicId={epicId} />;
}
