import { describe, expect, it } from "vitest";
import {
  MAX_AMOUNT,
  addRecord,
  chartRows,
  formatAmount,
  formatSgd,
  localDateISO,
  platformSuggestions,
  removeRecord,
  setRate,
  setTarget,
  summarise,
  toSgdCents,
  updateRecord,
  type NetworthData,
  type NetworthRecord,
} from "@/lib/networth";

function data(overrides: Partial<NetworthData> = {}): NetworthData {
  return {
    usdSgd: null,
    audSgd: null,
    targets: { cpf: 0, srs: 0, cashSavings: 0, cashInvestments: 0 },
    records: [],
    ...overrides,
  };
}

let n = 0;
function rec(overrides: Partial<NetworthRecord>): NetworthRecord {
  n += 1;
  return {
    id: `r${n}`,
    section: "cashSavings",
    name: "",
    platform: "",
    amount: 0,
    currency: "SGD",
    lastUpdated: "",
    ...overrides,
  };
}

describe("toSgdCents", () => {
  it("passes SGD through, in whole cents", () => {
    expect(toSgdCents(12.34, "SGD", data())).toBe(1234);
  });

  it("converts USD and AUD with the typed rates", () => {
    const d = data({ usdSgd: 1.35, audSgd: 0.9 });
    expect(toSgdCents(100, "USD", d)).toBe(13500);
    expect(toSgdCents(100, "AUD", d)).toBe(9000);
  });

  it("returns null when the rate is blank", () => {
    expect(toSgdCents(100, "USD", data())).toBeNull();
    expect(toSgdCents(100, "AUD", data({ usdSgd: 1.3 }))).toBeNull();
  });

  it("returns null for a result above SGD 100 billion or one that is not finite", () => {
    expect(toSgdCents(MAX_AMOUNT, "USD", data({ usdSgd: 1000 }))).toBeNull();
    expect(toSgdCents(Number.POSITIVE_INFINITY, "SGD", data())).toBeNull();
    expect(toSgdCents(MAX_AMOUNT, "SGD", data())).toBe(MAX_AMOUNT * 100);
  });
});

describe("summarise", () => {
  it("sums each section and subtracts debt once", () => {
    const d = data({
      records: [
        rec({ section: "cpf", amount: 1000 }),
        rec({ section: "srs", amount: 500.5 }),
        rec({ section: "debt", amount: 200 }),
      ],
    });
    const s = summarise(d);
    expect(s.sections.cpf.cents).toBe(100000);
    expect(s.sections.srs.cents).toBe(50050);
    expect(s.assetsCents).toBe(150050);
    expect(s.debtCents).toBe(20000);
    expect(s.netCents).toBe(130050);
    expect(s.incomplete).toBe(false);
  });

  it("rounds each record once, so the headline equals the sum of the subtotals", () => {
    const d = data({
      usdSgd: 1,
      records: [
        rec({ section: "cpf", amount: 0.005, currency: "USD" }),
        rec({ section: "cpf", amount: 0.005, currency: "USD" }),
        rec({ section: "cpf", amount: 0.005, currency: "USD" }),
      ],
    });
    const s = summarise(d);
    // Each record is 1 cent. Rounding the exact total (0.015) would give 2.
    expect(s.sections.cpf.cents).toBe(3);
    expect(s.netCents).toBe(s.assetsCents - s.debtCents);
    expect(s.assetsCents).toBe(3);
  });

  it("leaves out a record with no rate and marks the headline incomplete", () => {
    const missing = rec({ section: "cashSavings", amount: 100, currency: "USD", name: "Wise" });
    const s = summarise(data({ records: [missing, rec({ section: "cashSavings", amount: 50 })] }));
    expect(s.sections.cashSavings.cents).toBe(5000);
    expect(s.sections.cashSavings.excluded).toEqual([missing]);
    expect(s.incomplete).toBe(true);
  });

  it("marks the headline incomplete when a Debt record is left out", () => {
    const s = summarise(data({ records: [rec({ section: "debt", amount: 100, currency: "AUD" })] }));
    expect(s.sections.debt.excluded).toHaveLength(1);
    expect(s.incomplete).toBe(true);
  });

  it("clears incomplete once the rate is entered", () => {
    const d = data({ records: [rec({ amount: 100, currency: "USD" })] });
    expect(summarise(d).incomplete).toBe(true);
    expect(summarise(setRate(d, "USD", 1.3)).incomplete).toBe(false);
  });

  it("gives a negative net worth when debt is larger", () => {
    const s = summarise(data({ records: [rec({ section: "cpf", amount: 10 }), rec({ section: "debt", amount: 50 })] }));
    expect(s.netCents).toBe(-4000);
  });
});

describe("chartRows", () => {
  const withTargets = (cpf: number, subtotal: number) =>
    data({ targets: { cpf, srs: 0, cashSavings: 0, cashInvestments: 0 }, records: [rec({ section: "cpf", amount: subtotal })] });

  it("returns one row per asset section and leaves Debt out", () => {
    const d = data({ records: [rec({ section: "debt", amount: 999 })] });
    const { rows } = chartRows(summarise(d), d);
    expect(rows.map((r) => r.section)).toEqual(["cpf", "srs", "cashSavings", "cashInvestments"]);
  });

  it("gives a null percent when the target is 0", () => {
    const d = withTargets(0, 100);
    const { rows } = chartRows(summarise(d), d);
    expect(rows[0]).toMatchObject({ cents: 10000, targetCents: 0, percent: null });
  });

  it("gives a null percent for a target that rounds to 0 cents", () => {
    const d = withTargets(0.004, 100);
    const { rows } = chartRows(summarise(d), d);
    expect(rows[0].targetCents).toBe(0);
    expect(rows[0].percent).toBeNull();
  });

  it("reports 120% and 250% of target", () => {
    expect(chartRows(summarise(withTargets(1000, 1200)), withTargets(1000, 1200)).rows[0].percent).toBe(120);
    expect(chartRows(summarise(withTargets(1000, 2500)), withTargets(1000, 2500)).rows[0].percent).toBe(250);
  });

  it("sets one shared axis at least 15% above the largest value", () => {
    for (const [target, subtotal] of [[1000, 1200], [1000, 100], [50, 5000], [7000, 7000]]) {
      const d = withTargets(target, subtotal);
      const { axisMaxDollars } = chartRows(summarise(d), d);
      expect(axisMaxDollars).toBeGreaterThanOrEqual(1.15 * Math.max(target, subtotal));
    }
  });

  it("does not count Debt towards the axis", () => {
    const d = data({ records: [rec({ section: "cpf", amount: 100 }), rec({ section: "debt", amount: 1_000_000 })] });
    expect(chartRows(summarise(d), d).axisMaxDollars).toBeLessThan(1000);
  });

  it("uses niceMax's floor of 1000 when everything is 0", () => {
    const d = data();
    const { rows, axisMaxDollars } = chartRows(summarise(d), d);
    expect(axisMaxDollars).toBe(1000);
    expect(rows.every((r) => r.cents === 0 && r.percent === null)).toBe(true);
  });

  it("flags a row whose section has a left-out record", () => {
    const d = data({ records: [rec({ section: "srs", amount: 5, currency: "USD" })] });
    const { rows } = chartRows(summarise(d), d);
    expect(rows.find((r) => r.section === "srs")?.incomplete).toBe(true);
    expect(rows.find((r) => r.section === "cpf")?.incomplete).toBe(false);
  });
});

describe("localDateISO", () => {
  it("uses the local year, month and day", () => {
    expect(localDateISO(new Date(2026, 10, 9, 23, 30))).toBe("2026-11-09");
    expect(localDateISO(new Date(2026, 0, 5, 0, 5))).toBe("2026-01-05");
  });
});

describe("draft helpers", () => {
  it("addRecord adds a default SGD record without changing its input", () => {
    const d = data();
    const next = addRecord(d, "srs", "2026-11-09");
    expect(d.records).toHaveLength(0);
    expect(next.records).toHaveLength(1);
    expect(next.records[0]).toMatchObject({
      section: "srs",
      name: "",
      platform: "",
      amount: 0,
      currency: "SGD",
      lastUpdated: "2026-11-09",
    });
    expect(next.records[0].id).toMatch(/^nw_/);
  });

  it("updateRecord changes only the named record and ignores an unknown id", () => {
    const a = rec({ name: "A" });
    const b = rec({ name: "B" });
    const d = data({ records: [a, b] });
    const next = updateRecord(d, a.id, { name: "A2", amount: 5 });
    expect(next.records[0]).toMatchObject({ name: "A2", amount: 5 });
    expect(next.records[1]).toBe(b);
    expect(d.records[0].name).toBe("A");
    expect(updateRecord(d, "missing", { name: "x" })).toBe(d);
  });

  it("removeRecord drops one record", () => {
    const a = rec({});
    const b = rec({});
    expect(removeRecord(data({ records: [a, b] }), a.id).records).toEqual([b]);
  });

  it("setRate and setTarget return new data", () => {
    const d = data();
    expect(setRate(d, "USD", 1.3).usdSgd).toBe(1.3);
    expect(setRate(d, "AUD", null).audSgd).toBeNull();
    expect(setTarget(d, "cpf", 500).targets.cpf).toBe(500);
    expect(d.usdSgd).toBeNull();
    expect(d.targets.cpf).toBe(0);
  });
});

describe("platformSuggestions", () => {
  it("trims, de-duplicates without regard to case, keeps the first spelling and sorts", () => {
    const d = data({
      records: [
        rec({ platform: " Syfe " }),
        rec({ platform: "DBS" }),
        rec({ platform: "syfe" }),
        rec({ platform: "" }),
        rec({ platform: "   " }),
        rec({ platform: "Atlas" }),
      ],
    });
    expect(platformSuggestions(d)).toEqual(["Atlas", "DBS", "Syfe"]);
  });
});

describe("formatters", () => {
  it("formats SGD cents with 2 decimals and a minus sign for negatives", () => {
    expect(formatSgd(123456)).toContain("1,234.56");
    expect(formatSgd(-5000)).toMatch(/^-/);
    expect(formatSgd(-5000)).toContain("50.00");
  });

  it("formats a record amount in its own currency", () => {
    expect(formatAmount(10, "USD")).toContain("10.00");
    expect(formatAmount(10, "USD")).not.toBe(formatAmount(10, "AUD"));
  });
});
