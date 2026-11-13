import { describe, expect, it } from "vitest";
import type { ParsedBackup } from "@/lib/persistence/backup";
import { IDLE, importReducer, type ImportState } from "@/lib/persistence/importState";
import type { ImportPreview } from "@/lib/persistence/preview";

const payload: ParsedBackup = { app: "debtoralive", version: 1, exportedAt: null, data: {} };
const preview: ImportPreview = { fileTools: ["Mortgage"], fileLatestSavedAt: null, local: { toolCount: 0, latestSavedAt: null } };

const awaiting: ImportState = { status: "awaiting-confirmation", payload, preview };
const done: ImportState = { status: "done", message: "Imported 1 tool successfully." };
const error: ImportState = { status: "error", message: "No." };

describe("importReducer", () => {
  it("moves to awaiting-confirmation when a file is prepared, from idle, error or a file already waiting", () => {
    for (const from of [IDLE, error, awaiting]) {
      expect(importReducer(from, { type: "prepared", payload, preview })).toEqual(awaiting);
    }
  });

  it("moves to error when preparing or importing fails", () => {
    for (const from of [IDLE, error, awaiting]) {
      expect(importReducer(from, { type: "failed", message: "Bad file." })).toEqual({ status: "error", message: "Bad file." });
    }
  });

  it("moves to done when the import is confirmed", () => {
    expect(importReducer(awaiting, { type: "confirmed", message: "Imported 1 tool successfully." })).toEqual(done);
  });

  it("goes back to idle when the dialog is cancelled", () => {
    expect(importReducer(awaiting, { type: "cancelled" })).toEqual(IDLE);
  });

  it("goes back to idle from done and from error when dismissed", () => {
    expect(importReducer(done, { type: "dismissed" })).toEqual(IDLE);
    expect(importReducer(error, { type: "dismissed" })).toEqual(IDLE);
  });

  it("ignores a new file or a failure while done, because the page is about to reload", () => {
    expect(importReducer(done, { type: "prepared", payload, preview })).toBe(done);
    expect(importReducer(done, { type: "failed", message: "Bad file." })).toBe(done);
  });

  it("ignores confirm and cancel unless a file is awaiting confirmation", () => {
    for (const from of [IDLE, done, error]) {
      expect(importReducer(from, { type: "confirmed", message: "x" })).toBe(from);
      expect(importReducer(from, { type: "cancelled" })).toBe(from);
    }
  });

  it("keeps a file that awaits confirmation when dismissed", () => {
    expect(importReducer(awaiting, { type: "dismissed" })).toBe(awaiting);
  });
});
