"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { useCpfProfiles, CpfParams } from "@/hooks/useCpfProfiles";

// ─── Types ────────────────────────────────────────────────────────────────────
type YearRow = {
  year: number;
  balance: number;
  totalContributions: number;
  interestEarned: number;
  accruedInterest: number;
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
    const age = year - birthYear;
    let interestBuffer = 0;

    for (let month = 1; month <= 12; month++) {
      interestBuffer += cpfMonthlyInterest(balance, age);

      if (year <= endContribYear) {
        balance += monthlyContrib;
        totalContributions += monthlyContrib;
      }

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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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

  const balancePts = rows.map((r) => `${xOf(r.year).toFixed(1)},${yOf(r.balance).toFixed(1)}`);
  const balanceLine = `M ${balancePts.join(" L ")}`;
  const balanceArea = `${balanceLine} L ${xOf(maxYear).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  const principalPts = rows.map((r) => `${xOf(r.year).toFixed(1)},${yOf(r.totalContributions).toFixed(1)}`);
  const principalLine = `M ${principalPts.join(" L ")}`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  const xStep = span <= 15 ? 2 : 5;
  const firstLabel = Math.ceil(minYear / xStep) * xStep;
  const xLabels: number[] = [];
  for (let y = firstLabel; y <= maxYear; y += xStep) xLabels.push(y);

  const cutoffX = xOf(endContribYear);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const fraction = Math.max(0, Math.min(1, (svgX - PAD.left) / CW));
    setHoveredIdx(Math.round(fraction * (rows.length - 1)));
  };

  const hd = hoveredIdx !== null ? rows[hoveredIdx] : null;
  const hx = hd ? xOf(hd.year) : 0;
  const TW = 192;
  const TH = 62;
  const tooltipX = hd ? (hx < PAD.left + CW / 2 ? hx + 10 : hx - TW - 10) : 0;

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
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        aria-label="CPF SA balance projection chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="cpf-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00351f" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00351f" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((v) => (
          <line key={v} x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)}
            stroke="#c0c9c0" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.7" />
        ))}

        {ticks.map((v) => (
          <text key={v} x={PAD.left - 6} y={yOf(v) + 4} textAnchor="end"
            fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            {fmtAxis(v)}
          </text>
        ))}

        {xLabels.map((yr) => (
          <text key={yr} x={xOf(yr)} y={H - 6} textAnchor="middle"
            fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            {yr}
          </text>
        ))}

        <line x1={cutoffX} y1={PAD.top} x2={cutoffX} y2={PAD.top + CH}
          stroke="#c0c9c0" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
        <text x={cutoffX + 4} y={PAD.top + 12} fontSize="9" fill="#3d4a41"
          fontFamily="Manrope, sans-serif" opacity="0.8">
          Contributions end
        </text>

        <path d={balanceArea} fill="url(#cpf-fill)" />
        <path d={principalLine} fill="none" stroke="#c0c9c0" strokeWidth="1.5" strokeDasharray="5 4" />
        <path d={balanceLine} fill="none" stroke="#00351f" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        <g transform={`translate(${PAD.left}, 10)`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke="#00351f" strokeWidth="2" />
          <text x="23" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">SA Balance</text>
          <line x1="130" y1="0" x2="148" y2="0" stroke="#c0c9c0" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="153" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">Total Contributions</text>
        </g>

        {hd && (
          <g pointerEvents="none">
            <line x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + CH}
              stroke="#3d4a41" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle cx={hx} cy={yOf(hd.totalContributions)} r="3.5" fill="#c0c9c0" stroke="white" strokeWidth="1.5" />
            <circle cx={hx} cy={yOf(hd.balance)} r="4" fill="#00351f" stroke="white" strokeWidth="1.5" />
            <rect x={tooltipX} y={PAD.top + 4} width={TW} height={TH} rx="5"
              fill="white" stroke="#c0c9c0" strokeWidth="0.75" />
            <text x={tooltipX + 10} y={PAD.top + 20} fontSize="10" fontWeight="700"
              fill="#00351f" fontFamily="Manrope, sans-serif">{`${hd.year}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 36} fontSize="10" fill="#3d4a41"
              fontFamily="Manrope, sans-serif">{`Balance: $${fmtAxis(hd.balance)}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 51} fontSize="10" fill="#3d4a41"
              fontFamily="Manrope, sans-serif">{`Contributions: $${fmtAxis(hd.totalContributions)}`}</text>
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
                      className="px-6 py-3 text-left text-[0.6875rem] font-semibold tracking-widest uppercase"
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
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: "var(--on-surface)" }}>{fmt(row.balance)}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: "var(--on-surface)" }}>{fmt(row.totalContributions)}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "var(--primary)" }}>+{fmt(row.interestEarned)}</td>
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: "var(--on-surface)" }}>{fmt(row.accruedInterest)}</td>
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
export default function CpfSaCalculatorPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const router = useRouter();
  const { profiles, updateProfile } = useCpfProfiles();

  const profile = profiles.find((p) => p.id === profileId);

  useEffect(() => {
    if (profiles.length > 0 && !profile) {
      router.replace("/tools/cpf-sa-calculator");
    }
  }, [profile, profiles.length, router]);

  if (!profile) return null;

  const { currentBalance, monthlyContrib, startYear, endContribYear, birthYear, name } = profile;
  const currentYear = new Date().getFullYear();

  const set = (changes: Partial<CpfParams>) => updateProfile(profileId, changes);

  const rows = useMemo(
    () => simulate(currentBalance, monthlyContrib, startYear, endContribYear, birthYear),
    [currentBalance, monthlyContrib, startYear, endContribYear, birthYear]
  );

  const endContribRow = rows.find((r) => r.year === endContribYear);
  const age55Year = birthYear + 55;
  const age65Year = birthYear + 65;
  const age55Row = rows.find((r) => r.year === age55Year);
  const age65Row = rows.find((r) => r.year === age65Year);

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
              href="/tools/cpf-sa-calculator"
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
                  background: "linear-gradient(45deg, var(--primary), var(--primary-container))",
                  boxShadow: "0 8px 24px rgba(0,53,31,0.2)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 5c-1.5 0-2.5 1-2.5 1H5a3 3 0 0 0 0 6h.5v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1h2v1a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3.5c1.1-.4 2-1.4 2-2.5V8c0-1.7-1.3-3-3-3z" />
                  <path d="M12 5V3" />
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
                    onChange={(v) => set({ currentBalance: v })}
                    min={0}
                    step={1000}
                  />
                  <FocusInput
                    label="Monthly Contribution (S$)"
                    value={monthlyContrib}
                    onChange={(v) => set({ monthlyContrib: v })}
                    min={0}
                    step={100}
                  />
                </div>

                <FocusInput
                  label="Starting Year (Jan)"
                  value={startYear}
                  onChange={(v) => set({ startYear: Math.round(v) })}
                  min={2000}
                  max={2100}
                  step={1}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FocusInput
                    label="Year to End Contribution (Dec)"
                    value={endContribYear}
                    onChange={(v) => set({ endContribYear: Math.round(v) })}
                    min={startYear}
                    max={2100}
                    step={1}
                  />
                  <FocusInput
                    label="Birth Year"
                    value={birthYear}
                    onChange={(v) => set({ birthYear: Math.round(v) })}
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
