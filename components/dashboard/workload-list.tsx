import { Avatar } from "@/components/ui/avatar";

export function WorkloadList({ workload }: { workload: { user: { id: string; name: string; avatarUrl: string | null }; count: number }[] }) {
  const max = Math.max(1, ...workload.map((w) => w.count));

  if (workload.length === 0) {
    return <p className="text-sm text-text-tertiary">Nobody has open issues assigned right now.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {workload.map((w) => (
        <div key={w.user.id} className="flex items-center gap-3">
          <Avatar name={w.user.name} src={w.user.avatarUrl} size="xs" />
          <span className="w-24 shrink-0 truncate text-xs text-text-secondary">{w.user.name}</span>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.max(4, (w.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-medium text-text-primary">{w.count}</span>
        </div>
      ))}
    </div>
  );
}
