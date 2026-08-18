"use client";

import type { IssueType } from "@prisma/client";
import { ISSUE_TYPES, TYPE_ICON, findMeta } from "@/lib/constants";
import { MetaSelect } from "@/components/issues/meta-select";

export function TypeSelect({
  value,
  onChange,
  compact,
}: {
  value: IssueType;
  onChange: (value: IssueType) => void;
  compact?: boolean;
}) {
  return (
    <MetaSelect
      options={ISSUE_TYPES}
      icons={TYPE_ICON}
      value={value}
      onChange={(v) => onChange(v as IssueType)}
      compact={compact}
      triggerLabel={findMeta(ISSUE_TYPES, value).label}
    />
  );
}
