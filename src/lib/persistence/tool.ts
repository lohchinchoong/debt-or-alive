import { saveEntries } from "./save";
import type { DateState, SaveResult, StorageEntry, StorageLike, ToolAdapter } from "./types";

/**
 * Saves a single-state tool's record with `now` as its date. Puts the
 * date-carrying entry last, so a failed save never leaves a new date behind.
 */
export function saveTool<T>(
  storage: StorageLike,
  adapter: ToolAdapter<T>,
  record: T,
  now: string,
): SaveResult {
  let entries: StorageEntry[];
  try {
    entries = adapter.toEntries(record, now);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
  const rest = entries.filter((e) => e.key !== adapter.dateKey);
  const dated = entries.filter((e) => e.key === adapter.dateKey);
  return saveEntries(storage, [...rest, ...dated]);
}

export function dateStateOf(read: { exists: boolean; savedAt: string | null }): DateState {
  if (!read.exists) return "never";
  if (read.savedAt) return "saved";
  return "legacy";
}
