import { toolMeta } from "./toolMeta";
import type { StorageEntry, StorageLike, ToolAdapter } from "./types";

export type Inputs = Record<string, string | number | boolean>;

type ListSpecs<L> = { [K in keyof L]: { key: string; defaults: () => L[K] } };

export type InputsRecord<I extends Inputs, L> = { inputs: I } & L;

function parse(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Adapter for tools that keep flat inputs in `tool:<slug>` plus zero or more
 * array keys. The stored shape stays exactly as the autosave build wrote it,
 * so the old build can still read it: `tool:<slug>` is `{ ...inputs, savedAt }`
 * and each list key is a plain array. The inputs key carries the date.
 */
export function createInputsAdapter<I extends Inputs, L extends { [K in keyof L]: unknown[] }>(config: {
  slug: string;
  inputDefaults: () => I;
  lists: ListSpecs<L>;
}): ToolAdapter<InputsRecord<I, L>> {
  const inputKey = `tool:${config.slug}`;
  const listNames = Object.keys(config.lists) as (keyof L & string)[];
  const listKeys = listNames.map((name) => config.lists[name].key);

  const defaults = (): InputsRecord<I, L> => {
    const lists = {} as L;
    for (const name of listNames) lists[name] = config.lists[name].defaults();
    return { inputs: config.inputDefaults(), ...lists };
  };

  return {
    ...toolMeta(config.slug),
    keys: [inputKey, ...listKeys],
    dateKey: inputKey,
    defaults,
    read(storage: StorageLike) {
      const rawInputs = storage.getItem(inputKey);
      const stored = parse(rawInputs);
      const storedObj = stored !== null && typeof stored === "object" && !Array.isArray(stored)
        ? (stored as Record<string, unknown>)
        : {};
      const savedAt = typeof storedObj.savedAt === "string" ? storedObj.savedAt : null;

      // Keep a stored input only when its type matches the default, as the
      // autosave build's useToolState did. Unknown fields are dropped.
      const inputs = config.inputDefaults();
      for (const field of Object.keys(inputs) as (keyof I & string)[]) {
        const value = storedObj[field];
        if (value !== undefined && typeof value === typeof inputs[field]) {
          inputs[field] = value as I[typeof field];
        }
      }

      const lists = {} as L;
      for (const name of listNames) {
        const value = parse(storage.getItem(config.lists[name].key));
        lists[name] = (Array.isArray(value) ? value : config.lists[name].defaults()) as L[typeof name];
      }

      const exists = rawInputs !== null || listKeys.some((key) => storage.getItem(key) !== null);
      return { record: { inputs, ...lists }, savedAt, exists };
    },
    toEntries(record, savedAt) {
      const entries: StorageEntry[] = listNames.map((name) => ({
        key: config.lists[name].key,
        value: JSON.stringify(record[name]),
      }));
      entries.push({
        key: inputKey,
        value: JSON.stringify(savedAt ? { ...record.inputs, savedAt } : record.inputs),
      });
      return entries;
    },
  };
}
