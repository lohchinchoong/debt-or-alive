"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { useUnsavedGuard } from "@/hooks/useUnsavedGuard";
import { sameData } from "@/lib/persistence/equality";
import { saveProfile } from "@/lib/persistence/profiles";
import type { DateState, ProfileAdapter, ProfileBase, SaveResult } from "@/lib/persistence/types";

/** The reserved id that puts a detail page in "new profile" mode. */
export const NEW_PROFILE_ID = "new";

type DraftState<P> = {
  snapshot: P | null;
  draft: P | null;
  savedAt: string | null;
  found: boolean;
};

export type UseProfileDraftReturn<P> = {
  status: "loading" | "ready";
  draft: P | null;
  setDraft(updater: (d: P) => P): void;
  isDirty: boolean;
  canSave: boolean;
  save(): SaveResult;
  discard(): void;
  savedAt: string | null;
  dateState: DateState;
  saveError: Error | null;
  notFound: boolean;
};

function initialState<P extends ProfileBase>(adapter: ProfileAdapter<P>, id: string): DraftState<P> {
  if (typeof window === "undefined") return { snapshot: null, draft: null, savedAt: null, found: false };
  if (id === NEW_PROFILE_ID) {
    const fresh = adapter.newProfile();
    return { snapshot: fresh, draft: fresh, savedAt: null, found: true };
  }
  const profile = adapter.readAll(localStorage).find((p) => p.id === id) ?? null;
  return { snapshot: profile, draft: profile, savedAt: profile?.savedAt ?? null, found: profile !== null };
}

/** Draft, snapshot and Save for one profile on a detail page. Does no routing. */
export function useProfileDraft<P extends ProfileBase>(
  adapter: ProfileAdapter<P>,
  id: string,
): UseProfileDraftReturn<P> {
  const isClient = useIsClient();
  const status = isClient ? "ready" : "loading";
  const isNew = id === NEW_PROFILE_ID;

  const [state, setState] = useState<DraftState<P>>(() => initialState(adapter, id));
  const [saveError, setSaveError] = useState<Error | null>(null);
  // Seeded from the initial state so Save works before any edit. Only the
  // helpers below update it; the render path never reads it.
  const latestDraft = useRef<P | null>(state.draft);

  const commit = useCallback((next: P | null) => {
    latestDraft.current = next;
    setState((s) => ({ ...s, draft: next }));
  }, []);

  const setDraft = useCallback(
    (updater: (d: P) => P) => {
      const current = latestDraft.current;
      if (current === null) return;
      commit(updater(current));
    },
    [commit],
  );

  const discard = useCallback(() => {
    commit(state.snapshot);
    setSaveError(null);
  }, [commit, state.snapshot]);

  const save = useCallback((): SaveResult => {
    const draft = latestDraft.current;
    if (draft === null) return { ok: false, error: new Error("Nothing to save") };
    const now = new Date().toISOString();
    const result = saveProfile(localStorage, adapter, draft, now, isNew ? "new" : "existing");
    if (result.ok) {
      const saved: P = { ...draft, savedAt: now };
      latestDraft.current = saved;
      setState({ snapshot: saved, draft: saved, savedAt: now, found: true });
      setSaveError(null);
    } else {
      setSaveError(result.error);
    }
    return result;
  }, [adapter, isNew]);

  const isDirty = useMemo(
    () => status === "ready" && !sameData(state.draft, state.snapshot),
    [status, state.draft, state.snapshot],
  );
  const dateState: DateState = state.savedAt ? "saved" : isNew ? "never" : "legacy";
  const canSave = status === "ready" && state.draft !== null && (isDirty || dateState !== "saved");
  const notFound = status === "ready" && !isNew && !state.found;

  useUnsavedGuard(adapter.name, isDirty);

  return {
    status,
    draft: state.draft,
    setDraft,
    isDirty,
    canSave,
    save,
    discard,
    savedAt: state.savedAt,
    dateState,
    saveError,
    notFound,
  };
}
