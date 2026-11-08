import { describe, expect, it } from "vitest";
import { saveEntries } from "@/lib/persistence/save";
import { createMemoryStorage } from "@/lib/persistence/testing/memoryStorage";
import type { StorageEntry } from "@/lib/persistence/types";

describe("saveEntries", () => {
  it("writes all entries in order", () => {
    const order: string[] = [];
    const storage = createMemoryStorage({}, {
      failOnSet: (_call, key) => {
        order.push(key);
        return false;
      },
    });

    const result = saveEntries(storage, [
      { key: "a", value: "1" },
      { key: "b", value: "2" },
    ]);

    expect(result).toEqual({ ok: true });
    expect(order).toEqual(["a", "b"]);
    expect(storage.dump()).toEqual({ a: "1", b: "2" });
  });

  it("restores earlier keys when a later write throws", () => {
    const storage = createMemoryStorage({ a: "old" }, { failOnSet: (call) => call === 3 });

    const result = saveEntries(storage, [
      { key: "a", value: "new" },
      { key: "absent", value: "x" },
      { key: "c", value: "boom" },
    ]);

    expect(result.ok).toBe(false);
    expect(storage.dump()).toEqual({ a: "old" });
  });

  it("rejects a malformed entry before writing anything", () => {
    const storage = createMemoryStorage();
    const bad = [{ key: "a", value: "1" }, { key: "", value: "2" }] as StorageEntry[];

    const result = saveEntries(storage, bad);

    expect(result.ok).toBe(false);
    expect(storage.writes).toBe(0);
  });

  it("returns the original error when the restore also fails", () => {
    const storage = createMemoryStorage({ a: "old" }, { failOnSet: (call) => call >= 2 });

    const result = saveEntries(storage, [
      { key: "a", value: "new" },
      { key: "b", value: "x" },
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain("set #2");
  });
});
