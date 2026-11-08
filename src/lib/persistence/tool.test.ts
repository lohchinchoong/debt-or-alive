import { describe, expect, it } from "vitest";
import { dateStateOf, saveTool } from "@/lib/persistence/tool";
import { createMemoryStorage } from "@/lib/persistence/testing/memoryStorage";
import type { StorageLike, ToolAdapter } from "@/lib/persistence/types";

// A minimal two-key adapter: `demo:list` holds an array, `tool:demo` holds the
// flat inputs plus savedAt. toEntries deliberately returns the date key first.
type Demo = { inputs: { rate: number }; list: number[] };

const demoAdapter: ToolAdapter<Demo> = {
  slug: "demo",
  name: "Demo",
  keys: ["tool:demo", "demo:list"],
  dateKey: "tool:demo",
  defaults: () => ({ inputs: { rate: 5 }, list: [] }),
  read(storage: StorageLike) {
    const rawInputs = storage.getItem("tool:demo");
    const rawList = storage.getItem("demo:list");
    const stored = rawInputs ? (JSON.parse(rawInputs) as { rate: number; savedAt?: string }) : null;
    const { savedAt = null, ...inputs } = stored ?? { rate: 5 };
    return {
      record: { inputs, list: rawList ? (JSON.parse(rawList) as number[]) : [] },
      savedAt,
      exists: rawInputs !== null || rawList !== null,
    };
  },
  toEntries(record, savedAt) {
    return [
      { key: "tool:demo", value: JSON.stringify(savedAt ? { ...record.inputs, savedAt } : record.inputs) },
      { key: "demo:list", value: JSON.stringify(record.list) },
    ];
  },
};

describe("dateStateOf", () => {
  it("returns never when nothing is stored", () => {
    expect(dateStateOf({ exists: false, savedAt: null })).toBe("never");
  });
  it("returns saved when a date is set", () => {
    expect(dateStateOf({ exists: true, savedAt: "2026-11-08T00:00:00Z" })).toBe("saved");
  });
  it("returns legacy when data exists without a date", () => {
    expect(dateStateOf({ exists: true, savedAt: null })).toBe("legacy");
  });
});

describe("saveTool", () => {
  it("writes the date key last, even when toEntries returns it first", () => {
    const order: string[] = [];
    const storage = createMemoryStorage({}, {
      failOnSet: (_call, key) => {
        order.push(key);
        return false;
      },
    });

    const result = saveTool(storage, demoAdapter, { inputs: { rate: 6 }, list: [1] }, "2026-11-08T04:00:00Z");

    expect(result).toEqual({ ok: true });
    expect(order).toEqual(["demo:list", "tool:demo"]);
  });

  it("leaves storage unchanged when a write fails", () => {
    const initial = { "tool:demo": '{"rate":5}', "demo:list": "[]" };
    const storage = createMemoryStorage(initial, { failOnSet: (call) => call === 2 });

    const result = saveTool(storage, demoAdapter, { inputs: { rate: 7 }, list: [9] }, "2026-11-08T04:00:00Z");

    expect(result.ok).toBe(false);
    expect(storage.dump()).toEqual(initial);
  });

  it("turns a throw in toEntries into ok: false", () => {
    const throwing: ToolAdapter<Demo> = {
      ...demoAdapter,
      toEntries: () => {
        throw new Error("cannot serialise");
      },
    };
    const storage = createMemoryStorage();

    const result = saveTool(storage, throwing, demoAdapter.defaults(), "2026-11-08T04:00:00Z");

    expect(result.ok).toBe(false);
    expect(storage.writes).toBe(0);
  });

  it("lets legacy data be saved, after which it reads as saved", () => {
    const storage = createMemoryStorage({ "tool:demo": '{"rate":5}' });
    const before = demoAdapter.read(storage);
    expect(dateStateOf(before)).toBe("legacy");

    saveTool(storage, demoAdapter, before.record, "2026-11-08T04:00:00Z");

    const after = demoAdapter.read(storage);
    expect(dateStateOf(after)).toBe("saved");
    expect(after.savedAt).toBe("2026-11-08T04:00:00Z");
    expect(JSON.parse(storage.getItem("tool:demo") as string)).toEqual({ rate: 5, savedAt: "2026-11-08T04:00:00Z" });
  });
});
