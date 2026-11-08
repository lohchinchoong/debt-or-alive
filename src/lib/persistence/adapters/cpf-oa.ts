import { toolMeta } from "../toolMeta";
import type { ProfileAdapter } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CpfOaParams = {
  birthYear:        number;
  startDrawdownAge: number;
  balanceAtStart:   number;
  endDrawdownAge:   number;
};

export type CpfOaProfile = { id: string; name: string; savedAt?: string } & CpfOaParams;

// Profiles saved before the start age was configurable stored the Dec balance
// at 55, with drawdown starting the following Jan (age 56).
type StoredCpfOaProfile = { id: string; name: string; savedAt?: string } & Partial<CpfOaParams> & {
  balanceAt55?: number;
};

export const CPF_OA_DEFAULT_PARAMS: CpfOaParams = {
  birthYear:        1982,
  startDrawdownAge: 55,
  balanceAtStart:   150_000,
  endDrawdownAge:   75,
};

// ─── Adapter ──────────────────────────────────────────────────────────────────

const KEY = "cpf-oa:profiles";

export const cpfOaAdapter: ProfileAdapter<CpfOaProfile> = {
  ...toolMeta("cpf-oa-annuity-calculator"),
  listPath: "/tools/cpf-oa-annuity-calculator",
  key: KEY,
  readAll(storage) {
    try {
      const raw = storage.getItem(KEY);
      if (!raw) return [];
      // Fill in any fields missing from profiles saved under an earlier shape.
      return (JSON.parse(raw) as StoredCpfOaProfile[]).map(({ id, name, savedAt, ...rest }) => {
        const legacy = rest.balanceAtStart === undefined && rest.balanceAt55 !== undefined;
        const profile: CpfOaProfile = {
          id,
          name,
          birthYear:        rest.birthYear ?? CPF_OA_DEFAULT_PARAMS.birthYear,
          startDrawdownAge: rest.startDrawdownAge ?? (legacy ? 56 : CPF_OA_DEFAULT_PARAMS.startDrawdownAge),
          balanceAtStart:   rest.balanceAtStart ?? rest.balanceAt55 ?? CPF_OA_DEFAULT_PARAMS.balanceAtStart,
          endDrawdownAge:   rest.endDrawdownAge ?? CPF_OA_DEFAULT_PARAMS.endDrawdownAge,
        };
        return savedAt ? { ...profile, savedAt } : profile;
      });
    } catch {
      return [];
    }
  },
  newProfile() {
    return { id: `p_${Date.now()}`, name: "New Scenario", ...CPF_OA_DEFAULT_PARAMS };
  },
};
