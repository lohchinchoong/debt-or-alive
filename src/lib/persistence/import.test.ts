import { afterEach, describe, expect, it, vi } from "vitest";
import { importBackup, overlay } from "@/lib/persistence/import";
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

  it("removes the retired Amt keys from imported HYSA entries", () => {
    const storage = createMemoryStorage();
    const entry = { year: 2026, month: 1, salaryAmount: 5000, salaryInterest: 10, cardSpendAmount: 1, cardInterest: 0, insureAmount: 2, insureInterest: 0, investAmount: 3, investInterest: 0, investmentPL: 5 };

    const result = importBackup(storage, { "hysa-tracker:scenarios": [{ id: "h1", name: "Bank", entries: [entry], savedAt: SAVED }] });

    expect(result).toMatchObject({ ok: true, toolsImported: 1 });
    const [stored] = JSON.parse(storage.getItem("hysa-tracker:scenarios") as string)[0].entries;
    expect(Object.keys(stored).sort()).toEqual(["cardInterest", "insureInterest", "investInterest", "investmentPL", "month", "salaryInterest", "year"]);
    expect(stored.salaryInterest).toBe(10);
    expect(stored.investmentPL).toBe(5);
  });
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

describe("importBackup with a legacy OA key", () => {
  const LEGACY = "cpf-oa:profiles";
  const NEW_KEY = "tool:cpf-oa-annuity-calculator";
  const A = { id: "p_a", name: "Plan A", birthYear: 1980, startDrawdownAge: 55, balanceAtStart: 100000, endDrawdownAge: 75, savedAt: "2026-01-01T00:00:00.000Z" };
  const B = { id: "p_b", name: "Plan B", birthYear: 1982, startDrawdownAge: 60, balanceAtStart: 200000, endDrawdownAge: 80, savedAt: "2026-03-01T00:00:00.000Z" };
  const C = { id: "p_c", name: "Plan C", birthYear: 1984, startDrawdownAge: 65, balanceAtStart: 300000, endDrawdownAge: 85 };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes the latest profile and its date, replacing the device record and removing the device legacy key", () => {
    const storage = createMemoryStorage({
      [NEW_KEY]: JSON.stringify({ birthYear: 1999, startDrawdownAge: 55, balanceAtStart: 1, endDrawdownAge: 60, savedAt: SAVED }),
      [LEGACY]: JSON.stringify([C]),
    });

    const result = importBackup(storage, { [LEGACY]: [A, B, C] });

    expect(result).toEqual({ ok: true, toolsImported: 1, keysSkipped: [] });
    expect(JSON.parse(storage.getItem(NEW_KEY) as string)).toEqual({
      birthYear: 1982, startDrawdownAge: 60, balanceAtStart: 200000, endDrawdownAge: 80, savedAt: B.savedAt,
    });
    expect(storage.getItem(LEGACY)).toBeNull();
  });

  it("writes the new key with no date when the winner has no savedAt", () => {
    const storage = createMemoryStorage();

    importBackup(storage, { [LEGACY]: [C] });

    expect(JSON.parse(storage.getItem(NEW_KEY) as string)).not.toHaveProperty("savedAt");
  });

  it("uses the new key when the file has both keys, and reports the legacy key skipped", () => {
    const storage = createMemoryStorage();
    const current = { birthYear: 1975, startDrawdownAge: 55, balanceAtStart: 5, endDrawdownAge: 70, savedAt: SAVED };

    const result = importBackup(storage, { [NEW_KEY]: current, [LEGACY]: [B] });

    expect(result).toEqual({ ok: true, toolsImported: 1, keysSkipped: [LEGACY] });
    expect(JSON.parse(storage.getItem(NEW_KEY) as string)).toEqual(current);
  });

  it("removes a legacy key left on the device when a new-format backup is imported", () => {
    const storage = createMemoryStorage({ [LEGACY]: JSON.stringify([A, B]) });

    importBackup(storage, { [NEW_KEY]: { birthYear: 1975, startDrawdownAge: 55, balanceAtStart: 5, endDrawdownAge: 70, savedAt: SAVED } });

    expect(storage.getItem(LEGACY)).toBeNull();
  });

  it.each([
    ["[]", []],
    ["[1, null]", [1, null]],
    ["a string", "not json"],
  ])("skips a legacy key holding %s and leaves the device record untouched", (_name, value) => {
    const record = JSON.stringify({ birthYear: 1999, startDrawdownAge: 55, balanceAtStart: 1, endDrawdownAge: 60, savedAt: SAVED });
    const storage = createMemoryStorage({ [NEW_KEY]: record });

    const result = importBackup(storage, { [LEGACY]: value });

    expect(result).toEqual({ ok: true, toolsImported: 0, keysSkipped: [LEGACY] });
    expect(storage.getItem(NEW_KEY)).toBe(record);
    expect(storage.writes).toBe(0);
  });

  it("removes no legacy key when the save fails", () => {
    const storage = createMemoryStorage({ [LEGACY]: JSON.stringify([C]) }, { failOnSet: (call) => call === 1 });

    const result = importBackup(storage, { [LEGACY]: [A, B, C] });

    expect(result.ok).toBe(false);
    expect(storage.getItem(LEGACY)).not.toBeNull();
  });

  it("still returns ok and warns when removing the device legacy key fails", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const storage = createMemoryStorage({ [LEGACY]: JSON.stringify([C]) }, { failOnRemove: (_call, key) => key === LEGACY });

    const result = importBackup(storage, { [LEGACY]: [A, B, C] });

    expect(result).toMatchObject({ ok: true, toolsImported: 1 });
    expect(warn).toHaveBeenCalled();
  });
});

describe("overlay", () => {
  it("returns the file's value for a key in the file, and the stored value otherwise", () => {
    const storage = createMemoryStorage({ stored: "from storage", both: "old" });

    const view = overlay(storage, { both: { a: 1 }, text: "plain", fileOnly: [1] });

    expect(view.getItem("both")).toBe(JSON.stringify({ a: 1 }));
    expect(view.getItem("text")).toBe("plain");
    expect(view.getItem("fileOnly")).toBe("[1]");
    expect(view.getItem("stored")).toBe("from storage");
    expect(view.getItem("missing")).toBeNull();
  });

  it("throws on setItem and removeItem, and leaves the real storage untouched", () => {
    const storage = createMemoryStorage({ stored: "x" });
    const view = overlay(storage, {});

    expect(() => view.setItem("stored", "y")).toThrow("Import view is read-only");
    expect(() => view.removeItem("stored")).toThrow("Import view is read-only");
    expect(storage.writes).toBe(0);
    expect(storage.getItem("stored")).toBe("x");
  });
});
