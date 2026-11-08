"use client";

import type { DateState } from "@/lib/persistence/types";

type SaveBarProps = {
  status: "loading" | "ready";
  isDirty: boolean;
  canSave: boolean;
  dateState: DateState;
  saveError: Error | null;
  onSave: () => void;
  onDiscard: () => void;
};

/**
 * Fixed bottom bar with Save and Discard. The first matching rule wins:
 * loading → hidden; save error → "Couldn't save"; dirty → "Unsaved changes";
 * otherwise no text. Save follows canSave; Discard shows when dirty or errored.
 * Renders a spacer of its own height so it never covers page content.
 */
export function SaveBar({ status, isDirty, canSave, saveError, onSave, onDiscard }: SaveBarProps) {
  if (status === "loading") return null;

  const message = saveError ? "Couldn't save" : isDirty ? "Unsaved changes" : "";
  const showDiscard = isDirty || saveError !== null;

  return (
    <>
      <div aria-hidden className="h-20" />
      <div
        className="fixed inset-x-0 bottom-0 z-40 px-5 sm:px-8 lg:px-16 pb-[env(safe-area-inset-bottom)]"
        style={{
          backgroundColor: "var(--header-glass)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "var(--shadow-botanical)",
        }}
      >
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between gap-3">
          <div className="min-w-0 text-sm font-semibold">
            <span aria-live="polite" style={{ color: "var(--on-surface)" }}>
              {saveError ? "" : message}
            </span>
            <span role="alert" style={{ color: "var(--tertiary)" }}>
              {saveError ? message : ""}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {showDiscard && (
              <button
                type="button"
                onClick={onDiscard}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  backgroundColor: "var(--surface-container-highest)",
                  color: "var(--on-surface)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                Discard
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              aria-label={canSave ? "Save" : "Save (no changes to save)"}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, var(--primary-fill) 0%, var(--primary-fill-container) 100%)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
