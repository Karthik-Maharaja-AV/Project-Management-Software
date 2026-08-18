"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations/project";
import { useCreateProject } from "@/hooks/use-projects";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function deriveKey(name: string) {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 6)
    .toUpperCase();
}

export function CreateProjectDialog({
  workspaceId,
  workspaceSlug,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  workspaceSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const createProject = useCreateProject(workspaceId);
  const [keyEdited, setKeyEdited] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({ resolver: zodResolver(createProjectSchema) });

  const name = watch("name");

  useEffect(() => {
    if (!keyEdited && name) setValue("key", deriveKey(name));
  }, [name, keyEdited, setValue]);

  useEffect(() => {
    if (!open) {
      reset();
      setKeyEdited(false);
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      const { project } = await createProject.mutateAsync(data);
      toast.success(`${project.name} created`);
      onOpenChange(false);
      router.refresh();
      router.push(`/${workspaceSlug}/${project.key}/board` as never);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-4 px-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" placeholder="FiveM Delivery System" {...register("name")} />
              {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="key">Issue key prefix</Label>
              <Input
                id="key"
                placeholder="FDJ"
                {...register("key", {
                  onChange: () => setKeyEdited(true),
                })}
                className="font-mono uppercase"
              />
              {errors.key && <p className="text-xs text-danger">{errors.key.message}</p>}
              <p className="text-xs text-text-tertiary">Issues will be numbered like {watch("key") || "KEY"}-1.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" placeholder="What's this project about?" {...register("description")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
