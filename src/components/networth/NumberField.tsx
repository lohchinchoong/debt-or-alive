"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export const fieldClass =
  "w-full min-w-0 rounded-t border-0 border-b-2 border-[var(--outline-variant)] bg-[var(--surface-container-highest)] px-1.5 py-2 text-sm font-medium text-[var(--on-surface)] outline-none transition-colors focus:border-[var(--primary)]";

type NumberFieldProps = {
  value: number | null;
  onCommit: (value: number | null) => void;
  /** Smallest and largest valid value. */
  min: number;
  max: number;
  /** When true, `min` itself is not valid (a rate must be above 0). */
  minExclusive?: boolean;
  /** What blank text commits: null for a rate, 0 for an amount or target. */
  blank: null | 0;
  /** Shown under the field while the text is invalid. */
  error: string;
  label: string;
  placeholder?: string;
  className?: string;
};

type Parsed = { ok: true; value: number | null } | { ok: false };

function parseText(text: string, props: Pick<NumberFieldProps, "min" | "max" | "minExclusive" | "blank">): Parsed {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true, value: props.blank };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value > props.max) return { ok: false };
  if (props.minExclusive ? value <= props.min : value < props.min) return { ok: false };
  return { ok: true, value };
}

const format = (value: number | null) => (value === null ? "" : String(value));

/**
 * A numeric text field that keeps its own text, so "0.", "0.0" and a cleared
 * field can all be typed. It commits to the draft only when the text is valid.
 * When the draft value changes from outside (for example Discard), the text is
 * replaced by the draft value and the error is cleared.
 */
export function NumberField(props: NumberFieldProps) {
  const { value, onCommit, error, label, placeholder, className } = props;
  const [text, setText] = useState(format(value));
  const [seen, setSeen] = useState(value);
  const [invalid, setInvalid] = useState(false);

  if (value !== seen) {
    setSeen(value);
    setText(format(value));
    setInvalid(false);
  }

  function handleChange(next: string) {
    setText(next);
    const parsed = parseText(next, props);
    if (!parsed.ok) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setSeen(parsed.value);
    if (parsed.value !== value) onCommit(parsed.value);
  }

  return (
    <div className={cn("min-w-0", className)}>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={invalid}
        onChange={(e) => handleChange(e.target.value)}
        className={fieldClass}
      />
      {invalid && (
        <p role="alert" className="mt-1 text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
