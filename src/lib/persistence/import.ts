import { PROFILE_ADAPTERS, TOOL_ADAPTERS } from "./registry";
import { removeReplacedKeys, saveEntries } from "./save";
import type { SaveResult, StorageEntry, StorageLike, ToolAdapter } from "./types";

export type ImportResult = SaveResult & { toolsImported: number; keysSkipped: string[] };

/**
 * A read-only storage view: the backup's value for keys in the file, the stored
 * value otherwise. Writes throw, so an adapter's read can't change real storage
 * (the CPF SA migration's write fails here, harmlessly). The import preview
 * reuses it, with an empty `data` to read this browser's storage safely.
 */
export function overlay(storage: StorageLike, data: Record<string, unknown>): StorageLike {
  return {
    getItem(key) {
      if (!(key in data)) return storage.getItem(key);
      const value = data[key];
      return typeof value === "string" ? value : JSON.stringify(value);
    },
    setItem() {
      throw new Error("Import view is read-only");
    },
    removeItem() {
      throw new Error("Import view is read-only");
    },
  };
}

/**
 * Restores a backup through the adapters and the save module, as one save:
 * imported data is normalised like any other load, dates come only from the
 * file, and a failure part-way leaves storage unchanged. Keys that no adapter
 * owns (such as the old, unused `tool:srs-calculator`) are skipped.
 *
 * A backup from an older build may hold an adapter's legacy keys instead of its
 * current keys. If the adapter can read them, they replace the device's record,
 * and the device's legacy keys are removed after the save.
 */
export function importBackup(storage: StorageLike, data: Record<string, unknown>): ImportResult {
  const view = overlay(storage, data);
  const entries: StorageEntry[] = [];
  const owned = new Set<string>();
  const participants: ToolAdapter<unknown>[] = [];
  let toolsImported = 0;

  try {
    for (const adapter of TOOL_ADAPTERS) {
      for (const key of adapter.keys) owned.add(key);
      const legacyKeys = adapter.legacyKeys ?? [];
      const currentInFile = adapter.keys.some((key) => key in data);
      if (!currentInFile && !legacyKeys.some((key) => key in data)) continue;

      if (currentInFile) {
        // A legacy key in the same file is not used, so it stays unowned and is reported skipped.
        const { record, savedAt } = adapter.read(view);
        // A tool restored without its date-carrying key gets no date.
        entries.push(...adapter.toEntries(record, adapter.dateKey in data ? savedAt : null));
      } else {
        const legacy = adapter.readLegacy?.(view);
        // Nothing usable in the legacy key: skip it, so the device's record is not replaced by defaults.
        if (!legacy) continue;
        // Unlike the rule above, the date comes from the legacy item itself.
        entries.push(...adapter.toEntries(legacy.record, legacy.savedAt));
        for (const key of legacyKeys) owned.add(key);
      }
      toolsImported += 1;
      participants.push(adapter);
    }
    for (const adapter of PROFILE_ADAPTERS) {
      owned.add(adapter.key);
      if (!(adapter.key in data)) continue;
      // Each profile keeps its own savedAt from the file (or none).
      entries.push({ key: adapter.key, value: JSON.stringify(adapter.readAll(view)) });
      toolsImported += 1;
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { ok: false, error, toolsImported: 0, keysSkipped: [] };
  }

  const keysSkipped = Object.keys(data).filter((key) => !owned.has(key));
  if (entries.length === 0) return { ok: true, toolsImported: 0, keysSkipped };
  const result = saveEntries(storage, entries);
  if (!result.ok) return { ...result, toolsImported: 0, keysSkipped };
  // The imported records replace the device's legacy keys, so remove them (the real storage, not the view).
  for (const adapter of participants) removeReplacedKeys(storage, adapter.legacyKeys ?? []);
  return { ok: true, toolsImported, keysSkipped };
}
