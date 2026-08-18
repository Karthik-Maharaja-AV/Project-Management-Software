import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { formatActivity } from "@/lib/activity-format";
import type { ActivityDTO } from "@/lib/types";

type ActivityWithContext = ActivityDTO & {
  issue: { number: number; title: string; project: { key: string } } | null;
  project: { name: string; key: string } | null;
};

export function RecentActivityList({ activity }: { activity: ActivityWithContext[] }) {
  if (activity.length === 0) {
    return <p className="text-sm text-text-tertiary">No activity yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {activity.map((a) => (
        <div key={a.id} className="flex items-start gap-2.5 text-[13px]">
          <Avatar name={a.actor.name} src={a.actor.avatarUrl} size="xs" />
          <p className="text-text-secondary">
            <span className="font-medium text-text-primary">{a.actor.name}</span> {formatActivity(a)}
            {a.issue && (
              <span className="ml-1 font-mono text-[11px] text-text-tertiary">
                {a.issue.project.key}-{a.issue.number}
              </span>
            )}
            <span className="ml-1.5 text-[11px] text-text-tertiary">
              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
