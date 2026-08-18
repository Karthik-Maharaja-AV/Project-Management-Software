import { prisma } from "@/lib/prisma";
import { registerUser } from "@/lib/services/user.service";
import { createWorkspace } from "@/lib/services/workspace.service";
import { createProject } from "@/lib/services/project.service";
import { createEpic } from "@/lib/services/epic.service";
import { createSprint, startSprint, completeSprint } from "@/lib/services/sprint.service";
import { createIssue } from "@/lib/services/issue.service";
import { createComment } from "@/lib/services/comment.service";
import type { IssueStatus, IssuePriority, IssueType } from "@prisma/client";

const SEED_EMAIL_DOMAIN = "@pixelforge.dev";
const PASSWORD = "password123";

const PEOPLE = [
  { name: "Karthik", username: "karthik" },
  { name: "Arun", username: "arun" },
  { name: "Vishnu", username: "vishnu" },
  { name: "Divya", username: "divya" },
  { name: "Rahul", username: "rahul" },
  { name: "Sanjana", username: "sanjana" },
] as const;

async function resetPreviousSeed() {
  await prisma.workspace.deleteMany({ where: { slug: "pixelforge" } });
  await prisma.user.deleteMany({ where: { email: { endsWith: SEED_EMAIL_DOMAIN } } });
}

async function main() {
  console.log("Resetting previous seed data…");
  await resetPreviousSeed();

  console.log("Creating users…");
  const users: Record<string, Awaited<ReturnType<typeof registerUser>>> = {};
  for (const person of PEOPLE) {
    users[person.username] = await registerUser({
      name: person.name,
      username: person.username,
      email: `${person.username}${SEED_EMAIL_DOMAIN}`,
      password: PASSWORD,
    });
  }
  const [karthik, arun, vishnu, divya, rahul, sanjana] = PEOPLE.map((p) => users[p.username]);

  console.log("Creating workspace…");
  const workspace = await createWorkspace(karthik.id, {
    name: "PixelForge",
    icon: "🛠️",
    description: "Software, FiveM, and personal projects for the crew.",
  });

  for (const [user, role] of [
    [arun, "ADMIN"],
    [vishnu, "MEMBER"],
    [divya, "MEMBER"],
    [rahul, "GUEST"],
    [sanjana, "MEMBER"],
  ] as const) {
    await prisma.workspaceMember.create({ data: { workspaceId: workspace.id, userId: user.id, role } });
  }

  console.log("Creating projects…");
  const fdj = await createProject(karthik.id, workspace.id, {
    name: "FiveM Delivery System",
    key: "FDJ",
    description: "A delivery job script for our FiveM server, with skills, XP, and an admin tablet.",
  });
  const alo = await createProject(karthik.id, workspace.id, {
    name: "AI Learning OS",
    key: "ALO",
    description: "A personal operating system for learning, with an AI tutor and course generator.",
  });
  const port = await createProject(karthik.id, workspace.id, {
    name: "Personal Portfolio",
    key: "PORT",
    description: "Karthik's personal site and portfolio.",
  });

  for (const [user, role] of [
    [arun, "MEMBER"],
    [vishnu, "MEMBER"],
    [rahul, "VIEWER"],
  ] as const) {
    await prisma.projectMember.create({ data: { projectId: fdj.id, userId: user.id, role } });
  }
  for (const [user, role] of [
    [divya, "MEMBER"],
    [sanjana, "MEMBER"],
  ] as const) {
    await prisma.projectMember.create({ data: { projectId: alo.id, userId: user.id, role } });
  }
  await prisma.projectMember.create({ data: { projectId: port.id, userId: arun.id, role: "MEMBER" } });

  async function labelMap(projectId: string) {
    const labels = await prisma.label.findMany({ where: { projectId } });
    return Object.fromEntries(labels.map((l) => [l.name, l.id])) as Record<string, string>;
  }
  const fdjLabels = await labelMap(fdj.id);
  const aloLabels = await labelMap(alo.id);
  const portLabels = await labelMap(port.id);

  console.log("Creating epics…");
  const fdjEpicDelivery = await createEpic(karthik.id, fdj.id, {
    name: "Delivery Job System",
    description: "Core loop: accept a job, drive to pickup, deliver, get paid.",
    color: "#e2661c",
  });
  const fdjEpicSkills = await createEpic(karthik.id, fdj.id, {
    name: "Skill & XP System",
    description: "Leveling, XP gain, and unlockable perks for drivers.",
    color: "#9256d9",
  });
  const aloEpicTutor = await createEpic(karthik.id, alo.id, {
    name: "AI Tutor",
    description: "Conversational tutor that adapts to what the learner is studying.",
    color: "#1f8a9e",
  });

  console.log("Creating sprints…");
  const fdjSprint0 = await createSprint(karthik.id, fdj.id, { name: "Sprint 0", goal: "Project setup and scaffolding." });
  await startSprint(karthik.id, fdjSprint0.id);
  await createIssue(karthik.id, {
    projectId: fdj.id,
    title: "Scaffold FiveM resource structure",
    type: "TASK",
    status: "DONE",
    priority: "MEDIUM",
    assigneeId: karthik.id,
    sprintId: fdjSprint0.id,
    storyPoints: 2,
  });
  await createIssue(arun.id, {
    projectId: fdj.id,
    title: "Set up shared database connection module",
    type: "TASK",
    status: "DONE",
    priority: "MEDIUM",
    assigneeId: arun.id,
    sprintId: fdjSprint0.id,
    storyPoints: 3,
  });
  await completeSprint(karthik.id, fdjSprint0.id);

  const fdjSprint1 = await createSprint(karthik.id, fdj.id, {
    name: "Sprint 1",
    goal: "Ship the core delivery loop end to end.",
  });
  await startSprint(karthik.id, fdjSprint1.id);

  const aloSprint1 = await createSprint(karthik.id, alo.id, { name: "Sprint 1", goal: "Get a basic tutor chat working." });
  await startSprint(karthik.id, aloSprint1.id);

  console.log("Creating issues…");

  type SeedIssue = {
    title: string;
    type: IssueType;
    status: IssueStatus;
    priority: IssuePriority;
    assignee?: (typeof karthik) | null;
    epicId?: string;
    sprintId?: string;
    labelIds?: string[];
    storyPoints?: number;
    dueDaysFromNow?: number;
    parentId?: string;
  };

  async function seedIssues(projectId: string, items: SeedIssue[]) {
    const created: Awaited<ReturnType<typeof createIssue>>[] = [];
    for (const item of items) {
      const issue = await createIssue(karthik.id, {
        projectId,
        title: item.title,
        type: item.type,
        status: item.status,
        priority: item.priority,
        assigneeId: item.assignee?.id,
        epicId: item.epicId,
        sprintId: item.sprintId,
        labelIds: item.labelIds,
        storyPoints: item.storyPoints,
        dueDate: item.dueDaysFromNow != null ? new Date(Date.now() + item.dueDaysFromNow * 86400000).toISOString() : undefined,
        parentId: item.parentId,
      });
      created.push(issue);
    }
    return created;
  }

  const fdjIssues = await seedIssues(fdj.id, [
    { title: "Design delivery job database schema", type: "TASK", status: "DONE", priority: "HIGH", assignee: karthik, epicId: fdjEpicDelivery.id, sprintId: fdjSprint1.id, labelIds: [fdjLabels.backend], storyPoints: 3 },
    { title: "Create delivery job server events", type: "FEATURE", status: "DONE", priority: "HIGH", assignee: arun, epicId: fdjEpicDelivery.id, sprintId: fdjSprint1.id, labelIds: [fdjLabels.backend], storyPoints: 5 },
    { title: "Build delivery location blips and markers", type: "FEATURE", status: "IN_REVIEW", priority: "MEDIUM", assignee: vishnu, epicId: fdjEpicDelivery.id, sprintId: fdjSprint1.id, labelIds: [fdjLabels.frontend], storyPoints: 3 },
    { title: "Create job UI (accept/decline/progress)", type: "FEATURE", status: "IN_PROGRESS", priority: "HIGH", assignee: arun, epicId: fdjEpicDelivery.id, sprintId: fdjSprint1.id, labelIds: [fdjLabels.frontend, fdjLabels.fivem].filter(Boolean), storyPoints: 5, dueDaysFromNow: 3 },
    { title: "Test multiplayer sync for delivery state", type: "TASK", status: "TODO", priority: "MEDIUM", assignee: vishnu, epicId: fdjEpicDelivery.id, sprintId: fdjSprint1.id, labelIds: [fdjLabels.backend] },
    { title: "Fix delivery marker not clearing after drop-off", type: "BUG", status: "TODO", priority: "URGENT", assignee: karthik, epicId: fdjEpicDelivery.id, sprintId: fdjSprint1.id, labelIds: [fdjLabels.bug], dueDaysFromNow: 1 },
    { title: "Vehicle spawns inside building on some deliveries", type: "BUG", status: "BACKLOG", priority: "HIGH", epicId: fdjEpicDelivery.id, labelIds: [fdjLabels.bug] },
    { title: "Add payout calculation based on distance", type: "FEATURE", status: "BACKLOG", priority: "MEDIUM", epicId: fdjEpicDelivery.id, labelIds: [fdjLabels.backend] },
    { title: "Create XP gain on delivery completion", type: "FEATURE", status: "DONE", priority: "MEDIUM", assignee: karthik, epicId: fdjEpicSkills.id, storyPoints: 2 },
    { title: "Design skill tree UI", type: "TASK", status: "IN_PROGRESS", priority: "LOW", assignee: divya, epicId: fdjEpicSkills.id, labelIds: [fdjLabels.frontend] },
    { title: "Create skill system database schema", type: "TASK", status: "DONE", priority: "MEDIUM", assignee: karthik, epicId: fdjEpicSkills.id, storyPoints: 2 },
    { title: "Add level-up notification popup", type: "IMPROVEMENT", status: "BACKLOG", priority: "LOW", epicId: fdjEpicSkills.id, labelIds: [fdjLabels.frontend] },
    { title: "Build admin tablet job overview", type: "FEATURE", status: "BACKLOG", priority: "MEDIUM", labelIds: [fdjLabels.frontend] },
    { title: "Add ability to force-cancel a stuck job (admin)", type: "FEATURE", status: "BACKLOG", priority: "LOW" },
    { title: "Write documentation for server event API", type: "TASK", status: "BACKLOG", priority: "LOW", labelIds: [fdjLabels.documentation] },
    { title: "Investigate occasional server crash on job accept", type: "BUG", status: "TODO", priority: "URGENT", assignee: arun, labelIds: [fdjLabels.bug] },
  ]);

  const aloIssues = await seedIssues(alo.id, [
    { title: "Set up conversation state management", type: "TASK", status: "DONE", priority: "HIGH", assignee: divya, epicId: aloEpicTutor.id, sprintId: aloSprint1.id, labelIds: [aloLabels.backend], storyPoints: 3 },
    { title: "Integrate LLM tutor prompt pipeline", type: "FEATURE", status: "IN_PROGRESS", priority: "HIGH", assignee: sanjana, epicId: aloEpicTutor.id, sprintId: aloSprint1.id, labelIds: [aloLabels.backend], storyPoints: 5, dueDaysFromNow: 5 },
    { title: "Build chat UI for tutor sessions", type: "FEATURE", status: "IN_PROGRESS", priority: "MEDIUM", assignee: divya, epicId: aloEpicTutor.id, sprintId: aloSprint1.id, labelIds: [aloLabels.frontend], storyPoints: 3 },
    { title: "Train intent classifier for study topics", type: "TASK", status: "TODO", priority: "MEDIUM", assignee: sanjana, epicId: aloEpicTutor.id, sprintId: aloSprint1.id },
    { title: "Tutor forgets context after 10 messages", type: "BUG", status: "TODO", priority: "HIGH", epicId: aloEpicTutor.id, labelIds: [aloLabels.bug] },
    { title: "Design course generator data model", type: "TASK", status: "BACKLOG", priority: "MEDIUM", labelIds: [aloLabels.backend] },
    { title: "Generate a course outline from a topic prompt", type: "FEATURE", status: "BACKLOG", priority: "MEDIUM" },
    { title: "Add progress tracking dashboard", type: "FEATURE", status: "BACKLOG", priority: "LOW", labelIds: [aloLabels.frontend] },
    { title: "Write architecture overview doc", type: "TASK", status: "BACKLOG", priority: "LOW", labelIds: [aloLabels.documentation] },
    { title: "Spike: local embeddings vs hosted API", type: "STORY", status: "BACKLOG", priority: "LOW" },
  ]);

  const portIssues = await seedIssues(port.id, [
    { title: "Redesign homepage hero section", type: "IMPROVEMENT", status: "IN_PROGRESS", priority: "MEDIUM", assignee: karthik, labelIds: [portLabels.frontend], storyPoints: 3 },
    { title: "Add dark mode toggle", type: "FEATURE", status: "DONE", priority: "LOW", assignee: karthik, storyPoints: 2 },
    { title: "Fix mobile nav overlapping logo", type: "BUG", status: "TODO", priority: "MEDIUM", assignee: arun, labelIds: [portLabels.bug] },
    { title: "Write case study for FiveM Delivery System", type: "TASK", status: "BACKLOG", priority: "LOW", labelIds: [portLabels.documentation] },
    { title: "Add contact form with email notifications", type: "FEATURE", status: "BACKLOG", priority: "MEDIUM" },
    { title: "Optimize image loading (LCP)", type: "IMPROVEMENT", status: "BACKLOG", priority: "LOW" },
  ]);

  console.log(`Created ${fdjIssues.length + aloIssues.length + portIssues.length} issues.`);

  console.log("Adding subtasks…");
  await createIssue(arun.id, {
    projectId: fdj.id,
    title: "Wire up job accept button to server event",
    type: "TASK",
    status: "DONE",
    parentId: fdjIssues[3].id,
  });
  await createIssue(vishnu.id, {
    projectId: fdj.id,
    title: "Add progress bar to job UI",
    type: "TASK",
    status: "IN_PROGRESS",
    parentId: fdjIssues[3].id,
  });

  console.log("Adding comments…");
  await createComment(arun.id, fdjIssues[3].id, "Started on this — the accept/decline flow is working locally.");
  await createComment(karthik.id, fdjIssues[3].id, "Nice. @vishnu can you take a look at the progress bar styling once it's in?");
  await createComment(vishnu.id, fdjIssues[3].id, "On it, should have something to review by tomorrow.");
  await createComment(karthik.id, fdjIssues[5].id, "This is blocking sprint completion, bumping to urgent.");
  await createComment(sanjana.id, aloIssues[1].id, "The pipeline is mostly done, just tuning the system prompt now.");
  await createComment(karthik.id, portIssues[1].id, "Looks great in dark mode, shipping this.");

  console.log("Seeding a few recently-viewed issues…");
  await prisma.recentlyViewed.createMany({
    data: [
      { userId: karthik.id, issueId: fdjIssues[3].id },
      { userId: karthik.id, issueId: fdjIssues[5].id },
      { userId: karthik.id, issueId: aloIssues[1].id },
    ],
  });

  console.log("\nSeed complete.");
  console.log("Workspace: PixelForge (/pixelforge)");
  console.log("\nLogin with any of these accounts (all use the same password):");
  for (const person of PEOPLE) {
    console.log(`  ${person.username}${SEED_EMAIL_DOMAIN}  /  ${PASSWORD}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
