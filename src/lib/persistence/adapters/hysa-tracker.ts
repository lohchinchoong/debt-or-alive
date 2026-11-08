import { genId } from "@/lib/utils";
import { toolMeta } from "../toolMeta";
import type { ProfileAdapter } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HysaMonthEntry = {
  year:            number;
  month:           number; // 1-12
  salaryInterest:  number; // interest earned from salary bonus
  cardInterest:    number; // interest earned from card spend bonus
  insureInterest:  number; // interest earned from insure bonus
  investInterest:  number; // interest earned from invest bonus
  investmentPL:    number; // investment portfolio P&L
};

export type HysaScenario = {
  id:       string;
  name:     string;
  entries:  HysaMonthEntry[];
  savedAt?: string;
};

// ─── Pure draft helpers (the page applies these through setDraft) ─────────────

export function updateEntry(
  scenario: HysaScenario,
  year: number,
  month: number,
  changes: Partial<HysaMonthEntry>,
): HysaScenario {
  return {
    ...scenario,
    entries: scenario.entries.map((e) => (e.year === year && e.month === month ? { ...e, ...changes } : e)),
  };
}

/** Appends the month after the last entry, or the current month when empty. */
export function addMonth(scenario: HysaScenario, today: Date = new Date()): HysaScenario {
  const last = scenario.entries[scenario.entries.length - 1];
  const year = last ? (last.month === 12 ? last.year + 1 : last.year) : today.getFullYear();
  const month = last ? (last.month === 12 ? 1 : last.month + 1) : today.getMonth() + 1;
  return {
    ...scenario,
    entries: [
      ...scenario.entries,
      {
        year, month,
        salaryInterest: 0, cardInterest: 0,
        insureInterest: 0, investInterest: 0,
        investmentPL: 0,
      },
    ],
  };
}

export function removeLastMonth(scenario: HysaScenario): HysaScenario {
  return { ...scenario, entries: scenario.entries.slice(0, -1) };
}

// ─── Legacy data ──────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Removes the retired Amt keys (salaryAmount, cardSpendAmount, insureAmount,
 * investAmount) from every entry of a stored scenario. Every other key is kept.
 * Anything that is not a scenario with an `entries` array passes through
 * unchanged, so this never throws and never drops a record.
 */
export function stripLegacyAmounts(scenario: unknown): unknown {
  if (!isRecord(scenario) || !Array.isArray(scenario.entries)) return scenario;
  return {
    ...scenario,
    entries: scenario.entries.map((entry: unknown) => {
      if (!isRecord(entry)) return entry;
      const { salaryAmount, cardSpendAmount, insureAmount, investAmount, ...rest } = entry;
      void salaryAmount; void cardSpendAmount; void insureAmount; void investAmount;
      return rest;
    }),
  };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

const KEY = "hysa-tracker:scenarios";

export const hysaAdapter: ProfileAdapter<HysaScenario> = {
  ...toolMeta("hysa-tracker"),
  listPath: "/tools/hysa-tracker",
  key: KEY,
  readAll(storage) {
    try {
      const raw = storage.getItem(KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return parsed as HysaScenario[];
      return parsed.map(stripLegacyAmounts) as HysaScenario[];
    } catch {
      return [];
    }
  },
  newProfile() {
    return { id: genId("hysa"), name: "New Scenario", entries: [] };
  },
};
