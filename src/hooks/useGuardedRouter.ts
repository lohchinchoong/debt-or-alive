"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { confirmLeave } from "@/lib/unsavedStore";

export type GuardedRouter = {
  /** Navigates, asking first if any page has unsaved changes. */
  push(href: string): void;
  /** Replaces the URL without asking. For redirects and after a first save. */
  replaceWithoutPrompt(href: string): void;
};

/** The only module allowed to import useRouter. Call it at the top level. */
export function useGuardedRouter(): GuardedRouter {
  const router = useRouter();

  const push = useCallback(
    (href: string) => {
      if (confirmLeave()) router.push(href);
    },
    [router],
  );

  const replaceWithoutPrompt = useCallback((href: string) => router.replace(href), [router]);

  return useMemo(() => ({ push, replaceWithoutPrompt }), [push, replaceWithoutPrompt]);
}
