import { REGISTERED_KEYS } from "./registry";
import type { StorageLike } from "./types";

/**
 * The backup file: one versioned JSON envelope that holds every registered key.
 * Download, share and import all build and read it through this module.
 *
 * Compatibility policy:
 * - Bump FORMAT_VERSION only when the envelope's shape changes in a way an older
 *   build would misread. Adding a tool, or a key inside a tool's record, is not a bump.
 * - A build refuses any file whose version is higher than its own FORMAT_VERSION.
 * - Files from older builds are read through the adapters, including their legacy
 *   keys, by importBackup.
 * - Each released format version keeps one test fixture (see testing/backupV1.ts).
 */

export const APP_ID = "debtoralive";
export const FORMAT_VERSION = 1;

export type BackupPayload = {
  app: string;
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
};

/** A backup read from a file. `exportedAt` is null when the file has no usable date. */
export type ParsedBackup = {
  app: string;
  version: number;
  exportedAt: string | null;
  data: Record<string, unknown>;
};

export type ParseBackupError = {
  kind: "not-json" | "wrong-app" | "bad-shape" | "too-new";
  message: string;
};

export type ParseBackupResult =
  | { ok: true; payload: ParsedBackup }
  | { ok: false; error: ParseBackupError };

export const BACKUP_ERROR_MESSAGES: Record<ParseBackupError["kind"], string> = {
  "not-json": "This file isn't a valid backup. It couldn't be read as JSON.",
  "wrong-app": "This file isn't a Debt or Alive backup.",
  "bad-shape": "This backup file is damaged or in an unknown format.",
  "too-new": "This file was made by a newer version of Debt or Alive. Update the app and try again.",
};

function fail(kind: ParseBackupError["kind"]): ParseBackupResult {
  return { ok: false, error: { kind, message: BACKUP_ERROR_MESSAGES[kind] } };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads every registered key from `storage`. Values are parsed JSON, or the raw
 * string when they are not valid JSON. Returns null when no key holds data.
 */
export function buildBackup(storage: StorageLike, now: Date): BackupPayload | null {
  const data: Record<string, unknown> = {};

  for (const key of REGISTERED_KEYS) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw;
    }
  }

  if (Object.keys(data).length === 0) return null;
  return { app: APP_ID, version: FORMAT_VERSION, exportedAt: now.toISOString(), data };
}

export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

/** The file name uses the UTC date, as the export always has. */
export function backupFileName(now: Date): string {
  return `debtoralive-backup-${now.toISOString().slice(0, 10)}.json`;
}

/**
 * Checks a backup file's text. Never throws. Checks run in this order: valid
 * JSON, app id, version is a positive integer, version is not newer than this
 * build, data is a plain object.
 */
export function parseBackup(text: string): ParseBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail("not-json");
  }

  const file = isPlainObject(parsed) ? parsed : {};
  if (file.app !== APP_ID) return fail("wrong-app");

  const { version } = file;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) return fail("bad-shape");
  if (version > FORMAT_VERSION) return fail("too-new");

  if (!isPlainObject(file.data)) return fail("bad-shape");

  const exportedAt =
    typeof file.exportedAt === "string" && !Number.isNaN(Date.parse(file.exportedAt)) ? file.exportedAt : null;

  return { ok: true, payload: { app: APP_ID, version, exportedAt, data: file.data } };
}
