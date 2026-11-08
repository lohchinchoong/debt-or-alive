import { describe, expect, it } from "vitest";
import { cpfSaAdapter, type CpfProfile } from "@/lib/persistence/adapters/cpf-sa";
import { sameData } from "@/lib/persistence/equality";
import { createMemoryStorage } from "@/lib/persistence/testing/memoryStorage";

const KEY = "cpf-sa:profiles";

const legacy: CpfProfile = {
  id: "p_1",
  name: "Mine",
  currentBalance: 20_000,
  monthlyContrib: 600,
  startYear: 2024,
  startMonth: 3,
  endContribYear: 2035,
  birthYear: 1990,
};

describe("cpfSaAdapter", () => {
  it("uses the canonical slug, name and list path", () => {
    expect(cpfSaAdapter.slug).toBe("cpf-sa-calculator");
    expect(cpfSaAdapter.name).toBe("CPF Special Account (SA) Calculator");
    expect(cpfSaAdapter.listPath).toBe("/tools/cpf-sa-calculator");
  });

  it("reads empty storage as [] with zero writes", () => {
    const storage = createMemoryStorage();
    expect(cpfSaAdapter.readAll(storage)).toEqual([]);
    expect(storage.writes).toBe(0);
  });

  it("reads legacy data with zero writes and round-trips it unchanged", () => {
    const storage = createMemoryStorage({ [KEY]: JSON.stringify([legacy]) });
    const first = cpfSaAdapter.readAll(storage);
    expect(storage.writes).toBe(0);

    const again = cpfSaAdapter.readAll(createMemoryStorage({ [KEY]: JSON.stringify(first) }));
    expect(sameData(again, first)).toBe(true);
    expect(first[0].savedAt).toBeUndefined();
  });

  it("keeps savedAt on read", () => {
    const storage = createMemoryStorage({ [KEY]: JSON.stringify([{ ...legacy, savedAt: "2026-11-08T04:00:00Z" }]) });
    expect(cpfSaAdapter.readAll(storage)[0].savedAt).toBe("2026-11-08T04:00:00Z");
  });

  it("fills startMonth with 1 for profiles saved before it existed", () => {
    const { startMonth: _omit, ...withoutMonth } = legacy;
    void _omit;
    const storage = createMemoryStorage({ [KEY]: JSON.stringify([withoutMonth]) });
    expect(cpfSaAdapter.readAll(storage)[0].startMonth).toBe(1);
  });

  it("migrates the old single-profile key into one profile with no date", () => {
    const storage = createMemoryStorage({ "tool:cpf-sa-calculator": JSON.stringify({ currentBalance: 5_000 }) });

    const profiles = cpfSaAdapter.readAll(storage);

    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({ name: "My Scenario", currentBalance: 5_000, startMonth: 1 });
    expect(profiles[0].savedAt).toBeUndefined();
    expect(JSON.parse(storage.getItem(KEY) as string)).toHaveLength(1);

    // A second read finds the array and does not migrate again.
    const writes = storage.writes;
    cpfSaAdapter.readAll(storage);
    expect(storage.writes).toBe(writes);
  });

  it("gives newProfile a fresh id, the default name and no date", () => {
    const p = cpfSaAdapter.newProfile();
    expect(p.id).toMatch(/^p_\d+$/);
    expect(p.name).toBe("New Scenario");
    expect(p.savedAt).toBeUndefined();
  });
});
