import { z } from "zod";

const usernameRegex = /^[a-z0-9_-]+$/i;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24)
    .regex(usernameRegex, "Only letters, numbers, - and _ allowed"),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email().trim().toLowerCase(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  username: z.string().trim().min(3).max(24).regex(usernameRegex).optional(),
  bio: z.string().trim().max(280).optional().nullable(),
  avatarUrl: z.string().trim().max(2048).optional().nullable(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
