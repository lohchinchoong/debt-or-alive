import { describe, expect, it } from "vitest";
import { sameData, stableStringify } from "@/lib/persistence/equality";

describe("stableStringify", () => {
  it("sorts object keys at every depth", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("leaves out the listed keys at every depth", () => {
    expect(stableStringify({ a: 1, savedAt: "x", n: [{ savedAt: "y", b: 2 }] }, ["savedAt"])).toBe(
      '{"a":1,"n":[{"b":2}]}',
    );
  });
});

describe("sameData", () => {
  it("ignores key order", () => {
    expect(sameData({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it("ignores a top-level savedAt", () => {
    expect(sameData({ a: 1, savedAt: "2026-01-01" }, { a: 1 })).toBe(true);
  });

  it("ignores a nested savedAt", () => {
    expect(sameData({ withdrawal: { age: 63, savedAt: "x" } }, { withdrawal: { age: 63 } })).toBe(true);
  });

  it("treats array order as meaningful", () => {
    expect(sameData([1, 2], [2, 1])).toBe(false);
  });

  it("detects a changed value", () => {
    expect(sameData({ rate: 5 }, { rate: 6 })).toBe(false);
  });
});
