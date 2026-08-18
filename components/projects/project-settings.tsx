"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { useUpdateProject, useArchiveProject } from "@/hooks/use-project";
import { useAddProjectMember, useProjectMembers, useRemoveProjectMember } from "@/hooks/use-project-members";
import { useWorkspaceMembers } from "@/hooks/use-workspace-members";
import { useCreateLabel, useDeleteLabel, useProjectLabels } from "@/hooks/use-labels";
import { randomLabelColor } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProjectSettings({
  workspaceId,
  workspaceSlug,
  project,
}: {
  workspaceId: string;
  workspaceSlug: string;
  project: { id: string; name: string; description: string | null; key: string };
}) {
  const router = useRouter();
  const updateProject = useUpdateProject(workspaceId);
  const archiveProject = useArchiveProject(workspaceId);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");

  const { data: projectMembers, isLoading: loadingMembers } = useProjectMembers(project.id);
  const { data: workspaceMembers } = useWorkspaceMembers(workspaceId);
  const addMember = useAddProjectMember(project.id);
  const removeMember = useRemoveProjectMember(project.id);

  const { data: labels, isLoading: loadingLabels } = useProjectLabels(project.id);
  const createLabel = useCreateLabel(project.id);
  const deleteLabel = useDeleteLabel(project.id);
  const [labelName, setLabelName] = useState("");

  const addableMembers = (workspaceMembers ?? []).filter(
    (wm) => !projectMembers?.some((pm) => pm.userId === wm.userId),
  );

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProject.mutateAsync({ projectId: project.id, input: { name, description: description || null } });
      toast.success("Project updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update project");
    }
  }

  async function handleArchive() {
    if (!confirm(`Archive ${project.name}? It will be hidden from the workspace.`)) return;
    await archiveProject.mutateAsync(project.id);
    toast.success("Project archived");
    router.push(`/${workspaceSlug}`);
  }

  async function createAndAddLabel(e: React.FormEvent) {
    e.preventDefault();
    if (!labelName.trim()) return;
    try {
      await createLabel.mutateAsync({ name: labelName.trim(), color: randomLabelColor() });
      setLabelName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create label");
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveDetails} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-name">Name</Label>
              <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-key">Key</Label>
              <Input id="proj-key" value={project.key} disabled className="font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea id="proj-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Button type="submit" disabled={updateProject.isPending}>
                {updateProject.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Anyone in the workspace can be added to this project.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {loadingMembers ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            projectMembers?.map((m) => (
              <div key={m.userId} className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 hover:bg-surface-2">
                <Avatar name={m.user.name} src={m.user.avatarUrl} size="sm" />
                <span className="flex-1 truncate text-sm text-text-primary">{m.user.name}</span>
                <Badge>{m.role.toLowerCase()}</Badge>
                <button onClick={() => removeMember.mutate(m.userId)} className="text-text-tertiary hover:text-danger">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
          {addableMembers.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="mt-2 w-fit">
                  <UserPlus className="size-3.5" /> Add member
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {addableMembers.map((m) => (
                  <DropdownMenuItem key={m.userId} onSelect={() => addMember.mutate({ userId: m.userId })}>
                    <Avatar name={m.user.name} src={m.user.avatarUrl} size="xs" />
                    {m.user.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Labels</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {loadingLabels ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {labels?.map((label) => (
                <span
                  key={label.id}
                  className="flex items-center gap-1.5 rounded-full border border-transparent px-2 py-1 text-xs"
                  style={{ backgroundColor: `${label.color}22`, color: label.color }}
                >
                  {label.name}
                  <button onClick={() => deleteLabel.mutate(label.id)} className="hover:opacity-70">
                    <Trash2 className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <form onSubmit={createAndAddLabel} className="flex gap-2">
            <Input placeholder="New label name" value={labelName} onChange={(e) => setLabelName(e.target.value)} className="h-8 text-sm" />
            <Button type="submit" size="sm" disabled={!labelName.trim() || createLabel.isPending}>
              <Plus className="size-3.5" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-danger/30">
        <CardHeader>
          <CardTitle className="text-danger">Danger zone</CardTitle>
          <CardDescription>Archiving hides this project from the workspace. Issues are preserved.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="danger" onClick={handleArchive} disabled={archiveProject.isPending}>
            Archive project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
