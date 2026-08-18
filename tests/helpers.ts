import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const RUN_ID = crypto.randomBytes(4).toString("hex");
let counter = 0;

export function uniqueSuffix() {
  counter += 1;
  return `${RUN_ID}${counter}`;
}

export async function createTestUser(namePrefix = "Test User") {
  const suffix = uniqueSuffix();
  const passwordHash = await bcrypt.hash("password123", 4);
  return prisma.user.create({
    data: {
      name: `${namePrefix} ${suffix}`,
      username: `testuser${suffix}`,
      email: `testuser${suffix}@vitest.local`,
      passwordHash,
    },
  });
}

export async function createTestWorkspace(ownerId: string) {
  const suffix = uniqueSuffix();
  return prisma.workspace.create({
    data: {
      name: `Test Workspace ${suffix}`,
      slug: `test-workspace-${suffix}`,
      ownerId,
      members: { create: { userId: ownerId, role: "OWNER" } },
    },
  });
}

export async function createTestProject(workspaceId: string, ownerId: string, keyPrefix = "TST") {
  const suffix = uniqueSuffix().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4) || "X";
  return prisma.project.create({
    data: {
      workspaceId,
      name: `Test Project ${suffix}`,
      key: `${keyPrefix}${suffix}`.slice(0, 10),
      members: { create: { userId: ownerId, role: "LEAD" } },
    },
  });
}

/** Deletes everything created for a workspace/user set. Call from afterAll/afterEach. */
export async function cleanupWorkspace(workspaceId: string) {
  await prisma.workspace.deleteMany({ where: { id: workspaceId } });
}

export async function cleanupUser(userId: string) {
  await prisma.user.deleteMany({ where: { id: userId } });
}
