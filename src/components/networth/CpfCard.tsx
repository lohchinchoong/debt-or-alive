"use client";

import { MAX_AMOUNT, MAX_TARGET, SECTIONS, formatSgd, type Section } from "@/lib/networth";
import { NumberField } from "./NumberField";

type CpfCardProps = {
  section: Section;
  subtotalCents: number;
  target: number;
  onAmount: (value: number) => void;
  onTarget: (value: number) => void;
};

const labelClass = "block text-[0.7rem] font-semibold uppercase tracking-wide mb-1";

/** One CPF account (OA, SA, MA or RA): a single SGD amount and a target. */
export function CpfCard({ section, subtotalCents, target, onAmount, onTarget }: CpfCardProps) {
  const def = SECTIONS.find((s) => s.key === section);
  if (!def) return null;

  return (
    <section
      aria-label={def.label}
      className="min-w-0 rounded-2xl p-4"
      style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}
    >
      <h2 className="text-base font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
        {def.label}
      </h2>
      <p className="mt-0.5 text-xl font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
        {formatSgd(subtotalCents)}
      </p>

      <div className="mt-3 min-w-0">
        <span className={labelClass} style={{ color: "var(--on-surface-sub)" }}>Target (SGD)</span>
        <NumberField
          value={target}
          min={0}
          max={MAX_TARGET}
          blank={0}
          error="Enter an amount from 0 to 10,000,000,000."
          label={`${def.label} target in SGD`}
          onCommit={(v) => onTarget(v ?? 0)}
        />
      </div>

      <div className="mt-3 min-w-0">
        <span className={labelClass} style={{ color: "var(--on-surface-sub)" }}>Est. Amount (SGD)</span>
        <NumberField
          value={subtotalCents / 100}
          min={0}
          max={MAX_AMOUNT}
          blank={0}
          error="Enter an amount from 0 to 10,000,000,000."
          label={`${def.label} estimated amount in SGD`}
          onCommit={(v) => onAmount(v ?? 0)}
        />
      </div>
    </section>
  );
}
