"use client";

import type { IssueStatus } from "@prisma/client";
import { ISSUE_STATUSES, STATUS_ICON, findMeta } from "@/lib/constants";
import { MetaSelect } from "@/components/issues/meta-select";

export function StatusSelect({
  value,
  onChange,
  compact,
}: {
  value: IssueStatus;
  onChange: (value: IssueStatus) => void;
  compact?: boolean;
}) {
  return (
    <MetaSelect
      options={ISSUE_STATUSES}
      icons={STATUS_ICON}
      value={value}
      onChange={(v) => onChange(v as IssueStatus)}
      compact={compact}
      triggerLabel={findMeta(ISSUE_STATUSES, value).label}
    />
  );
}
