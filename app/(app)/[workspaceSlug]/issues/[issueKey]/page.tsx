import { IssueDetailView } from "@/components/issues/issue-detail-view";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; issueKey: string }>;
}) {
  const { workspaceSlug, issueKey } = await params;
  return <IssueDetailView workspaceSlug={workspaceSlug} issueKey={issueKey.toUpperCase()} />;
}
