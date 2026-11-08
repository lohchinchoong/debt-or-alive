"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { useUnsavedGuard } from "@/hooks/useUnsavedGuard";
import { sameData } from "@/lib/persistence/equality";
import { dateStateOf, saveTool } from "@/lib/persistence/tool";
import type { DateState, SaveResult, ToolAdapter } from "@/lib/persistence/types";

type DraftState<T> = { snapshot: T; draft: T; savedAt: string | null; exists: boolean };

export type UseToolDraftReturn<T> = {
  status: "loading" | "ready";
  draft: T;
  setDraft(updater: (d: T) => T): void;
  isDirty: boolean;
  canSave: boolean;
  save(): SaveResult;
  discard(): void;
  savedAt: string | null;
  dateState: DateState;
  saveError: Error | null;
};

function initialState<T>(adapter: ToolAdapter<T>): DraftState<T> {
  if (typeof window === "undefined") {
    const defaults = adapter.defaults();
    return { snapshot: defaults, draft: defaults, savedAt: null, exists: false };
  }
  const { record, savedAt, exists } = adapter.read(localStorage);
  return { snapshot: record, draft: record, savedAt, exists };
}

/**
 * Draft, snapshot and Save for a single-state tool. Loading reads only; Save is
 * the only write. Pages render a placeholder until status is "ready", so the
 * server render (defaults) and the first client render match.
 */
export function useToolDraft<T>(adapter: ToolAdapter<T>): UseToolDraftReturn<T> {
  const isClient = useIsClient();
  const status = isClient ? "ready" : "loading";

  const [state, setState] = useState<DraftState<T>>(() => initialState(adapter));
  const [saveError, setSaveError] = useState<Error | null>(null);
  // Seeded from the initial state so Save works before any edit. Only the
  // helpers below update it; the render path never reads it.
  const latestDraft = useRef<T>(state.draft);

  // Shared links are gone: ignore URL params and drop them from old bookmarks.
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
  }, []);

  const commit = useCallback((next: T) => {
    latestDraft.current = next;
    setState((s) => ({ ...s, draft: next }));
  }, []);

  const setDraft = useCallback((updater: (d: T) => T) => commit(updater(latestDraft.current)), [commit]);

  const discard = useCallback(() => {
    commit(state.snapshot);
    setSaveError(null);
  }, [commit, state.snapshot]);

  const save = useCallback((): SaveResult => {
    const draft = latestDraft.current;
    const now = new Date().toISOString();
    const result = saveTool(localStorage, adapter, draft, now);
    if (result.ok) {
      setState({ snapshot: draft, draft, savedAt: now, exists: true });
      setSaveError(null);
    } else {
      setSaveError(result.error);
    }
    return result;
  }, [adapter]);

  const isDirty = useMemo(
    () => status === "ready" && !sameData(state.draft, state.snapshot),
    [status, state.draft, state.snapshot],
  );
  const dateState = dateStateOf({ exists: state.exists, savedAt: state.savedAt });
  const canSave = status === "ready" && (isDirty || dateState !== "saved");

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
  };
}
