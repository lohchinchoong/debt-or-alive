// Shared persistence types. Interface members use method syntax so adapters of
// different record types fit in one readonly array.

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type StorageEntry = { key: string; value: string };

export type SaveResult = { ok: true } | { ok: false; error: Error };

export type DateState = "saved" | "never" | "legacy";

export type ToolRead<T> = { record: T; savedAt: string | null; exists: boolean };

export interface ToolAdapter<T> {
  readonly slug: string;
  readonly name: string;
  readonly keys: readonly string[];
  /** The key whose stored object carries `savedAt`. */
  readonly dateKey: string;
  /**
   * Keys an older build wrote. Import reads them, and they are removed after a
   * successful Save or import. They are never written.
   */
  readonly legacyKeys?: readonly string[];
  defaults(): T;
  read(storage: StorageLike): ToolRead<T>;
  /**
   * Reads the record held in the legacy keys, or null when they hold nothing
   * usable. `discarded` counts the legacy items that were not carried over.
   * Never writes.
   */
  readLegacy?(storage: StorageLike): (ToolRead<T> & { discarded: number }) | null;
  toEntries(record: T, savedAt: string | null): StorageEntry[];
}

export type ProfileBase = { id: string; name: string; savedAt?: string };

export interface ProfileAdapter<P extends ProfileBase> {
  readonly slug: string;
  readonly name: string;
  readonly listPath: string;
  /** The storage key holding the profile array. */
  readonly key: string;
  readAll(storage: StorageLike): P[];
  newProfile(): P;
}
