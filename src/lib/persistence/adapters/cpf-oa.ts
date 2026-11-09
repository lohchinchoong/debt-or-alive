import { createInputsAdapter } from "../inputsAdapter";
import type { StorageLike } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CpfOaParams = {
  birthYear:        number;
  startDrawdownAge: number;
  balanceAtStart:   number;
  endDrawdownAge:   number;
};

export const CPF_OA_DEFAULT_PARAMS: CpfOaParams = {
  birthYear:        1982,
  startDrawdownAge: 55,
  balanceAtStart:   150_000,
  endDrawdownAge:   75,
};

// ─── Legacy profiles ──────────────────────────────────────────────────────────
// Older builds kept a list of named profiles under this key. The calculator now
// keeps one record, so the latest profile is carried over and the rest dropped.

const OA_LEGACY_KEY = "cpf-oa:profiles";

// Profiles saved before the start age was configurable stored the Dec balance
// at 55 (`balanceAt55`), with drawdown starting the following Jan (age 56).
type StoredLegacyProfile = Partial<Record<keyof CpfOaParams | "balanceAt55" | "savedAt", unknown>>;

function isUsable(item: unknown): item is StoredLegacyProfile {
  return item !== null && typeof item === "object" && !Array.isArray(item);
}

/** The profile's params, with the old `readAll` rules. Types are checked later. */
function normalise(item: StoredLegacyProfile): Record<keyof CpfOaParams, unknown> {
  const legacy = item.balanceAtStart === undefined && item.balanceAt55 !== undefined;
  return {
    birthYear:        item.birthYear ?? CPF_OA_DEFAULT_PARAMS.birthYear,
    startDrawdownAge: item.startDrawdownAge ?? (legacy ? 56 : CPF_OA_DEFAULT_PARAMS.startDrawdownAge),
    balanceAtStart:   item.balanceAtStart ?? item.balanceAt55 ?? CPF_OA_DEFAULT_PARAMS.balanceAtStart,
    endDrawdownAge:   item.endDrawdownAge ?? CPF_OA_DEFAULT_PARAMS.endDrawdownAge,
  };
}

/** Milliseconds for a usable `savedAt`, or null for a missing, bad or future date. */
function savedAtTime(value: unknown, now: number): number | null {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  return Number.isNaN(time) || time > now ? null : time;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

const base = createInputsAdapter({
  slug: "cpf-oa-annuity-calculator",
  inputDefaults: () => ({ ...CPF_OA_DEFAULT_PARAMS }),
  lists: {},
});

/**
 * The latest legacy profile as a record, or null when the legacy key holds no
 * usable profile. Never writes. The winner goes through the base adapter's
 * read, so mistyped values take their defaults like any other load.
 */
function readLegacy(storage: StorageLike): ReturnType<NonNullable<typeof base.readLegacy>> {
  let parsed: unknown;
  try {
    const raw = storage.getItem(OA_LEGACY_KEY);
    if (raw === null) return null;
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const usable = parsed.filter(isUsable);
  if (usable.length === 0) return null;

  // The latest valid date wins. A missing, bad or future date counts as oldest.
  // Ties, and the no-valid-date case, go to the last item: profiles are appended.
  const now = Date.now();
  let winner = usable[0];
  let winnerTime = savedAtTime(winner.savedAt, now) ?? -Infinity;
  for (const item of usable.slice(1)) {
    const time = savedAtTime(item.savedAt, now) ?? -Infinity;
    if (time >= winnerTime) {
      winner = item;
      winnerTime = time;
    }
  }

  const flat: Record<string, unknown> = normalise(winner);
  if (winnerTime !== -Infinity) flat.savedAt = winner.savedAt;
  // `read` takes a storage object, so the winner is placed in a one-key store.
  const store: StorageLike = {
    getItem: (key) => (key === base.dateKey ? JSON.stringify(flat) : null),
    setItem() {
      throw new Error("Legacy view is read-only");
    },
    removeItem() {
      throw new Error("Legacy view is read-only");
    },
  };
  const { record, savedAt } = base.read(store);
  return { record, savedAt, exists: true, discarded: usable.length - 1 };
}

/**
 * The legacy record when a migration is pending: the new key is absent and the
 * legacy key yields a profile. The one place that decides this.
 */
function legacyToMigrate(storage: StorageLike): ReturnType<typeof readLegacy> {
  if (storage.getItem(base.dateKey) !== null) return null;
  return readLegacy(storage);
}

export const cpfOaAdapter: typeof base = {
  ...base,
  legacyKeys: [OA_LEGACY_KEY],
  readLegacy,
  read(storage) {
    return legacyToMigrate(storage) ?? base.read(storage);
  },
};

/** For the page: whether a legacy profile is waiting to be saved, and how many others it drops. */
export function readLegacyOaState(storage: StorageLike): { pending: boolean; others: number } {
  const migration = legacyToMigrate(storage);
  return { pending: migration !== null, others: migration?.discarded ?? 0 };
}
