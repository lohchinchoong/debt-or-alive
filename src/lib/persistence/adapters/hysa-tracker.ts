import { genId } from "@/lib/utils";
import { toolMeta } from "../toolMeta";
import type { ProfileAdapter } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HysaMonthEntry = {
  year:            number;
  month:           number; // 1-12
  salaryAmount:    number; // salary credited this month
  salaryInterest:  number; // interest earned from salary bonus
  cardSpendAmount: number; // card spend this month
  cardInterest:    number; // interest earned from card spend bonus
  insureAmount:    number; // insurance premium / qualifying amount
  insureInterest:  number; // interest earned from insure bonus
  investAmount:    number; // qualifying investment amount
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
        salaryAmount: 0, salaryInterest: 0,
        cardSpendAmount: 0, cardInterest: 0,
        insureAmount: 0, insureInterest: 0,
        investAmount: 0, investInterest: 0,
        investmentPL: 0,
      },
    ],
  };
}

export function removeLastMonth(scenario: HysaScenario): HysaScenario {
  return { ...scenario, entries: scenario.entries.slice(0, -1) };
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
      return raw ? (JSON.parse(raw) as HysaScenario[]) : [];
    } catch {
      return [];
    }
  },
  newProfile() {
    return { id: genId("hysa"), name: "New Scenario", entries: [] };
  },
};
