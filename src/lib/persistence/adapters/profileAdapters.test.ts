import { describe, expect, it } from "vitest";
import { cpfMaAdapter } from "@/lib/persistence/adapters/cpf-ma";
import { cpfOaAdapter } from "@/lib/persistence/adapters/cpf-oa";
import { addMonth, hysaAdapter, removeLastMonth, updateEntry } from "@/lib/persistence/adapters/hysa-tracker";
import { addItem, moveItem, removeItem, savingsGoalAdapter, updateItem } from "@/lib/persistence/adapters/savings-goal";
import { sameData } from "@/lib/persistence/equality";
import { createMemoryStorage } from "@/lib/persistence/testing/memoryStorage";
import type { ProfileAdapter, ProfileBase } from "@/lib/persistence/types";
import { REGISTERED_KEYS } from "@/lib/persistence/registry";

const SAVED = "2026-11-08T04:00:00Z";

type Case = { adapter: ProfileAdapter<ProfileBase>; legacy: Record<string, unknown> };

const cases: Case[] = [
  {
    adapter: cpfMaAdapter as ProfileAdapter<ProfileBase>,
    legacy: { id: "p_1", name: "MA", currentBalance: 1, monthlyContrib: 2, startYear: 2024, startMonth: 3, endContribYear: 2030, birthYear: 1990, annualMedishieldPremium: 0 },
  },
  {
    adapter: cpfOaAdapter as ProfileAdapter<ProfileBase>,
    legacy: { id: "p_1", name: "OA", birthYear: 1980, startDrawdownAge: 55, balanceAtStart: 100_000, endDrawdownAge: 70 },
  },
  {
    adapter: hysaAdapter as ProfileAdapter<ProfileBase>,
    legacy: { id: "hysa_1", name: "Bank", entries: [] },
  },
  {
    adapter: savingsGoalAdapter as ProfileAdapter<ProfileBase>,
    legacy: { id: "sg_1", name: "Trip", targetAmount: 5000, targetDate: "2027-01-01", items: [] },
  },
];

describe.each(cases)("$adapter.slug adapter", ({ adapter, legacy }) => {
  it("reads empty storage as [] with zero writes", () => {
    const storage = createMemoryStorage();
    expect(adapter.readAll(storage)).toEqual([]);
    expect(storage.writes).toBe(0);
  });

  it("reads legacy data with zero writes and round-trips it unchanged", () => {
    const storage = createMemoryStorage({ [adapter.key]: JSON.stringify([legacy]) });
    const first = adapter.readAll(storage);
    expect(storage.writes).toBe(0);
    const again = adapter.readAll(createMemoryStorage({ [adapter.key]: JSON.stringify(first) }));
    expect(sameData(again, first)).toBe(true);
    expect(first[0].savedAt).toBeUndefined();
  });

  it("keeps savedAt on read", () => {
    const storage = createMemoryStorage({ [adapter.key]: JSON.stringify([{ ...legacy, savedAt: SAVED }]) });
    expect(adapter.readAll(storage)[0].savedAt).toBe(SAVED);
  });

  it("gives newProfile a fresh id each call, a name and no date", async () => {
    const a = adapter.newProfile();
    await new Promise((r) => setTimeout(r, 2));
    const b = adapter.newProfile();
    expect(a.id).not.toBe(b.id);
    expect(a.name).toBeTruthy();
    expect(a.savedAt).toBeUndefined();
  });

  it("is registered for export", () => {
    expect(REGISTERED_KEYS).toContain(adapter.key);
  });
});

describe("cpf-oa legacy shape", () => {
  it("maps balanceAt55 to a start age of 56", () => {
    const storage = createMemoryStorage({ "cpf-oa:profiles": JSON.stringify([{ id: "p", name: "Old", balanceAt55: 80_000 }]) });
    expect(cpfOaAdapter.readAll(storage)[0]).toMatchObject({ startDrawdownAge: 56, balanceAtStart: 80_000 });
  });
});

describe("savings-goal legacy ids", () => {
  it("gives a record without an id the same id on every read", () => {
    const storage = createMemoryStorage({ "savings-goal:scenarios": JSON.stringify([{ name: "No id" }]) });
    const first = savingsGoalAdapter.readAll(storage)[0].id;
    const second = savingsGoalAdapter.readAll(storage)[0].id;
    expect(first).toBe("sg_legacy_0");
    expect(second).toBe(first);
  });

  it("has no duplicate keys across registered adapters", () => {
    expect(new Set(REGISTERED_KEYS).size).toBe(REGISTERED_KEYS.length);
  });
});

describe("hysa draft helpers", () => {
  const base = hysaAdapter.newProfile();

  it("adds the current month to an empty scenario, then the following month", () => {
    const one = addMonth(base, new Date(2026, 10, 8));
    expect(one.entries.map((e) => [e.year, e.month])).toEqual([[2026, 11]]);
    const three = addMonth(addMonth(one));
    expect(three.entries.map((e) => [e.year, e.month])).toEqual([[2026, 11], [2026, 12], [2027, 1]]);
  });

  it("removes the last month and updates one entry without mutating the input", () => {
    const two = addMonth(addMonth(base, new Date(2026, 0, 1)));
    const edited = updateEntry(two, 2026, 2, { salaryAmount: 5000 });
    expect(edited.entries[1].salaryAmount).toBe(5000);
    expect(two.entries[1].salaryAmount).toBe(0);
    expect(removeLastMonth(edited).entries).toHaveLength(1);
  });
});

describe("savings-goal draft helpers", () => {
  const base = savingsGoalAdapter.newProfile();

  it("adds, updates, moves and removes items without mutating the input", () => {
    const a = addItem(base, { name: "A", amount: 1, date: "2026-01-01" });
    const ab = { ...a, items: [...a.items, { id: "b", name: "B", amount: 2, date: "2026-01-02" }] };
    const moved = moveItem(ab, 0, 1);
    expect(moved.items.map((i) => i.name)).toEqual(["B", "A"]);
    expect(ab.items.map((i) => i.name)).toEqual(["A", "B"]);
    expect(moveItem(ab, 0, -1)).toBe(ab);
    const updated = updateItem(moved, "b", { amount: 9 });
    expect(updated.items[0].amount).toBe(9);
    expect(removeItem(updated, "b").items.map((i) => i.name)).toEqual(["A"]);
  });
});
