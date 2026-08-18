"use client";

import type { IssuePriority } from "@prisma/client";
import { ISSUE_PRIORITIES, PRIORITY_ICON, findMeta } from "@/lib/constants";
import { MetaSelect } from "@/components/issues/meta-select";

export function PrioritySelect({
  value,
  onChange,
  compact,
}: {
  value: IssuePriority;
  onChange: (value: IssuePriority) => void;
  compact?: boolean;
}) {
  return (
    <MetaSelect
      options={ISSUE_PRIORITIES}
      icons={PRIORITY_ICON}
      value={value}
      onChange={(v) => onChange(v as IssuePriority)}
      compact={compact}
      triggerLabel={findMeta(ISSUE_PRIORITIES, value).label}
    />
  );
}
