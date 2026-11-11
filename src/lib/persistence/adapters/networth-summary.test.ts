import { describe, expect, it } from "vitest";
import { MAX_AMOUNT, defaultNetworth, type NetworthData } from "@/lib/networth";
import { networthAdapter } from "@/lib/persistence/adapters/networth-summary";
import { sameData } from "@/lib/persistence/equality";
import { importBackup } from "@/lib/persistence/import";
import { REGISTERED_KEYS, TOOL_ADAPTERS } from "@/lib/persistence/registry";
import { createMemoryStorage } from "@/lib/persistence/testing/memoryStorage";
import { dateStateOf, saveTool } from "@/lib/persistence/tool";

const KEY = "tool:networth-summary";
const SAVED = "2026-11-09T04:00:00Z";

function readFrom(value: unknown) {
  const storage = createMemoryStorage({ [KEY]: typeof value === "string" ? value : JSON.stringify(value) });
  return networthAdapter.read(storage);
}

const goodRecord = {
  id: "a",
  section: "cpfOa",
  name: "OA",
  platform: "CPF Board",
  amount: 100,
  currency: "SGD",
  lastUpdated: "2026-11-01",
};

describe("networth adapter: reading", () => {
  it("reads empty storage as not existing, with zero writes", () => {
    const storage = createMemoryStorage();
    const r = networthAdapter.read(storage);
    expect(r.exists).toBe(false);
    expect(r.savedAt).toBeNull();
    expect(r.record).toEqual(defaultNetworth());
    expect(storage.writes).toBe(0);
    expect(dateStateOf(r)).toBe("never");
  });

  it("treats a value that is not valid JSON as saved data with no date", () => {
    const r = readFrom("{not json");
    expect(r.exists).toBe(true);
    expect(r.savedAt).toBeNull();
    expect(r.record).toEqual(defaultNetworth());
    expect(dateStateOf(r)).toBe("legacy");
  });

  it("treats a non-object value the same way", () => {
    for (const value of ["[]", "5", '"text"', "null"]) {
      const r = readFrom(value);
      expect(r.exists).toBe(true);
      expect(r.record).toEqual(defaultNetworth());
    }
  });

  it("keeps good data as it is", () => {
    const data: NetworthData = {
      usdSgd: 1.35,
      audSgd: 0.88,
      targets: { cpfOa: 100, cpfSa: 110, cpfMa: 120, cpfRa: 130, srs: 200, cashSavings: 300, cashInvestments: 400 },
      records: [goodRecord as NetworthData["records"][number]],
    };
    const r = readFrom({ ...data, savedAt: SAVED });
    expect(r.record).toEqual(data);
    expect(r.savedAt).toBe(SAVED);
  });

  it("reads a rate that is not a finite number in range as null", () => {
    for (const bad of [0, -1, "1.3", null, 1001, Number.NaN, {}]) {
      expect(readFrom({ usdSgd: bad, audSgd: bad }).record.usdSgd).toBeNull();
    }
    expect(readFrom({ usdSgd: 1000 }).record.usdSgd).toBe(1000);
  });

  it("reads a target outside 0 to the maximum as 0, and a bad targets value as all zeros", () => {
    const r = readFrom({ targets: { cpfOa: -1, srs: "5", cashSavings: 1e12, cashInvestments: 7 } });
    expect(r.record.targets).toEqual({ cpfOa: 0, cpfSa: 0, cpfMa: 0, cpfRa: 0, srs: 0, cashSavings: 0, cashInvestments: 7 });
    expect(readFrom({ targets: "lots" }).record.targets).toEqual(defaultNetworth().targets);
    expect(readFrom({ targets: { cpf: 5 } }).record.targets).toEqual({ cpfOa: 5, cpfSa: 0, cpfMa: 0, cpfRa: 0, srs: 0, cashSavings: 0, cashInvestments: 0 });
  });

  it("treats records that are not an array as empty", () => {
    expect(readFrom({ records: "x" }).record.records).toEqual([]);
    expect(readFrom({ records: { a: 1 } }).record.records).toEqual([]);
  });

  it("drops a non-object record and one with an unknown section", () => {
    const r = readFrom({ records: [5, null, "x", [], { ...goodRecord, section: "crypto" }, { ...goodRecord, section: 3 }, goodRecord] });
    expect(r.record.records).toHaveLength(1);
    expect(r.record.records[0].id).toBe("a");
  });

  it("repairs the fields of a record", () => {
    const r = readFrom({
      records: [
        { section: "srs", name: 5, platform: null, amount: "12", currency: "EUR", lastUpdated: "2026-02-30" },
        { id: "", section: "debt", amount: -5, lastUpdated: "yesterday" },
        { id: "z", section: "cpfOa", amount: MAX_AMOUNT + 1, currency: "USD", lastUpdated: "2026-02-28" },
      ],
    });
    const [a, b, c] = r.record.records;
    expect(a).toMatchObject({ name: "", platform: "", amount: 0, currency: "SGD", lastUpdated: "" });
    expect(a.id).toMatch(/^nw_/);
    expect(b.id).toMatch(/^nw_/);
    expect(b).toMatchObject({ amount: 0, currency: "SGD", lastUpdated: "" });
    expect(c).toMatchObject({ id: "z", amount: 0, currency: "USD", lastUpdated: "2026-02-28" });
  });

  it("gives a later record a new id when two share one", () => {
    const r = readFrom({ records: [goodRecord, { ...goodRecord, name: "other" }] });
    expect(r.record.records).toHaveLength(2);
    expect(r.record.records[0].id).toBe("a");
    expect(r.record.records[1].id).not.toBe("a");
  });

  it("reads savedAt only when it is a string", () => {
    expect(readFrom({ savedAt: 5 }).savedAt).toBeNull();
  });

  it("never writes", () => {
    const storage = createMemoryStorage({ [KEY]: JSON.stringify({ records: [5] }) });
    networthAdapter.read(storage);
    expect(storage.writes).toBe(0);
  });
});

describe("networth adapter: saving", () => {
  it("writes one entry, and savedAt is not in the record", () => {
    const storage = createMemoryStorage();
    expect(saveTool(storage, networthAdapter, defaultNetworth(), SAVED)).toEqual({ ok: true });
    expect(Object.keys(storage.dump())).toEqual([KEY]);
    expect(JSON.parse(storage.getItem(KEY) as string).savedAt).toBe(SAVED);

    const after = networthAdapter.read(storage);
    expect(after.savedAt).toBe(SAVED);
    expect(JSON.stringify(after.record)).not.toContain("savedAt");
    expect(sameData(after.record, defaultNetworth())).toBe(true);
    expect(dateStateOf(after)).toBe("saved");
  });

  it("leaves savedAt out when it is null", () => {
    const entries = networthAdapter.toEntries(defaultNetworth(), null);
    expect(entries).toHaveLength(1);
    expect(JSON.parse(entries[0].value)).not.toHaveProperty("savedAt");
  });

  it("round-trips data", () => {
    const data: NetworthData = {
      usdSgd: 1.3,
      audSgd: null,
      targets: { cpfOa: 1, cpfSa: 5, cpfMa: 6, cpfRa: 7, srs: 2, cashSavings: 3, cashInvestments: 4 },
      records: [goodRecord as NetworthData["records"][number]],
    };
    const storage = createMemoryStorage();
    saveTool(storage, networthAdapter, data, SAVED);
    expect(networthAdapter.read(storage).record).toEqual(data);
  });
});

describe("networth adapter: registration and import", () => {
  it("is registered, with its key exported", () => {
    expect(TOOL_ADAPTERS).toContain(networthAdapter);
    expect(REGISTERED_KEYS).toContain(KEY);
  });

  it("repairs a damaged backup on import and imports one tool", () => {
    const storage = createMemoryStorage();
    const result = importBackup(storage, {
      [KEY]: { usdSgd: 0, records: [{ ...goodRecord, currency: "EUR" }, { ...goodRecord, id: "b", section: "nope" }] },
    });
    expect(result).toMatchObject({ ok: true, toolsImported: 1, keysSkipped: [] });
    const { record } = networthAdapter.read(storage);
    expect(record.usdSgd).toBeNull();
    expect(record.records).toHaveLength(1);
    expect(record.records[0].currency).toBe("SGD");
  });
});

describe("legacy CPF section", () => {
  it("moves records saved under the old single cpf section to OA", () => {
    const r = readFrom({ records: [{ ...goodRecord, id: "old", section: "cpf" }] });
    expect(r.record.records.map((x) => x.section)).toEqual(["cpfOa"]);
  });
});
