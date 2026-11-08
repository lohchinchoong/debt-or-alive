import { saveEntries } from "../save";
import { toolMeta } from "../toolMeta";
import type { ProfileAdapter, StorageLike } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CpfParams = {
  currentBalance: number;
  monthlyContrib: number;
  startYear:      number;
  startMonth:     number; // 1–12
  endContribYear: number;
  birthYear:      number;
};

export type CpfProfile = { id: string; name: string; savedAt?: string } & CpfParams;

export const CPF_DEFAULT_PARAMS: CpfParams = {
  currentBalance: 10_000,
  monthlyContrib: 500,
  startYear:      new Date().getFullYear(),
  startMonth:     new Date().getMonth() + 1,
  endContribYear: new Date().getFullYear() + 11,
  birthYear:      1982,
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const KEY = "cpf-sa:profiles";
const LEGACY_SINGLE_KEY = "tool:cpf-sa-calculator";

/**
 * One-time migration from the old single-profile key. Runs only while the
 * profile array is absent, writes through saveEntries (a declared exception to
 * "Save is the only write"), and sets no date, so the profile reads as legacy.
 */
function migrateLegacy(storage: StorageLike): CpfProfile[] {
  const oldRaw = storage.getItem(LEGACY_SINGLE_KEY);
  if (!oldRaw) return [];
  const old = JSON.parse(oldRaw) as Partial<CpfParams>;
  const migrated: CpfProfile = {
    id:   `p_${Date.now()}`,
    name: "My Scenario",
    ...CPF_DEFAULT_PARAMS,
    startMonth: 1,
    ...old,
  };
  saveEntries(storage, [{ key: KEY, value: JSON.stringify([migrated]) }]);
  return [migrated];
}

export const cpfSaAdapter: ProfileAdapter<CpfProfile> = {
  ...toolMeta("cpf-sa-calculator"),
  listPath: "/tools/cpf-sa-calculator",
  key: KEY,
  readAll(storage) {
    try {
      const raw = storage.getItem(KEY);
      // Profiles saved before startMonth existed always started in January.
      // The spread keeps every other stored field, including savedAt.
      if (raw) return (JSON.parse(raw) as CpfProfile[]).map((p) => ({ ...p, startMonth: p.startMonth ?? 1 }));
      return migrateLegacy(storage);
    } catch {
      return [];
    }
  },
  newProfile() {
    return { id: `p_${Date.now()}`, name: "New Scenario", ...CPF_DEFAULT_PARAMS };
  },
};
