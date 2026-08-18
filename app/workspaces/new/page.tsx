"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createWorkspaceSchema, type CreateWorkspaceInput } from "@/lib/validations/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewWorkspacePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkspaceInput>({ resolver: zodResolver(createWorkspaceSchema) });

  const onSubmit = async (data: CreateWorkspaceInput) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create workspace");
      }
      const { workspace } = await res.json();
      router.push(`/${workspace.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-surface-0 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 text-text-primary">
        <span className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-accent text-accent-foreground font-bold text-sm">
          PF
        </span>
        <span className="text-lg font-semibold tracking-tight">PixelForge</span>
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Create a workspace</CardTitle>
          <CardDescription>This is where your team&apos;s projects will live.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Workspace name</Label>
              <Input id="name" placeholder="PixelForge" {...register("name")} />
              {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="icon">Icon (emoji, optional)</Label>
              <Input id="icon" placeholder="🛠️" {...register("icon")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" placeholder="Software, FiveM, and personal projects" {...register("description")} />
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Creating…" : "Create workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
