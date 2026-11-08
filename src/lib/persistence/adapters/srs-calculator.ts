import { todayISO } from "@/lib/utils";
import { toolMeta } from "../toolMeta";
import type { ToolAdapter } from "../types";

export type Deposit = {
  id: string;
  name: string;       // e.g. "T-Bills", "OCBC FD"
  amount: number;     // SGD
  startDate: string;  // YYYY-MM-DD
  interestRate: number; // % p.a.
};

export type WithdrawalSettings = {
  startDate: string;   // YYYY-MM-DD — first withdrawal year
  years: number;       // 1–10 consecutive years
};

export type SrsRecord = { deposits: Deposit[]; withdrawal: WithdrawalSettings };

const DEPOSITS_KEY = "srs:deposits";
const WITHDRAWAL_KEY = "srs:withdrawal";

function defaultWithdrawal(): WithdrawalSettings {
  return { startDate: `${new Date().getFullYear() + 20}-01-01`, years: 10 };
}

function defaultDeposits(): Deposit[] {
  return [{ id: "srs_default_1", name: "T-Bills", amount: 15400, startDate: todayISO(), interestRate: 3.5 }];
}

function parse(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** SRS stores its date inside the withdrawal object: `{ ...withdrawal, savedAt }`. */
export const srsAdapter: ToolAdapter<SrsRecord> = {
  ...toolMeta("srs-calculator"),
  keys: [DEPOSITS_KEY, WITHDRAWAL_KEY],
  dateKey: WITHDRAWAL_KEY,
  defaults: () => ({ deposits: defaultDeposits(), withdrawal: defaultWithdrawal() }),
  read(storage) {
    const rawDeposits = storage.getItem(DEPOSITS_KEY);
    const rawWithdrawal = storage.getItem(WITHDRAWAL_KEY);
    const deposits = parse(rawDeposits);
    const stored = parse(rawWithdrawal);

    let withdrawal = defaultWithdrawal();
    let savedAt: string | null = null;
    if (stored !== null && typeof stored === "object" && !Array.isArray(stored)) {
      const { savedAt: date, ...rest } = stored as WithdrawalSettings & { savedAt?: unknown };
      withdrawal = rest;
      savedAt = typeof date === "string" ? date : null;
    }

    return {
      record: { deposits: Array.isArray(deposits) ? (deposits as Deposit[]) : defaultDeposits(), withdrawal },
      savedAt,
      exists: rawDeposits !== null || rawWithdrawal !== null,
    };
  },
  toEntries(record, savedAt) {
    return [
      { key: DEPOSITS_KEY, value: JSON.stringify(record.deposits) },
      { key: WITHDRAWAL_KEY, value: JSON.stringify(savedAt ? { ...record.withdrawal, savedAt } : record.withdrawal) },
    ];
  },
};
