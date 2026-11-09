import type { SaveResult, StorageEntry, StorageLike } from "./types";

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * The only writer of tool data. Writes entries in the order given; callers put
 * the date-carrying entry last. If a write fails, it tries to restore every key
 * already written (removing keys that were absent before) and returns the
 * original error, even if the restore also fails. It never swallows an error.
 */
export function saveEntries(storage: StorageLike, entries: StorageEntry[]): SaveResult {
  for (const entry of entries) {
    if (typeof entry.key !== "string" || entry.key === "" || typeof entry.value !== "string") {
      return { ok: false, error: new Error(`Malformed storage entry for key "${String(entry.key)}"`) };
    }
  }

  const previous = new Map<string, string | null>();
  for (const { key } of entries) {
    if (!previous.has(key)) previous.set(key, storage.getItem(key));
  }

  const written: string[] = [];
  try {
    for (const { key, value } of entries) {
      storage.setItem(key, value);
      written.push(key);
    }
    return { ok: true };
  } catch (err) {
    const error = toError(err);
    for (const key of written.reverse()) {
      try {
        const old = previous.get(key) ?? null;
        if (old === null) storage.removeItem(key);
        else storage.setItem(key, old);
      } catch {
        // The restore failed too; the original error is still reported below.
      }
    }
    return { ok: false, error };
  }
}

/**
 * Removes keys that a newer record has replaced, such as an older build's
 * storage keys. Call it only after the replacing save succeeded. A failed
 * removal is logged and ignored: a leftover key is not read again.
 */
export function removeReplacedKeys(storage: StorageLike, keys: readonly string[]): void {
  for (const key of keys) {
    try {
      storage.removeItem(key);
    } catch (err) {
      console.warn(`Could not remove replaced key "${key}"`, err);
    }
  }
}
