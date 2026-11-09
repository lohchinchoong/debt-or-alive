import { describe, expect, it } from "vitest";
import { cpfOaAdapter } from "@/lib/persistence/adapters/cpf-oa";
import { dividendAdapter, readProjectionYears } from "@/lib/persistence/adapters/dividend-calculator";
import {
  budgetAdapter,
  compoundInterestAdapter,
  emergencyFundAdapter,
  fireAdapter,
  mortgageAdapter,
} from "@/lib/persistence/adapters/singleStateTools";
import { srsAdapter } from "@/lib/persistence/adapters/srs-calculator";
import { sameData } from "@/lib/persistence/equality";
import { REGISTERED_KEYS, TOOL_ADAPTERS } from "@/lib/persistence/registry";
import { createMemoryStorage } from "@/lib/persistence/testing/memoryStorage";
import { saveTool, dateStateOf } from "@/lib/persistence/tool";
import type { ToolAdapter } from "@/lib/persistence/types";

const SAVED = "2026-11-08T04:00:00Z";

// Legacy data exactly as the autosave build stored it, per tool.
const legacy: { adapter: ToolAdapter<unknown>; data: Record<string, string> }[] = [
  { adapter: compoundInterestAdapter as ToolAdapter<unknown>, data: { "tool:compound-interest": '{"initial":1,"monthly":2,"rate":3,"years":4,"compFreq":1,"timing":"start"}' } },
  { adapter: fireAdapter as ToolAdapter<unknown>, data: { "tool:fire-calculator": '{"monthlyExpense":1,"currentAge":2,"retirementAge":3,"deathAge":4}', "fire:yield-sources-v2": "[]", "fire:drawdown-sources-v2": '[{"id":"d","name":"D","value":1,"startAge":1,"endAge":2}]' } },
  { adapter: mortgageAdapter as ToolAdapter<unknown>, data: { "tool:mortgage-calculator": '{"propertyPrice":1,"downPaymentPct":2,"annualRate":3,"tenureYears":4}', "mortgage:partial-repayments": '[{"id":"p","year":1,"amount":5}]' } },
  { adapter: emergencyFundAdapter as ToolAdapter<unknown>, data: { "tool:emergency-fund": '{"monthlyExpenses":1,"targetMonths":2}', "emergency-fund:sources": "[]" } },
  { adapter: budgetAdapter as ToolAdapter<unknown>, data: { "tool:budget-planner": '{"annualSalary":1}', "budget:items": '[{"id":"b","label":"L","category":"Car","planned":3}]' } },
  { adapter: srsAdapter as ToolAdapter<unknown>, data: { "srs:deposits": "[]", "srs:withdrawal": '{"startDate":"2040-01-01","years":5}' } },
  { adapter: cpfOaAdapter as ToolAdapter<unknown>, data: { "tool:cpf-oa-annuity-calculator": '{"birthYear":1980,"startDrawdownAge":55,"balanceAtStart":1,"endDrawdownAge":70}' } },
  { adapter: dividendAdapter as ToolAdapter<unknown>, data: { "dividend:sources": "[]", "dividend:projection-years": "15" } },
];

describe.each(legacy)("$adapter.slug adapter", ({ adapter, data }) => {
  it("reads empty storage as not existing, with zero writes", () => {
    const storage = createMemoryStorage();
    const r = adapter.read(storage);
    expect(r.exists).toBe(false);
    expect(r.savedAt).toBeNull();
    expect(storage.writes).toBe(0);
  });

  it("reads legacy data with zero writes, as legacy, and round-trips it", () => {
    const storage = createMemoryStorage(data);
    const first = adapter.read(storage);
    expect(storage.writes).toBe(0);
    expect(dateStateOf(first)).toBe("legacy");

    const copy = createMemoryStorage();
    for (const e of adapter.toEntries(first.record, null)) copy.setItem(e.key, e.value);
    expect(sameData(adapter.read(copy).record, first.record)).toBe(true);
  });

  it("saves with a date that reads back, without savedAt in the record", () => {
    const storage = createMemoryStorage(data);
    const { record } = adapter.read(storage);
    expect(saveTool(storage, adapter, record, SAVED)).toEqual({ ok: true });
    const after = adapter.read(storage);
    expect(after.savedAt).toBe(SAVED);
    expect(JSON.stringify(after.record)).not.toContain("savedAt");
    expect(sameData(after.record, record)).toBe(true);
  });

  it("is registered, with every key exported", () => {
    expect(TOOL_ADAPTERS).toContain(adapter);
    for (const key of adapter.keys) expect(REGISTERED_KEYS).toContain(key);
  });
});

describe("inputs adapters keep the stored shape flat", () => {
  it("writes tool:<slug> flat, so the old build can still read the inputs", () => {
    const storage = createMemoryStorage({ "tool:mortgage-calculator": '{"propertyPrice":9,"downPaymentPct":2,"annualRate":3,"tenureYears":4}' });
    const { record } = mortgageAdapter.read(storage);
    saveTool(storage, mortgageAdapter, record, SAVED);
    expect(JSON.parse(storage.getItem("tool:mortgage-calculator") as string)).toEqual({
      propertyPrice: 9, downPaymentPct: 2, annualRate: 3, tenureYears: 4, savedAt: SAVED,
    });
    expect(JSON.parse(storage.getItem("mortgage:partial-repayments") as string)).toEqual([]);
  });

  it("drops stored inputs whose type doesn't match the default, as useToolState did", () => {
    const storage = createMemoryStorage({ "tool:budget-planner": '{"annualSalary":"lots","extra":1}' });
    expect(budgetAdapter.read(storage).record.inputs).toEqual({ annualSalary: 72000 });
  });

  it("writes the date-carrying key last", () => {
    const order: string[] = [];
    const storage = createMemoryStorage({}, { failOnSet: (_c, key) => (order.push(key), false) });
    saveTool(storage, fireAdapter, fireAdapter.defaults(), SAVED);
    expect(order.at(-1)).toBe("tool:fire-calculator");
  });
});

describe("srs", () => {
  it("stores the date inside the withdrawal object", () => {
    const storage = createMemoryStorage();
    saveTool(storage, srsAdapter, srsAdapter.defaults(), SAVED);
    expect(JSON.parse(storage.getItem("srs:withdrawal") as string).savedAt).toBe(SAVED);
    expect(srsAdapter.read(storage).record.withdrawal).not.toHaveProperty("savedAt");
  });
});

describe("dividend projection years", () => {
  it("reads a plain number, a numeric string and the new object", () => {
    expect(readProjectionYears("15")).toEqual({ years: 15, savedAt: null });
    expect(readProjectionYears('"12"')).toEqual({ years: 12, savedAt: null });
    expect(readProjectionYears(JSON.stringify({ years: 9, savedAt: SAVED }))).toEqual({ years: 9, savedAt: SAVED });
    expect(readProjectionYears(null)).toEqual({ years: 20, savedAt: null });
    expect(readProjectionYears("garbage")).toEqual({ years: 20, savedAt: null });
  });

  it("always writes the object format", () => {
    const storage = createMemoryStorage({ "dividend:projection-years": "15" });
    const { record } = dividendAdapter.read(storage);
    saveTool(storage, dividendAdapter, record, SAVED);
    expect(JSON.parse(storage.getItem("dividend:projection-years") as string)).toEqual({ years: 15, savedAt: SAVED });
  });
});

describe("cpf-oa registration", () => {
  it("owns the new key and not the legacy key", () => {
    expect(REGISTERED_KEYS).toContain("tool:cpf-oa-annuity-calculator");
    expect(REGISTERED_KEYS).not.toContain("cpf-oa:profiles");
  });
});
