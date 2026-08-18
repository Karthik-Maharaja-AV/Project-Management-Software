"use client";

import { formatDistanceToNow } from "date-fns";
import { useIssueActivity } from "@/hooks/use-activity";
import { formatActivity } from "@/lib/activity-format";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function ActivityFeed({ issueId }: { issueId: string }) {
  const { data: activity, isLoading } = useIssueActivity(issueId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return <p className="text-sm text-text-tertiary">No activity yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {activity.map((a) => (
        <div key={a.id} className="flex items-start gap-2.5 text-[13px]">
          <Avatar name={a.actor.name} src={a.actor.avatarUrl} size="xs" />
          <p className="text-text-secondary">
            <span className="font-medium text-text-primary">{a.actor.name}</span> {formatActivity(a)}
            <span className="ml-1.5 text-[11px] text-text-tertiary">
              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
