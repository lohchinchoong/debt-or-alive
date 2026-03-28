"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useToolState } from "@/hooks/useToolState";

// ─── Types ────────────────────────────────────────────────────────────────────
type YearRow = {
  year: number;
  balance: number;
  totalContributions: number;
  interestEarned: number;  // interest credited this specific year
  accruedInterest: number; // cumulative interest from day one
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const fmtAxis = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
};

function niceMax(rawMax: number): number {
  if (rawMax <= 0) return 1000;
  const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const niceFactors = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  const nice = niceFactors.find((f) => f * mag >= rawMax) ?? 10;
  return nice * mag;
}

// ─── CPF Tiered Monthly Interest ──────────────────────────────────────────────
// Rules (SA only — does not include OA cross-floor top-up logic):
//   Below 55 : 5% p.a. on first $60k, 4% on remainder
//   55 & above: 6% p.a. on first $30k, 5% on next $30k, 4% on remainder
function cpfMonthlyInterest(balance: number, age: number): number {
  if (age >= 55) {
    const tier1 = Math.min(balance, 30_000);
    const tier2 = Math.min(Math.max(balance - 30_000, 0), 30_000);
    const tier3 = Math.max(balance - 60_000, 0);
    return (tier1 * 0.06 + tier2 * 0.05 + tier3 * 0.04) / 12;
  } else {
    const tier1 = Math.min(balance, 60_000);
    const tier2 = Math.max(balance - 60_000, 0);
    return (tier1 * 0.05 + tier2 * 0.04) / 12;
  }
}

// ─── Simulation ───────────────────────────────────────────────────────────────
// CPF rules modelled:
//  • Interest computed monthly on the lowest balance of the month
//    (= opening balance, since contributions arrive at end of month)
//  • Contributions credited at end of each month within contribution window
//  • Monthly interest accumulated in a buffer; credited to principal each December
//  • Projection continues to age 65 even after contributions stop
function simulate(
  initialBalance: number,
  monthlyContrib: number,
  startYear: number,
  endContribYear: number,
  birthYear: number
): YearRow[] {
  const endProjectionYear = birthYear + 65;
  if (endProjectionYear < startYear) return [];

  const rows: YearRow[] = [];
  let balance = initialBalance;
  let totalContributions = initialBalance;
  let cumulativeInterest = 0;

  for (let year = startYear; year <= endProjectionYear; year++) {
    const age = year - birthYear; // age during this calendar year
    let interestBuffer = 0;

    for (let month = 1; month <= 12; month++) {
      // Step 1 — monthly interest on lowest balance (opening, before end-of-month contrib)
      interestBuffer += cpfMonthlyInterest(balance, age);

      // Step 2 — contribution arrives at end of month
      if (year <= endContribYear) {
        balance += monthlyContrib;
        totalContributions += monthlyContrib;
      }

      // Step 3 — credit entire year's interest at December
      if (month === 12) {
        balance += interestBuffer;
        cumulativeInterest += interestBuffer;
        rows.push({
          year,
          balance,
          totalContributions,
          interestEarned: interestBuffer,
          accruedInterest: cumulativeInterest,
        });
      }
    }
  }

  return rows;
}

// ─── FocusInput ───────────────────────────────────────────────────────────────
function FocusInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
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
      {hint && (
        <p className="text-[0.75rem] mt-1" style={{ color: "var(--on-surface-sub)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  sublabel,
  value,
  caption,
  gradient,
}: {
  label: string;
  sublabel?: string;
  value: string;
  caption?: string;
  gradient?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col justify-between"
      style={{
        background: gradient
          ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)"
          : "var(--surface-container-lowest)",
        boxShadow: gradient
          ? "0 12px 32px rgba(0,53,31,0.20)"
          : "var(--shadow-botanical)",
        minHeight: "7.5rem",
      }}
    >
      <div>
        <p
          className="text-[0.6875rem] font-semibold tracking-widest uppercase"
          style={{ color: gradient ? "rgba(255,255,255,0.65)" : "var(--primary)" }}
        >
          {label}
        </p>
        {sublabel && (
          <p
            className="text-[0.75rem] mt-0.5"
            style={{ color: gradient ? "rgba(255,255,255,0.50)" : "var(--on-surface-sub)" }}
          >
            {sublabel}
          </p>
        )}
      </div>
      <div>
        <p
          className="text-2xl sm:text-3xl font-bold leading-none mt-3"
          style={{
            color: gradient ? "#fff" : "var(--on-surface)",
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </p>
        {caption && (
          <p
            className="text-xs mt-1.5"
            style={{ color: gradient ? "rgba(255,255,255,0.55)" : "var(--on-surface-sub)" }}
          >
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── CPF SA Chart ─────────────────────────────────────────────────────────────
function CpfChart({
  rows,
  startYear,
  endContribYear,
}: {
  rows: YearRow[];
  startYear: number;
  endContribYear: number;
}) {
  if (rows.length < 2) return null;

  const W = 700;
  const H = 260;
  const PAD = { top: 24, right: 20, bottom: 44, left: 60 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const years = rows.map((r) => r.year);
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const span = maxYear - minYear;

  const rawMax = Math.max(...rows.map((r) => r.balance));
  const yMax = niceMax(rawMax);

  const xOf = (yr: number) => PAD.left + ((yr - minYear) / span) * CW;
  const yOf = (v: number) => PAD.top + CH - (v / yMax) * CH;

  // Balance line & area
  const balancePts = rows.map((r) => `${xOf(r.year).toFixed(1)},${yOf(r.balance).toFixed(1)}`);
  const balanceLine = `M ${balancePts.join(" L ")}`;
  const balanceArea = `${balanceLine} L ${xOf(maxYear).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  // Principal-only dashed line
  const principalPts = rows.map((r) => `${xOf(r.year).toFixed(1)},${yOf(r.totalContributions).toFixed(1)}`);
  const principalLine = `M ${principalPts.join(" L ")}`;

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  // X-axis labels — show every 2 or 5 years depending on span
  const step = span <= 15 ? 2 : 5;
  const xLabels: number[] = [];
  for (let y = minYear; y <= maxYear; y += step) xLabels.push(y);
  if (xLabels[xLabels.length - 1] !== maxYear) xLabels.push(maxYear);

  // Contribution cutoff marker
  const cutoffX = xOf(endContribYear);

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[0.9375rem] font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
        CPF SA ({startYear} – {maxYear})
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
        aria-label="CPF SA balance projection chart"
      >
        <defs>
          <linearGradient id="cpf-fill" x1="0" y1="0" x2="0" y2="1">
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
        {xLabels.map((yr) => (
          <text
            key={yr}
            x={xOf(yr)}
            y={H - 6}
            textAnchor="middle"
            fontSize="10"
            fill="#3d4a41"
            fontFamily="Manrope, sans-serif"
          >
            {yr}
          </text>
        ))}

        {/* Contribution cutoff vertical line */}
        <line
          x1={cutoffX}
          y1={PAD.top}
          x2={cutoffX}
          y2={PAD.top + CH}
          stroke="#c0c9c0"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.6"
        />
        <text
          x={cutoffX + 4}
          y={PAD.top + 12}
          fontSize="9"
          fill="#3d4a41"
          fontFamily="Manrope, sans-serif"
          opacity="0.8"
        >
          Contributions end
        </text>

        {/* Area fill */}
        <path d={balanceArea} fill="url(#cpf-fill)" />

        {/* Principal-only dashed line */}
        <path d={principalLine} fill="none" stroke="#c0c9c0" strokeWidth="1.5" strokeDasharray="5 4" />

        {/* Balance line */}
        <path
          d={balanceLine}
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
            SA Balance
          </text>
          <line x1="130" y1="0" x2="148" y2="0" stroke="#c0c9c0" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="153" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            Total Contributions
          </text>
        </g>
      </svg>
    </div>
  );
}

// ─── Yearly Table ─────────────────────────────────────────────────────────────
function YearlyTable({ rows }: { rows: YearRow[] }) {
  const [open, setOpen] = useState(false);

  const COLS = [
    { key: "year", label: "Year" },
    { key: "balance", label: "Future Value" },
    { key: "totalContributions", label: "Total Contribution" },
    { key: "interestEarned", label: "Interest Earned" },
    { key: "accruedInterest", label: "Accrued Interest" },
  ];

  return (
    <div className="rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-botanical)" }}>
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left"
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          border: "none",
          cursor: "pointer",
          fontFamily: "Manrope, sans-serif",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>
          CPF SA Growth Over Time (Table)
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--on-surface-sub)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
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
                {rows.map((row, i) => (
                  <tr
                    key={row.year}
                    style={{
                      backgroundColor:
                        i % 2 === 0
                          ? "var(--surface-container-lowest)"
                          : "var(--surface-container-low)",
                    }}
                  >
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
                      {row.year}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                      {fmt(row.balance)}
                    </td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: "var(--on-surface)" }}>
                      {fmt(row.totalContributions)}
                    </td>
                    <td
                      className="px-6 py-3.5 text-sm font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      +{fmt(row.interestEarned)}
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
export function CpfSaCalculatorPage() {
  const currentYear = new Date().getFullYear();

  // ── Persisted state (localStorage + URL params) ──
  const [s, set] = useToolState("tool:cpf-sa-calculator", {
    currentBalance: 10_000,
    monthlyContrib: 500,
    startYear: currentYear,
    endContribYear: currentYear + 11,
    birthYear: 1982,
  });

  const currentBalance  = s.currentBalance;
  const monthlyContrib  = s.monthlyContrib;
  const startYear       = s.startYear;
  const endContribYear  = s.endContribYear;
  const birthYear       = s.birthYear;

  const setCurrentBalance  = (v: number) => set({ currentBalance: v });
  const setMonthlyContrib  = (v: number) => set({ monthlyContrib: v });
  const setStartYear       = (v: number) => set({ startYear: Math.round(v) });
  const setEndContribYear  = (v: number) => set({ endContribYear: Math.round(v) });
  const setBirthYear       = (v: number) => set({ birthYear: Math.round(v) });

  const rows = useMemo(
    () => simulate(currentBalance, monthlyContrib, startYear, endContribYear, birthYear),
    [currentBalance, monthlyContrib, startYear, endContribYear, birthYear]
  );

  // Key milestones
  const endContribRow = rows.find((r) => r.year === endContribYear);
  const age55Year = birthYear + 55;
  const age65Year = birthYear + 65;
  const age55Row = rows.find((r) => r.year === age55Year);
  const age65Row = rows.find((r) => r.year === age65Year);

  // Projection note
  const projNote =
    rows.length > 0
      ? `Projection runs from Jan ${startYear} to end of ${rows[rows.length - 1].year}.`
      : "";

  return (
    <>
      <SiteHeader />
      <main
        className="min-h-screen px-5 sm:px-8 lg:px-16 py-10"
        style={{ backgroundColor: "var(--surface-container-low)" }}
      >
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Page Header ───────────────────────────────────────────────── */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
              style={{ color: "var(--on-surface-sub)", textDecoration: "none" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Home
            </Link>

            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: "linear-gradient(45deg, var(--primary), var(--primary-container))",
                  boxShadow: "0 8px 24px rgba(0,53,31,0.2)",
                }}
              >
                {/* PiggyBank — matches ToolCard landing card icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 5c-1.5 0-2.5 1-2.5 1H5a3 3 0 0 0 0 6h.5v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1h2v1a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3.5c1.1-.4 2-1.4 2-2.5V8c0-1.7-1.3-3-3-3z" />
                  <path d="M12 5V3" />
                </svg>
              </div>

              <div>
                <h1
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                >
                  CPF Special Account (SA) Calculator
                </h1>
                <p
                  className="mt-2 text-base max-w-xl"
                  style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}
                >
                  Project your CPF SA balance with tiered interest rates and accurate annual crediting.
                </p>
              </div>
            </div>
          </div>

          {/* ── Main Grid ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left — Parameters */}
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
                Enter your CPF SA details
              </p>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FocusInput
                    label="Current SA Balance (S$)"
                    value={currentBalance}
                    onChange={setCurrentBalance}
                    min={0}
                    step={1000}
                  />
                  <FocusInput
                    label="Monthly Contribution (S$)"
                    value={monthlyContrib}
                    onChange={setMonthlyContrib}
                    min={0}
                    step={100}
                  />
                </div>

                <FocusInput
                  label="Starting Year (Jan)"
                  value={startYear}
                  onChange={setStartYear}
                  min={2000}
                  max={2100}
                  step={1}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FocusInput
                    label="Year to End Contribution (Dec)"
                    value={endContribYear}
                    onChange={setEndContribYear}
                    min={startYear}
                    max={2100}
                    step={1}
                  />
                  <FocusInput
                    label="Birth Year"
                    value={birthYear}
                    onChange={setBirthYear}
                    min={1930}
                    max={currentYear - 16}
                    step={1}
                  />
                </div>
              </div>

              {projNote && (
                <p className="text-[0.75rem] mt-5" style={{ color: "var(--on-surface-sub)" }}>
                  {projNote}
                </p>
              )}
            </div>

            {/* Right — Stat Cards */}
            <div className="lg:col-span-7 space-y-4">

              {/* Row 1 — end of contribution period */}
              {endContribRow && (
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    label={`By end of ${endContribYear}`}
                    sublabel="Balance"
                    value={fmt(endContribRow.balance)}
                    gradient
                  />
                  <StatCard
                    label={`By end of ${endContribYear}`}
                    sublabel="Total Interest"
                    value={fmt(endContribRow.accruedInterest)}
                    caption={`${((endContribRow.accruedInterest / endContribRow.totalContributions) * 100).toFixed(1)}% return on contributions`}
                  />
                </div>
              )}

              {/* Row 2 — Age 55 (only shown when different from end-contribution year) */}
              {age55Row && age55Year >= startYear && age55Year !== endContribYear && (
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    label={`By Age 55 (${age55Year})`}
                    sublabel="Projected Balance"
                    value={fmt(age55Row.balance)}
                  />
                  <StatCard
                    label={`By Age 55 (${age55Year})`}
                    sublabel="Total Interest Earned"
                    value={fmt(age55Row.accruedInterest)}
                  />
                </div>
              )}

              {/* Row 3 — Age 65 */}
              {age65Row && age65Year >= startYear && (
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    label={`By Age 65 (${age65Year})`}
                    sublabel="Projected Balance"
                    value={fmt(age65Row.balance)}
                  />
                  <StatCard
                    label={`By Age 65 (${age65Year})`}
                    sublabel="Total Interest Earned"
                    value={fmt(age65Row.accruedInterest)}
                  />
                </div>
              )}

              {/* Row 4 — total contributions */}
              {endContribRow && (
                <StatCard
                  label={`Total Contributions by end of ${endContribYear}`}
                  sublabel="Principal Invested"
                  value={fmt(endContribRow.totalContributions)}
                />
              )}
            </div>
          </div>

          {/* ── Chart ─────────────────────────────────────────────────────── */}
          {rows.length > 1 && (
            <CpfChart rows={rows} startYear={startYear} endContribYear={endContribYear} />
          )}

          {/* ── Yearly Table ──────────────────────────────────────────────── */}
          {rows.length > 0 && <YearlyTable rows={rows} />}

          {/* ── How It Works ──────────────────────────────────────────────── */}
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

            <ul className="space-y-4">
              {[
                {
                  heading: "Interest Rate (Below 55)",
                  body: (
                    <>
                      <strong>5% p.a.</strong> on the first S$60,000 and <strong>4% p.a.</strong> on the remaining balance.
                    </>
                  ),
                },
                {
                  heading: "Interest Rate (55 and Above)",
                  body: (
                    <>
                      <strong>6% p.a.</strong> on the first S$30,000, <strong>5% p.a.</strong> on the next S$30,000,
                      and <strong>4% p.a.</strong> on the remaining balance.
                    </>
                  ),
                },
                {
                  heading: "Interest Calculation",
                  body: "Computed monthly based on the lowest balance of the month. Because contributions arrive at the end of the month, the lowest balance is the opening balance — meaning new contributions only begin earning interest the following month.",
                },
                {
                  heading: "Interest Crediting",
                  body: (
                    <>
                      Monthly interest is accumulated in a buffer throughout the year and credited to your principal
                      only at the <strong>end of December</strong>. The credited interest then earns interest in
                      subsequent years — this is the compounding effect that makes CPF SA so powerful over long horizons.
                    </>
                  ),
                },
                {
                  heading: "Contributions",
                  body: "Added at the end of each month within your specified contribution window. After the end contribution year, the balance continues to grow from interest alone — the projection extends to age 65 to show the long-term picture.",
                },
              ].map(({ heading, body }) => (
                <li
                  key={heading}
                  className="flex gap-3 text-sm leading-relaxed"
                  style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}
                >
                  <span
                    className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "var(--primary)", marginTop: "0.55rem" }}
                  />
                  <span>
                    <span className="font-semibold" style={{ color: "var(--on-surface)" }}>
                      {heading}:{" "}
                    </span>
                    {body}
                  </span>
                </li>
              ))}
            </ul>

            <p
              className="text-xs mt-8 pt-6"
              style={{
                color: "var(--on-surface-sub)",
                borderTop: "1px solid rgba(192,201,192,0.3)",
                lineHeight: "1.6",
              }}
            >
              <span className="font-semibold">Disclaimer:</span> This calculator models CPF SA interest
              based on publicly available CPF Board rules as of 2025. Results are illustrative only —
              actual figures may differ due to changes in interest rate policy, withdrawal rules, or
              your individual CPF account composition (OA/SA/MA cross-floor interactions are not modelled here).
              This tool does not constitute financial advice.
            </p>
          </div>

        </div>
      </main>
    </>
  );
}

export default CpfSaCalculatorPage;
