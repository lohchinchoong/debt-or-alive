import { genId } from "@/lib/utils";
import { toolMeta } from "../toolMeta";
import type { ToolAdapter } from "../types";

export type DividendSource = {
  id: string;
  name: string;
  value: number;
  yieldRate: number; // annual %
  withholdingTax?: boolean; // subject to 30% dividend withholding tax
};

export type DividendRecord = { sources: DividendSource[]; projectionYears: number };

const SOURCES_KEY = "dividend:sources";
const YEARS_KEY = "dividend:projection-years";
const DEFAULT_YEARS = 20;

function defaultSources(): DividendSource[] {
  return [
    { id: genId("div"), name: "Dividend ETF", value: 50000, yieldRate: 5, withholdingTax: false },
    { id: genId("div"), name: "REITs", value: 30000, yieldRate: 6, withholdingTax: false },
  ];
}

/**
 * Reads `dividend:projection-years` in any of its three formats: the autosave
 * build's plain number or numeric string, or the new `{ years, savedAt }`.
 */
export function readProjectionYears(raw: string | null): { years: number; savedAt: string | null } {
  if (raw === null) return { years: DEFAULT_YEARS, savedAt: null };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    value = raw;
  }
  if (value !== null && typeof value === "object") {
    const obj = value as { years?: unknown; savedAt?: unknown };
    const years = typeof obj.years === "number" && obj.years > 0 ? obj.years : DEFAULT_YEARS;
    return { years, savedAt: typeof obj.savedAt === "string" ? obj.savedAt : null };
  }
  const years = typeof value === "number" ? value : parseInt(String(value), 10);
  return { years: Number.isFinite(years) && years > 0 ? years : DEFAULT_YEARS, savedAt: null };
}

/**
 * The one stored-shape change in this design: projection years become
 * `{ years, savedAt }`. Rolling back to the autosave build resets them to 20.
 */
export const dividendAdapter: ToolAdapter<DividendRecord> = {
  ...toolMeta("dividend-calculator"),
  keys: [SOURCES_KEY, YEARS_KEY],
  dateKey: YEARS_KEY,
  defaults: () => ({ sources: defaultSources(), projectionYears: DEFAULT_YEARS }),
  read(storage) {
    const rawSources = storage.getItem(SOURCES_KEY);
    const rawYears = storage.getItem(YEARS_KEY);
    let sources: unknown = null;
    try {
      sources = rawSources === null ? null : JSON.parse(rawSources);
    } catch {
      sources = null;
    }
    const { years, savedAt } = readProjectionYears(rawYears);
    return {
      record: {
        sources: Array.isArray(sources) ? (sources as DividendSource[]) : defaultSources(),
        projectionYears: years,
      },
      savedAt,
      exists: rawSources !== null || rawYears !== null,
    };
  },
  toEntries(record, savedAt) {
    const years = savedAt ? { years: record.projectionYears, savedAt } : { years: record.projectionYears };
    return [
      { key: SOURCES_KEY, value: JSON.stringify(record.sources) },
      { key: YEARS_KEY, value: JSON.stringify(years) },
    ];
  },
};
