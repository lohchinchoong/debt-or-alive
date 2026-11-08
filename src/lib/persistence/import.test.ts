import { describe, expect, it } from "vitest";
import { importBackup } from "@/lib/persistence/import";
import { createMemoryStorage } from "@/lib/persistence/testing/memoryStorage";

const SAVED = "2026-11-08T04:00:00Z";

// A backup's `data` holds parsed JSON values, as export writes them.
const fullBackup = {
  "tool:mortgage-calculator": { propertyPrice: 700_000, downPaymentPct: 20, annualRate: 3, tenureYears: 25, savedAt: SAVED },
  "mortgage:partial-repayments": [{ id: "p", year: 2, amount: 10_000 }],
  "cpf-sa:profiles": [
    { id: "p_1", name: "Mine", currentBalance: 1, monthlyContrib: 2, startYear: 2024, startMonth: 1, endContribYear: 2030, birthYear: 1990, savedAt: SAVED },
  ],
  "hysa-tracker:scenarios": [{ id: "h1", name: "Bank", entries: [], savedAt: SAVED }],
  "dividend:projection-years": { years: 12, savedAt: SAVED },
};

describe("importBackup", () => {
  it("restores data and dates for every tool in the file", () => {
    const storage = createMemoryStorage();

    const result = importBackup(storage, fullBackup);

    expect(result).toMatchObject({ ok: true, toolsImported: 4, keysSkipped: [] });
    expect(JSON.parse(storage.getItem("tool:mortgage-calculator") as string).savedAt).toBe(SAVED);
    expect(JSON.parse(storage.getItem("cpf-sa:profiles") as string)[0].savedAt).toBe(SAVED);
    expect(JSON.parse(storage.getItem("hysa-tracker:scenarios") as string)[0].name).toBe("Bank");
    expect(JSON.parse(storage.getItem("dividend:projection-years") as string)).toEqual({ years: 12, savedAt: SAVED });
  });

  it("gives a tool no date when the file lacks its date-carrying key, even if storage had one", () => {
    const storage = createMemoryStorage({
      "tool:mortgage-calculator": JSON.stringify({ propertyPrice: 1, downPaymentPct: 2, annualRate: 3, tenureYears: 4, savedAt: SAVED }),
    });

    importBackup(storage, { "mortgage:partial-repayments": [{ id: "x", year: 1, amount: 5 }] });

    const inputs = JSON.parse(storage.getItem("tool:mortgage-calculator") as string);
    expect(inputs).toEqual({ propertyPrice: 1, downPaymentPct: 2, annualRate: 3, tenureYears: 4 });
    expect(JSON.parse(storage.getItem("mortgage:partial-repayments") as string)).toHaveLength(1);
  });

  it("imports an older backup without dates as data with no date", () => {
    const storage = createMemoryStorage();
    importBackup(storage, { "tool:budget-planner": { annualSalary: 50_000 }, "dividend:projection-years": 15 });
    expect(JSON.parse(storage.getItem("tool:budget-planner") as string)).toEqual({ annualSalary: 50_000 });
    expect(JSON.parse(storage.getItem("dividend:projection-years") as string)).toEqual({ years: 15 });
  });

  it("leaves storage unchanged when a write fails part-way", () => {
    const initial = { "tool:budget-planner": '{"annualSalary":1}' };
    const storage = createMemoryStorage(initial, { failOnSet: (call) => call === 3 });

    const result = importBackup(storage, fullBackup);

    expect(result.ok).toBe(false);
    expect(storage.dump()).toEqual(initial);
  });

  it("skips keys no adapter owns, including the old tool:srs-calculator", () => {
    const storage = createMemoryStorage();
    const result = importBackup(storage, { "tool:srs-calculator": {}, "made-up": 1 });
    expect(result).toMatchObject({ ok: true, toolsImported: 0, keysSkipped: ["tool:srs-calculator", "made-up"] });
    expect(storage.writes).toBe(0);
  });

  it("normalises imported data like any other load", () => {
    const storage = createMemoryStorage();
    importBackup(storage, { "cpf-ma:profiles": [{ id: "m", name: "No month", currentBalance: 1, monthlyContrib: 1, startYear: 2024, endContribYear: 2030, birthYear: 1990, annualMedishieldPremium: 0 }] });
    expect(JSON.parse(storage.getItem("cpf-ma:profiles") as string)[0].startMonth).toBe(1);
  });
});
