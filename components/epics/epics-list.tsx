"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Layers } from "lucide-react";
import { useProjectEpics } from "@/hooks/use-epics";
import { CreateEpicDialog } from "@/components/epics/create-epic-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type EpicWithProgress = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
  progress: { total: number; done: number; percent: number; totalPoints: number; donePoints: number };
};

export function EpicsList({ projectId }: { projectId: string }) {
  const { data: epics, isLoading } = useProjectEpics(projectId);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Epics</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New epic
        </Button>
      </div>

      {!epics || epics.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No epics yet"
          description="Group related issues into an epic to track large pieces of work."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Create epic
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {epics.map((epic: EpicWithProgress) => (
            <Link key={epic.id} href={`${pathname}/${epic.id}`}>
              <Card className="h-full p-4 transition-shadow hover:shadow-[var(--shadow-md)]">
                <div className="mb-2 flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: epic.color }} />
                  <span className="truncate text-sm font-semibold text-text-primary">{epic.name}</span>
                  <Badge className="ml-auto">{epic.status.replace("_", " ").toLowerCase()}</Badge>
                </div>
                {epic.description && <p className="mb-3 line-clamp-2 text-xs text-text-secondary">{epic.description}</p>}
                <ProgressBar percent={epic.progress.percent} color={epic.color} />
                <div className="mt-2 flex items-center justify-between text-xs text-text-tertiary">
                  <span>
                    {epic.progress.done}/{epic.progress.total} issues
                  </span>
                  <span>{epic.progress.percent}%</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateEpicDialog projectId={projectId} open={open} onOpenChange={setOpen} />
    </div>
  );
}
