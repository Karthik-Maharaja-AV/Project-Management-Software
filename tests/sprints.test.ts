import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createIssue, getIssue } from "@/lib/services/issue.service";
import { completeSprint, createSprint, startSprint } from "@/lib/services/sprint.service";
import { createTestUser, createTestWorkspace, createTestProject, cleanupWorkspace, cleanupUser } from "./helpers";

describe("sprints: lifecycle", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let workspace: Awaited<ReturnType<typeof createTestWorkspace>>;
  let project: Awaited<ReturnType<typeof createTestProject>>;

  beforeAll(async () => {
    owner = await createTestUser("Sprint Owner");
    workspace = await createTestWorkspace(owner.id);
    project = await createTestProject(workspace.id, owner.id, "SPR");
  });

  afterAll(async () => {
    await cleanupWorkspace(workspace.id);
    await cleanupUser(owner.id);
  });

  async function completeAnyActiveSprint() {
    const active = await prisma.sprint.findFirst({ where: { projectId: project.id, status: "ACTIVE" } });
    if (active) await completeSprint(owner.id, active.id);
  }

  it("starts a planned sprint and rejects starting it twice", async () => {
    const sprint = await createSprint(owner.id, project.id, { name: "Sprint A" });
    const started = await startSprint(owner.id, sprint.id);
    expect(started.status).toBe("ACTIVE");

    await expect(startSprint(owner.id, sprint.id)).rejects.toThrow();
    await completeSprint(owner.id, sprint.id);
  });

  it("refuses to start a second sprint while one is already active", async () => {
    const sprintA = await createSprint(owner.id, project.id, { name: "Sprint B" });
    await startSprint(owner.id, sprintA.id);

    const sprintB = await createSprint(owner.id, project.id, { name: "Sprint C" });
    await expect(startSprint(owner.id, sprintB.id)).rejects.toThrow();

    await completeSprint(owner.id, sprintA.id);
  });

  it("moves an incomplete issue back to the backlog when its sprint completes", async () => {
    await completeAnyActiveSprint();
    const sprint = await createSprint(owner.id, project.id, { name: "Sprint D" });
    const issue = await createIssue(owner.id, {
      projectId: project.id,
      title: "Carries over",
      sprintId: sprint.id,
      status: "TODO",
    });

    await startSprint(owner.id, sprint.id);
    await completeSprint(owner.id, sprint.id);

    const rolledOver = await getIssue(owner.id, issue.id);
    expect(rolledOver.sprintId).toBeNull();
    expect(rolledOver.status).toBe("BACKLOG");
  });

  it("keeps a DONE issue attached to its completed sprint", async () => {
    await completeAnyActiveSprint();
    const sprint = await createSprint(owner.id, project.id, { name: "Sprint E" });
    const issue = await createIssue(owner.id, {
      projectId: project.id,
      title: "Finished work",
      sprintId: sprint.id,
      status: "DONE",
    });

    await startSprint(owner.id, sprint.id);
    await completeSprint(owner.id, sprint.id);

    const finished = await getIssue(owner.id, issue.id);
    expect(finished.sprintId).toBe(sprint.id);
    expect(finished.status).toBe("DONE");
  });
});
