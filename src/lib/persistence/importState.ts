import type { ParsedBackup } from "./backup";
import type { ImportPreview } from "./preview";

export type ImportState =
  | { status: "idle" }
  | { status: "awaiting-confirmation"; payload: ParsedBackup; preview: ImportPreview }
  | { status: "done"; message: string }
  | { status: "error"; message: string };

export type ImportAction =
  | { type: "prepared"; payload: ParsedBackup; preview: ImportPreview }
  | { type: "failed"; message: string }
  | { type: "confirmed"; message: string }
  | { type: "cancelled" }
  | { type: "dismissed" };

export const IDLE: ImportState = { status: "idle" };

/**
 * The import flow's state changes. `prepared` and `failed` are ignored once the
 * import is `done`, because the page is about to reload. `confirmed` and
 * `cancelled` only apply while a file awaits confirmation.
 */
export function importReducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case "prepared":
      if (state.status === "done") return state;
      return { status: "awaiting-confirmation", payload: action.payload, preview: action.preview };
    case "failed":
      if (state.status === "done") return state;
      return { status: "error", message: action.message };
    case "confirmed":
      if (state.status !== "awaiting-confirmation") return state;
      return { status: "done", message: action.message };
    case "cancelled":
      if (state.status !== "awaiting-confirmation") return state;
      return IDLE;
    case "dismissed":
      if (state.status === "done" || state.status === "error") return IDLE;
      return state;
  }
}
