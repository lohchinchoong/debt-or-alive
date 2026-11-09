import { describe, expect, it } from "vitest";
import { cpfOaAdapter, CPF_OA_DEFAULT_PARAMS, readLegacyOaState } from "@/lib/persistence/adapters/cpf-oa";
import { createMemoryStorage } from "@/lib/persistence/testing/memoryStorage";

const LEGACY = "cpf-oa:profiles";
const NEW_KEY = "tool:cpf-oa-annuity-calculator";

const A = { id: "p_a", name: "Plan A", birthYear: 1980, startDrawdownAge: 55, balanceAtStart: 100000, endDrawdownAge: 75, savedAt: "2026-01-01T00:00:00.000Z" };
const B = { id: "p_b", name: "Plan B", birthYear: 1982, startDrawdownAge: 60, balanceAtStart: 200000, endDrawdownAge: 80, savedAt: "2026-03-01T00:00:00.000Z" };
const C = { id: "p_c", name: "Plan C", birthYear: 1984, startDrawdownAge: 65, balanceAtStart: 300000, endDrawdownAge: 85 };
const C1 = { id: "p_c1", name: "Plan C1", birthYear: 1986, startDrawdownAge: 56, balanceAtStart: 110000, endDrawdownAge: 70 };
const C2 = { id: "p_c2", name: "Plan C2", birthYear: 1988, startDrawdownAge: 57, balanceAtStart: 120000, endDrawdownAge: 71 };
const F = { id: "p_f", name: "Plan F", birthYear: 1990, startDrawdownAge: 58, balanceAtStart: 130000, endDrawdownAge: 72, savedAt: "2999-01-01T00:00:00.000Z" };
const L = { id: "p_l", name: "Plan L", birthYear: 1970, balanceAt55: 80000, endDrawdownAge: 70 };

const withLegacy = (items: unknown) => createMemoryStorage({ [LEGACY]: JSON.stringify(items) });
const inputsOf = (p: typeof A) => ({
  birthYear: p.birthYear,
  startDrawdownAge: p.startDrawdownAge,
  balanceAtStart: p.balanceAtStart,
  endDrawdownAge: p.endDrawdownAge,
});

describe("cpfOaAdapter.readLegacy winner selection", () => {
  const read = (items: unknown) => cpfOaAdapter.readLegacy?.(withLegacy(items));

  it("[A, B, C] returns B's values", () => {
    expect(read([A, B, C])?.record.inputs).toEqual(inputsOf(B));
  });
  it("returns B's savedAt", () => {
    expect(read([A, B, C])?.savedAt).toBe(B.savedAt);
  });
  it("[A, C] returns A, because a missing date is oldest", () => {
    expect(read([A, C])?.record.inputs).toEqual(inputsOf(A));
  });
  it("[C1, C2] returns C2, the last item", () => {
    expect(read([C1, C2])?.record.inputs).toEqual(inputsOf(C2 as typeof A));
  });
  it("two profiles with the same savedAt return the last", () => {
    expect(read([A, { ...B, savedAt: A.savedAt }])?.record.inputs).toEqual(inputsOf(B));
  });
  it("[A, F] returns A, because a future date counts as invalid", () => {
    expect(read([A, F])?.record.inputs).toEqual(inputsOf(A));
  });
  it("a winner with an unparseable savedAt returns savedAt null", () => {
    expect(read([{ ...A, savedAt: "garbage" }])?.savedAt).toBeNull();
  });
  it("a winner with a numeric savedAt returns savedAt null", () => {
    expect(read([{ ...A, savedAt: 123 }])?.savedAt).toBeNull();
  });
});

describe("cpfOaAdapter.readLegacy normalisation and counts", () => {
  const read = (items: unknown) => cpfOaAdapter.readLegacy?.(withLegacy(items));

  it("[L] gives start age 56 and the balance from balanceAt55", () => {
    expect(read([L])?.record.inputs).toMatchObject({ startDrawdownAge: 56, balanceAtStart: 80000 });
  });
  it("a string birthYear takes its default", () => {
    expect(read([{ ...A, birthYear: "1980" }])?.record.inputs.birthYear).toBe(CPF_OA_DEFAULT_PARAMS.birthYear);
  });
  it("discarded is the usable count minus 1", () => {
    expect(read([A, B, C])?.discarded).toBe(2);
  });
  it("non-object items are skipped and not counted", () => {
    expect(read([A, null, 5])?.discarded).toBe(0);
  });
});

describe("cpfOaAdapter.readLegacy null cases", () => {
  it.each([
    ["invalid JSON", createMemoryStorage({ [LEGACY]: "not json" })],
    ["a non-array", createMemoryStorage({ [LEGACY]: "{}" })],
    ["an empty array", withLegacy([])],
    ["an array with no usable item", withLegacy([1, null])],
    ["no legacy key", createMemoryStorage()],
  ])("returns null for %s", (_name, storage) => {
    expect(cpfOaAdapter.readLegacy?.(storage)).toBeNull();
  });
});

describe("cpfOaAdapter.read", () => {
  it("falls back to the winner with exists true and no writes", () => {
    const storage = withLegacy([A, B, C]);
    const read = cpfOaAdapter.read(storage);
    expect(read.record.inputs).toEqual(inputsOf(B));
    expect(read.savedAt).toBe(B.savedAt);
    expect(read.exists).toBe(true);
    expect(storage.writes).toBe(0);
  });
  it("ignores the legacy key when the new key exists", () => {
    const storage = createMemoryStorage({
      [LEGACY]: JSON.stringify([B]),
      [NEW_KEY]: JSON.stringify({ ...inputsOf(A), savedAt: "2026-02-01T00:00:00.000Z" }),
    });
    expect(cpfOaAdapter.read(storage).record.inputs).toEqual(inputsOf(A));
  });
  it("returns defaults when neither key exists", () => {
    const read = cpfOaAdapter.read(createMemoryStorage());
    expect(read.record.inputs).toEqual(CPF_OA_DEFAULT_PARAMS);
    expect(read.exists).toBe(false);
  });
  it("returns defaults and keeps the legacy key when the new key is corrupt", () => {
    const storage = createMemoryStorage({ [LEGACY]: JSON.stringify([B]), [NEW_KEY]: "not json" });
    expect(cpfOaAdapter.read(storage).record.inputs).toEqual(CPF_OA_DEFAULT_PARAMS);
    expect(storage.getItem(LEGACY)).not.toBeNull();
  });
});

describe("readLegacyOaState", () => {
  it("several profiles give pending true and others n - 1", () => {
    expect(readLegacyOaState(withLegacy([A, B, C]))).toEqual({ pending: true, others: 2 });
  });
  it("one profile gives pending true and others 0", () => {
    expect(readLegacyOaState(withLegacy([A]))).toEqual({ pending: true, others: 0 });
  });
  it("the new key present gives pending false", () => {
    const storage = createMemoryStorage({ [LEGACY]: JSON.stringify([A, B]), [NEW_KEY]: JSON.stringify(inputsOf(A)) });
    expect(readLegacyOaState(storage)).toEqual({ pending: false, others: 0 });
  });
  it("no keys give pending false", () => {
    expect(readLegacyOaState(createMemoryStorage())).toEqual({ pending: false, others: 0 });
  });
});
