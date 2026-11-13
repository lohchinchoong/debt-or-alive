import { BACKUP_ERROR_MESSAGES, parseBackup, type ParsedBackup } from "./backup";
import { overlay } from "./import";
import { PROFILE_ADAPTERS, TOOL_ADAPTERS } from "./registry";
import type { StorageLike } from "./types";

export type LocalSummary = { toolCount: number; latestSavedAt: string | null };

export type ImportPreview = {
  /** Names of the tools the file would replace, in registry order. */
  fileTools: string[];
  /** The newest `savedAt` inside the file, or null when it has none. */
  fileLatestSavedAt: string | null;
  /** What this browser holds now. */
  local: LocalSummary;
};

export type PrepareImportResult =
  | { ok: true; payload: ParsedBackup; preview: ImportPreview }
  | { ok: false; message: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** The latest valid date, compared by `Date.parse` and not by string order. */
function latest(dates: readonly (string | null | undefined)[]): string | null {
  let best: string | null = null;
  let bestTime = Number.NEGATIVE_INFINITY;
  for (const date of dates) {
    if (typeof date !== "string") continue;
    const time = Date.parse(date);
    if (Number.isNaN(time)) continue;
    if (time > bestTime) {
      best = date;
      bestTime = time;
    }
  }
  return best;
}

/**
 * Profile adapters may return the stored value as is (HYSA returns a non-array
 * unchanged and passes null entries through), and importBackup imports such a
 * file without checking. So read defensively: a non-array holds no profiles,
 * entries that are not objects are skipped, and only a string savedAt counts.
 */
function readProfiles(result: unknown): { count: number; dates: string[] } {
  const entries = Array.isArray(result) ? result.filter(isObject) : [];
  const dates = entries.map((entry) => entry.savedAt).filter((d): d is string => typeof d === "string");
  return { count: entries.length, dates };
}

/**
 * Summarises this browser's data through a read-only view, so it never writes.
 * (The CPF SA adapter migrates a legacy key with a write when given real
 * storage; on the view that write fails inside saveEntries and is ignored.)
 * An adapter that throws is skipped, as if it held no data.
 */
export function summarizeLocal(storage: StorageLike): LocalSummary {
  const view = overlay(storage, {});
  let toolCount = 0;
  const dates: (string | null)[] = [];

  for (const adapter of TOOL_ADAPTERS) {
    try {
      const read = adapter.read(view);
      if (!read.exists) continue;
      toolCount += 1;
      dates.push(read.savedAt);
    } catch {
      // Unreadable local data counts as no data.
    }
  }

  for (const adapter of PROFILE_ADAPTERS) {
    try {
      const { count, dates: profileDates } = readProfiles(adapter.readAll(view));
      if (count === 0) continue;
      toolCount += 1;
      dates.push(...profileDates);
    } catch {
      // Unreadable local data counts as no data.
    }
  }

  return { toolCount, latestSavedAt: latest(dates) };
}

/**
 * Lists the tools a backup would replace, using the same rule importBackup
 * uses (import.ts), plus the newest save date in the file and a summary of this
 * browser. It never writes. An adapter that throws while reading the file makes
 * this throw, as importBackup would fail on it.
 */
export function previewBackup(storage: StorageLike, data: Record<string, unknown>): ImportPreview {
  const view = overlay(storage, data);
  const fileTools: string[] = [];
  const dates: (string | null)[] = [];

  for (const adapter of TOOL_ADAPTERS) {
    if (adapter.keys.some((key) => key in data)) {
      const read = adapter.read(view);
      fileTools.push(adapter.name);
      // A date counts only when the file carries the date-bearing key.
      if (adapter.dateKey in data) dates.push(read.savedAt);
      continue;
    }
    if (!(adapter.legacyKeys ?? []).some((key) => key in data)) continue;
    const legacy = adapter.readLegacy?.(view);
    if (!legacy) continue;
    fileTools.push(adapter.name);
    dates.push(legacy.savedAt);
  }

  for (const adapter of PROFILE_ADAPTERS) {
    if (!(adapter.key in data)) continue;
    fileTools.push(adapter.name);
    dates.push(...readProfiles(adapter.readAll(view)).dates);
  }

  return { fileTools, fileLatestSavedAt: latest(dates), local: summarizeLocal(storage) };
}

/**
 * Reads a backup file's text and previews it. Returns a message instead of a
 * preview for a file that fails the checks, holds no recognised tool, or makes
 * an adapter throw. Pure, so it needs no browser.
 */
export function prepareImport(storage: StorageLike, text: string): PrepareImportResult {
  const parsed = parseBackup(text);
  if (!parsed.ok) return { ok: false, message: parsed.error.message };

  let preview: ImportPreview;
  try {
    preview = previewBackup(storage, parsed.payload.data);
  } catch {
    return { ok: false, message: BACKUP_ERROR_MESSAGES["bad-shape"] };
  }

  if (preview.fileTools.length === 0) return { ok: false, message: "No recognised data found in this file." };
  return { ok: true, payload: parsed.payload, preview };
}
