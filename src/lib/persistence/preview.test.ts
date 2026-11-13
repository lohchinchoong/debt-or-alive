import { describe, expect, it } from "vitest";
import { APP_ID, parseBackup } from "@/lib/persistence/backup";
import { importBackup } from "@/lib/persistence/import";
import { prepareImport, previewBackup, summarizeLocal } from "@/lib/persistence/preview";
import { toolMeta } from "@/lib/persistence/toolMeta";
import { BACKUP_V1_TEXT } from "@/lib/persistence/testing/backupV1";
import { createMemoryStorage } from "@/lib/persistence/testing/memoryStorage";
import type { StorageLike } from "@/lib/persistence/types";

const SAVED = "2026-11-08T04:00:00Z";

const MORTGAGE = toolMeta("mortgage-calculator").name;
const DIVIDEND = toolMeta("dividend-calculator").name;
const CPF_SA = toolMeta("cpf-sa-calculator").name;
const HYSA = toolMeta("hysa-tracker").name;
const CPF_OA = toolMeta("cpf-oa-annuity-calculator").name;

const LEGACY = "cpf-oa:profiles";
const OA_KEY = "tool:cpf-oa-annuity-calculator";
const A = { id: "p_a", name: "Plan A", birthYear: 1980, startDrawdownAge: 55, balanceAtStart: 100000, endDrawdownAge: 75, savedAt: "2026-01-01T00:00:00.000Z" };
const B = { id: "p_b", name: "Plan B", birthYear: 1982, startDrawdownAge: 60, balanceAtStart: 200000, endDrawdownAge: 80, savedAt: "2026-03-01T00:00:00.000Z" };
const C = { id: "p_c", name: "Plan C", birthYear: 1984, startDrawdownAge: 65, balanceAtStart: 300000, endDrawdownAge: 85 };

function fixtureData(): Record<string, unknown> {
  const parsed = parseBackup(BACKUP_V1_TEXT);
  if (!parsed.ok) throw new Error("fixture should parse");
  return parsed.payload.data;
}

function hysa(...scenarios: unknown[]): Record<string, unknown> {
  return { "hysa-tracker:scenarios": scenarios };
}

describe("previewBackup: tools and dates in the file", () => {
  it("lists the tools of the version 1 fixture in registry order, with the newest save", () => {
    const preview = previewBackup(createMemoryStorage(), fixtureData());

    expect(preview.fileTools).toEqual([MORTGAGE, DIVIDEND, CPF_SA, HYSA]);
    expect(preview.fileLatestSavedAt).toBe(SAVED);
  });

  it("lists nothing for a file with only unknown keys", () => {
    const preview = previewBackup(createMemoryStorage(), { "unknown:example": 1 });

    expect(preview).toMatchObject({ fileTools: [], fileLatestSavedAt: null });
  });

  it("uses a legacy-only CPF OA key, dated by the profile that import would keep", () => {
    const preview = previewBackup(createMemoryStorage(), { [LEGACY]: [A, B, C] });

    expect(preview.fileTools).toEqual([CPF_OA]);
    expect(preview.fileLatestSavedAt).toBe(B.savedAt);
  });

  it("uses the current CPF OA key when the file has both keys", () => {
    const current = { birthYear: 1975, startDrawdownAge: 55, balanceAtStart: 5, endDrawdownAge: 70, savedAt: SAVED };

    const preview = previewBackup(createMemoryStorage(), { [OA_KEY]: current, [LEGACY]: [B] });

    expect(preview.fileTools).toEqual([CPF_OA]);
    expect(preview.fileLatestSavedAt).toBe(SAVED);
  });

  it("gives a tool no date when the file lacks its date-bearing key", () => {
    // The dividend tool is dated by its projection-years key; the file has only sources.
    const preview = previewBackup(createMemoryStorage(), { "dividend:sources": [] });

    expect(preview.fileTools).toEqual([DIVIDEND]);
    expect(preview.fileLatestSavedAt).toBeNull();
  });

  it("counts a profile tool whose value is not an array, with no date", () => {
    const preview = previewBackup(createMemoryStorage(), { "hysa-tracker:scenarios": {} });

    expect(preview.fileTools).toEqual([HYSA]);
    expect(preview.fileLatestSavedAt).toBeNull();
  });

  it("counts a profile list that holds a null entry, and ignores the entry", () => {
    const preview = previewBackup(createMemoryStorage(), hysa(null, { id: "h1", name: "Bank", entries: [], savedAt: SAVED }));

    expect(preview.fileTools).toEqual([HYSA]);
    expect(preview.fileLatestSavedAt).toBe(SAVED);
  });

  it("ignores a savedAt that is not a string or not a date", () => {
    const preview = previewBackup(
      createMemoryStorage(),
      hysa({ id: "h1", name: "A", entries: [], savedAt: 5 }, { id: "h2", name: "B", entries: [], savedAt: "nope" }),
    );

    expect(preview.fileTools).toEqual([HYSA]);
    expect(preview.fileLatestSavedAt).toBeNull();
  });

  it("chooses the latest date by time, not by string order", () => {
    // 12:00+08:00 is 04:00Z, earlier than 05:00Z, although it sorts later as a string.
    const preview = previewBackup(
      createMemoryStorage(),
      hysa(
        { id: "h1", name: "A", entries: [], savedAt: "2026-11-08T12:00:00+08:00" },
        { id: "h2", name: "B", entries: [], savedAt: "2026-11-08T05:00:00Z" },
      ),
    );

    expect(preview.fileLatestSavedAt).toBe("2026-11-08T05:00:00Z");
  });

  it("includes the summary of this browser", () => {
    const storage = createMemoryStorage();
    importBackup(storage, fixtureData());

    expect(previewBackup(storage, { "unknown:example": 1 }).local).toEqual(summarizeLocal(storage));
  });
});

describe("previewBackup agrees with importBackup (drift guard)", () => {
  const cases: { name: string; data: () => Record<string, unknown>; tools: string[] }[] = [
    { name: "the version 1 fixture", data: fixtureData, tools: [MORTGAGE, DIVIDEND, CPF_SA, HYSA] },
    { name: "only the legacy CPF OA key", data: () => ({ [LEGACY]: [A, B, C] }), tools: [CPF_OA] },
    { name: "both CPF OA keys", data: () => ({ [OA_KEY]: { birthYear: 1975, startDrawdownAge: 55, balanceAtStart: 5, endDrawdownAge: 70 }, [LEGACY]: [B] }), tools: [CPF_OA] },
    { name: "a HYSA value that is not an array", data: () => ({ "hysa-tracker:scenarios": {} }), tools: [HYSA] },
    { name: "a HYSA list with a null entry", data: () => hysa(null, { id: "h1", name: "Bank", entries: [] }), tools: [HYSA] },
    { name: "only unknown keys", data: () => ({ "unknown:example": 1 }), tools: [] },
  ];

  for (const { name, data, tools } of cases) {
    it(`lists the same tools that import counts for ${name}`, () => {
      const preview = previewBackup(createMemoryStorage(), data());
      const result = importBackup(createMemoryStorage(), data());

      expect(preview.fileTools).toEqual(tools);
      expect(preview.fileTools.length).toBe(result.toolsImported);
    });
  }
});

describe("summarizeLocal", () => {
  it("gives a count of 0 and no date for empty storage", () => {
    expect(summarizeLocal(createMemoryStorage())).toEqual({ toolCount: 0, latestSavedAt: null });
  });

  it("counts tools and profile lists, and finds the newest save", () => {
    const storage = createMemoryStorage();
    importBackup(storage, fixtureData());

    expect(summarizeLocal(storage)).toEqual({ toolCount: 4, latestSavedAt: SAVED });
  });

  it("counts a tool with data and no date, leaving the date unchanged", () => {
    const storage = createMemoryStorage({
      "tool:mortgage-calculator": JSON.stringify({ propertyPrice: 700_000, downPaymentPct: 20, annualRate: 3, tenureYears: 25 }),
    });

    expect(summarizeLocal(storage)).toEqual({ toolCount: 1, latestSavedAt: null });
  });

  it("counts local data held only in the legacy CPF OA key", () => {
    const storage = createMemoryStorage({ [LEGACY]: JSON.stringify([B]) });

    expect(summarizeLocal(storage)).toEqual({ toolCount: 1, latestSavedAt: B.savedAt });
  });

  it("skips an adapter that throws on the local read", () => {
    const memory = createMemoryStorage();
    importBackup(memory, fixtureData());
    const failing: StorageLike = {
      getItem(key) {
        if (key === "tool:mortgage-calculator") throw new Error("unreadable");
        return memory.getItem(key);
      },
      setItem: memory.setItem,
      removeItem: memory.removeItem,
    };

    expect(summarizeLocal(failing).toolCount).toBe(3);
  });

  it("never writes, and counts a CPF SA profile that is only in the legacy key", () => {
    const storage = createMemoryStorage({ "tool:cpf-sa-calculator": JSON.stringify({ currentBalance: 5 }) });

    const summary = summarizeLocal(storage);

    expect(summary.toolCount).toBe(1);
    expect(storage.writes).toBe(0);
    expect(storage.getItem("cpf-sa:profiles")).toBeNull();
  });
});

describe("prepareImport", () => {
  it("returns the payload and the preview for a good file", () => {
    const result = prepareImport(createMemoryStorage(), BACKUP_V1_TEXT);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.exportedAt).toBe("2026-11-08T04:00:00.000Z");
    expect(result.preview.fileTools).toHaveLength(4);
  });

  it("returns the parse message for a file that fails the checks", () => {
    expect(prepareImport(createMemoryStorage(), "{")).toEqual({
      ok: false,
      message: "This file isn't a valid backup. It couldn't be read as JSON.",
    });
    expect(prepareImport(createMemoryStorage(), JSON.stringify({ app: APP_ID, version: 2, data: {} }))).toEqual({
      ok: false,
      message: "This file was made by a newer version of Debt or Alive. Update the app and try again.",
    });
  });

  it("reports a file with no recognised tool", () => {
    const text = JSON.stringify({ app: APP_ID, version: 1, data: { "unknown:example": 1 } });

    expect(prepareImport(createMemoryStorage(), text)).toEqual({
      ok: false,
      message: "No recognised data found in this file.",
    });
  });

  it("reports a file as damaged when an adapter throws while reading it", () => {
    // The file has the dividend date key only, so the adapter reads its sources key from storage, which throws.
    const failing: StorageLike = {
      getItem(key) {
        if (key === "dividend:sources") throw new Error("unreadable");
        return null;
      },
      setItem() {},
      removeItem() {},
    };
    const text = JSON.stringify({ app: APP_ID, version: 1, data: { "dividend:projection-years": { years: 12, savedAt: SAVED } } });

    expect(prepareImport(failing, text)).toEqual({
      ok: false,
      message: "This backup file is damaged or in an unknown format.",
    });
  });
});
