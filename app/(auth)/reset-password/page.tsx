"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "This reset link is invalid or has expired");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1500);
  };

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm text-text-secondary">
          This reset link is missing a token. Request a new one from the{" "}
          <Link href="/forgot-password" className="text-accent hover:underline">
            forgot password
          </Link>{" "}
          page.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <p className="text-sm text-success">Password updated. Redirecting to log in…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <input type="hidden" {...register("token")} value={token} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" placeholder="At least 8 characters" {...register("password")} />
              {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
