"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    const res = await fetch("/api/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    setMessage(body.message);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reset your password</CardTitle>
        <CardDescription>We&apos;ll generate a reset link for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {message ? (
          <p className="text-sm text-text-secondary">{message}</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <p className="mt-5 text-center text-sm text-text-tertiary">
          <Link href="/login" className="text-accent hover:underline">
            Back to log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
