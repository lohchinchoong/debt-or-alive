"use client";

import { MAX_TARGET, SECTIONS, formatSgd, type NetworthRecord, type Section } from "@/lib/networth";
import { NumberField } from "./NumberField";
import { RecordHeader, RecordRow } from "./RecordRow";

type SectionCardProps = {
  section: Section;
  records: NetworthRecord[];
  subtotalCents: number;
  /** Given only for the four asset sections. Debt has no target. */
  target?: number;
  onAdd: () => void;
  onUpdate: (id: string, changes: Partial<Omit<NetworthRecord, "id" | "section">>) => void;
  onRemove: (id: string) => void;
  onTarget?: (value: number) => void;
};

export function SectionCard({ section, records, subtotalCents, target, onAdd, onUpdate, onRemove, onTarget }: SectionCardProps) {
  const def = SECTIONS.find((s) => s.key === section);
  if (!def) return null;

  return (
    <section
      aria-label={def.label}
      className="rounded-2xl p-5"
      style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
            {def.label}
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: "var(--on-surface-sub)" }}>{def.helper}</p>
        </div>
        <p className="shrink-0 text-base font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
          {formatSgd(subtotalCents)}
        </p>
      </div>

      {target !== undefined && onTarget && (
        <div className="mt-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
          <span className="shrink-0">Target (SGD)</span>
          <NumberField
            className="w-40"
            value={target}
            min={0}
            max={MAX_TARGET}
            blank={0}
            error="Enter an amount from 0 to 10,000,000,000."
            label={`${def.label} target in SGD`}
            onCommit={(v) => onTarget(v ?? 0)}
          />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 lg:gap-1">
        {records.length > 0 && <RecordHeader />}
        {records.length === 0 ? (
          <p className="text-sm py-2" style={{ color: "var(--on-surface-sub)" }}>No records yet. Add one.</p>
        ) : (
          records.map((record) => (
            <RecordRow
              key={record.id}
              record={record}
              onUpdate={(changes) => onUpdate(record.id, changes)}
              onRemove={() => onRemove(record.id)}
            />
          ))
        )}
      </div>

      {records.length > 0 && (
        <p className="mt-3 text-xs" style={{ color: "var(--on-surface-sub)" }}>
          Est. Amount is the approximate current value in each record&rsquo;s own currency.
        </p>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontFamily: "Manrope, sans-serif", padding: 0 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add record
      </button>
    </section>
  );
}
