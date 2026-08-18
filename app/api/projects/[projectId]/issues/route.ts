import { NextResponse } from "next/server";
import { requireUser, withApiError } from "@/lib/api-utils";
import { createIssueSchema, issueFilterSchema } from "@/lib/validations/issue";
import { createIssue, listIssues } from "@/lib/services/issue.service";

type Params = { params: Promise<{ projectId: string }> };

export const GET = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const url = new URL(req.url);

  const filters = issueFilterSchema.parse({
    status: url.searchParams.getAll("status").length ? url.searchParams.getAll("status") : undefined,
    assigneeId: url.searchParams.getAll("assigneeId").length ? url.searchParams.getAll("assigneeId") : undefined,
    priority: url.searchParams.getAll("priority").length ? url.searchParams.getAll("priority") : undefined,
    type: url.searchParams.getAll("type").length ? url.searchParams.getAll("type") : undefined,
    labelId: url.searchParams.getAll("labelId").length ? url.searchParams.getAll("labelId") : undefined,
    sprintId: url.searchParams.get("sprintId") ?? undefined,
    epicId: url.searchParams.get("epicId") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
  });

  const issues = await listIssues(user.id, projectId, filters);
  return NextResponse.json({ issues });
});

export const POST = withApiError(async (req: Request, { params }: Params) => {
  const user = await requireUser();
  const { projectId } = await params;
  const body = await req.json();
  const input = createIssueSchema.parse({ ...body, projectId });
  const issue = await createIssue(user.id, input);
  return NextResponse.json({ issue }, { status: 201 });
});
