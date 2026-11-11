import { genId, niceMax } from "@/lib/utils";

// ─── Sections and currencies ──────────────────────────────────────────────────

export type SectionKind = "asset" | "debt";

export const SECTIONS = [
  { key: "cpfOa", label: "CPF OA", kind: "asset", helper: "CPF Ordinary Account balance." },
  { key: "cpfSa", label: "CPF SA", kind: "asset", helper: "CPF Special Account balance." },
  { key: "cpfMa", label: "CPF MA", kind: "asset", helper: "CPF MediSave Account balance." },
  { key: "cpfRa", label: "CPF RA", kind: "asset", helper: "CPF Retirement Account balance." },
  { key: "srs", label: "SRS", kind: "asset", helper: "Supplementary Retirement Scheme account, cash and investments." },
  { key: "cashSavings", label: "Cash Savings", kind: "asset", helper: "Bank and savings accounts you can withdraw from." },
  { key: "cashInvestments", label: "Cash Investments", kind: "asset", helper: "Money held with a broker or in funds, at current estimated value." },
  { key: "debt", label: "Debt", kind: "debt", helper: "Loans and balances you owe. Enter amounts as positive numbers." },
] as const;

export type Section = (typeof SECTIONS)[number]["key"];
export type AssetSection = Exclude<Section, "debt">;

export const CPF_SECTIONS = ["cpfOa", "cpfSa", "cpfMa", "cpfRa"] as const satisfies readonly AssetSection[];

export function isCpfSection(section: Section): section is (typeof CPF_SECTIONS)[number] {
  return (CPF_SECTIONS as readonly string[]).includes(section);
}

export const ASSET_SECTIONS: readonly AssetSection[] = ["cpfOa", "cpfSa", "cpfMa", "cpfRa", "srs", "cashSavings", "cashInvestments"];

export const CURRENCIES = ["SGD", "USD", "AUD"] as const;
export type Currency = (typeof CURRENCIES)[number];

// Limits keep every integer-cent sum below 2^53 for up to about 900 records.
export const MAX_AMOUNT = 10_000_000_000;
export const MAX_TARGET = 10_000_000_000;
export const MAX_RATE = 1_000;
const MAX_CENTS = 10_000_000_000_000;

// ─── Data ─────────────────────────────────────────────────────────────────────

export type NetworthRecord = {
  id: string;
  section: Section;
  name: string;
  platform: string;
  amount: number;      // in the record's own currency
  currency: Currency;
  lastUpdated: string; // YYYY-MM-DD, typed by the user, may be empty
};

export type NetworthData = {
  usdSgd: number | null; // 1 USD = x SGD, null when blank
  audSgd: number | null;
  targets: Record<AssetSection, number>; // SGD, 0 means no target
  records: NetworthRecord[];
};

export function defaultNetworth(): NetworthData {
  return {
    usdSgd: null,
    audSgd: null,
    targets: { cpfOa: 0, cpfSa: 0, cpfMa: 0, cpfRa: 0, srs: 0, cashSavings: 0, cashInvestments: 0 },
    records: [],
  };
}

// ─── Dates ────────────────────────────────────────────────────────────────────

/** Today's date in the user's time zone. `todayISO()` in utils is UTC. */
export function localDateISO(d: Date = new Date()): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

// ─── Draft helpers (each returns new data) ────────────────────────────────────

export function addRecord(data: NetworthData, section: Section, today: string): NetworthData {
  const record: NetworthRecord = {
    id: genId("nw"),
    section,
    name: "",
    platform: "",
    amount: 0,
    currency: "SGD",
    lastUpdated: today,
  };
  return { ...data, records: [...data.records, record] };
}

export function updateRecord(
  data: NetworthData,
  id: string,
  changes: Partial<Omit<NetworthRecord, "id" | "section">>,
): NetworthData {
  if (!data.records.some((r) => r.id === id)) return data;
  return { ...data, records: data.records.map((r) => (r.id === id ? { ...r, ...changes } : r)) };
}

/**
 * A CPF account holds one SGD amount. Replaces every record in the section with
 * a single record (or none when the amount is 0), so older multi-record data
 * collapses to its total the first time the amount is edited.
 */
export function setCpfAmount(data: NetworthData, section: Section, amount: number): NetworthData {
  const others = data.records.filter((r) => r.section !== section);
  if (amount === 0) return { ...data, records: others };
  const existing = data.records.find((r) => r.section === section);
  const record: NetworthRecord = {
    id: existing?.id ?? genId("nw"),
    section,
    name: "",
    platform: "",
    amount,
    currency: "SGD",
    lastUpdated: "",
  };
  return { ...data, records: [...others, record] };
}

export function removeRecord(data: NetworthData, id: string): NetworthData {
  return { ...data, records: data.records.filter((r) => r.id !== id) };
}

export function setRate(data: NetworthData, currency: "USD" | "AUD", value: number | null): NetworthData {
  return currency === "USD" ? { ...data, usdSgd: value } : { ...data, audSgd: value };
}

export function setTarget(data: NetworthData, section: AssetSection, value: number): NetworthData {
  return { ...data, targets: { ...data.targets, [section]: value } };
}

/** Platform names entered so far: trimmed, de-duplicated without regard to case (first spelling kept), sorted. */
export function platformSuggestions(data: NetworthData): string[] {
  const seen = new Map<string, string>();
  for (const record of data.records) {
    const name = record.platform.trim();
    if (name === "") continue;
    const key = name.toLowerCase();
    if (!seen.has(key)) seen.set(key, name);
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
}

// ─── Conversion and totals ────────────────────────────────────────────────────

/**
 * One record in whole SGD cents, rounded once. Returns null when the currency
 * has no rate, or when the result is not finite or above SGD 100 billion.
 */
export function toSgdCents(amount: number, currency: Currency, data: NetworthData): number | null {
  const rate = currency === "SGD" ? 1 : currency === "USD" ? data.usdSgd : data.audSgd;
  if (rate === null) return null;
  const cents = Math.round(amount * rate * 100);
  if (!Number.isFinite(cents) || cents > MAX_CENTS) return null;
  return cents;
}

export type SectionSummary = { cents: number; excluded: NetworthRecord[] };

export type Summary = {
  sections: Record<Section, SectionSummary>;
  assetsCents: number;
  debtCents: number;
  netCents: number;
  incomplete: boolean;
};

export function summarise(data: NetworthData): Summary {
  const sections = {} as Record<Section, SectionSummary>;
  for (const { key } of SECTIONS) sections[key] = { cents: 0, excluded: [] };

  for (const record of data.records) {
    const cents = toSgdCents(record.amount, record.currency, data);
    if (cents === null) sections[record.section].excluded.push(record);
    else sections[record.section].cents += cents;
  }

  const assetsCents = ASSET_SECTIONS.reduce((sum, key) => sum + sections[key].cents, 0);
  const debtCents = sections.debt.cents;
  const incomplete = SECTIONS.some(({ key }) => sections[key].excluded.length > 0);
  return { sections, assetsCents, debtCents, netCents: assetsCents - debtCents, incomplete };
}

// ─── Chart ────────────────────────────────────────────────────────────────────

export type ChartRow = {
  section: AssetSection;
  label: string;
  cents: number;
  targetCents: number;
  percent: number | null; // null when the target rounds to 0 cents
  incomplete: boolean;
};

export function chartRows(summary: Summary, data: NetworthData): { rows: ChartRow[]; axisMaxDollars: number } {
  const rows: ChartRow[] = ASSET_SECTIONS.map((section) => {
    const cents = summary.sections[section].cents;
    const targetCents = Math.round(data.targets[section] * 100);
    return {
      section,
      label: SECTIONS.find((s) => s.key === section)?.label ?? section,
      cents,
      targetCents,
      percent: targetCents === 0 ? null : Math.round((cents / targetCents) * 100),
      incomplete: summary.sections[section].excluded.length > 0,
    };
  });
  const largest = Math.max(0, ...rows.map((r) => Math.max(r.cents, r.targetCents) / 100));
  return { rows, axisMaxDollars: niceMax(1.15 * largest) };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function currencyFormatter(currency: string): Intl.NumberFormat {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatSgd(cents: number): string {
  return currencyFormatter("SGD").format(cents / 100);
}

export function formatAmount(amount: number, currency: Currency): string {
  return currencyFormatter(currency).format(amount);
}
