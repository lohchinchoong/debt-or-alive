"use client";

import { useEffect, useId } from "react";
import { setUnsaved } from "@/lib/unsavedStore";

/**
 * Registers this page's unsaved state for the leave guards, and asks the
 * browser to prompt on tab close or reload while there are unsaved changes.
 * The beforeunload listener exists only while dirty, so clean pages keep the
 * browser's back-forward cache.
 */
export function useUnsavedGuard(toolName: string, isDirty: boolean): void {
  const ownerId = useId();

  useEffect(() => {
    setUnsaved(ownerId, isDirty ? toolName : null);
    return () => setUnsaved(ownerId, null);
  }, [ownerId, toolName, isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Older browsers need returnValue set to show the prompt.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);
}
