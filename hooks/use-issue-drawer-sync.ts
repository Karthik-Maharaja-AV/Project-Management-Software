"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUiStore } from "@/lib/stores/ui-store";

/** Keeps the `?issue=KEY` query param in sync with the drawer's open issue. */
export function useIssueDrawerSync() {
  const activeIssueKey = useUiStore((s) => s.activeIssueKey);
  const openIssue = useUiStore((s) => s.openIssue);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useRef(false);

  // One-time bootstrap: open the drawer if the initial URL already points at an issue.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const key = searchParams.get("issue");
    if (key) openIssue(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the URL's `issue` param mirroring the drawer state (pure external-system sync, no setState).
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeIssueKey) params.set("issue", activeIssueKey);
    else params.delete("issue");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIssueKey, pathname]);
}
