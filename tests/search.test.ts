import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createIssue } from "@/lib/services/issue.service";
import { searchWorkspace } from "@/lib/services/search.service";
import { createTestUser, createTestWorkspace, createTestProject, cleanupWorkspace, cleanupUser } from "./helpers";

describe("search: issue key and text", () => {
  let owner: Awaited<ReturnType<typeof createTestUser>>;
  let workspace: Awaited<ReturnType<typeof createTestWorkspace>>;
  let project: Awaited<ReturnType<typeof createTestProject>>;
  let issue: Awaited<ReturnType<typeof createIssue>>;

  beforeAll(async () => {
    owner = await createTestUser("Search Owner");
    workspace = await createTestWorkspace(owner.id);
    project = await createTestProject(workspace.id, owner.id, "SEA");
    issue = await createIssue(owner.id, { projectId: project.id, title: "Train intent classifier for search" });
  });

  afterAll(async () => {
    await cleanupWorkspace(workspace.id);
    await cleanupUser(owner.id);
  });

  it("finds an issue by its exact key", async () => {
    const results = await searchWorkspace(owner.id, workspace.id, issue.key);
    expect(results.issues).toHaveLength(1);
    expect(results.issues[0].key).toBe(issue.key);
  });

  it("finds an issue by a text fragment of its title", async () => {
    const results = await searchWorkspace(owner.id, workspace.id, "intent classifier");
    expect(results.issues.some((i) => i.id === issue.id)).toBe(true);
  });

  it("finds the project itself by name", async () => {
    const results = await searchWorkspace(owner.id, workspace.id, project.name);
    expect(results.projects.some((p) => p.id === project.id)).toBe(true);
  });

  it("returns nothing for an unrelated query", async () => {
    const results = await searchWorkspace(owner.id, workspace.id, "zzz-nonexistent-zzz");
    expect(results.issues).toHaveLength(0);
    expect(results.projects).toHaveLength(0);
  });
});
