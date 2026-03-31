"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useToolState } from "@/hooks/useToolState";

// ─── Types ────────────────────────────────────────────────────────────────────

type YieldSource = {
  id: string;
  name: string;
  value: number;
  yieldRate: number; // annual %
  startAge: number;  // age at which yield income begins (compounds before this)
};

type DrawdownSource = {
  id: string;
  name: string;
  value: number;
  startAge: number;
  endAge: number;
};

type YearRow = {
  age: number;
  year: number;
  phase: "accumulation" | "retirement";
  yieldPortfolio: number;
  drawdownPortfolio: number;
  totalPortfolio: number;
  yieldIncome: number;
  drawdownWithdrawal: number;
  totalIncome: number;
  annualExpense: number;
  surplus: number;
};

type FireTier = {
  label: string;
  color: string;
  bgColor: string;
  description: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FIRE_TIERS: { min: number; tier: FireTier }[] = [
  {
    min: 200,
    tier: {
      label: "Fat FIRE",
      color: "#00351f",
      bgColor: "rgba(0,53,31,0.12)",
      description: "Double your target — retire in luxury with a wide margin of safety.",
    },
  },
  {
    min: 150,
    tier: {
      label: "Comfortable FIRE",
      color: "#0e4d31",
      bgColor: "rgba(14,77,49,0.10)",
      description: "Substantial surplus above your needs — you can weather market downturns with ease.",
    },
  },
  {
    min: 100,
    tier: {
      label: "FIRE Achieved",
      color: "#1a6b42",
      bgColor: "rgba(26,107,66,0.10)",
      description: "Your passive income covers your retirement expenses. Financial independence unlocked.",
    },
  },
  {
    min: 80,
    tier: {
      label: "Almost There",
      color: "#b8860b",
      bgColor: "rgba(184,134,11,0.10)",
      description: "Within striking distance. A few more years of contributions or a spending trim closes the gap.",
    },
  },
  {
    min: 50,
    tier: {
      label: "Coast FIRE",
      color: "#cc7a00",
      bgColor: "rgba(204,122,0,0.10)",
      description: "Your existing assets can grow to your FIRE number by retirement — keep contributions steady.",
    },
  },
  {
    min: 25,
    tier: {
      label: "Building Momentum",
      color: "#c05621",
      bgColor: "rgba(192,86,33,0.10)",
      description: "Solid foundation in place. Focus on increasing savings rate and growing your yield sources.",
    },
  },
  {
    min: 0,
    tier: {
      label: "Early Days",
      color: "#4f1b1f",
      bgColor: "rgba(79,27,31,0.10)",
      description: "Everyone starts here. The most powerful step is the first one — keep building.",
    },
  },
];

function getFireTier(score: number): FireTier {
  for (const { min, tier } of FIRE_TIERS) {
    if (score >= min) return tier;
  }
  return FIRE_TIERS[FIRE_TIERS.length - 1].tier;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

let idCounter = 0;
function genId(): string {
  return `src_${Date.now()}_${++idCounter}`;
}

// ─── localStorage persistence for dynamic arrays ─────────────────────────────

function loadArray<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveArray<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage full — fail silently
  }
}

// ─── Calculation Engine ──────────────────────────────────────────────────────

function calculateFireProjection(
  currentAge: number,
  retirementAge: number,
  deathAge: number,
  monthlyExpense: number,
  yieldSources: YieldSource[],
  drawdownSources: DrawdownSource[],
): YearRow[] {
  const rows: YearRow[] = [];
  const annualExpense = monthlyExpense * 12;
  const currentYear = new Date().getFullYear();

  // Track each source individually
  let yieldValues = yieldSources.map((s) => s.value);
  let drawdownValues = drawdownSources.map((s) => s.value);

  for (let age = currentAge; age <= deathAge; age++) {
    const year = currentYear + (age - currentAge);
    const isRetired = age >= retirementAge;
    const phase = isRetired ? "retirement" as const : "accumulation" as const;

    const yieldPortfolio = yieldValues.reduce((a, b) => a + b, 0);
    const drawdownPortfolio = drawdownValues.reduce((a, b) => a + Math.max(0, b), 0);
    const totalPortfolio = yieldPortfolio + drawdownPortfolio;

    // Annual yield income — only from sources where age >= startAge
    const yieldIncome = yieldSources.reduce(
      (sum, s, i) => {
        if (age < s.startAge) return sum; // not yet active
        return sum + yieldValues[i] * (s.yieldRate / 100);
      },
      0,
    );

    let drawdownWithdrawal = 0;
    let totalIncome = 0;
    let surplus = 0;

    // Drawdown: each source is active between its own startAge and endAge
    drawdownWithdrawal = drawdownSources.reduce((sum, s, i) => {
      const span = s.endAge - s.startAge;
      if (span <= 0) return sum;
      const annual = s.value / span;
      if (age >= s.startAge && age < s.endAge) {
        return sum + Math.min(annual, Math.max(0, drawdownValues[i]));
      }
      return sum;
    }, 0);

    // Deplete each active drawdown source by its fixed annual slice
    drawdownValues = drawdownValues.map((v, i) => {
      const s = drawdownSources[i];
      const span = s.endAge - s.startAge;
      if (span <= 0 || age < s.startAge || age >= s.endAge) return v;
      return Math.max(0, v - s.value / span);
    });

    if (isRetired) {
      totalIncome = yieldIncome + drawdownWithdrawal;
      surplus = totalIncome - annualExpense;
    } else {
      drawdownWithdrawal = 0; // don't show drawdown in accumulation phase rows
      totalIncome = 0;
      surplus = 0;
    }

    rows.push({
      age,
      year,
      phase,
      yieldPortfolio,
      drawdownPortfolio,
      totalPortfolio,
      yieldIncome,
      drawdownWithdrawal,
      totalIncome,
      annualExpense: isRetired ? annualExpense : 0,
      surplus,
    });

    // Grow yield sources by their yield rate
    // - During accumulation: all sources compound (yield reinvested)
    // - During retirement: sources before startAge still compound; active sources stay flat (income withdrawn)
    yieldValues = yieldValues.map((v, i) => {
      const s = yieldSources[i];
      if (!isRetired || age < s.startAge) {
        return v * (1 + s.yieldRate / 100); // compound
      }
      return v; // flat — income being withdrawn
    });
    // Drawdown sources don't grow (not yield-bearing per user spec)
  }

  return rows;
}

// ─── FocusInput ──────────────────────────────────────────────────────────────

function FocusInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
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
    </div>
  );
}

// ─── Inline Text Input (for source rows) ─────────────────────────────────────

function InlineInput({
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  step,
  style: extraStyle,
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: number;
  step?: number;
  style?: React.CSSProperties;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      min={min}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        background: "var(--surface-container-highest)",
        border: "none",
        borderBottom: `2px solid ${focused ? "var(--primary)" : "var(--outline-variant)"}`,
        borderRadius: "0.25rem 0.25rem 0 0",
        padding: "0.5rem 0.4rem",
        fontSize: "0.8125rem",
        fontFamily: "Manrope, sans-serif",
        fontWeight: 500,
        color: "var(--on-surface)",
        outline: "none",
        transition: "border-color 0.15s ease",
        ...extraStyle,
      }}
    />
  );
}

// ─── FIRE Chart ──────────────────────────────────────────────────────────────

function FireChart({
  data,
  retirementAge,
  fireNumber,
}: {
  data: YearRow[];
  retirementAge: number;
  fireNumber: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (data.length < 2) return null;

  const W = 640;
  const H = 260;
  const PAD = { top: 28, right: 24, bottom: 44, left: 62 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const rawMax = Math.max(...data.map((d) => d.totalPortfolio), fireNumber);
  const yMax = niceMax(rawMax);
  const ageMin = data[0].age;
  const ageMax = data[data.length - 1].age;
  const ageRange = ageMax - ageMin || 1;

  const xOf = (age: number) => PAD.left + ((age - ageMin) / ageRange) * CW;
  const yOf = (v: number) => PAD.top + CH - (v / yMax) * CH;

  // Portfolio line
  const pts = data.map((d) => `${xOf(d.age).toFixed(1)},${yOf(d.totalPortfolio).toFixed(1)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${xOf(ageMax).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  // Yield-only line
  const yieldPts = data.map((d) => `${xOf(d.age).toFixed(1)},${yOf(d.yieldPortfolio).toFixed(1)}`);
  const yieldLine = `M ${yieldPts.join(" L ")}`;

  // Y ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  // X labels — clean multiples of step (equal visual spacing)
  const xStep = ageRange <= 15 ? 2 : ageRange <= 30 ? 5 : 10;
  const firstLabel = Math.ceil(ageMin / xStep) * xStep;
  const xLabels: number[] = [];
  for (let a = firstLabel; a <= ageMax; a += xStep) xLabels.push(a);

  // Retirement vertical line
  const retX = xOf(retirementAge);

  // Hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const fraction = Math.max(0, Math.min(1, (svgX - PAD.left) / CW));
    setHoveredIdx(Math.round(fraction * (data.length - 1)));
  };

  const hd = hoveredIdx !== null ? data[hoveredIdx] : null;
  const hx = hd ? xOf(hd.age) : 0;
  const TW = 178;
  const TH = 78;
  const tooltipX = hd ? (hx < PAD.left + CW / 2 ? hx + 10 : hx - TW - 10) : 0;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[0.9375rem] font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
        Portfolio Projection
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        aria-label="FIRE portfolio projection chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="fire-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00351f" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00351f" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ticks.map((v) => (
          <line key={v} x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)} stroke="#c0c9c0" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.7" />
        ))}

        {/* Y-axis labels */}
        {ticks.map((v) => (
          <text key={v} x={PAD.left - 6} y={yOf(v) + 4} textAnchor="end" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            {fmtAxis(v)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((a) => (
          <text key={a} x={xOf(a)} y={H - 6} textAnchor="middle" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            {a}
          </text>
        ))}

        {/* FIRE number horizontal line */}
        {fireNumber > 0 && fireNumber <= yMax && (
          <>
            <line x1={PAD.left} y1={yOf(fireNumber)} x2={W - PAD.right} y2={yOf(fireNumber)} stroke="#c05621" strokeWidth="1" strokeDasharray="6 3" opacity="0.6" />
            <text x={W - PAD.right + 4} y={yOf(fireNumber) + 3} fontSize="9" fill="#c05621" fontFamily="Manrope, sans-serif" fontWeight="600">
              FIRE
            </text>
          </>
        )}

        {/* Retirement vertical line */}
        {retirementAge > ageMin && retirementAge < ageMax && (
          <>
            <line x1={retX} y1={PAD.top} x2={retX} y2={PAD.top + CH} stroke="#b8860b" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
            <text x={retX} y={PAD.top - 6} textAnchor="middle" fontSize="9" fill="#b8860b" fontFamily="Manrope, sans-serif" fontWeight="600">
              Retire
            </text>
          </>
        )}

        {/* Area fill */}
        <path d={area} fill="url(#fire-fill)" />

        {/* Yield-only dashed line */}
        <path d={yieldLine} fill="none" stroke="#1a6b42" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6" />

        {/* Total portfolio line */}
        <path d={line} fill="none" stroke="#00351f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Legend */}
        <g transform={`translate(${PAD.left}, 12)`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke="#00351f" strokeWidth="2" />
          <text x="23" y="4" fontSize="9" fill="#3d4a41" fontFamily="Manrope, sans-serif">Total portfolio</text>
          <line x1="130" y1="0" x2="148" y2="0" stroke="#1a6b42" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="153" y="4" fontSize="9" fill="#3d4a41" fontFamily="Manrope, sans-serif">Yield sources only</text>
          <line x1="275" y1="0" x2="293" y2="0" stroke="#c05621" strokeWidth="1" strokeDasharray="6 3" />
          <text x="298" y="4" fontSize="9" fill="#3d4a41" fontFamily="Manrope, sans-serif">FIRE number</text>
        </g>

        {/* Hover crosshair + tooltip */}
        {hd && (
          <g pointerEvents="none">
            <line x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + CH} stroke="#3d4a41" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle cx={hx} cy={yOf(hd.yieldPortfolio)} r="3.5" fill="#1a6b42" stroke="white" strokeWidth="1.5" />
            <circle cx={hx} cy={yOf(hd.totalPortfolio)} r="4" fill="#00351f" stroke="white" strokeWidth="1.5" />
            <rect x={tooltipX} y={PAD.top + 4} width={TW} height={TH} rx="5" fill="white" stroke="#c0c9c0" strokeWidth="0.75" />
            <text x={tooltipX + 10} y={PAD.top + 20} fontSize="10" fontWeight="700" fill="#00351f" fontFamily="Manrope, sans-serif">{`Age ${hd.age} · ${hd.year}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 36} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">{`Total: $${fmtAxis(hd.totalPortfolio)}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 51} fontSize="10" fill="#1a6b42" fontFamily="Manrope, sans-serif">{`Yield: $${fmtAxis(hd.yieldPortfolio)}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 66} fontSize="10" fill="#b8860b" fontFamily="Manrope, sans-serif">{`Drawdown: $${fmtAxis(hd.drawdownPortfolio)}`}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Monthly Income Chart ────────────────────────────────────────────────────

function IncomeChart({
  data,
  retirementAge,
  monthlyExpense,
}: {
  data: YearRow[];
  retirementAge: number;
  monthlyExpense: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const retirementData = data.filter((r) => r.phase === "retirement");
  if (retirementData.length < 2) return null;

  const W = 640;
  const H = 240;
  const PAD = { top: 28, right: 24, bottom: 44, left: 62 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const maxIncome = Math.max(...retirementData.map((d) => d.totalIncome / 12), monthlyExpense);
  const yMax = niceMax(maxIncome);
  const ageMin = retirementData[0].age;
  const ageMax = retirementData[retirementData.length - 1].age;
  const ageRange = ageMax - ageMin || 1;

  const xOf = (age: number) => PAD.left + ((age - ageMin) / ageRange) * CW;
  const yOf = (v: number) => PAD.top + CH - (v / yMax) * CH;

  // Yield income area
  const yieldPts = retirementData.map((d) => `${xOf(d.age).toFixed(1)},${yOf(d.yieldIncome / 12).toFixed(1)}`);
  const yieldArea = `M ${yieldPts.join(" L ")} L ${xOf(ageMax).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  // Total income line (yield + drawdown)
  const totalPts = retirementData.map((d) => `${xOf(d.age).toFixed(1)},${yOf(d.totalIncome / 12).toFixed(1)}`);
  const totalLine = `M ${totalPts.join(" L ")}`;
  const totalArea = `${totalLine} L ${xOf(ageMax).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  // X labels — clean multiples of step (equal visual spacing)
  const xStep = ageRange <= 15 ? 2 : ageRange <= 30 ? 5 : 10;
  const firstLabel = Math.ceil(ageMin / xStep) * xStep;
  const xLabels: number[] = [];
  for (let a = firstLabel; a <= ageMax; a += xStep) xLabels.push(a);

  const expenseY = yOf(monthlyExpense);
  const expenseInRange = monthlyExpense <= yMax;

  // Hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const fraction = Math.max(0, Math.min(1, (svgX - PAD.left) / CW));
    setHoveredIdx(Math.round(fraction * (retirementData.length - 1)));
  };

  const hd = hoveredIdx !== null ? retirementData[hoveredIdx] : null;
  const hx = hd ? xOf(hd.age) : 0;
  const TW = 200;
  const TH = 94;
  const tooltipX = hd ? (hx < PAD.left + CW / 2 ? hx + 10 : hx - TW - 10) : 0;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[0.9375rem] font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
        Monthly Income Projection
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        aria-label="Monthly income projection chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="income-total-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a6b42" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1a6b42" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="income-yield-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00351f" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#00351f" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ticks.map((v) => (
          <line key={v} x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)} stroke="#c0c9c0" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.7" />
        ))}

        {/* Y-axis labels */}
        {ticks.map((v) => (
          <text key={v} x={PAD.left - 6} y={yOf(v) + 4} textAnchor="end" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            {fmtAxis(v)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((a) => (
          <text key={a} x={xOf(a)} y={H - 6} textAnchor="middle" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            {a}
          </text>
        ))}

        {/* Monthly expense line */}
        {expenseInRange && (
          <>
            <line x1={PAD.left} y1={expenseY} x2={W - PAD.right} y2={expenseY} stroke="#c05621" strokeWidth="1" strokeDasharray="6 3" opacity="0.6" />
            <text x={W - PAD.right + 4} y={expenseY + 3} fontSize="9" fill="#c05621" fontFamily="Manrope, sans-serif" fontWeight="600">
              Target
            </text>
          </>
        )}

        {/* Total income area (behind yield) */}
        <path d={totalArea} fill="url(#income-total-fill)" />

        {/* Yield-only area (on top) */}
        <path d={yieldArea} fill="url(#income-yield-fill)" />

        {/* Yield income line */}
        <path d={`M ${yieldPts.join(" L ")}`} fill="none" stroke="#00351f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Total income line */}
        <path d={totalLine} fill="none" stroke="#1a6b42" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />

        {/* Legend */}
        <g transform={`translate(${PAD.left}, 12)`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke="#00351f" strokeWidth="2" />
          <text x="23" y="4" fontSize="9" fill="#3d4a41" fontFamily="Manrope, sans-serif">Yield income</text>
          <line x1="130" y1="0" x2="148" y2="0" stroke="#1a6b42" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="153" y="4" fontSize="9" fill="#3d4a41" fontFamily="Manrope, sans-serif">Total income (incl. drawdown)</text>
          <line x1="355" y1="0" x2="373" y2="0" stroke="#c05621" strokeWidth="1" strokeDasharray="6 3" />
          <text x="378" y="4" fontSize="9" fill="#3d4a41" fontFamily="Manrope, sans-serif">Monthly expense</text>
        </g>

        {/* Hover crosshair + tooltip */}
        {hd && (
          <g pointerEvents="none">
            <line x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + CH} stroke="#3d4a41" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle cx={hx} cy={yOf(hd.yieldIncome / 12)} r="3.5" fill="#00351f" stroke="white" strokeWidth="1.5" />
            <circle cx={hx} cy={yOf(hd.totalIncome / 12)} r="4" fill="#1a6b42" stroke="white" strokeWidth="1.5" />
            <rect x={tooltipX} y={PAD.top + 4} width={TW} height={TH} rx="5" fill="white" stroke="#c0c9c0" strokeWidth="0.75" />
            <text x={tooltipX + 10} y={PAD.top + 20} fontSize="10" fontWeight="700" fill="#00351f" fontFamily="Manrope, sans-serif">{`Age ${hd.age}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 36} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">{`Total: $${fmtAxis(hd.totalIncome / 12)}/mth`}</text>
            <text x={tooltipX + 20} y={PAD.top + 51} fontSize="9" fill="#1a6b42" fontFamily="Manrope, sans-serif">{`Yield: $${fmtAxis(hd.yieldIncome / 12)}/mth`}</text>
            <text x={tooltipX + 20} y={PAD.top + 65} fontSize="9" fill="#b8860b" fontFamily="Manrope, sans-serif">{`Drawdown: $${fmtAxis(hd.drawdownWithdrawal / 12)}/mth`}</text>
            <text x={tooltipX + 10} y={PAD.top + 81} fontSize="9" fill="#c05621" fontFamily="Manrope, sans-serif">{`Target: $${fmtAxis(monthlyExpense)}/mth`}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Yearly Table ────────────────────────────────────────────────────────────

function FireTable({ data }: { data: YearRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-botanical)" }}>
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left"
        style={{ backgroundColor: "var(--surface-container-lowest)", border: "none", cursor: "pointer", fontFamily: "Manrope, sans-serif" }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>
          Year-by-Year Projection (Table)
        </span>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-sub)" strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      {open && (
        <div style={{ backgroundColor: "var(--surface-container-lowest)" }}>
          <div style={{ height: "1px", backgroundColor: "var(--outline-variant)", opacity: 0.25 }} />
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--surface-container-low)" }}>
                  {["Age", "Year", "Phase", "Yield Portfolio", "Drawdown Portfolio", "Total Portfolio", "Yield Income", "Drawdown", "Surplus/Deficit"].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row.age} style={{ backgroundColor: i % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)" }}>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{row.age}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--on-surface)" }}>{row.year}</td>
                    <td className="px-4 py-3 text-xs font-medium">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: row.phase === "retirement" ? "rgba(184,134,11,0.12)" : "rgba(0,53,31,0.08)",
                          color: row.phase === "retirement" ? "#b8860b" : "var(--primary)",
                          fontSize: "0.6875rem",
                        }}
                      >
                        {row.phase === "retirement" ? "Drawdown" : "Growth"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--on-surface)" }}>{fmt(row.yieldPortfolio)}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--on-surface)" }}>{fmt(row.drawdownPortfolio)}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{fmt(row.totalPortfolio)}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: row.yieldIncome > 0 ? "var(--primary)" : "var(--on-surface)" }}>
                      {row.phase === "retirement" ? fmt(row.yieldIncome) : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: row.drawdownWithdrawal > 0 ? "var(--tertiary)" : "var(--on-surface)" }}>
                      {row.phase === "retirement" && row.drawdownWithdrawal > 0 ? `-${fmt(row.drawdownWithdrawal)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: row.surplus >= 0 ? "var(--primary)" : "var(--tertiary)" }}>
                      {row.phase === "retirement" ? (row.surplus >= 0 ? `+${fmt(row.surplus)}` : fmt(row.surplus)) : "—"}
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

// ─── FIRE Score Badge ────────────────────────────────────────────────────────

function FireScoreBadge({ score }: { score: number }) {
  const tier = getFireTier(score);
  const clampedScore = Math.min(score, 250);
  const barWidth = Math.max(0, Math.min(100, (clampedScore / 200) * 100));

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[0.6875rem] font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--on-surface-sub)" }}>
        FIRE Score
      </p>

      {/* Score + label */}
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-3xl font-bold" style={{ color: tier.color, letterSpacing: "-0.02em" }}>
          {Math.round(score)}%
        </span>
        <span
          className="text-sm font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: tier.bgColor, color: tier.color }}
        >
          {tier.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="rounded-full h-2 mb-3" style={{ backgroundColor: "var(--surface-container-high)" }}>
        <div
          className="rounded-full h-2 transition-all duration-500"
          style={{ width: `${barWidth}%`, backgroundColor: tier.color }}
        />
      </div>

      {/* Tier markers */}
      <div className="flex justify-between text-[0.625rem] font-medium mb-4" style={{ color: "var(--on-surface-sub)" }}>
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
        <span>200%+</span>
      </div>

      <p className="text-sm" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
        {tier.description}
      </p>
    </div>
  );
}

// ─── Source Row Component ────────────────────────────────────────────────────

function SourceRow({
  name,
  value,
  rate,
  rateLabel,
  annualAmount,
  startAge,
  onChangeName,
  onChangeValue,
  onChangeRate,
  onChangeStartAge,
  onDelete,
}: {
  name: string;
  value: number;
  rate: number;
  rateLabel: string;
  annualAmount: number;
  startAge?: number;
  onChangeName: (v: string) => void;
  onChangeValue: (v: number) => void;
  onChangeRate: (v: number) => void;
  onChangeStartAge?: (v: number) => void;
  onDelete: () => void;
}) {
  const hasStartAge = startAge !== undefined && onChangeStartAge !== undefined;

  return (
    <div className={`grid ${hasStartAge ? "grid-cols-[3fr_3fr_3fr_2fr_auto]" : "grid-cols-12"} gap-2 items-start`}>
      {/* Name */}
      <div className={`${hasStartAge ? "" : "col-span-4"} flex flex-col`}>
        <InlineInput value={name} onChange={onChangeName} placeholder="Name" />
        <div className="h-[1.25rem]" />
      </div>

      {/* Value */}
      <div className={`${hasStartAge ? "" : "col-span-4"} flex flex-col`}>
        <InlineInput
          value={value}
          onChange={(v) => onChangeValue(parseFloat(v) || 0)}
          type="number"
          placeholder="Value ($)"
          min={0}
          step={1000}
        />
        <div className="h-[1.25rem]" />
      </div>

      {/* Rate + annual amount */}
      <div className={`${hasStartAge ? "" : "col-span-3"} flex flex-col`}>
        <InlineInput
          value={rate}
          onChange={(v) => onChangeRate(parseFloat(v) || 0)}
          type="number"
          placeholder={rateLabel}
          min={0}
          step={0.1}
        />
        <p
          className="text-[0.625rem] mt-1 font-semibold tracking-wide"
          style={{ color: "var(--primary)", lineHeight: "1.25rem" }}
        >
          = {fmt(annualAmount / 12)} / mth
        </p>
      </div>

      {/* Start Age (optional) */}
      {hasStartAge && (
        <div className="flex flex-col">
          <InlineInput
            value={startAge}
            onChange={(v) => onChangeStartAge(parseInt(v) || 0)}
            type="number"
            placeholder="Age"
            min={0}
            step={1}
          />
          <div className="h-[1.25rem]" />
        </div>
      )}

      {/* Delete — aligned with input */}
      <div className={`${hasStartAge ? "" : "col-span-1"} flex justify-center pt-[0.35rem]`} style={hasStartAge ? { width: "1.75rem" } : undefined}>
        <button
          type="button"
          onClick={onDelete}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem" }}
          title="Remove source"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tertiary)" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function FireCalculatorPage() {
  // ── Persisted scalar state ──
  const [s, set] = useToolState("tool:fire-calculator", {
    monthlyExpense: 3000,
    currentAge: 30,
    retirementAge: 55,
    deathAge: 80,
  });

  const { monthlyExpense, currentAge, retirementAge, deathAge } = s;

  // ── Persisted dynamic arrays (localStorage only) ──
  const [yieldSources, setYieldSourcesRaw] = useState<YieldSource[]>([]);
  const [drawdownSources, setDrawdownSourcesRaw] = useState<DrawdownSource[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage after mount
  useEffect(() => {
    setYieldSourcesRaw(
      loadArray<YieldSource>("fire:yield-sources-v2", [
        { id: genId(), name: "Dividend ETF", value: 50000, yieldRate: 5, startAge: 30 },
      ]),
    );
    setDrawdownSourcesRaw(
      loadArray<DrawdownSource>("fire:drawdown-sources-v2", [
        { id: genId(), name: "Growth Portfolio", value: 100000, startAge: 55, endAge: 80 },
      ]),
    );
    setMounted(true);
  }, []);

  // Persist arrays on change
  const setYieldSources = useCallback((fn: (prev: YieldSource[]) => YieldSource[]) => {
    setYieldSourcesRaw((prev) => {
      const next = fn(prev);
      saveArray("fire:yield-sources-v2", next);
      return next;
    });
  }, []);

  const setDrawdownSources = useCallback((fn: (prev: DrawdownSource[]) => DrawdownSource[]) => {
    setDrawdownSourcesRaw((prev) => {
      const next = fn(prev);
      saveArray("fire:drawdown-sources-v2", next);
      return next;
    });
  }, []);

  // ── Derived calculations ──
  const projection = useMemo(
    () => calculateFireProjection(currentAge, retirementAge, deathAge, monthlyExpense, yieldSources, drawdownSources),
    [currentAge, retirementAge, deathAge, monthlyExpense, yieldSources, drawdownSources],
  );

  const annualExpense = monthlyExpense * 12;
  const fireNumber = annualExpense * 25; // 4% rule: 1/0.04 = 25x

  // Projected values at retirement
  const retirementRow = projection.find((r) => r.age === retirementAge);
  const portfolioAtRetirement = retirementRow?.totalPortfolio ?? 0;
  const yieldIncomeAtRetirement = retirementRow?.yieldIncome ?? 0;
  const drawdownWithdrawalAtRetirement = retirementRow?.drawdownWithdrawal ?? 0;
  const totalIncomeAtRetirement = yieldIncomeAtRetirement + drawdownWithdrawalAtRetirement;

  // FIRE Score = yield income only / annual expense * 100
  // Drawdown is excluded — it's finite capital depletion, not perpetual passive income.
  // Including drawdown would inflate the score even when money runs out in 5 years.
  const fireScore = annualExpense > 0 ? (yieldIncomeAtRetirement / annualExpense) * 100 : 0;

  // Income sustainability — first retirement year where income falls short of expenses
  const shortfallRow = projection.find((r) => r.phase === "retirement" && r.surplus < 0);
  const shortfallAge = shortfallRow?.age ?? null;
  const incomeSustained = shortfallAge === null;

  // Years of retirement income covered
  const retirementYears = deathAge - retirementAge;

  const totalYieldValue = yieldSources.reduce((sum, s) => sum + s.value, 0);
  const totalDrawdownValue = drawdownSources.reduce((sum, s) => sum + s.value, 0);
  const totalCurrentPortfolio = totalYieldValue + totalDrawdownValue;

  if (!mounted) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen" style={{ backgroundColor: "var(--surface-container-low)" }} />
      </>
    );
  }

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
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </div>

              <div>
                <h1
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                >
                  FIRE Calculator
                </h1>
                <p className="mt-2 text-base max-w-xl" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Model your path to Financial Independence, Retire Early. Add your income sources and see when your passive income covers your lifestyle.
                </p>
              </div>
            </div>
          </div>

          {/* ── Main Grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left — Parameters */}
            <div className="lg:col-span-5 space-y-5">
              {/* Basic parameters */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
              >
                <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                  Retirement Profile
                </p>
                <p className="text-sm mt-0.5 mb-6" style={{ color: "var(--on-surface-sub)" }}>
                  Your age, target retirement, and monthly spending
                </p>

                <div className="space-y-5">
                  <FocusInput label="Monthly Expense in Retirement ($)" value={monthlyExpense} onChange={(v) => set({ monthlyExpense: v })} min={0} step={100} />
                  <div className="grid grid-cols-3 gap-4">
                    <FocusInput label="Current Age" value={currentAge} onChange={(v) => set({ currentAge: v })} min={18} max={80} />
                    <FocusInput label="Retire At" value={retirementAge} onChange={(v) => set({ retirementAge: v })} min={currentAge + 1} max={90} />
                    <FocusInput label="Plan To" value={deathAge} onChange={(v) => set({ deathAge: v })} min={retirementAge + 1} max={120} />
                  </div>
                </div>

                {/* Summary strip */}
                <div className="mt-6 rounded-lg px-4 py-3.5" style={{ backgroundColor: "var(--surface-container-low)" }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[0.75rem] font-medium mb-0.5" style={{ color: "var(--on-surface-sub)" }}>FIRE Number (4% Rule)</p>
                      <p className="text-xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>{fmt(fireNumber)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.75rem] font-medium mb-0.5" style={{ color: "var(--on-surface-sub)" }}>Retirement Span</p>
                      <p className="text-xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>{retirementYears} yrs</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yield sources */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                    Yield Sources
                  </p>
                  <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                    {fmt(totalYieldValue)}
                  </span>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Dividend stocks, REITs, bonds — capital stays intact, yield provides income.
                </p>

                {/* Column headers */}
                <div className="grid grid-cols-[3fr_3fr_3fr_2fr_auto] gap-2 mb-2">
                  <p className="text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Name</p>
                  <p className="text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Value ($)</p>
                  <p className="text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Yield % p.a.</p>
                  <p className="text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>From Age</p>
                  <p style={{ width: "1.75rem" }} />
                </div>

                <div className="space-y-2">
                  {yieldSources.map((src) => (
                    <SourceRow
                      key={src.id}
                      name={src.name}
                      value={src.value}
                      rate={src.yieldRate}
                      rateLabel="% p.a."
                      annualAmount={src.value * (src.yieldRate / 100)}
                      startAge={src.startAge}
                      onChangeName={(v) => setYieldSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, name: v } : s)))}
                      onChangeValue={(v) => setYieldSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, value: v } : s)))}
                      onChangeRate={(v) => setYieldSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, yieldRate: v } : s)))}
                      onChangeStartAge={(v) => setYieldSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, startAge: v } : s)))}
                      onDelete={() => setYieldSources((prev) => prev.filter((s) => s.id !== src.id))}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setYieldSources((prev) => [...prev, { id: genId(), name: "", value: 0, yieldRate: 5, startAge: currentAge }])}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontFamily: "Manrope, sans-serif", padding: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add yield source
                </button>
              </div>

              {/* Drawdown sources */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                    Drawdown Sources
                  </p>
                  <span className="text-xs font-semibold" style={{ color: "var(--tertiary)" }}>
                    {fmt(totalDrawdownValue)}
                  </span>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Growth stocks, cash savings — capital is consumed during retirement at your specified withdrawal rate.
                </p>

                {/* Column headers */}
                <div className="grid grid-cols-12 gap-2 mb-2">
                  <p className="col-span-4 text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Name</p>
                  <p className="col-span-3 text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Value ($)</p>
                  <p className="col-span-2 text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Start Age</p>
                  <p className="col-span-2 text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>End Age</p>
                  <p className="col-span-1" />
                </div>

                <div className="space-y-3">
                  {drawdownSources.map((src) => {
                    const span = src.endAge - src.startAge;
                    const annualWithdrawal = span > 0 ? src.value / span : 0;
                    return (
                      <div key={src.id} className="grid grid-cols-12 gap-2 items-start">
                        {/* Name */}
                        <div className="col-span-4 flex flex-col">
                          <InlineInput value={src.name} onChange={(v) => setDrawdownSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, name: v } : s)))} placeholder="Name" />
                          <div className="h-[1.25rem]" />
                        </div>

                        {/* Value + annual withdrawal */}
                        <div className="col-span-3 flex flex-col">
                          <InlineInput
                            value={src.value}
                            onChange={(v) => setDrawdownSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, value: parseFloat(v) || 0 } : s)))}
                            type="number" placeholder="Value ($)" min={0} step={1000}
                          />
                          <p
                            className="text-[0.625rem] mt-1 font-semibold tracking-wide"
                            style={{ color: "var(--primary)", lineHeight: "1.25rem" }}
                          >
                            = {fmt(annualWithdrawal / 12)} / mth
                          </p>
                        </div>

                        {/* Start Age */}
                        <div className="col-span-2 flex flex-col">
                          <InlineInput
                            value={src.startAge}
                            onChange={(v) => setDrawdownSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, startAge: parseInt(v) || 0 } : s)))}
                            type="number" placeholder="Start" min={0} step={1}
                          />
                          <div className="h-[1.25rem]" />
                        </div>

                        {/* End Age */}
                        <div className="col-span-2 flex flex-col">
                          <InlineInput
                            value={src.endAge}
                            onChange={(v) => setDrawdownSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, endAge: parseInt(v) || 0 } : s)))}
                            type="number" placeholder="End" min={0} step={1}
                          />
                          <div className="h-[1.25rem]" />
                        </div>

                        {/* Delete — aligned with input */}
                        <div className="col-span-1 flex justify-center pt-[0.35rem]">
                          <button
                            type="button"
                            onClick={() => setDrawdownSources((prev) => prev.filter((s) => s.id !== src.id))}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem" }}
                            title="Remove source"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tertiary)" strokeWidth="2" strokeLinecap="round">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setDrawdownSources((prev) => [...prev, { id: genId(), name: "", value: 0, startAge: retirementAge, endAge: deathAge }])}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontFamily: "Manrope, sans-serif", padding: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add drawdown source
                </button>
              </div>
            </div>

            {/* Right — Results */}
            <div className="lg:col-span-7 space-y-5">
              {/* FIRE Score */}
              <FireScoreBadge score={fireScore} />

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Portfolio at Retirement */}
                <div
                  className="rounded-xl p-5 flex flex-col justify-between"
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                    boxShadow: "0 12px 32px rgba(0,53,31,0.20)",
                    minHeight: "7.5rem",
                  }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.65)" }}>
                    Portfolio at Retirement
                  </p>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold leading-none mt-3" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
                      {fmt(portfolioAtRetirement)}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                      At age {retirementAge}
                    </p>
                  </div>
                </div>

                {/* Monthly Available */}
                <div
                  className="rounded-xl p-5 flex flex-col justify-between"
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                    boxShadow: "0 12px 32px rgba(0,53,31,0.20)",
                    minHeight: "7.5rem",
                  }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.65)" }}>
                    Monthly Available
                  </p>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold leading-none mt-3" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
                      {fmt(totalIncomeAtRetirement / 12)}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                      Yield: {fmt(yieldIncomeAtRetirement / 12)} · Drawdown: {fmt(drawdownWithdrawalAtRetirement / 12)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary stat cards */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--on-surface-sub)" }}>
                    Current Portfolio
                  </p>
                  <p className="text-xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
                    {fmt(totalCurrentPortfolio)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                    Yield: {fmt(totalYieldValue)} · Drawdown: {fmt(totalDrawdownValue)}
                  </p>
                </div>

                <div
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--on-surface-sub)" }}>
                    Income Covers Expenses
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-lg font-bold"
                      style={{ color: incomeSustained ? "var(--primary)" : "var(--tertiary)", letterSpacing: "-0.01em" }}
                    >
                      {incomeSustained ? "✓ Sustained" : "✗ Shortfall"}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                    {incomeSustained
                      ? `Income covers expenses through age ${deathAge}`
                      : `Income falls short from age ${shortfallAge} — ${deathAge - shortfallAge!} yrs before plan end`}
                  </p>
                </div>
              </div>

              {/* Portfolio chart */}
              <FireChart data={projection} retirementAge={retirementAge} fireNumber={fireNumber} />

              {/* Monthly income chart */}
              <IncomeChart data={projection} retirementAge={retirementAge} monthlyExpense={monthlyExpense} />
            </div>
          </div>

          {/* ── Table ─────────────────────────────────────────────────── */}
          <FireTable data={projection} />

          {/* ── How It Works ──────────────────────────────────────────── */}
          <div
            className="rounded-xl p-8"
            style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {/* 1 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>1</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>The 4% Rule (Trinity Study)</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  Your <span className="font-semibold" style={{ color: "var(--on-surface)" }}>FIRE Number</span> is calculated as
                  annual expenses ÷ 4%, or equivalently, annual expenses × 25. This comes from the 1998 Trinity Study, which found that a
                  diversified portfolio withdrawn at 4% annually had a high probability of lasting 30+ years. It remains the most widely
                  referenced benchmark in the FIRE community.
                </p>
              </div>

              {/* 2 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>2</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Yield vs. Drawdown Sources</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>Yield sources</span> (dividend stocks, REITs, bonds) generate
                  recurring income without depleting capital — during accumulation, yields are reinvested and compound.{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>Drawdown sources</span> (growth stocks, cash) are consumed
                  during retirement at your specified withdrawal rate, filling the gap between yield income and expenses.
                </p>
              </div>

              {/* 3 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>3</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>The FIRE Score</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  Your FIRE Score = (projected portfolio at retirement ÷ FIRE number) × 100%. At{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>100%</span>, your portfolio matches your FIRE number.
                  The tiers — from <em>Early Days</em> to <em>Fat FIRE</em> — are inspired by the FIRE community&apos;s widely used categories:
                  Coast FIRE (on track without further contributions), Lean FIRE (basic coverage), and Fat FIRE (2×+ your target).
                </p>
              </div>

              {/* 4 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>4</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Income Sustainability</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>✓ Sustained</span> means your combined yield income
                  and drawdown withdrawals cover your expenses every year through to your planned end age.{" "}
                  <span className="font-semibold" style={{ color: "var(--tertiary)" }}>✗ Shortfall</span> means income drops below expenses
                  at a specific age — typically because drawdown sources have shrunk too much. If you see a shortfall, consider increasing
                  yield sources, reducing expenses, or extending your accumulation period.
                </p>
              </div>
            </div>

            <p
              className="text-xs mt-8 pt-6"
              style={{ color: "var(--on-surface-sub)", borderTop: "1px solid rgba(192,201,192,0.3)", lineHeight: "1.6" }}
            >
              <span className="font-semibold">Disclaimer:</span> This calculator is for illustrative purposes only. It assumes constant yield
              rates, no inflation adjustment, and simplified withdrawal mechanics. Actual investment returns vary based on market conditions,
              fees, and tax treatment. The FIRE tiers are community-derived benchmarks, not financial advice. Consult a qualified financial
              adviser for personalised retirement planning.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default FireCalculatorPage;
