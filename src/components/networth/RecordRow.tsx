"use client";

import { CURRENCIES, MAX_AMOUNT, type Currency, type NetworthRecord } from "@/lib/networth";
import { NumberField, fieldClass } from "./NumberField";

type RecordRowProps = {
  record: NetworthRecord;
  onUpdate: (changes: Partial<Omit<NetworthRecord, "id" | "section">>) => void;
  onRemove: () => void;
};

const labelClass = "block text-[0.7rem] font-semibold uppercase tracking-wide mb-1";

export function RecordRow({ record, onUpdate, onRemove }: RecordRowProps) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 items-end rounded-xl p-3"
      style={{ background: "var(--surface-container-lowest)" }}>
      <label className="col-span-2 sm:col-span-1 min-w-0">
        <span className={labelClass} style={{ color: "var(--on-surface-sub)" }}>Name</span>
        <input
          type="text"
          value={record.name}
          placeholder="e.g. Ordinary Account"
          onChange={(e) => onUpdate({ name: e.target.value })}
          className={fieldClass}
        />
      </label>

      <label className="col-span-2 sm:col-span-1 min-w-0">
        <span className={labelClass} style={{ color: "var(--on-surface-sub)" }}>Platform</span>
        <input
          type="text"
          value={record.platform}
          list="networth-platforms"
          placeholder="e.g. DBS"
          onChange={(e) => onUpdate({ platform: e.target.value })}
          className={fieldClass}
        />
      </label>

      <div className="min-w-0">
        <span className={labelClass} style={{ color: "var(--on-surface-sub)" }}>Est. Amount</span>
        <NumberField
          value={record.amount}
          min={0}
          max={MAX_AMOUNT}
          blank={0}
          error="Enter an amount from 0 to 10,000,000,000."
          label="Estimated amount"
          onCommit={(v) => onUpdate({ amount: v ?? 0 })}
        />
      </div>

      <label className="min-w-0">
        <span className={labelClass} style={{ color: "var(--on-surface-sub)" }}>Currency</span>
        <select
          value={record.currency}
          onChange={(e) => onUpdate({ currency: e.target.value as Currency })}
          className={fieldClass}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <label className="col-span-2 sm:col-span-1 min-w-0">
        <span className={labelClass} style={{ color: "var(--on-surface-sub)" }}>Last Updated</span>
        <input
          type="date"
          value={record.lastUpdated}
          onChange={(e) => onUpdate({ lastUpdated: e.target.value })}
          className={fieldClass}
        />
      </label>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${record.name.trim() === "" ? "record" : record.name.trim()}`}
        className="col-span-2 sm:col-span-1 justify-self-end rounded-md px-2 py-2 text-xs font-semibold transition-opacity hover:opacity-70"
        style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
      >
        Remove
      </button>
    </div>
  );
}
