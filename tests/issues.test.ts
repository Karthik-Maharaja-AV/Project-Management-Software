import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createIssue, deleteIssue, getIssue, updateIssue } from "@/lib/services/issue.service";
import { createTestUser, createTestWorkspace, createTestProject, cleanupWorkspace, cleanupUser } from "./helpers";

describe("issues: CRUD and lifecycle", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let assignee: Awaited<ReturnType<typeof createTestUser>>;
  let workspace: Awaited<ReturnType<typeof createTestWorkspace>>;
  let project: Awaited<ReturnType<typeof createTestProject>>;

  beforeAll(async () => {
    owner = await createTestUser("Reporter");
    assignee = await createTestUser("Assignee");
    workspace = await createTestWorkspace(owner.id);
    project = await createTestProject(workspace.id, owner.id, "ISS");
    await prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId: assignee.id, role: "MEMBER" } });
    await prisma.projectMember.create({ data: { projectId: project.id, userId: assignee.id, role: "MEMBER" } });
  });

  afterAll(async () => {
    await cleanupWorkspace(workspace.id);
    await cleanupUser(owner.id);
    await cleanupUser(assignee.id);
  });

  it("assigns sequential per-project issue numbers", async () => {
    const issue1 = await createIssue(owner.id, { projectId: project.id, title: "First issue" });
    const issue2 = await createIssue(owner.id, { projectId: project.id, title: "Second issue" });

    expect(issue2.number).toBe(issue1.number + 1);
    expect(issue1.key).toBe(`${project.key}-${issue1.number}`);
  });

  it("creates an issue with defaults and lets the reporter update it", async () => {
    const issue = await createIssue(owner.id, { projectId: project.id, title: "Fix login bug", type: "BUG" });
    expect(issue.status).toBe("BACKLOG");
    expect(issue.reporterId).toBe(owner.id);

    const updated = await updateIssue(owner.id, issue.id, { status: "IN_PROGRESS" });
    expect(updated.status).toBe("IN_PROGRESS");
  });

  it("assigns an issue to a project member", async () => {
    const issue = await createIssue(owner.id, { projectId: project.id, title: "Needs an owner" });
    const updated = await updateIssue(owner.id, issue.id, { assigneeId: assignee.id });
    expect(updated.assigneeId).toBe(assignee.id);
    expect(updated.assignee?.id).toBe(assignee.id);
  });

  it("deletes an issue", async () => {
    const issue = await createIssue(owner.id, { projectId: project.id, title: "Temporary" });
    await deleteIssue(owner.id, issue.id);
    await expect(getIssue(owner.id, issue.id)).rejects.toThrow();
  });
});
