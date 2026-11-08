"use client";

import { useEffect, useState } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { REGISTERED_KEYS } from "@/lib/persistence/registry";

const FLAG = "meta:manual-save-notice-dismissed";

type NoticeDecision = { show: boolean; markNewUser: boolean };

/**
 * Decides once per browser. A user with no saved data is new: mark the notice
 * as seen so their own first Save never triggers it. A user with data saved
 * before this release sees the notice until they dismiss it.
 */
function decide(): NoticeDecision {
  if (typeof window === "undefined") return { show: false, markNewUser: false };
  try {
    if (localStorage.getItem(FLAG) !== null) return { show: false, markNewUser: false };
    const hasData = REGISTERED_KEYS.some((key) => localStorage.getItem(key) !== null);
    return hasData ? { show: true, markNewUser: false } : { show: false, markNewUser: true };
  } catch {
    return { show: false, markNewUser: false };
  }
}

function writeFlag(): void {
  try {
    localStorage.setItem(FLAG, "1"); // Declared exception: app state, not tool data.
  } catch {
    // Storage unavailable; the notice simply won't be remembered.
  }
}

/** One-time notice for users who had data under autosave. Remove 3 months after release. */
export function ManualSaveNotice() {
  const isClient = useIsClient();
  const [decision] = useState<NoticeDecision>(decide);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (decision.markNewUser) writeFlag();
  }, [decision.markNewUser]);

  if (!isClient || !decision.show || dismissed) return null;

  return (
    <div
      className="rounded-xl p-4 flex items-start justify-between gap-3 text-sm"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p style={{ color: "var(--on-surface)", lineHeight: 1.6 }}>
        Changes are no longer saved automatically. Press Save to keep them. Unsaved changes can be lost,
        especially on mobile.
      </p>
      <button
        type="button"
        onClick={() => {
          writeFlag();
          setDismissed(true);
        }}
        className="flex-shrink-0 font-semibold"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)" }}
      >
        Got it
      </button>
    </div>
  );
}
