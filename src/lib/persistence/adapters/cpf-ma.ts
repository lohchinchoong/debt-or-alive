import { toolMeta } from "../toolMeta";
import type { ProfileAdapter } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CpfMaParams = {
  currentBalance:          number;
  monthlyContrib:          number;
  startYear:               number;
  startMonth:              number; // 1–12
  endContribYear:          number;
  birthYear:               number;
  annualMedishieldPremium: number;
};

export type CpfMaProfile = { id: string; name: string; savedAt?: string } & CpfMaParams;

export const CPF_MA_DEFAULT_PARAMS: CpfMaParams = {
  currentBalance:          10_000,
  monthlyContrib:          300,
  startYear:               new Date().getFullYear(),
  startMonth:              new Date().getMonth() + 1,
  endContribYear:          new Date().getFullYear() + 11,
  birthYear:               1982,
  annualMedishieldPremium: 0,
};

// ─── Adapter ──────────────────────────────────────────────────────────────────

const KEY = "cpf-ma:profiles";

export const cpfMaAdapter: ProfileAdapter<CpfMaProfile> = {
  ...toolMeta("cpf-ma-calculator"),
  listPath: "/tools/cpf-ma-calculator",
  key: KEY,
  readAll(storage) {
    try {
      const raw = storage.getItem(KEY);
      // Profiles saved before startMonth existed always started in January.
      // The spread keeps every other stored field, including savedAt.
      if (raw) return (JSON.parse(raw) as CpfMaProfile[]).map((p) => ({ ...p, startMonth: p.startMonth ?? 1 }));
    } catch {
      // Unreadable data reads as empty.
    }
    return [];
  },
  newProfile() {
    return { id: `p_${Date.now()}`, name: "New Scenario", ...CPF_MA_DEFAULT_PARAMS };
  },
};
