import { describe, expect, it } from "vitest";
import { deleteProfile, saveProfile } from "@/lib/persistence/profiles";
import { createMemoryStorage } from "@/lib/persistence/testing/memoryStorage";
import type { ProfileAdapter, StorageLike } from "@/lib/persistence/types";

type Demo = { id: string; name: string; value: number; savedAt?: string };

const KEY = "demo:profiles";
const demoAdapter: ProfileAdapter<Demo> = {
  slug: "demo",
  name: "Demo",
  listPath: "/tools/demo",
  key: KEY,
  readAll(storage: StorageLike) {
    const raw = storage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Demo[]) : [];
  },
  newProfile: () => ({ id: "p_new", name: "New Scenario", value: 0 }),
};

const NOW = "2026-11-08T04:00:00Z";
const stored = (profiles: Demo[]) => ({ [KEY]: JSON.stringify(profiles) });
const read = (storage: StorageLike) => demoAdapter.readAll(storage);

describe("saveProfile", () => {
  it("leaves other profiles' dates unchanged", () => {
    const storage = createMemoryStorage(
      stored([
        { id: "a", name: "A", value: 1, savedAt: "2026-01-01T00:00:00Z" },
        { id: "b", name: "B", value: 2, savedAt: "2026-02-02T00:00:00Z" },
      ]),
    );

    saveProfile(storage, demoAdapter, { id: "a", name: "A", value: 10 }, NOW, "existing");

    const [a, b] = read(storage);
    expect(a).toEqual({ id: "a", name: "A", value: 10, savedAt: NOW });
    expect(b.savedAt).toBe("2026-02-02T00:00:00Z");
  });

  it("keeps a profile another writer added after this page loaded", () => {
    const storage = createMemoryStorage(stored([{ id: "a", name: "A", value: 1 }]));
    const loaded = read(storage)[0];
    storage.setItem(KEY, JSON.stringify([...read(storage), { id: "c", name: "C", value: 3 }]));

    saveProfile(storage, demoAdapter, { ...loaded, value: 5 }, NOW, "existing");

    expect(read(storage).map((p) => p.id)).toEqual(["a", "c"]);
  });

  it("returns an error and writes nothing when an existing profile was deleted", () => {
    const storage = createMemoryStorage(stored([]));
    const writesBefore = storage.writes;

    const result = saveProfile(storage, demoAdapter, { id: "gone", name: "G", value: 1 }, NOW, "existing");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe("This profile was deleted in another tab");
    expect(storage.writes).toBe(writesBefore);
  });

  it("stores one record when saving twice in new mode", () => {
    const storage = createMemoryStorage();
    const profile = demoAdapter.newProfile();

    saveProfile(storage, demoAdapter, profile, NOW, "new");
    saveProfile(storage, demoAdapter, profile, NOW, "new");

    expect(read(storage)).toHaveLength(1);
  });
});

describe("deleteProfile", () => {
  it("removes only that id", () => {
    const storage = createMemoryStorage(
      stored([
        { id: "a", name: "A", value: 1 },
        { id: "b", name: "B", value: 2 },
      ]),
    );

    expect(deleteProfile(storage, demoAdapter, "a")).toEqual({ ok: true });
    expect(read(storage).map((p) => p.id)).toEqual(["b"]);
  });

  it("writes nothing for a missing id", () => {
    const storage = createMemoryStorage(stored([{ id: "a", name: "A", value: 1 }]));

    expect(deleteProfile(storage, demoAdapter, "missing")).toEqual({ ok: true });
    expect(storage.writes).toBe(0);
  });
});
