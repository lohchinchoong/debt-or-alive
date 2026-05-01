"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { useCpfMaProfiles, CpfMaParams } from "@/hooks/useCpfMaProfiles";

// ─── Constants ────────────────────────────────────────────────────────────────
const BHS = 79_000; // Basic Healthcare Sum 2026

// ─── Types ────────────────────────────────────────────────────────────────────
type YearRow = {
  year:               number;
  balance:            number;
  totalContributions: number;
  interestEarned:     number;
  accruedInterest:    number;
  overflowToSA:       number; // cumulative overflow redirected to SA/RA
  premiumsPaid:       number; // cumulative MediShield Life premiums deducted
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── MA Tiered Monthly Interest ───────────────────────────────────────────────
// MA earns 4% base rate + CPF extra interest: effectively same tiers as SA
// (5%/4% below 55; 6%/5%/4% at 55+) when modelled as standalone account.
function cpfMaMonthlyInterest(balance: number, age: number): number {
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
  initialBalance:          number,
  monthlyContrib:          number,
  startYear:               number,
  endContribYear:          number,
  birthYear:               number,
  annualMedishieldPremium: number
): YearRow[] {
  const endProjectionYear = birthYear + 65;
  if (endProjectionYear < startYear) return [];

  const rows: YearRow[] = [];
  let balance             = initialBalance;
  let totalContributions  = initialBalance; // actual funds deposited into MA
  let cumulativeInterest  = 0;
  let cumulativeOverflow  = 0;
  let cumulativePremiums  = 0;

  for (let year = startYear; year <= endProjectionYear; year++) {
    const age = year - birthYear;
    let interestBuffer = 0;
    const monthlyPremium = annualMedishieldPremium / 12;

    for (let month = 1; month <= 12; month++) {
      // Interest on beginning-of-month balance (before this month's contribution)
      interestBuffer += cpfMaMonthlyInterest(balance, age);

      // Contributions: only enter MA if balance is below BHS
      if (year <= endContribYear) {
        if (balance < BHS) {
          const contrib   = Math.min(monthlyContrib, BHS - balance);
          const overflow  = monthlyContrib - contrib;
          balance              += contrib;
          totalContributions   += contrib;
          cumulativeOverflow   += overflow;
        } else {
          cumulativeOverflow += monthlyContrib;
        }
      }

      // Deduct MediShield Life premium
      if (monthlyPremium > 0) {
        const deducted      = Math.min(monthlyPremium, balance);
        balance            -= deducted;
        cumulativePremiums += deducted;
      }

      // Interest credited annually at end of December (not capped — interest
      // can temporarily take balance above BHS; contributions check next month)
      if (month === 12) {
        balance            += interestBuffer;
        cumulativeInterest += interestBuffer;

        rows.push({
          year,
          balance,
          totalContributions,
          interestEarned:  interestBuffer,
          accruedInterest: cumulativeInterest,
          overflowToSA:    cumulativeOverflow,
          premiumsPaid:    cumulativePremiums,
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
  label:     string;
  value:     number;
  onChange:  (v: number) => void;
  min?:      number;
  max?:      number;
  step?:     number;
  hint?:     string;
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

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  sublabel,
  value,
  caption,
  gradient,
  highlight,
}: {
  label:      string;
  sublabel?:  string;
  value:      string;
  caption?:   string;
  gradient?:  boolean;
  highlight?: boolean; // teal accent for the BHS milestone
}) {
  const bgStyle = gradient
    ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)"
    : highlight
    ? "linear-gradient(135deg, #0d6b4a 0%, #1a9467 100%)"
    : "var(--surface-container-lowest)";

  return (
    <div
      className="rounded-xl p-5 flex flex-col justify-between"
      style={{
        background: bgStyle,
        boxShadow: (gradient || highlight)
          ? "0 12px 32px rgba(0,53,31,0.20)"
          : "var(--shadow-botanical)",
        minHeight: "7.5rem",
      }}
    >
      <div>
        <p
          className="text-[0.6875rem] font-semibold tracking-widest uppercase"
          style={{ color: (gradient || highlight) ? "rgba(255,255,255,0.65)" : "var(--primary)" }}
        >
          {label}
        </p>
        {sublabel && (
          <p
            className="text-[0.75rem] mt-0.5"
            style={{ color: (gradient || highlight) ? "rgba(255,255,255,0.50)" : "var(--on-surface-sub)" }}
          >
            {sublabel}
          </p>
        )}
      </div>
      <div>
        <p
          className="text-2xl sm:text-3xl font-bold leading-none mt-3"
          style={{
            color: (gradient || highlight) ? "#fff" : "var(--on-surface)",
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </p>
        {caption && (
          <p
            className="text-xs mt-1.5"
            style={{ color: (gradient || highlight) ? "rgba(255,255,255,0.55)" : "var(--on-surface-sub)" }}
          >
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── MA Chart ─────────────────────────────────────────────────────────────────
function MaChart({
  rows,
  startYear,
  endContribYear,
}: {
  rows:           YearRow[];
  startYear:      number;
  endContribYear: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (rows.length < 2) return null;

  const W   = 700;
  const H   = 260;
  const PAD = { top: 24, right: 20, bottom: 44, left: 60 };
  const CW  = W - PAD.left - PAD.right;
  const CH  = H - PAD.top - PAD.bottom;

  const years   = rows.map((r) => r.year);
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const span    = maxYear - minYear;

  const rawMax  = Math.max(...rows.map((r) => r.balance), BHS * 1.05);
  const yMax    = niceMax(rawMax);

  const xOf = (yr: number) => PAD.left + ((yr - minYear) / span) * CW;
  const yOf = (v: number)  => PAD.top + CH - (v / yMax) * CH;

  const balancePts   = rows.map((r) => `${xOf(r.year).toFixed(1)},${yOf(r.balance).toFixed(1)}`);
  const balanceLine  = `M ${balancePts.join(" L ")}`;
  const balanceArea  = `${balanceLine} L ${xOf(maxYear).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  const principalPts  = rows.map((r) => `${xOf(r.year).toFixed(1)},${yOf(r.totalContributions).toFixed(1)}`);
  const principalLine = `M ${principalPts.join(" L ")}`;

  const ticks     = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);
  const xStep     = span <= 15 ? 2 : 5;
  const firstLabel = Math.ceil(minYear / xStep) * xStep;
  const xLabels: number[] = [];
  for (let y = firstLabel; y <= maxYear; y += xStep) xLabels.push(y);

  const cutoffX = xOf(endContribYear);
  const bhsY    = yOf(BHS);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect     = e.currentTarget.getBoundingClientRect();
    const svgX     = ((e.clientX - rect.left) / rect.width) * W;
    const fraction = Math.max(0, Math.min(1, (svgX - PAD.left) / CW));
    setHoveredIdx(Math.round(fraction * (rows.length - 1)));
  };

  const hd       = hoveredIdx !== null ? rows[hoveredIdx] : null;
  const hx       = hd ? xOf(hd.year) : 0;
  const TW       = 192;
  const TH       = 62;
  const tooltipX = hd ? (hx < PAD.left + CW / 2 ? hx + 10 : hx - TW - 10) : 0;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[0.9375rem] font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
        CPF MA ({startYear} – {maxYear})
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        aria-label="CPF MA balance projection chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="ma-fill" x1="0" y1="0" x2="0" y2="1">
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

        {/* BHS reference line */}
        {BHS <= yMax && (
          <g>
            <line x1={PAD.left} y1={bhsY} x2={W - PAD.right} y2={bhsY}
              stroke="#c85a00" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" />
            <text x={W - PAD.right - 4} y={bhsY - 4} textAnchor="end"
              fontSize="9" fill="#c85a00" fontFamily="Manrope, sans-serif" opacity="0.9">
              BHS S$79K
            </text>
          </g>
        )}

        {/* Contributions end line */}
        <line x1={cutoffX} y1={PAD.top} x2={cutoffX} y2={PAD.top + CH}
          stroke="#c0c9c0" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
        <text x={cutoffX + 4} y={PAD.top + 12} fontSize="9" fill="#3d4a41"
          fontFamily="Manrope, sans-serif" opacity="0.8">
          Contributions end
        </text>

        <path d={balanceArea} fill="url(#ma-fill)" />
        <path d={principalLine} fill="none" stroke="#c0c9c0" strokeWidth="1.5" strokeDasharray="5 4" />
        <path d={balanceLine} fill="none" stroke="#00351f" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        <g transform={`translate(${PAD.left}, 10)`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke="#00351f" strokeWidth="2" />
          <text x="23" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">MA Balance</text>
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
function YearlyTable({ rows, showOverflow, showPremiums }: { rows: YearRow[]; showOverflow: boolean; showPremiums: boolean }) {
  const [open, setOpen] = useState(false);

  const COLS = [
    { key: "year",               label: "Year" },
    { key: "balance",            label: "MA Balance" },
    { key: "totalContributions", label: "Total Contributions" },
    { key: "interestEarned",     label: "Interest Earned" },
    { key: "accruedInterest",    label: "Accrued Interest" },
    ...(showOverflow  ? [{ key: "overflowToSA", label: "Overflow to SA/RA" }] : []),
    ...(showPremiums  ? [{ key: "premiumsPaid", label: "Premiums Paid" }]     : []),
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
          CPF MA Growth Over Time (Table)
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
                    <td className="px-6 py-3.5 text-sm font-medium" style={{
                      color: row.balance >= BHS ? "#c85a00" : "var(--on-surface)",
                      fontWeight: row.balance >= BHS ? 700 : 500,
                    }}>
                      {fmt(row.balance)}
                      {row.balance >= BHS && <span className="ml-1 text-[0.65rem] font-semibold opacity-70">BHS</span>}
                    </td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: "var(--on-surface)" }}>{fmt(row.totalContributions)}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "var(--primary)" }}>+{fmt(row.interestEarned)}</td>
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: "var(--on-surface)" }}>{fmt(row.accruedInterest)}</td>
                    {showOverflow && (
                      <td className="px-6 py-3.5 text-sm" style={{ color: row.overflowToSA > 0 ? "#c85a00" : "var(--on-surface-sub)" }}>
                        {row.overflowToSA > 0 ? fmt(row.overflowToSA) : "—"}
                      </td>
                    )}
                    {showPremiums && (
                      <td className="px-6 py-3.5 text-sm" style={{ color: "var(--on-surface-sub)" }}>
                        {fmt(row.premiumsPaid)}
                      </td>
                    )}
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
export default function CpfMaCalculatorPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const router        = useRouter();
  const { profiles, updateProfile } = useCpfMaProfiles();

  const profile = profiles.find((p) => p.id === profileId);

  useEffect(() => {
    if (profiles.length > 0 && !profile) {
      router.replace("/tools/cpf-ma-calculator");
    }
  }, [profile, profiles.length, router]);

  if (!profile) return null;

  const {
    currentBalance,
    monthlyContrib,
    startYear,
    endContribYear,
    birthYear,
    annualMedishieldPremium,
    name,
  } = profile;

  const currentYear = new Date().getFullYear();
  const set = (changes: Partial<CpfMaParams>) => updateProfile(profileId, changes);

  const rows = useMemo(
    () => simulate(currentBalance, monthlyContrib, startYear, endContribYear, birthYear, annualMedishieldPremium),
    [currentBalance, monthlyContrib, startYear, endContribYear, birthYear, annualMedishieldPremium]
  );

  // Key milestone rows
  const endContribRow = rows.find((r) => r.year === endContribYear);
  const age55Year     = birthYear + 55;
  const age65Year     = birthYear + 65;
  const age55Row      = rows.find((r) => r.year === age55Year);
  const age65Row      = rows.find((r) => r.year === age65Year);

  // First year balance >= BHS
  const bhsRow        = rows.find((r) => r.balance >= BHS);
  const bhsAge        = bhsRow ? bhsRow.year - birthYear : null;

  const hasOverflow   = rows.some((r) => r.overflowToSA > 0);
  const hasPremiums   = annualMedishieldPremium > 0;
  const finalOverflow = rows.length > 0 ? rows[rows.length - 1].overflowToSA : 0;

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
              href="/tools/cpf-ma-calculator"
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
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  <path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h3.28"/>
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
                  CPF Medisave Account (MA) Calculator
                </h1>
                <p
                  className="mt-2 text-base max-w-xl"
                  style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}
                >
                  Project your MA balance with tiered interest rates, the S$79,000 BHS ceiling, and MediShield Life premiums.
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
                Enter your CPF MA details
              </p>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FocusInput
                    label="Current MA Balance (S$)"
                    value={currentBalance}
                    onChange={(v) => set({ currentBalance: v })}
                    min={0}
                    max={BHS}
                    step={1000}
                  />
                  <FocusInput
                    label="Monthly Contribution (S$)"
                    value={monthlyContrib}
                    onChange={(v) => set({ monthlyContrib: v })}
                    min={0}
                    step={50}
                    hint="MA portion of your CPF contribution"
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

                <FocusInput
                  label="Annual MediShield Life Premium (S$)"
                  value={annualMedishieldPremium}
                  onChange={(v) => set({ annualMedishieldPremium: v })}
                  min={0}
                  step={100}
                  hint="Optional — enter 0 to project without premium deductions"
                />
              </div>

              {/* BHS badge */}
              <div
                className="mt-6 px-4 py-3 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: "var(--surface-container-low)", border: "1px solid rgba(200,90,0,0.2)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c85a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-xs" style={{ color: "var(--on-surface-sub)", lineHeight: "1.5" }}>
                  <span className="font-semibold" style={{ color: "#c85a00" }}>Basic Healthcare Sum (BHS) 2026:</span>{" "}
                  S$79,000. Contributions exceeding this ceiling are redirected to your SA (or RA if 55+).
                </p>
              </div>

              {projNote && (
                <p className="text-[0.75rem] mt-4" style={{ color: "var(--on-surface-sub)" }}>
                  {projNote}
                </p>
              )}
            </div>

            {/* Right — Stat Cards */}
            <div className="lg:col-span-7 space-y-4">

              {/* BHS milestone — most MA-specific insight */}
              {bhsRow ? (
                <StatCard
                  label="BHS Reached"
                  sublabel={`S$79,000 ceiling hit`}
                  value={`${bhsRow.year}`}
                  caption={`At age ${bhsAge} · contributions redirect to SA/RA from this point`}
                  highlight
                />
              ) : (
                <StatCard
                  label="BHS Status"
                  sublabel="Basic Healthcare Sum"
                  value="Not reached"
                  caption="MA balance stays below S$79,000 throughout projection"
                />
              )}

              {endContribRow && (
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    label={`By end of ${endContribYear}`}
                    sublabel="MA Balance"
                    value={fmt(endContribRow.balance)}
                    gradient
                  />
                  <StatCard
                    label={`By end of ${endContribYear}`}
                    sublabel="Total Interest"
                    value={fmt(endContribRow.accruedInterest)}
                    caption={
                      endContribRow.totalContributions > 0
                        ? `${((endContribRow.accruedInterest / endContribRow.totalContributions) * 100).toFixed(1)}% return on contributions`
                        : undefined
                    }
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

              {(hasOverflow || hasPremiums) && (
                <div className={`grid gap-4 ${hasOverflow && hasPremiums ? "grid-cols-2" : "grid-cols-1"}`}>
                  {hasOverflow && (
                    <StatCard
                      label="Total Redirected to SA/RA"
                      sublabel="Overflow from BHS cap"
                      value={fmt(finalOverflow)}
                      caption="Contributions that could not enter MA"
                    />
                  )}
                  {hasPremiums && rows.length > 0 && (
                    <StatCard
                      label="Total Premiums Deducted"
                      sublabel="MediShield Life"
                      value={fmt(rows[rows.length - 1].premiumsPaid)}
                      caption={`Over ${rows[rows.length - 1].year - startYear + 1} years`}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Chart ─────────────────────────────────────────────────────── */}
          {rows.length > 1 && (
            <MaChart rows={rows} startYear={startYear} endContribYear={endContribYear} />
          )}

          {/* ── Yearly Table ──────────────────────────────────────────────── */}
          {rows.length > 0 && (
            <YearlyTable rows={rows} showOverflow={hasOverflow} showPremiums={hasPremiums} />
          )}

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
                      MA earns a <strong>4% p.a. base rate</strong>, plus an extra <strong>1% p.a.</strong> on the first S$60,000 of your combined CPF balances — giving an effective rate of <strong>5% p.a.</strong> on the first S$60,000 and <strong>4% p.a.</strong> on the remainder (modelled here as the MA balance alone).
                    </>
                  ),
                },
                {
                  heading: "Interest Rate (55 and Above)",
                  body: (
                    <>
                      From age 55, an extra <strong>2% p.a.</strong> applies on the first S$30,000 and an extra <strong>1% p.a.</strong> on the next S$30,000 of combined CPF balances — giving effective rates of <strong>6%</strong>, <strong>5%</strong>, and <strong>4% p.a.</strong> across three tiers.
                    </>
                  ),
                },
                {
                  heading: "Basic Healthcare Sum (BHS)",
                  body: (
                    <>
                      Once your MA balance reaches the BHS (<strong>S$79,000 for 2026</strong>), any further CPF contributions that would otherwise flow into MA are redirected to your SA (before age 55) or RA (at age 55+). Interest credited in December is not subject to the cap, so your balance can momentarily exceed BHS.
                    </>
                  ),
                },
                {
                  heading: "Interest Calculation",
                  body: "Computed monthly based on the lowest balance of the month — the opening balance before that month's contribution arrives. New contributions only begin earning interest the following month.",
                },
                {
                  heading: "Interest Crediting",
                  body: (
                    <>
                      Monthly interest accrues in a buffer throughout the year and is credited to your principal at the <strong>end of December</strong>. Credited interest compounds in subsequent years, driving significant long-term growth.
                    </>
                  ),
                },
                {
                  heading: "MediShield Life Premiums",
                  body: "If entered, annual premiums are deducted in equal monthly instalments directly from your MA balance. Premiums increase with age; check the CPF Board's published premium tables for your exact amount.",
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
              <span className="font-semibold">Disclaimer:</span> This calculator models CPF MA interest
              based on publicly available CPF Board rules as of 2026. The BHS of S$79,000 applies for 2026
              and is reviewed annually by the CPF Board. Results are illustrative only — actual figures may
              differ due to changes in BHS, interest rate policy, MediShield Life premium schedules, or
              your individual CPF account composition. This tool does not constitute financial or medical advice.
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
