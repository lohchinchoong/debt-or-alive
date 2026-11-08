import { saveEntries } from "./save";
import type { ProfileAdapter, ProfileBase, SaveResult, StorageLike } from "./types";

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

function writeProfiles<P extends ProfileBase>(
  storage: StorageLike,
  adapter: ProfileAdapter<P>,
  profiles: P[],
): SaveResult {
  let value: string;
  try {
    value = JSON.stringify(profiles);
  } catch (err) {
    return { ok: false, error: toError(err) };
  }
  return saveEntries(storage, [{ key: adapter.key, value }]);
}

/**
 * Saves one profile with `now` as its date, merged by id into a fresh read of
 * storage so other profiles (including ones another tab added) survive.
 * - "existing": replaces the record in place; errors if it was deleted elsewhere.
 * - "new": appends, or replaces if the id is already present (a double tap).
 */
export function saveProfile<P extends ProfileBase>(
  storage: StorageLike,
  adapter: ProfileAdapter<P>,
  profile: P,
  now: string,
  mode: "new" | "existing",
): SaveResult {
  const profiles = adapter.readAll(storage);
  const index = profiles.findIndex((p) => p.id === profile.id);
  const saved: P = { ...profile, savedAt: now };

  if (index === -1) {
    if (mode === "existing") {
      return { ok: false, error: new Error("This profile was deleted in another tab") };
    }
    profiles.push(saved);
  } else {
    profiles[index] = saved;
  }
  return writeProfiles(storage, adapter, profiles);
}

/** Removes one profile by id from a fresh read. A missing id writes nothing. */
export function deleteProfile<P extends ProfileBase>(
  storage: StorageLike,
  adapter: ProfileAdapter<P>,
  id: string,
): SaveResult {
  const profiles = adapter.readAll(storage);
  const next = profiles.filter((p) => p.id !== id);
  if (next.length === profiles.length) return { ok: true };
  return writeProfiles(storage, adapter, next);
}
