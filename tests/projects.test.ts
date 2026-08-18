import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { addProjectMember, createProject, listProjectMembers, removeProjectMember } from "@/lib/services/project.service";
import { ApiError } from "@/lib/errors";
import { createTestUser, createTestWorkspace, cleanupWorkspace, cleanupUser } from "./helpers";

describe("projects: creation and membership", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let friend: Awaited<ReturnType<typeof createTestUser>>;
  let workspace: Awaited<ReturnType<typeof createTestWorkspace>>;

  beforeAll(async () => {
    owner = await createTestUser("Project Owner");
    friend = await createTestUser("Friend");
    workspace = await createTestWorkspace(owner.id);
    await prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId: friend.id, role: "MEMBER" } });
  });

  afterAll(async () => {
    await cleanupWorkspace(workspace.id);
    await cleanupUser(owner.id);
    await cleanupUser(friend.id);
  });

  it("creates a project with default labels and the creator as lead", async () => {
    const project = await createProject(owner.id, workspace.id, { name: "Delivery Job", key: "DLV" });
    const members = await listProjectMembers(owner.id, project.id);
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(owner.id);
    expect(members[0].role).toBe("LEAD");

    const labels = await prisma.label.findMany({ where: { projectId: project.id } });
    expect(labels.length).toBeGreaterThan(0);
  });

  it("adds and removes a workspace member from the project", async () => {
    const project = await createProject(owner.id, workspace.id, { name: "Second Project", key: "SEC" });
    const added = await addProjectMember(owner.id, project.id, { userId: friend.id, role: "MEMBER" });
    expect(added.userId).toBe(friend.id);

    let members = await listProjectMembers(owner.id, project.id);
    expect(members.map((m) => m.userId)).toContain(friend.id);

    await removeProjectMember(owner.id, project.id, friend.id);
    members = await listProjectMembers(owner.id, project.id);
    expect(members.map((m) => m.userId)).not.toContain(friend.id);
  });

  it("refuses to add someone who isn't a workspace member", async () => {
    const outsider = await createTestUser("Not In Workspace");
    const project = await createProject(owner.id, workspace.id, { name: "Third Project", key: "THI" });
    await expect(addProjectMember(owner.id, project.id, { userId: outsider.id, role: "MEMBER" })).rejects.toBeInstanceOf(
      ApiError,
    );
    await cleanupUser(outsider.id);
  });
});
