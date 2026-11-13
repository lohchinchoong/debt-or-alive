import { describe, expect, it } from "vitest";
import {
  APP_ID,
  FORMAT_VERSION,
  backupFileName,
  buildBackup,
  parseBackup,
  serializeBackup,
} from "@/lib/persistence/backup";
import { importBackup } from "@/lib/persistence/import";
import { REGISTERED_KEYS } from "@/lib/persistence/registry";
import { BACKUP_V1_TEXT } from "@/lib/persistence/testing/backupV1";
import { createMemoryStorage } from "@/lib/persistence/testing/memoryStorage";

const NOW = new Date("2026-11-08T04:00:00.000Z");

function file(overrides: Record<string, unknown>): string {
  return JSON.stringify({ app: APP_ID, version: FORMAT_VERSION, exportedAt: NOW.toISOString(), data: {}, ...overrides });
}

function errorKind(text: string): string | null {
  const result = parseBackup(text);
  return result.ok ? null : result.error.kind;
}

describe("buildBackup", () => {
  it("returns null when no registered key holds data", () => {
    expect(buildBackup(createMemoryStorage(), NOW)).toBeNull();
  });

  it("includes only registered keys and sets the envelope fields", () => {
    const storage = createMemoryStorage({
      "tool:mortgage-calculator": JSON.stringify({ propertyPrice: 1 }),
      "not-registered": JSON.stringify({ a: 1 }),
    });

    const payload = buildBackup(storage, NOW);

    expect(payload).toEqual({
      app: "debtoralive",
      version: 1,
      exportedAt: "2026-11-08T04:00:00.000Z",
      data: { "tool:mortgage-calculator": { propertyPrice: 1 } },
    });
  });

  it("keeps a value that is not valid JSON as a string", () => {
    const storage = createMemoryStorage({ "dividend:projection-years": "not json" });

    expect(buildBackup(storage, NOW)?.data).toEqual({ "dividend:projection-years": "not json" });
  });
});

describe("serializeBackup", () => {
  it("writes the envelope as JSON with a two-space indent, as the export always has", () => {
    const payload = { app: APP_ID, version: 1, exportedAt: NOW.toISOString(), data: { a: 1 } };

    expect(serializeBackup(payload)).toBe(JSON.stringify(payload, null, 2));
    expect(serializeBackup(payload)).toContain('\n  "app": "debtoralive"');
  });
});

describe("backupFileName", () => {
  it("uses the UTC date", () => {
    expect(backupFileName(NOW)).toBe("debtoralive-backup-2026-11-08.json");
    // Already 9 November in Singapore, but the name keeps the UTC date.
    expect(backupFileName(new Date("2026-11-08T20:00:00Z"))).toBe("debtoralive-backup-2026-11-08.json");
  });
});

describe("parseBackup", () => {
  it("accepts a valid file", () => {
    const result = parseBackup(file({ data: { "tool:mortgage-calculator": { a: 1 } } }));

    expect(result).toEqual({
      ok: true,
      payload: {
        app: "debtoralive",
        version: 1,
        exportedAt: "2026-11-08T04:00:00.000Z",
        data: { "tool:mortgage-calculator": { a: 1 } },
      },
    });
  });

  it("returns not-json for text that is not JSON", () => {
    expect(errorKind("")).toBe("not-json");
    expect(errorKind("{")).toBe("not-json");
  });

  it("returns wrong-app when the app id is missing, different, or the JSON is not an object", () => {
    expect(errorKind(JSON.stringify({ version: 1, data: {} }))).toBe("wrong-app");
    expect(errorKind(file({ app: "other" }))).toBe("wrong-app");
    expect(errorKind("null")).toBe("wrong-app");
    expect(errorKind("[1]")).toBe("wrong-app");
    expect(errorKind("1")).toBe("wrong-app");
  });

  it("returns bad-shape when the version is missing or not a positive integer", () => {
    expect(errorKind(JSON.stringify({ app: APP_ID, data: {} }))).toBe("bad-shape");
    for (const version of [0, -1, 1.5, "1", null]) {
      expect(errorKind(file({ version }))).toBe("bad-shape");
    }
  });

  it("returns bad-shape when data is missing, null, an array or a string", () => {
    expect(errorKind(JSON.stringify({ app: APP_ID, version: 1 }))).toBe("bad-shape");
    for (const data of [null, [], "x"]) {
      expect(errorKind(file({ data }))).toBe("bad-shape");
    }
  });

  it("returns too-new for a newer version, even when data is missing (the check order)", () => {
    expect(errorKind(file({ version: FORMAT_VERSION + 1 }))).toBe("too-new");
    expect(errorKind(JSON.stringify({ app: APP_ID, version: FORMAT_VERSION + 1 }))).toBe("too-new");
  });

  it("gives a plain-language message for each error kind", () => {
    const newer = parseBackup(file({ version: 2 }));
    expect(newer.ok === false && newer.error.message).toBe(
      "This file was made by a newer version of Debt or Alive. Update the app and try again.",
    );
    const notJson = parseBackup("{");
    expect(notJson.ok === false && notJson.error.message).toBe("This file isn't a valid backup. It couldn't be read as JSON.");
    const wrongApp = parseBackup(file({ app: "x" }));
    expect(wrongApp.ok === false && wrongApp.error.message).toBe("This file isn't a Debt or Alive backup.");
    const badShape = parseBackup(file({ data: null }));
    expect(badShape.ok === false && badShape.error.message).toBe("This backup file is damaged or in an unknown format.");
  });

  it("accepts a file with no exportedAt, or an unusable one, and reports it as null", () => {
    const missing = parseBackup(JSON.stringify({ app: APP_ID, version: 1, data: {} }));
    const invalid = parseBackup(file({ exportedAt: "yesterday" }));
    const notAString = parseBackup(file({ exportedAt: 5 }));

    for (const result of [missing, invalid, notAString]) {
      expect(result.ok && result.payload.exportedAt).toBeNull();
    }
  });
});

describe("a backup passed from one storage to another", () => {
  it("restores every registered key with the same value", () => {
    const parsed = parseBackup(BACKUP_V1_TEXT);
    if (!parsed.ok) throw new Error("fixture should parse");
    const first = createMemoryStorage();
    importBackup(first, parsed.payload.data);

    const payload = buildBackup(first, NOW);
    expect(payload).not.toBeNull();
    const reparsed = parseBackup(serializeBackup(payload!));
    if (!reparsed.ok) throw new Error("built backup should parse");
    const second = createMemoryStorage();
    expect(importBackup(second, reparsed.payload.data)).toMatchObject({ ok: true });

    for (const key of REGISTERED_KEYS) {
      const a = first.getItem(key);
      const b = second.getItem(key);
      expect(b === null ? null : JSON.parse(b)).toEqual(a === null ? null : JSON.parse(a));
    }
  });
});

describe("the version 1 fixture", () => {
  it("parses and imports as 4 tools, reporting the unknown key as skipped", () => {
    const parsed = parseBackup(BACKUP_V1_TEXT);
    if (!parsed.ok) throw new Error("fixture should parse");

    const result = importBackup(createMemoryStorage(), parsed.payload.data);

    expect(parsed.payload.exportedAt).toBe("2026-11-08T04:00:00.000Z");
    expect(result).toEqual({ ok: true, toolsImported: 4, keysSkipped: ["unknown:example"] });
  });
});
