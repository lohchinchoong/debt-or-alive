import type { StorageLike } from "../types";

export type MemoryStorage = StorageLike & {
  /** Number of setItem and removeItem calls made so far. */
  readonly writes: number;
  /** A copy of the current contents. */
  dump(): Record<string, string>;
};

export type MemoryStorageOptions = {
  /** Return true to make the nth setItem call (1-based) throw. */
  failOnSet?: (call: number, key: string) => boolean;
};

/** An in-memory StorageLike for tests. App code never imports this. */
export function createMemoryStorage(
  initial: Record<string, string> = {},
  options: MemoryStorageOptions = {},
): MemoryStorage {
  const data = new Map<string, string>(Object.entries(initial));
  let writes = 0;
  let setCalls = 0;

  return {
    get writes() {
      return writes;
    },
    getItem(key) {
      return data.has(key) ? (data.get(key) as string) : null;
    },
    setItem(key, value) {
      setCalls += 1;
      if (options.failOnSet?.(setCalls, key)) {
        throw new Error(`QuotaExceededError (simulated) on set #${setCalls}`);
      }
      writes += 1;
      data.set(key, value);
    },
    removeItem(key) {
      writes += 1;
      data.delete(key);
    },
    dump() {
      return Object.fromEntries(data);
    },
  };
}
