"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useToolState } from "@/hooks/useToolState";
import { fmtAxis, niceMax } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type CompoundingFreq = 1 | 2 | 4 | 12 | 365;
type ContributionTiming = "start" | "end";

type YearData = {
  year: number;
  futureValue: number;
  totalContribution: number;
  interestEarned: number;
  accruedInterest: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const FREQ_OPTIONS: { label: string; value: CompoundingFreq }[] = [
  { label: "Annually (1/yr)", value: 1 },
  { label: "Semi-Annually (2/yr)", value: 2 },
  { label: "Quarterly (4/yr)", value: 4 },
  { label: "Monthly (12/yr)", value: 12 },
  { label: "Daily (365/yr)", value: 365 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);


// ─── Core Formula (month-by-month simulation) ─────────────────────────────────
function calculateGrowth(
  initial: number,
  monthly: number,
  annualRate: number,
  years: number,
  compFreq: CompoundingFreq,
  timing: ContributionTiming
): YearData[] {
  const clampedYears = Math.min(Math.max(Math.round(years), 1), 50);
  const totalMonths = clampedYears * 12;
  const rate = annualRate / 100;

  let balance = initial;
  const data: YearData[] = [
    { year: 0, futureValue: initial, totalContribution: initial, interestEarned: 0, accruedInterest: 0 },
  ];
  let prevYearBalance = initial;

  for (let month = 1; month <= totalMonths; month++) {
    if (timing === "start") balance += monthly;

    if (compFreq === 365) {
      // Approximate daily compounding per calendar month
      balance *= Math.pow(1 + rate / 365, 365 / 12);
    } else {
      const monthsPerPeriod = 12 / compFreq;
      if (month % monthsPerPeriod === 0) {
        balance *= 1 + rate / compFreq;
      }
    }

    if (timing === "end") balance += monthly;

    if (month % 12 === 0) {
      const year = month / 12;
      const totalContrib = initial + monthly * month;
      const accruedInterest = balance - totalContrib;
      const interestEarned = balance - prevYearBalance - monthly * 12;
      data.push({ year, futureValue: balance, totalContribution: totalContrib, interestEarned, accruedInterest });
      prevYearBalance = balance;
    }
  }

  return data;
}

// ─── FocusInput ───────────────────────────────────────────────────────────────
type FocusInputProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

function FocusInput({ label, value, onChange, min, max, step = 1 }: FocusInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <p className="text-[0.8125rem] font-medium mb-1.5" style={{ color: "var(--on-surface-sub)" }}>
        {label}
      </p>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "var(--surface-container-highest)",
          border: "none",
          borderBottom: `2px solid ${focused ? "var(--primary)" : "var(--outline-variant)"}`,
          borderRadius: "0.25rem 0.25rem 0 0",
          padding: "0.625rem 0.5rem",
          fontSize: "0.9375rem",
          fontFamily: "Manrope, sans-serif",
          fontWeight: 500,
          color: "var(--on-surface)",
          outline: "none",
          transition: "border-color 0.15s ease",
        }}
      />
    </div>
  );
}

// ─── FocusSelect ─────────────────────────────────────────────────────────────
type FocusSelectProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { label: string; value: number }[];
};

function FocusSelect({ label, value, onChange, options }: FocusSelectProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <p className="text-[0.8125rem] font-medium mb-1.5" style={{ color: "var(--on-surface-sub)" }}>
        {label}
      </p>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            background: "var(--surface-container-highest)",
            border: "none",
            borderBottom: `2px solid ${focused ? "var(--primary)" : "var(--outline-variant)"}`,
            borderRadius: "0.25rem 0.25rem 0 0",
            padding: "0.625rem 2rem 0.625rem 0.5rem",
            fontSize: "0.9375rem",
            fontFamily: "Manrope, sans-serif",
            fontWeight: 500,
            color: "var(--on-surface)",
            outline: "none",
            transition: "border-color 0.15s ease",
            appearance: "none",
            cursor: "pointer",
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--on-surface-sub)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

// ─── RadioPill ────────────────────────────────────────────────────────────────
function RadioPill({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        fontFamily: "Manrope, sans-serif",
      }}
    >
      <span
        style={{
          width: "1rem",
          height: "1rem",
          borderRadius: "50%",
          border: `2px solid ${checked ? "var(--primary)" : "var(--outline-variant)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "border-color 0.15s",
        }}
      >
        {checked && (
          <span
            style={{
              width: "0.5rem",
              height: "0.5rem",
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
            }}
          />
        )}
      </span>
      <span className="text-sm" style={{ color: "var(--on-surface)" }}>
        {label}
      </span>
    </button>
  );
}

// ─── GrowthChart ─────────────────────────────────────────────────────────────
function GrowthChart({ data }: { data: YearData[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (data.length < 2) return null;

  const W = 600;
  const H = 240;
  const PAD = { top: 24, right: 20, bottom: 40, left: 58 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const totalYears = data[data.length - 1].year;
  const rawMax = Math.max(...data.map((d) => d.futureValue));
  const yMax = niceMax(rawMax);

  const xOf = (y: number) => PAD.left + (y / totalYears) * CW;
  const yOf = (v: number) => PAD.top + CH - (v / yMax) * CH;

  // Compound growth path
  const growthPts = data.map((d) => `${xOf(d.year).toFixed(1)},${yOf(d.futureValue).toFixed(1)}`);
  const growthLine = `M ${growthPts.join(" L ")}`;
  const growthArea = `${growthLine} L ${xOf(totalYears).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  // Principal-only path
  const principalPts = data.map((d) => `${xOf(d.year).toFixed(1)},${yOf(d.totalContribution).toFixed(1)}`);
  const principalLine = `M ${principalPts.join(" L ")}`;

  // Y-axis ticks (0, 25%, 50%, 75%, 100%)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  // X-axis labels — evenly spaced multiples of a nice step
  const xStep = totalYears <= 10 ? 2 : totalYears <= 20 ? 5 : 10;
  const xLabels: number[] = [];
  for (let y = 0; y <= totalYears; y += xStep) xLabels.push(y);
  // Add final year only if it's meaningfully far from last tick
  const lastTick = xLabels[xLabels.length - 1];
  if (lastTick !== totalYears && totalYears - lastTick > xStep * 0.4) xLabels.push(totalYears);

  // Hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const fraction = Math.max(0, Math.min(1, (svgX - PAD.left) / CW));
    setHoveredIdx(Math.round(fraction * (data.length - 1)));
  };

  const hd = hoveredIdx !== null ? data[hoveredIdx] : null;
  const hx = hd ? xOf(hd.year) : 0;
  const TW = 180;
  const TH = 78;
  const tooltipX = hd ? (hx < PAD.left + CW / 2 ? hx + 10 : hx - TW - 10) : 0;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[0.9375rem] font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
        Growth Projection
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        aria-label="Compound interest growth projection chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="cic-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00351f" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00351f" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ticks.map((v) => (
          <line
            key={v}
            x1={PAD.left}
            y1={yOf(v)}
            x2={W - PAD.right}
            y2={yOf(v)}
            stroke="#c0c9c0"
            strokeWidth="0.5"
            strokeDasharray="3 5"
            opacity="0.7"
          />
        ))}

        {/* Y-axis labels */}
        {ticks.map((v) => (
          <text
            key={v}
            x={PAD.left - 6}
            y={yOf(v) + 4}
            textAnchor="end"
            fontSize="10"
            fill="#3d4a41"
            fontFamily="Manrope, sans-serif"
          >
            {fmtAxis(v)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((y) => (
          <text
            key={y}
            x={xOf(y)}
            y={H - 6}
            textAnchor="middle"
            fontSize="10"
            fill="#3d4a41"
            fontFamily="Manrope, sans-serif"
          >
            {y === 0 ? "Now" : `Yr ${y}`}
          </text>
        ))}

        {/* Area fill */}
        <path d={growthArea} fill="url(#cic-fill)" />

        {/* Principal-only dashed line */}
        <path d={principalLine} fill="none" stroke="#c0c9c0" strokeWidth="1.5" strokeDasharray="5 4" />

        {/* Compound growth line */}
        <path
          d={growthLine}
          fill="none"
          stroke="#00351f"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Legend */}
        <g transform={`translate(${PAD.left}, 10)`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke="#00351f" strokeWidth="2" />
          <text x="23" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            With compound interest
          </text>
          <line x1="162" y1="0" x2="180" y2="0" stroke="#c0c9c0" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="185" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            Principal only
          </text>
        </g>

        {/* Hover crosshair + tooltip */}
        {hd && (
          <g pointerEvents="none">
            <line x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + CH} stroke="#3d4a41" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle cx={hx} cy={yOf(hd.totalContribution)} r="3.5" fill="#c0c9c0" stroke="white" strokeWidth="1.5" />
            <circle cx={hx} cy={yOf(hd.futureValue)} r="4" fill="#00351f" stroke="white" strokeWidth="1.5" />
            <rect x={tooltipX} y={PAD.top + 4} width={TW} height={TH} rx="5" fill="white" stroke="#c0c9c0" strokeWidth="0.75" />
            <text x={tooltipX + 10} y={PAD.top + 20} fontSize="10" fontWeight="700" fill="#00351f" fontFamily="Manrope, sans-serif">{`Year ${hd.year}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 36} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">{`Balance: $${fmtAxis(hd.futureValue)}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 51} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">{`Principal: $${fmtAxis(hd.totalContribution)}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 66} fontSize="10" fill="#1a6b42" fontFamily="Manrope, sans-serif">{`Interest: $${fmtAxis(hd.accruedInterest)}`}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── YearlyTable ──────────────────────────────────────────────────────────────
function YearlyTable({ data }: { data: YearData[] }) {
  const [open, setOpen] = useState(false);

  const COLS = [
    { key: "year", label: "Year" },
    { key: "futureValue", label: "Future Value" },
    { key: "totalContribution", label: "Total Contribution" },
    { key: "interestEarned", label: "Interest Earned" },
    { key: "accruedInterest", label: "Accrued Interest" },
  ];

  return (
    <div className="rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-botanical)" }}>
      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left"
        style={{ backgroundColor: "var(--surface-container-lowest)", border: "none", cursor: "pointer", fontFamily: "Manrope, sans-serif" }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>
          Investment Growth Over Time (Table)
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--on-surface-sub)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      {open && (
        <div style={{ backgroundColor: "var(--surface-container-lowest)" }}>
          <div style={{ height: "1px", backgroundColor: "var(--outline-variant)", opacity: 0.25 }} />
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--surface-container-low)" }}>
                  {COLS.map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-3 text-left text-[0.6875rem] font-semibold tracking-widest uppercase"
                      style={{ color: "var(--on-surface-sub)" }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={row.year}
                    style={{
                      backgroundColor:
                        i % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)",
                    }}
                  >
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
                      {row.year}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                      {fmt(row.futureValue)}
                    </td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: "var(--on-surface)" }}>
                      {fmt(row.totalContribution)}
                    </td>
                    <td
                      className="px-6 py-3.5 text-sm font-semibold"
                      style={{ color: row.interestEarned >= 0 ? "var(--primary)" : "var(--tertiary)" }}
                    >
                      {row.interestEarned >= 0 ? "+" : ""}
                      {fmt(row.interestEarned)}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                      {fmt(row.accruedInterest)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function CompoundInterestPage() {
  // ── Persisted state (localStorage + URL params) ──
  const [s, set] = useToolState("tool:compound-interest", {
    initial: 10_000,
    monthly: 500,
    rate: 5,
    years: 10,
    compFreq: 12 as number,
    timing: "end",
  });

  const initial   = s.initial;
  const monthly   = s.monthly;
  const rate      = s.rate;
  const years     = s.years;
  const compFreq  = s.compFreq as CompoundingFreq;
  const timing    = s.timing as ContributionTiming;

  const setInitial  = (v: number) => set({ initial: v });
  const setMonthly  = (v: number) => set({ monthly: v });
  const setRate     = (v: number) => set({ rate: v });
  const setYears    = (v: number) => set({ years: v });
  const setCompFreq = (v: number) => set({ compFreq: v });
  const setTiming   = (v: string) => set({ timing: v });

  // ── Derived ──
  const data = useMemo(
    () => calculateGrowth(initial, monthly, rate, years, compFreq, timing),
    [initial, monthly, rate, years, compFreq, timing]
  );

  const finalRow = data[data.length - 1];
  const finalBalance = finalRow?.futureValue ?? 0;
  const totalInterest = finalRow?.accruedInterest ?? 0;
  const totalContributed = finalRow?.totalContribution ?? 0;
  const returnPct = totalContributed > 0 ? (totalInterest / totalContributed) * 100 : 0;

  return (
    <>
      <SiteHeader />
      <main
        className="min-h-screen px-5 sm:px-8 lg:px-16 py-10"
        style={{ backgroundColor: "var(--surface-container-low)" }}
      >
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Page Header ─────────────────────────────────────────────── */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
              style={{ color: "var(--on-surface-sub)", textDecoration: "none" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Home
            </Link>

            <div className="flex items-start gap-4">
              {/* Icon badge */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: "linear-gradient(45deg, var(--primary), var(--primary-container))",
                  boxShadow: "0 8px 24px rgba(0,53,31,0.2)",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 7l-8.5 8.5-5-5L2 17" />
                  <path d="M16 7h6v6" />
                </svg>
              </div>

              <div>
                <h1
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                >
                  Compound Interest Calculator
                </h1>
                <p
                  className="mt-2 text-base max-w-xl"
                  style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}
                >
                  Plan your future by visualising how small, regular contributions grow exponentially over time.
                </p>
              </div>
            </div>
          </div>

          {/* ── Main Grid ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left — Parameters Panel */}
            <div
              className="lg:col-span-5 rounded-xl p-6"
              style={{
                backgroundColor: "var(--surface-container-lowest)",
                boxShadow: "var(--shadow-botanical)",
              }}
            >
              <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                Parameters
              </p>
              <p className="text-sm mt-0.5 mb-6" style={{ color: "var(--on-surface-sub)" }}>
                Adjust the details of your investment
              </p>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FocusInput
                    label="Initial Investment (S$)"
                    value={initial}
                    onChange={setInitial}
                    min={0}
                    step={1000}
                  />
                  <FocusInput
                    label="Monthly Contribution (S$)"
                    value={monthly}
                    onChange={setMonthly}
                    min={0}
                    step={100}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FocusInput
                    label="Annual Interest Rate (%)"
                    value={rate}
                    onChange={setRate}
                    min={0}
                    max={100}
                    step={0.1}
                  />
                  <FocusInput
                    label="Investment Duration (Years)"
                    value={years}
                    onChange={setYears}
                    min={1}
                    max={50}
                  />
                </div>

                <FocusSelect
                  label="Compounding Frequency"
                  value={compFreq}
                  onChange={(v) => setCompFreq(v as CompoundingFreq)}
                  options={FREQ_OPTIONS}
                />

                {/* Contribution timing */}
                <div>
                  <p className="text-[0.8125rem] font-medium mb-2.5" style={{ color: "var(--on-surface-sub)" }}>
                    Contributions Made At
                  </p>
                  <div className="flex gap-6">
                    <RadioPill
                      checked={timing === "start"}
                      label="Start of Month"
                      onClick={() => setTiming("start")}
                    />
                    <RadioPill
                      checked={timing === "end"}
                      label="End of Month"
                      onClick={() => setTiming("end")}
                    />
                  </div>
                </div>
              </div>

              {/* Total principal strip */}
              <div
                className="mt-6 rounded-lg px-4 py-3.5"
                style={{ backgroundColor: "var(--surface-container-low)" }}
              >
                <p className="text-[0.75rem] font-medium mb-0.5" style={{ color: "var(--on-surface-sub)" }}>
                  Total Principal Invested
                </p>
                <p
                  className="text-xl font-bold"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
                >
                  {fmt(totalContributed)}
                </p>
              </div>
            </div>

            {/* Right — Results */}
            <div className="lg:col-span-7 space-y-5">
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Final Balance — signature gradient */}
                <div
                  className="rounded-xl p-5 flex flex-col justify-between"
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                    boxShadow: "0 12px 32px rgba(0,53,31,0.20)",
                    minHeight: "7.5rem",
                  }}
                >
                  <p
                    className="text-[0.6875rem] font-semibold tracking-widest uppercase"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    Final Balance
                  </p>
                  <div>
                    <p
                      className="text-2xl sm:text-3xl font-bold leading-none mt-3"
                      style={{ color: "#fff", letterSpacing: "-0.02em" }}
                    >
                      {fmt(finalBalance)}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                      After {years} year{years !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Total Interest */}
                <div
                  className="rounded-xl p-5 flex flex-col justify-between"
                  style={{
                    backgroundColor: "var(--surface-container-lowest)",
                    boxShadow: "var(--shadow-botanical)",
                    minHeight: "7.5rem",
                  }}
                >
                  <p
                    className="text-[0.6875rem] font-semibold tracking-widest uppercase"
                    style={{ color: "var(--primary)" }}
                  >
                    Total Interest
                  </p>
                  <div>
                    <p
                      className="text-2xl sm:text-3xl font-bold leading-none mt-3"
                      style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
                    >
                      {fmt(totalInterest)}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "var(--on-surface-sub)" }}>
                      {returnPct > 0 ? `${returnPct.toFixed(1)}% return on principal` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Growth chart */}
              <GrowthChart data={data} />
            </div>
          </div>

          {/* ── Yearly Table ─────────────────────────────────────────────── */}
          <YearlyTable data={data} />

          {/* ── How It Works ─────────────────────────────────────────────── */}
          <div
            className="rounded-xl p-8"
            style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
          >
            <h2
              className="text-xl font-bold mb-6"
              style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
            >
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">

              {/* 1 — The core formula */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: "var(--primary)", color: "#fff" }}
                  >
                    1
                  </span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>
                    The Core Formula
                  </h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  Your final balance is calculated using the standard compound interest formula:{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>
                    FV = PV × (1 + r/n)^(n×t)
                  </span>
                  , where <em>PV</em> is your initial investment, <em>r</em> is the annual interest rate,{" "}
                  <em>n</em> is how many times interest compounds per year, and <em>t</em> is time in years.
                  Regular contributions are added on top using the future value of an annuity formula.
                </p>
              </div>

              {/* 2 — Compounding frequency */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: "var(--primary)", color: "#fff" }}
                  >
                    2
                  </span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>
                    Compounding Frequency
                  </h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  The more often interest is compounded, the more you earn — because each period&apos;s
                  interest starts earning its own interest sooner. Monthly compounding (12×/yr) is standard
                  for most savings accounts and fixed deposits, while daily (365×/yr) is used by some
                  high-yield accounts. The difference becomes more pronounced over longer time horizons.
                </p>
              </div>

              {/* 3 — Contribution timing */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: "var(--primary)", color: "#fff" }}
                  >
                    3
                  </span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>
                    Start vs. End of Month
                  </h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  Contributing at the <span className="font-semibold" style={{ color: "var(--on-surface)" }}>start</span> of
                  each month means each deposit earns one extra compounding period of interest — this is called
                  an <em>annuity due</em>. Contributing at the{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>end</span> (ordinary annuity)
                  is more common in practice, matching how most bank transfers and salary-linked contributions work.
                  The gap is small per period but compounds meaningfully over decades.
                </p>
              </div>

              {/* 4 — Reading the table */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: "var(--primary)", color: "#fff" }}
                  >
                    4
                  </span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>
                    Reading the Table
                  </h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>Future Value</span> is your
                  running balance at the end of each year.{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>Total Contribution</span> is
                  every dollar you put in (initial + all monthly deposits).{" "}
                  <span className="font-semibold" style={{ color: "var(--primary)" }}>Interest Earned</span> shows
                  only the interest generated in that single year, and{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>Accrued Interest</span> is the
                  cumulative total interest earned from day one. The gap between these two numbers is compounding
                  working in your favour.
                </p>
              </div>

            </div>

            {/* Disclaimer */}
            <p
              className="text-xs mt-8 pt-6"
              style={{
                color: "var(--on-surface-sub)",
                borderTop: "1px solid rgba(192,201,192,0.3)",
                lineHeight: "1.6",
              }}
            >
              <span className="font-semibold">Disclaimer:</span> Results are for illustrative purposes only and
              assume a constant interest rate throughout the investment period. Actual returns will vary based on
              market conditions, fees, tax treatment, and the specific product you invest in. This tool does not
              constitute financial advice.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default CompoundInterestPage;
