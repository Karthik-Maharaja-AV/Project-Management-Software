export function BarList({
  items,
}: {
  items: { key: string; label: string; count: number; color: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-xs text-text-secondary">{item.label}</span>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: item.count === 0 ? 0 : `${Math.max(4, (item.count / max) * 100)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-medium text-text-primary">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
