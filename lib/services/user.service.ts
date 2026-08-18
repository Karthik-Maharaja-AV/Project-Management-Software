import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import type { RegisterInput, ResetPasswordInput, UpdateProfileInput } from "@/lib/validations/auth";

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function registerUser(input: RegisterInput) {
  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email } }),
    prisma.user.findUnique({ where: { username: input.username.toLowerCase() } }),
  ]);

  if (existingEmail) throw new ApiError("An account with this email already exists", 409);
  if (existingUsername) throw new ApiError("This username is taken", 409);

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username.toLowerCase(),
      name: input.name,
      passwordHash,
    },
    select: { id: true, email: true, username: true, name: true, avatarUrl: true, createdAt: true },
  });

  return user;
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always behave the same whether or not the account exists, to avoid leaking which emails are registered.
  if (!user) return null;

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  return { token, user };
}

export async function resetPassword(input: ResetPasswordInput) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token: input.token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new ApiError("This reset link is invalid or has expired", 400);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  if (input.username) {
    const existing = await prisma.user.findUnique({ where: { username: input.username.toLowerCase() } });
    if (existing && existing.id !== userId) {
      throw new ApiError("This username is taken", 409);
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.username !== undefined ? { username: input.username.toLowerCase() } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
}

export async function getPublicUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
  if (!user) throw new ApiError("User not found", 404);
  return user;
}
