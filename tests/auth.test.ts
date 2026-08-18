import { describe, it, expect, afterAll } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/lib/services/user.service";
import { ApiError } from "@/lib/errors";
import { uniqueSuffix } from "./helpers";

describe("auth: registration", () => {
  const createdUserIds: string[] = [];

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("registers a new user with a hashed password", async () => {
    const suffix = uniqueSuffix();
    const user = await registerUser({
      name: "Ada Lovelace",
      username: `ada${suffix}`,
      email: `ada${suffix}@vitest.local`,
      password: "password123",
    });
    createdUserIds.push(user.id);

    expect(user.email).toBe(`ada${suffix}@vitest.local`);

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).not.toBe("password123");
    expect(await bcrypt.compare("password123", stored.passwordHash)).toBe(true);
  });

  it("rejects a duplicate email", async () => {
    const suffix = uniqueSuffix();
    const email = `dupe${suffix}@vitest.local`;
    const first = await registerUser({ name: "First", username: `first${suffix}`, email, password: "password123" });
    createdUserIds.push(first.id);

    await expect(
      registerUser({ name: "Second", username: `second${suffix}`, email, password: "password123" }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("rejects a duplicate username", async () => {
    const suffix = uniqueSuffix();
    const username = `dupeuser${suffix}`;
    const first = await registerUser({
      name: "First",
      username,
      email: `firstemail${suffix}@vitest.local`,
      password: "password123",
    });
    createdUserIds.push(first.id);

    await expect(
      registerUser({
        name: "Second",
        username,
        email: `secondemail${suffix}@vitest.local`,
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
