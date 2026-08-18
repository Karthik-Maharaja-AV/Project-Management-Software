import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { AuthzError, requireProjectAccess, requireWorkspaceRole } from "@/lib/authz";
import { updateWorkspace } from "@/lib/services/workspace.service";
import { createProject, listProjects } from "@/lib/services/project.service";
import { createTestUser, createTestWorkspace, createTestProject, cleanupWorkspace, cleanupUser } from "./helpers";

describe("authz: workspace isolation", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let outsider: Awaited<ReturnType<typeof createTestUser>>;
  let member: Awaited<ReturnType<typeof createTestUser>>;
  let workspace: Awaited<ReturnType<typeof createTestWorkspace>>;
  let project: Awaited<ReturnType<typeof createTestProject>>;

  beforeAll(async () => {
    owner = await createTestUser("Owner");
    outsider = await createTestUser("Outsider");
    member = await createTestUser("Member");
    workspace = await createTestWorkspace(owner.id);
    project = await createTestProject(workspace.id, owner.id);
    await prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId: member.id, role: "MEMBER" } });
  });

  afterAll(async () => {
    await cleanupWorkspace(workspace.id);
    await cleanupUser(owner.id);
    await cleanupUser(outsider.id);
    await cleanupUser(member.id);
  });

  it("denies a non-member access to a workspace", async () => {
    await expect(requireWorkspaceRole(outsider.id, workspace.id, "GUEST")).rejects.toBeInstanceOf(AuthzError);
  });

  it("denies a non-member access to a project inside that workspace", async () => {
    await expect(requireProjectAccess(outsider.id, project.id, "GUEST")).rejects.toBeInstanceOf(AuthzError);
  });

  it("denies a non-member from listing the workspace's projects", async () => {
    await expect(listProjects(outsider.id, workspace.id)).rejects.toBeInstanceOf(AuthzError);
  });

  it("allows a member GUEST-level access but denies ADMIN-only actions", async () => {
    await expect(requireWorkspaceRole(member.id, workspace.id, "GUEST")).resolves.toBeTruthy();
    await expect(updateWorkspace(member.id, workspace.id, { name: "Hijacked" })).rejects.toBeInstanceOf(AuthzError);
  });

  it("allows the owner to perform ADMIN-only actions", async () => {
    const updated = await updateWorkspace(owner.id, workspace.id, { name: "Renamed by owner" });
    expect(updated.name).toBe("Renamed by owner");
  });

  it("rejects creating a project with a key already used in the workspace", async () => {
    await createProject(owner.id, workspace.id, { name: "Dup", key: "DUPKEY" });
    await expect(createProject(owner.id, workspace.id, { name: "Dup 2", key: "DUPKEY" })).rejects.toThrow();
  });
});
