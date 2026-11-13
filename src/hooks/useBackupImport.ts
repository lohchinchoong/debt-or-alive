"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { importBackup } from "@/lib/persistence/import";
import { IDLE, importReducer } from "@/lib/persistence/importState";
import { prepareImport } from "@/lib/persistence/preview";

// Tool pages read localStorage once at mount, so the page reloads after an import.
const RELOAD_DELAY_MS = 1500;

function importedMessage(toolsImported: number, keysSkipped: readonly string[]): string {
  const tools = `${toolsImported} tool${toolsImported === 1 ? "" : "s"}`;
  const ignored =
    keysSkipped.length > 0
      ? " Some data in this file isn't supported by this version of the app and was ignored."
      : "";
  return `Imported ${tools} successfully.${ignored}`;
}

/**
 * Runs the import in steps: read and check a file, wait for the user to
 * confirm, then apply it with importBackup (the only writer). State changes are
 * in importReducer; this hook adds the file read, storage access and the reload.
 */
export function useBackupImport() {
  const [state, dispatch] = useReducer(importReducer, IDLE);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (reloadTimer.current !== null) clearTimeout(reloadTimer.current);
    },
    [],
  );

  const selectFile = useCallback(async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      dispatch({ type: "failed", message: "Couldn't read this file." });
      return;
    }

    const result = prepareImport(localStorage, text);
    if (!result.ok) {
      dispatch({ type: "failed", message: result.message });
      return;
    }
    dispatch({ type: "prepared", payload: result.payload, preview: result.preview });
  }, []);

  const confirm = useCallback(() => {
    if (state.status !== "awaiting-confirmation") return;

    const result = importBackup(localStorage, state.payload.data);
    if (!result.ok) {
      dispatch({ type: "failed", message: `Couldn't import. Nothing was changed. (${result.error.message})` });
      return;
    }

    dispatch({ type: "confirmed", message: importedMessage(result.toolsImported, result.keysSkipped) });
    reloadTimer.current = setTimeout(() => window.location.reload(), RELOAD_DELAY_MS);
  }, [state]);

  const cancel = useCallback(() => dispatch({ type: "cancelled" }), []);
  const dismiss = useCallback(() => dispatch({ type: "dismissed" }), []);

  return { state, selectFile, confirm, cancel, dismiss };
}
