"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { useCpfOaProfiles, CpfOaParams } from "@/hooks/useCpfOaProfiles";
import { fmtAxis, niceMax } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type YearRow = {
  year: number;
  age: number;
  balance: number;
  withdrawals: number;
  interestEarned: number;
  cumulativeInterest: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const OA_RATE = 0.025;
const START_AGE = 55;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

// ─── Simulation ───────────────────────────────────────────────────────────────
// The balance at 55 is taken as at Dec of the year the member turns 55. Drawdown
// runs Jan of the following year to Dec of the year they reach endDrawdownAge.
// Withdrawals leave at month-start; interest accrues monthly on the remaining
// (lowest) balance and is credited each December.
function simulate(params: CpfOaParams, monthlyDrawdown: number): YearRow[] {
  const { balanceAt55, birthYear, endDrawdownAge } = params;

  const rows: YearRow[] = [];
  let balance = balanceAt55;
  let cumulativeInterest = 0;

  for (let age = START_AGE + 1; age <= endDrawdownAge; age++) {
    let interestBuffer = 0;

    for (let month = 1; month <= 12; month++) {
      balance -= monthlyDrawdown;
      interestBuffer += (balance * OA_RATE) / 12;
    }

    balance += interestBuffer;
    cumulativeInterest += interestBuffer;
    rows.push({
      year: birthYear + age,
      age,
      balance,
      withdrawals: monthlyDrawdown * 12,
      interestEarned: interestBuffer,
      cumulativeInterest,
    });
  }

  return rows;
}

// The end balance is affine in the drawdown amount, so two runs give the exact
// payout that brings the balance to zero.
function solveMonthlyDrawdown(params: CpfOaParams): number {
  const endBalance = (w: number) => simulate(params, w).at(-1)?.balance ?? 0;
  const b0 = endBalance(0);
  const b1 = endBalance(1);
  const slope = b0 - b1;
  if (slope <= 0 || b0 <= 0) return 0;
  return b0 / slope;
}

function validate(params: CpfOaParams): string | null {
  if (params.balanceAt55 < 0) {
    return "OA Balance at 55 cannot be negative.";
  }
  if (params.endDrawdownAge <= START_AGE) {
    return `Age to End Drawdown must be above ${START_AGE}.`;
  }
  if (params.endDrawdownAge > 120) {
    return "Age to End Drawdown is limited to 120.";
  }
  return null;
}

// ─── ProfileNameEditor ────────────────────────────────────────────────────────
function ProfileNameEditor({
  name,
  onSave,
}: {
  name: string;
  onSave: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    onSave(draft.trim() || "Unnamed");
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.currentTarget.blur(); }
          if (e.key === "Escape") { setDraft(name); setEditing(false); }
        }}
        style={{
          background: "transparent",
          border: "none",
          borderBottom: "2px solid var(--primary)",
          outline: "none",
          fontSize: "0.875rem",
          fontFamily: "Manrope, sans-serif",
          fontWeight: 600,
          color: "var(--on-surface)",
          padding: "0.125rem 0",
          minWidth: "8rem",
          maxWidth: "24rem",
          width: `${Math.max(draft.length, 8)}ch`,
        }}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(name); setEditing(true); }}
      title="Click to rename"
      style={{
        background: "none",
        border: "none",
        cursor: "text",
        padding: "0.125rem 0",
        fontFamily: "Manrope, sans-serif",
        fontWeight: 600,
        fontSize: "0.875rem",
        color: "var(--on-surface-sub)",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
      }}
    >
      {name}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
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
  // While focused, show the raw text so the field can be cleared mid-edit;
  // only valid numbers are committed, and blur snaps back to the saved value.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div>
      <p className="text-[0.8125rem] font-medium mb-1.5" style={{ color: "var(--on-surface-sub)" }}>
        {label}
      </p>
      <input
        type="number"
        value={draft ?? value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          setDraft(e.target.value);
          const parsed = parseFloat(e.target.value);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setDraft(null); }}
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
          ? "linear-gradient(135deg, var(--primary-fill) 0%, var(--primary-fill-container) 100%)"
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

// ─── CPF OA Chart ─────────────────────────────────────────────────────────────
function OaChart({
  rows,
  balanceAt55,
  birthYear,
}: {
  rows: YearRow[];
  balanceAt55: number;
  birthYear: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (rows.length < 1) return null;

  const W = 700;
  const H = 260;
  const PAD = { top: 24, right: 20, bottom: 44, left: 60 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  // Plot by age; the first point is the Dec balance at 55
  const points = [
    { age: START_AGE, balance: balanceAt55 },
    ...rows.map((r) => ({ age: r.age, balance: r.balance })),
  ];
  const minAge = START_AGE;
  const maxAge = points[points.length - 1].age;
  const span = maxAge - minAge;

  const yMax = niceMax(Math.max(...points.map((p) => p.balance)));

  const xOf = (age: number) => PAD.left + ((age - minAge) / span) * CW;
  const yOf = (v: number) => PAD.top + CH - (Math.max(v, 0) / yMax) * CH;
  const baseY = (PAD.top + CH).toFixed(1);

  const line = `M ${points.map((p) => `${xOf(p.age).toFixed(1)},${yOf(p.balance).toFixed(1)}`).join(" L ")}`;
  const area = `${line} L ${xOf(maxAge).toFixed(1)},${baseY} L ${xOf(minAge).toFixed(1)},${baseY} Z`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  const xStep = span <= 10 ? 1 : span <= 20 ? 2 : 5;
  const xLabels: number[] = [];
  for (let a = Math.ceil(minAge / xStep) * xStep; a <= maxAge; a += xStep) xLabels.push(a);

  // Include the opening balance at 55 so the leftmost edge is hoverable
  const hoverRows = [
    { year: birthYear + START_AGE, age: START_AGE, balance: balanceAt55, withdrawals: 0 },
    ...rows,
  ];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const fraction = Math.max(0, Math.min(1, (svgX - PAD.left) / CW));
    const age = minAge + fraction * span;
    setHoveredIdx(Math.max(0, Math.min(hoverRows.length - 1, Math.round(age) - START_AGE)));
  };

  const hd = hoveredIdx !== null ? hoverRows[hoveredIdx] : null;
  const hx = hd ? xOf(hd.age) : 0;
  const TW = 192;
  const TH = 62;
  const tooltipX = hd ? (hx < PAD.left + CW / 2 ? hx + 10 : hx - TW - 10) : 0;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[0.9375rem] font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
        CPF OA Drawdown (Age {START_AGE + 1} – {maxAge}, {birthYear + START_AGE + 1} – {birthYear + maxAge})
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        aria-label="CPF OA drawdown projection chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="oa-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((v) => (
          <line key={v} x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)}
            stroke="var(--outline-variant)" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.7" />
        ))}

        {ticks.map((v) => (
          <text key={v} x={PAD.left - 6} y={yOf(v) + 4} textAnchor="end"
            fontSize="10" fill="var(--on-surface-sub)" fontFamily="Manrope, sans-serif">
            {fmtAxis(v)}
          </text>
        ))}

        {xLabels.map((age) => (
          <text key={age} x={xOf(age)} y={H - 6} textAnchor="middle"
            fontSize="10" fill="var(--on-surface-sub)" fontFamily="Manrope, sans-serif">
            {age}
          </text>
        ))}
        <text x={W - PAD.right} y={H - 22} textAnchor="end"
          fontSize="9" fill="var(--on-surface-sub)" fontFamily="Manrope, sans-serif" opacity="0.8">
          Age
        </text>

        <path d={area} fill="url(#oa-fill)" />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        <g transform={`translate(${PAD.left}, 10)`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke="var(--primary)" strokeWidth="2" />
          <text x="23" y="4" fontSize="10" fill="var(--on-surface-sub)" fontFamily="Manrope, sans-serif">OA Balance (Dec)</text>
        </g>

        {hd && (
          <g pointerEvents="none">
            <line x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + CH}
              stroke="var(--on-surface-sub)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle cx={hx} cy={yOf(hd.balance)} r="4" fill="var(--primary)"
              stroke="var(--surface-container-lowest)" strokeWidth="1.5" />
            <rect x={tooltipX} y={PAD.top + 4} width={TW} height={TH} rx="5"
              fill="var(--surface-container-lowest)" stroke="var(--outline-variant)" strokeWidth="0.75" />
            <text x={tooltipX + 10} y={PAD.top + 20} fontSize="10" fontWeight="700"
              fill="var(--primary)" fontFamily="Manrope, sans-serif">{`${hd.year} · Age ${hd.age}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 36} fontSize="10" fill="var(--on-surface-sub)"
              fontFamily="Manrope, sans-serif">{`Balance: $${fmtAxis(Math.max(hd.balance, 0))}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 51} fontSize="10" fill="var(--on-surface-sub)"
              fontFamily="Manrope, sans-serif">{`Withdrawn: $${fmtAxis(hd.withdrawals)}`}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Yearly Table ─────────────────────────────────────────────────────────────
function YearlyTable({ rows }: { rows: YearRow[] }) {
  const [open, setOpen] = useState(false);

  const COLS = [
    { key: "year", label: "Year" },
    { key: "age", label: "Age" },
    { key: "balance", label: "Year-end Balance" },
    { key: "withdrawals", label: "Withdrawals" },
    { key: "interestEarned", label: "Interest Earned" },
    { key: "cumulativeInterest", label: "Cumulative Interest" },
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
          CPF OA Balance Over Time (Table)
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="var(--on-surface-sub)" strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}>
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
                    <th key={col.key}
                      className="px-6 py-3 text-left text-[0.6875rem] font-semibold tracking-widest uppercase whitespace-nowrap"
                      style={{ color: "var(--on-surface-sub)" }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.year} style={{
                    backgroundColor: i % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)",
                  }}>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{row.year}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: "var(--on-surface)" }}>{row.age}</td>
                    <td className="px-6 py-3.5 text-sm font-medium whitespace-nowrap" style={{ color: "var(--on-surface)" }}>{fmt(Math.max(row.balance, 0))}</td>
                    <td className="px-6 py-3.5 text-sm whitespace-nowrap" style={{ color: "var(--on-surface)" }}>−{fmt(row.withdrawals)}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold whitespace-nowrap" style={{ color: "var(--primary)" }}>+{fmt(row.interestEarned)}</td>
                    <td className="px-6 py-3.5 text-sm font-medium whitespace-nowrap" style={{ color: "var(--on-surface)" }}>{fmt(row.cumulativeInterest)}</td>
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
export default function CpfOaAnnuityCalculatorPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const router = useRouter();
  const { profiles, updateProfile } = useCpfOaProfiles();

  const profile = profiles.find((p) => p.id === profileId);

  useEffect(() => {
    // Profiles are read synchronously from localStorage on the client, so a
    // missing profile here means the id is stale (even when no profiles remain).
    if (!profile) {
      router.replace("/tools/cpf-oa-annuity-calculator");
    }
  }, [profile, router]);

  const balanceAt55    = profile?.balanceAt55 ?? 0;
  const birthYear      = profile?.birthYear ?? 0;
  const endDrawdownAge = profile?.endDrawdownAge ?? 0;

  const { rows, monthlyDrawdown, error } = useMemo(() => {
    const params: CpfOaParams = { balanceAt55, birthYear, endDrawdownAge };
    const err = validate(params);
    if (err) return { rows: [] as YearRow[], monthlyDrawdown: 0, error: err };
    const w = solveMonthlyDrawdown(params);
    return { rows: simulate(params, w), monthlyDrawdown: w, error: null };
  }, [balanceAt55, birthYear, endDrawdownAge]);

  if (!profile) return null;

  const { name } = profile;
  const currentYear = new Date().getFullYear();

  const set = (changes: Partial<CpfOaParams>) => updateProfile(profileId, changes);

  const drawdownYears = endDrawdownAge - START_AGE;
  const startYear = birthYear + START_AGE + 1;
  const endYear = birthYear + endDrawdownAge;
  const totalWithdrawn = rows.reduce((s, r) => s + r.withdrawals, 0);
  const totalInterest = rows.at(-1)?.cumulativeInterest ?? 0;

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
              href="/tools/cpf-oa-annuity-calculator"
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
              style={{ color: "var(--on-surface-sub)", textDecoration: "none" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              All Scenarios
            </Link>

            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: "linear-gradient(45deg, var(--primary-fill), var(--primary-fill-container))",
                  boxShadow: "0 8px 24px rgba(0,53,31,0.2)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
              </div>

              <div>
                <ProfileNameEditor
                  name={name}
                  onSave={(newName) => updateProfile(profileId, { name: newName })}
                />
                <h1
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                >
                  CPF Ordinary Account (OA) Annuity Calculator
                </h1>
                <p
                  className="mt-2 text-base max-w-xl"
                  style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}
                >
                  See the constant monthly payout your OA balance at 55 can fund until your chosen age.
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
                Enter your CPF OA details
              </p>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FocusInput
                    label="OA Balance at 55 (S$)"
                    value={balanceAt55}
                    onChange={(v) => set({ balanceAt55: v })}
                    min={0}
                    step={1000}
                  />
                  <FocusInput
                    label="Birth Year"
                    value={birthYear}
                    onChange={(v) => set({ birthYear: Math.round(v) })}
                    min={1930}
                    max={currentYear}
                    step={1}
                  />
                </div>

                <FocusInput
                  label="Age to End Drawdown (Dec)"
                  value={endDrawdownAge}
                  onChange={(v) => set({ endDrawdownAge: Math.round(v) })}
                  min={START_AGE + 1}
                  max={120}
                  step={1}
                />
              </div>

              {error ? (
                <p className="text-[0.75rem] mt-5 font-medium" style={{ color: "var(--tertiary)" }}>
                  {error}
                </p>
              ) : (
                <p className="text-[0.75rem] mt-5" style={{ color: "var(--on-surface-sub)" }}>
                  Balance at 55 is taken as at Dec {birthYear + START_AGE}. Drawdown runs from
                  Jan {startYear} (age {START_AGE + 1}) to Dec {endYear} (age {endDrawdownAge}).
                </p>
              )}
            </div>

            {/* Right — Stat Cards */}
            {!error && (
              <div className="lg:col-span-7 space-y-4">
                <StatCard
                  label="Monthly Drawdown"
                  sublabel={`Jan ${startYear} – Dec ${endYear}`}
                  value={fmt(monthlyDrawdown)}
                  caption={`Constant payout for ${drawdownYears} year${drawdownYears === 1 ? "" : "s"} (${drawdownYears * 12} months), ending at S$0`}
                  gradient
                />

                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    label="Total Withdrawn"
                    sublabel={`Age ${START_AGE + 1} – ${endDrawdownAge}`}
                    value={fmt(totalWithdrawn)}
                  />
                  <StatCard
                    label="Total Interest Earned"
                    sublabel="During drawdown"
                    value={fmt(totalInterest)}
                    caption={balanceAt55 > 0
                      ? `${((totalInterest / balanceAt55) * 100).toFixed(1)}% on balance at 55`
                      : undefined}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Chart ─────────────────────────────────────────────────────── */}
          {rows.length > 0 && (
            <OaChart rows={rows} balanceAt55={balanceAt55} birthYear={birthYear} />
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
                  heading: "Interest Rate",
                  body: (
                    <>
                      A flat <strong>2.5% p.a.</strong> on the entire OA balance.
                    </>
                  ),
                },
                {
                  heading: "Interest Calculation",
                  body: "Computed monthly on the lowest balance of the month. Withdrawals leave at the start of the month, so the withdrawn amount earns no interest that month.",
                },
                {
                  heading: "Interest Crediting",
                  body: (
                    <>
                      Monthly interest accumulates through the year and is credited only at the{" "}
                      <strong>end of December</strong>. Credited interest then compounds in subsequent years.
                    </>
                  ),
                },
                {
                  heading: "Drawdown Period",
                  body: "Your OA balance at 55 is taken as at December of the year you turn 55. Drawdown runs from January of the following year to December of the year you reach your chosen end age, giving (end age − 55) years.",
                },
                {
                  heading: "Monthly Payout",
                  body: "A constant monthly amount is withdrawn throughout the drawdown period. It is solved exactly so that the balance reaches S$0 after the final December interest credit.",
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
                borderTop: "1px solid var(--divider)",
                lineHeight: "1.6",
              }}
            >
              <span className="font-semibold">Disclaimer:</span> This calculator models a simplified CPF OA
              at a constant 2.5% p.a. Results are illustrative only. It does not model extra interest on the
              first S$60,000 of combined balances, the OA-to-RA transfer at age 55, CPF LIFE payouts,
              housing or investment withdrawals, or actual CPF withdrawal rules. This tool does not
              constitute financial advice.
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
