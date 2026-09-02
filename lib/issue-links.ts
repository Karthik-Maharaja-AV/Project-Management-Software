/** Client-side counterpart to lib/services/issue.service.ts's issueUrl() — keep in sync. */
export function issueHref(workspaceSlug: string, issueKey: string) {
  return `/${workspaceSlug}/issues/${issueKey}`;
}
