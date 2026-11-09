"use client";

import { MAX_RATE } from "@/lib/networth";
import { NumberField } from "./NumberField";

type RatesPanelProps = {
  usdSgd: number | null;
  audSgd: number | null;
  onRate: (currency: "USD" | "AUD", value: number | null) => void;
};

export function RatesPanel({ usdSgd, audSgd, onRate }: RatesPanelProps) {
  return (
    <section
      aria-label="Exchange rates"
      className="rounded-2xl p-5"
      style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}
    >
      <h2 className="text-base font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
        Exchange rates
      </h2>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(
          [
            { currency: "USD", value: usdSgd },
            { currency: "AUD", value: audSgd },
          ] as const
        ).map(({ currency, value }) => (
          <label key={currency} className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
            <span className="shrink-0">1 {currency} =</span>
            <NumberField
              className="flex-1"
              value={value}
              min={0}
              max={MAX_RATE}
              minExclusive
              blank={null}
              error="Enter a rate above 0."
              label={`1 ${currency} in SGD`}
              placeholder="0.0000"
              onCommit={(v) => onRate(currency, v)}
            />
            <span className="shrink-0">SGD</span>
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs" style={{ color: "var(--on-surface-sub)" }}>
        Rates are entered by you, SGD is the base, and the values here are used for every figure on this page. A record
        in USD or AUD is left out of the totals until its rate is entered.
      </p>
    </section>
  );
}
