"use client";

import { formatSavedDate } from "@/lib/formatSavedDate";
import type { DateState } from "@/lib/persistence/types";

/** The "Last saved: 8 Nov 2026" line. Holds its height so the layout doesn't jump. */
export function LastSaved({
  status,
  dateState,
  savedAt,
}: {
  status: "loading" | "ready";
  dateState: DateState;
  savedAt: string | null;
}) {
  let text: string | null = null;
  if (status === "ready") {
    if (dateState === "saved" && savedAt) {
      const formatted = formatSavedDate(savedAt);
      text = formatted ? `Last saved: ${formatted}` : null;
    } else if (dateState === "never") {
      text = "Not saved yet";
    }
  }

  return (
    <p className="min-h-5 text-xs font-medium" style={{ color: "var(--on-surface-sub)" }}>
      {text}
    </p>
  );
}
