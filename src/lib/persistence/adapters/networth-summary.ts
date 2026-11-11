import { genId } from "@/lib/utils";
import {
  ASSET_SECTIONS,
  CURRENCIES,
  MAX_AMOUNT,
  MAX_RATE,
  MAX_TARGET,
  SECTIONS,
  defaultNetworth,
  type Currency,
  type NetworthData,
  type NetworthRecord,
  type Section,
} from "@/lib/networth";
import { toolMeta } from "../toolMeta";
import type { StorageLike, ToolAdapter, ToolRead } from "../types";

const KEY = "tool:networth-summary";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parse(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function inRange(value: unknown, min: number, max: number, minExclusive = false): value is number {
  return typeof value === "number" && Number.isFinite(value) && (minExclusive ? value > min : value >= min) && value <= max;
}

function readRate(value: unknown): number | null {
  return inRange(value, 0, MAX_RATE, true) ? value : null;
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

const SECTION_KEYS = new Set<string>(SECTIONS.map((s) => s.key));

// Before CPF was split into four accounts, everything lived under one "cpf"
// section. Keep that data by moving it to OA rather than dropping it.
function readSection(value: unknown): Section | null {
  if (value === "cpf") return "cpfOa";
  return typeof value === "string" && SECTION_KEYS.has(value) ? (value as Section) : null;
}

function readRecords(value: unknown): NetworthRecord[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const records: NetworthRecord[] = [];
  for (const item of value) {
    if (!isObject(item)) continue;
    const section = readSection(item.section);
    if (section === null) continue;

    let id = typeof item.id === "string" && item.id !== "" ? item.id : genId("nw");
    while (seen.has(id)) id = genId("nw");
    seen.add(id);

    records.push({
      id,
      section,
      name: typeof item.name === "string" ? item.name : "",
      platform: typeof item.platform === "string" ? item.platform : "",
      amount: inRange(item.amount, 0, MAX_AMOUNT) ? item.amount : 0,
      currency: CURRENCIES.includes(item.currency as Currency) ? (item.currency as Currency) : "SGD",
      lastUpdated: typeof item.lastUpdated === "string" && isRealDate(item.lastUpdated) ? item.lastUpdated : "",
    });
  }
  return records;
}

/**
 * The whole tool is one nested object under `tool:networth-summary`, which also
 * carries `savedAt`. Every field is checked on read and repaired without a
 * notice, so a hand-edited or imported backup can never break the totals.
 */
export const networthAdapter: ToolAdapter<NetworthData> = {
  ...toolMeta("networth-summary"),
  keys: [KEY],
  dateKey: KEY,
  defaults: defaultNetworth,
  read(storage: StorageLike): ToolRead<NetworthData> {
    const raw = storage.getItem(KEY);
    const stored = parse(raw);
    const record = defaultNetworth();
    let savedAt: string | null = null;

    if (isObject(stored)) {
      record.usdSgd = readRate(stored.usdSgd);
      record.audSgd = readRate(stored.audSgd);
      if (isObject(stored.targets)) {
        for (const section of ASSET_SECTIONS) {
          const target = stored.targets[section] ?? (section === "cpfOa" ? stored.targets.cpf : undefined);
          record.targets[section] = inRange(target, 0, MAX_TARGET) ? target : 0;
        }
      }
      record.records = readRecords(stored.records);
      savedAt = typeof stored.savedAt === "string" ? stored.savedAt : null;
    }

    return { record, savedAt, exists: raw !== null };
  },
  toEntries(record, savedAt) {
    return [{ key: KEY, value: JSON.stringify(savedAt ? { ...record, savedAt } : record) }];
  },
};
