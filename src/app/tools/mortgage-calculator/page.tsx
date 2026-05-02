"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useToolState } from "@/hooks/useToolState";
import { fmtAxis, niceMax, loadArray, saveArray, genId } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type MonthRow = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

type YearRow = {
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  partialRepayment: number; // lump sum applied at start of this year
};

type PartialRepayment = {
  id: string;
  year: number;  // loan year (1-based)
  amount: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);


// ─── Monthly payment helper ──────────────────────────────────────────────────

function calcMonthlyPayment(principal: number, monthlyRate: number, remainingMonths: number): number {
  if (principal <= 0 || remainingMonths <= 0) return 0;
  if (monthlyRate === 0) return principal / remainingMonths;
  const factor = Math.pow(1 + monthlyRate, remainingMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

// ─── Amortization Calculation ─────────────────────────────────────────────────
function calculateAmortization(
  loanAmount: number,
  annualRate: number,
  tenureYears: number,
  partialRepayments: PartialRepayment[],
): { monthly: MonthRow[]; yearly: YearRow[]; initialMonthlyPayment: number } {
  const totalMonths = Math.max(1, Math.round(tenureYears * 12));
  const r = annualRate / 100 / 12;

  // Build a map of year → total partial repayment
  const partialByYear = new Map<number, number>();
  for (const pr of partialRepayments) {
    if (pr.year >= 1 && pr.year <= tenureYears && pr.amount > 0) {
      partialByYear.set(pr.year, (partialByYear.get(pr.year) ?? 0) + pr.amount);
    }
  }

  const initialMonthlyPayment = calcMonthlyPayment(loanAmount, r, totalMonths);

  const monthly: MonthRow[] = [];
  let balance = loanAmount;
  let currentMonthlyPayment = initialMonthlyPayment;

  for (let m = 1; m <= totalMonths; m++) {
    if (balance <= 0) {
      monthly.push({ month: m, payment: 0, principal: 0, interest: 0, balance: 0 });
      continue;
    }

    // At the start of each year, apply partial repayment and recalculate monthly payment
    if ((m - 1) % 12 === 0) {
      const loanYear = Math.floor((m - 1) / 12) + 1;
      const lumpSum = partialByYear.get(loanYear) ?? 0;
      if (lumpSum > 0) {
        balance = Math.max(0, balance - lumpSum);
        const remainingMonths = totalMonths - (m - 1);
        currentMonthlyPayment = calcMonthlyPayment(balance, r, remainingMonths);
      }
    }

    if (balance <= 0) {
      monthly.push({ month: m, payment: 0, principal: 0, interest: 0, balance: 0 });
      continue;
    }

    const interest = balance * r;
    const payment = Math.min(currentMonthlyPayment, balance + interest);
    const principal = Math.min(payment - interest, balance);
    balance = Math.max(0, balance - principal);

    monthly.push({ month: m, payment, principal, interest, balance });
  }

  // Aggregate by year
  const yearly: YearRow[] = [];
  for (let y = 0; y < tenureYears; y++) {
    const start = y * 12;
    const end = Math.min(start + 12, monthly.length);
    const slice = monthly.slice(start, end);
    if (slice.length === 0) break;

    const loanYear = y + 1;
    yearly.push({
      year: loanYear,
      payment: slice.reduce((s, m) => s + m.payment, 0),
      principal: slice.reduce((s, m) => s + m.principal, 0),
      interest: slice.reduce((s, m) => s + m.interest, 0),
      balance: slice[slice.length - 1].balance,
      partialRepayment: partialByYear.get(loanYear) ?? 0,
    });
  }

  return { monthly, yearly, initialMonthlyPayment };
}

// ─── FocusInput ──────────────────────────────────────────────────────────────
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

// ─── Inline Text Input (for partial repayment rows) ──────────────────────────

function InlineInput({
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  step,
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: number;
  step?: number;
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
      }}
    />
  );
}

// ─── Balance Chart ───────────────────────────────────────────────────────────
function BalanceChart({ data, baseData }: { data: YearRow[]; baseData: YearRow[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (data.length < 2) return null;

  const W = 600;
  const H = 260;
  const PAD = { top: 24, right: 20, bottom: 44, left: 58 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const hasBase = baseData.length >= 2 && baseData !== data;
  const allBalances = [...data.map((d) => d.balance), ...(hasBase ? baseData.map((d) => d.balance) : [])];
  const rawMax = Math.max(...allBalances, data[0]?.balance ?? 0);
  const yMax = niceMax(rawMax);
  const totalYears = data.length;

  const xOf = (idx: number) => PAD.left + (idx / (totalYears - 1)) * CW;
  const yOf = (v: number) => PAD.top + CH - (v / yMax) * CH;

  // Balance line
  const pts = data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.balance).toFixed(1)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${xOf(totalYears - 1).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  // Baseline (no partials) dashed line
  const basePts = hasBase ? baseData.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.balance).toFixed(1)}`) : [];
  const baseLine = hasBase ? `M ${basePts.join(" L ")}` : "";

  // Y ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  // X labels — equal spacing by index
  const xStep = totalYears <= 10 ? 1 : totalYears <= 20 ? 2 : totalYears <= 30 ? 5 : 10;
  const xLabels: number[] = [];
  for (let i = 0; i < totalYears; i += xStep) xLabels.push(i);
  const lastTick = xLabels[xLabels.length - 1];
  if (lastTick !== totalYears - 1 && totalYears - 1 - lastTick > xStep * 0.4) xLabels.push(totalYears - 1);

  // Partial repayment markers
  const repaymentIndices = data.map((d, i) => ({ i, d })).filter(({ d }) => d.partialRepayment > 0);

  // Hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const fraction = Math.max(0, Math.min(1, (svgX - PAD.left) / CW));
    setHoveredIdx(Math.round(fraction * (data.length - 1)));
  };

  const hd = hoveredIdx !== null ? data[hoveredIdx] : null;
  const hx = hd ? xOf(hoveredIdx!) : 0;
  const TW = 196;
  const TH = hd?.partialRepayment ? 94 : 78;
  const tooltipX = hd ? (hx < PAD.left + CW / 2 ? hx + 10 : hx - TW - 10) : 0;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[0.9375rem] font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
        Outstanding Balance
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        aria-label="Mortgage balance projection chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="mort-bal-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00351f" stopOpacity="0.18" />
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
        {xLabels.map((i) => (
          <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            {`Yr ${data[i].year}`}
          </text>
        ))}

        {/* Area fill */}
        <path d={area} fill="url(#mort-bal-fill)" />

        {/* Baseline dashed line (no partials) */}
        {hasBase && <path d={baseLine} fill="none" stroke="#c0c9c0" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7" />}

        {/* Balance line */}
        <path d={line} fill="none" stroke="#00351f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Partial repayment drop markers */}
        {repaymentIndices.map(({ i, d }) => (
          <g key={i}>
            <line x1={xOf(i)} y1={PAD.top} x2={xOf(i)} y2={PAD.top + CH} stroke="#1a6b42" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <circle cx={xOf(i)} cy={yOf(d.balance)} r="5" fill="#1a6b42" stroke="white" strokeWidth="1.5" />
          </g>
        ))}

        {/* Legend */}
        <g transform={`translate(${PAD.left}, 10)`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke="#00351f" strokeWidth="2" />
          <text x="23" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">With repayments</text>
          {hasBase && <>
            <line x1="140" y1="0" x2="158" y2="0" stroke="#c0c9c0" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x="163" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">No repayments</text>
          </>}
          {repaymentIndices.length > 0 && <>
            <circle cx={hasBase ? 290 : 155} cy="0" r="4" fill="#1a6b42" />
            <text x={hasBase ? 298 : 163} y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">Partial repayment</text>
          </>}
        </g>

        {/* Hover crosshair + tooltip */}
        {hd && hoveredIdx !== null && (
          <g pointerEvents="none">
            <line x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + CH} stroke="#3d4a41" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle cx={hx} cy={yOf(hd.balance)} r="4" fill="#00351f" stroke="white" strokeWidth="1.5" />
            <rect x={tooltipX} y={PAD.top + 4} width={TW} height={TH} rx="5" fill="white" stroke="#c0c9c0" strokeWidth="0.75" />
            <text x={tooltipX + 10} y={PAD.top + 20} fontSize="10" fontWeight="700" fill="#00351f" fontFamily="Manrope, sans-serif">{`Year ${hd.year}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 36} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">{`Balance: ${fmt(hd.balance)}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 51} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">{`Principal paid: ${fmt(hd.principal)}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 66} fontSize="10" fill="#c05621" fontFamily="Manrope, sans-serif">{`Interest paid: ${fmt(hd.interest)}`}</text>
            {hd.partialRepayment > 0 && (
              <text x={tooltipX + 10} y={PAD.top + 81} fontSize="10" fill="#1a6b42" fontFamily="Manrope, sans-serif">{`Lump sum: ${fmt(hd.partialRepayment)}`}</text>
            )}
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Payment Breakdown Chart ─────────────────────────────────────────────────
function PaymentBreakdownChart({ data }: { data: YearRow[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (data.length < 2) return null;

  const W = 600;
  const H = 260;
  const PAD = { top: 24, right: 20, bottom: 44, left: 58 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const rawMax = Math.max(...data.map((d) => d.payment));
  const yMax = niceMax(rawMax);
  const totalYears = data.length;

  const xOf = (idx: number) => PAD.left + (idx / (totalYears - 1)) * CW;
  const yOf = (v: number) => PAD.top + CH - (v / yMax) * CH;

  // Principal line
  const principalPts = data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.principal).toFixed(1)}`);
  const principalLine = `M ${principalPts.join(" L ")}`;

  // Interest line
  const interestPts = data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.interest).toFixed(1)}`);
  const interestLine = `M ${interestPts.join(" L ")}`;
  const interestArea = `${interestLine} L ${xOf(totalYears - 1).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  // Principal area (stacks above interest conceptually, but we show them separately for clarity)
  const principalArea = `${principalLine} L ${xOf(totalYears - 1).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  // Y ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  // X labels — equal spacing by index
  const xStep = totalYears <= 10 ? 1 : totalYears <= 20 ? 2 : totalYears <= 30 ? 5 : 10;
  const xLabels: number[] = [];
  for (let i = 0; i < totalYears; i += xStep) xLabels.push(i);
  const lastTick = xLabels[xLabels.length - 1];
  if (lastTick !== totalYears - 1 && totalYears - 1 - lastTick > xStep * 0.4) xLabels.push(totalYears - 1);

  // Hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const fraction = Math.max(0, Math.min(1, (svgX - PAD.left) / CW));
    setHoveredIdx(Math.round(fraction * (data.length - 1)));
  };

  const hd = hoveredIdx !== null ? data[hoveredIdx] : null;
  const hx = hd ? xOf(hoveredIdx!) : 0;
  const TW = 196;
  const TH = 78;
  const tooltipX = hd ? (hx < PAD.left + CW / 2 ? hx + 10 : hx - TW - 10) : 0;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[0.9375rem] font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
        Annual Payment Breakdown
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        aria-label="Mortgage payment breakdown chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="mort-int-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c05621" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#c05621" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="mort-princ-fill" x1="0" y1="0" x2="0" y2="1">
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
        {xLabels.map((i) => (
          <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            {`Yr ${data[i].year}`}
          </text>
        ))}

        {/* Principal area */}
        <path d={principalArea} fill="url(#mort-princ-fill)" />

        {/* Interest area */}
        <path d={interestArea} fill="url(#mort-int-fill)" />

        {/* Interest line */}
        <path d={interestLine} fill="none" stroke="#c05621" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.8" />

        {/* Principal line */}
        <path d={principalLine} fill="none" stroke="#00351f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Legend */}
        <g transform={`translate(${PAD.left}, 10)`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke="#00351f" strokeWidth="2" />
          <text x="23" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            Principal
          </text>
          <line x1="110" y1="0" x2="128" y2="0" stroke="#c05621" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x="133" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            Interest
          </text>
        </g>

        {/* Hover crosshair + tooltip */}
        {hd && hoveredIdx !== null && (
          <g pointerEvents="none">
            <line x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + CH} stroke="#3d4a41" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle cx={hx} cy={yOf(hd.principal)} r="4" fill="#00351f" stroke="white" strokeWidth="1.5" />
            <circle cx={hx} cy={yOf(hd.interest)} r="3.5" fill="#c05621" stroke="white" strokeWidth="1.5" />
            <rect x={tooltipX} y={PAD.top + 4} width={TW} height={TH} rx="5" fill="white" stroke="#c0c9c0" strokeWidth="0.75" />
            <text x={tooltipX + 10} y={PAD.top + 20} fontSize="10" fontWeight="700" fill="#00351f" fontFamily="Manrope, sans-serif">{`Year ${hd.year}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 36} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">{`Principal: ${fmt(hd.principal)}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 51} fontSize="10" fill="#c05621" fontFamily="Manrope, sans-serif">{`Interest: ${fmt(hd.interest)}`}</text>
            <text x={tooltipX + 10} y={PAD.top + 66} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">{`Total: ${fmt(hd.payment)}`}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Yearly Table ────────────────────────────────────────────────────────────
function YearlyTable({ data }: { data: YearRow[] }) {
  const [open, setOpen] = useState(false);

  const hasPartials = data.some((r) => r.partialRepayment > 0);

  const COLS = [
    { key: "year", label: "Year" },
    ...(hasPartials ? [{ key: "partialRepayment", label: "Partial Repayment" }] : []),
    { key: "payment", label: "Annual Payment" },
    { key: "principal", label: "Principal" },
    { key: "interest", label: "Interest" },
    { key: "balance", label: "Outstanding Balance" },
  ];

  return (
    <div className="rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-botanical)" }}>
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left"
        style={{ backgroundColor: "var(--surface-container-lowest)", border: "none", cursor: "pointer", fontFamily: "Manrope, sans-serif" }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>
          Amortization Schedule (Table)
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
                      backgroundColor: i % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)",
                    }}
                  >
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
                      {row.year}
                    </td>
                    {hasPartials && (
                      <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: row.partialRepayment > 0 ? "var(--primary)" : "var(--on-surface-sub)" }}>
                        {row.partialRepayment > 0 ? fmt(row.partialRepayment) : "—"}
                      </td>
                    )}
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                      {fmt(row.payment)}
                    </td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: "var(--on-surface)" }}>
                      {fmt(row.principal)}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "#c05621" }}>
                      {fmt(row.interest)}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                      {fmt(row.balance)}
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

// ─── Page ────────────────────────────────────────────────────────────────────
export function MortgageCalculatorPage() {
  const [s, set] = useToolState("tool:mortgage-calculator", {
    propertyPrice: 500_000,
    downPaymentPct: 25,
    annualRate: 3.5,
    tenureYears: 25,
  });

  const { propertyPrice, downPaymentPct, annualRate, tenureYears } = s;

  // ── Partial repayments (localStorage only, like FIRE's dynamic arrays) ──
  const [partialRepayments, setPartialRepaymentsRaw] = useState<PartialRepayment[]>([]);
  const [mounted, setMounted] = useState(false);
  const [paymentRegimeIndex, setPaymentRegimeIndex] = useState(0);

  useEffect(() => {
    setPartialRepaymentsRaw(loadArray<PartialRepayment>("mortgage:partial-repayments", []));
    setMounted(true);
  }, []);

  const setPartialRepayments = useCallback((fn: (prev: PartialRepayment[]) => PartialRepayment[]) => {
    setPartialRepaymentsRaw((prev) => {
      const next = fn(prev);
      saveArray("mortgage:partial-repayments", next);
      return next;
    });
  }, []);

  const downPayment = propertyPrice * (downPaymentPct / 100);
  const loanAmount = Math.max(0, propertyPrice - downPayment);

  const { yearly, initialMonthlyPayment } = useMemo(
    () => calculateAmortization(loanAmount, annualRate, tenureYears, partialRepayments),
    [loanAmount, annualRate, tenureYears, partialRepayments],
  );

  // Total actually paid (sum of all yearly payments + all partial repayments)
  const totalPartialRepaid = partialRepayments.reduce((s, pr) => s + (pr.amount > 0 ? pr.amount : 0), 0);
  const totalScheduledPayments = yearly.reduce((s, yr) => s + yr.payment, 0);
  const totalPaid = totalScheduledPayments + totalPartialRepaid;
  const totalInterest = yearly.reduce((s, yr) => s + yr.interest, 0);
  const interestToLoanRatio = loanAmount > 0 ? (totalInterest / loanAmount) * 100 : 0;

  // Compute interest saved by comparing with no-partial scenario
  const baseResult = useMemo(
    () => calculateAmortization(loanAmount, annualRate, tenureYears, []),
    [loanAmount, annualRate, tenureYears],
  );
  const baseInterest = baseResult.yearly.reduce((s, yr) => s + yr.interest, 0);
  const interestSaved = baseInterest - totalInterest;

  // Current monthly payment (latest non-zero, after partials recalculate)
  const lastActiveYear = [...yearly].reverse().find((yr) => yr.payment > 0);
  const currentMonthlyPayment = lastActiveYear ? lastActiveYear.payment / 12 : 0;
  const monthlyPaymentChanged = partialRepayments.length > 0 && Math.abs(currentMonthlyPayment - initialMonthlyPayment) > 0.01;

  // Extract distinct payment regimes (consecutive years with same monthly payment)
  type PaymentRegime = { startYear: number; endYear: number; monthlyPayment: number };
  const paymentRegimes: PaymentRegime[] = useMemo(() => {
    if (yearly.length === 0) return [];

    const regimes: PaymentRegime[] = [];
    let currentStart = yearly[0].year;
    let currentPayment = yearly[0].payment / 12;

    for (let i = 1; i < yearly.length; i++) {
      const yearlyPayment = yearly[i].payment / 12;
      if (Math.abs(yearlyPayment - currentPayment) > 0.01) {
        // Payment changed, save the current regime
        regimes.push({
          startYear: currentStart,
          endYear: yearly[i - 1].year,
          monthlyPayment: currentPayment,
        });
        currentStart = yearly[i].year;
        currentPayment = yearlyPayment;
      }
    }

    // Add the final regime
    regimes.push({
      startYear: currentStart,
      endYear: yearly[yearly.length - 1].year,
      monthlyPayment: currentPayment,
    });

    return regimes;
  }, [yearly]);

  // Reset regime index when regimes change
  useEffect(() => {
    setPaymentRegimeIndex(0);
  }, [paymentRegimes.length]);

  const currentRegime = paymentRegimes[paymentRegimeIndex] ?? paymentRegimes[0];
  const hasMultipleRegimes = paymentRegimes.length > 1;

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
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>

              <div>
                <h1
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                >
                  Mortgage Calculator
                </h1>
                <p className="mt-2 text-base max-w-xl" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Estimate your monthly repayments and see how interest adds up over the life of your home loan.
                </p>
              </div>
            </div>
          </div>

          {/* ── Main Grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left — Parameters */}
            <div className="lg:col-span-5 space-y-5">
              {/* Loan Details */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
              >
                <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                  Loan Details
                </p>
                <p className="text-sm mt-0.5 mb-6" style={{ color: "var(--on-surface-sub)" }}>
                  Adjust the details of your mortgage
                </p>

                <div className="space-y-5">
                  <FocusInput
                    label="Property Price (S$)"
                    value={propertyPrice}
                    onChange={(v) => set({ propertyPrice: v })}
                    min={0}
                    step={10000}
                  />
                  <FocusInput
                    label="Down Payment (%)"
                    value={downPaymentPct}
                    onChange={(v) => set({ downPaymentPct: v })}
                    min={0}
                    max={100}
                    step={5}
                    hint={`Down payment: ${fmt(downPayment)}`}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FocusInput
                      label="Annual Interest Rate (%)"
                      value={annualRate}
                      onChange={(v) => set({ annualRate: v })}
                      min={0}
                      max={30}
                      step={0.1}
                    />
                    <FocusInput
                      label="Loan Tenure (Years)"
                      value={tenureYears}
                      onChange={(v) => set({ tenureYears: v })}
                      min={1}
                      max={35}
                    />
                  </div>
                </div>

                {/* Loan amount strip */}
                <div className="mt-6 rounded-lg px-4 py-3.5" style={{ backgroundColor: "var(--surface-container-low)" }}>
                  <p className="text-[0.75rem] font-medium mb-0.5" style={{ color: "var(--on-surface-sub)" }}>
                    Loan Amount
                  </p>
                  <p className="text-xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
                    {fmt(loanAmount)}
                  </p>
                </div>
              </div>

              {/* Partial Repayments */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                    Partial Repayments
                  </p>
                  {interestSaved > 0 && (
                    <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                      Save {fmt(interestSaved)}
                    </span>
                  )}
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Lump-sum payments that reduce your principal. Monthly instalment is recalculated for the remaining tenure.
                </p>

                {/* Column headers */}
                {partialRepayments.length > 0 && (
                  <div className="grid grid-cols-12 gap-2 mb-2">
                    <p className="col-span-5 text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Loan Year</p>
                    <p className="col-span-6 text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Amount (S$)</p>
                    <p className="col-span-1" />
                  </div>
                )}

                <div className="space-y-2">
                  {partialRepayments.map((pr) => (
                    <div key={pr.id} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-5">
                        <InlineInput
                          value={pr.year}
                          onChange={(v) => setPartialRepayments((prev) => prev.map((p) => (p.id === pr.id ? { ...p, year: parseInt(v) || 0 } : p)))}
                          type="number"
                          placeholder="Year"
                          min={1}
                          step={1}
                        />
                      </div>
                      <div className="col-span-6">
                        <InlineInput
                          value={pr.amount}
                          onChange={(v) => setPartialRepayments((prev) => prev.map((p) => (p.id === pr.id ? { ...p, amount: parseFloat(v) || 0 } : p)))}
                          type="number"
                          placeholder="Amount"
                          min={0}
                          step={1000}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center pt-[0.35rem]">
                        <button
                          type="button"
                          onClick={() => setPartialRepayments((prev) => prev.filter((p) => p.id !== pr.id))}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem" }}
                          title="Remove"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tertiary)" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setPartialRepayments((prev) => [...prev, { id: genId("pr"), year: 5, amount: 50000 }])}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontFamily: "Manrope, sans-serif", padding: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add partial repayment
                </button>
              </div>
            </div>

            {/* Right — Results */}
            <div className="lg:col-span-7 space-y-5">
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Monthly Payment — gradient */}
                <div
                  className="rounded-xl p-5 flex flex-col justify-between relative"
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                    boxShadow: "0 12px 32px rgba(0,53,31,0.20)",
                    minHeight: "7.5rem",
                  }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.65)" }}>
                    Monthly Repayment
                  </p>
                  <div className="flex items-center justify-between pr-8">
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold leading-none mt-3" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
                        {currentRegime ? fmt(currentRegime.monthlyPayment) : fmt(initialMonthlyPayment)}
                      </p>
                      <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {currentRegime && paymentRegimes.length > 1
                          ? `Year ${currentRegime.startYear}${currentRegime.endYear > currentRegime.startYear ? `–${currentRegime.endYear}` : ""}`
                          : monthlyPaymentChanged
                            ? `Reduces after each partial repayment`
                            : `Over ${tenureYears} year${tenureYears !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>

                  {/* Navigation arrows — only show if multiple regimes */}
                  {hasMultipleRegimes && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => setPaymentRegimeIndex((i) => Math.max(0, i - 1))}
                        disabled={paymentRegimeIndex === 0}
                        className="p-1 rounded transition-opacity hover:opacity-75 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ color: "#fff" }}
                        aria-label="Previous payment"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentRegimeIndex((i) => Math.min(paymentRegimes.length - 1, i + 1))}
                        disabled={paymentRegimeIndex === paymentRegimes.length - 1}
                        className="p-1 rounded transition-opacity hover:opacity-75 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ color: "#fff" }}
                        aria-label="Next payment"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Total Interest */}
                <div
                  className="rounded-xl p-5 flex flex-col justify-between"
                  style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)", minHeight: "7.5rem" }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "#c05621" }}>
                    Total Interest
                  </p>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold leading-none mt-3" style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}>
                      {fmt(totalInterest)}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "var(--on-surface-sub)" }}>
                      {interestToLoanRatio > 0 ? `${interestToLoanRatio.toFixed(1)}% of loan amount` : "—"}
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
                    Total Amount Paid
                  </p>
                  <p className="text-xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
                    {fmt(totalPaid)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                    Instalments + partial repayments
                  </p>
                </div>

                <div
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase mb-2" style={{ color: interestSaved > 0 ? "var(--primary)" : "var(--on-surface-sub)" }}>
                    Interest Saved
                  </p>
                  <p className="text-xl font-bold" style={{ color: interestSaved > 0 ? "var(--primary)" : "var(--on-surface)", letterSpacing: "-0.01em" }}>
                    {interestSaved > 0 ? fmt(interestSaved) : "—"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                    {interestSaved > 0 ? `vs no partial repayments` : `Add partial repayments to see savings`}
                  </p>
                </div>
              </div>

              {/* Balance chart */}
              <BalanceChart data={yearly} baseData={partialRepayments.length > 0 ? baseResult.yearly : yearly} />

              {/* Payment breakdown chart */}
              <PaymentBreakdownChart data={yearly} />
            </div>
          </div>

          {/* ── Table ─────────────────────────────────────────────────── */}
          <YearlyTable data={yearly} />

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
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Standard Amortization</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  Your monthly repayment is calculated using the standard amortization formula:{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>
                    M = P × r(1+r)ⁿ / ((1+r)ⁿ − 1)
                  </span>
                  , where <em>P</em> is your loan principal, <em>r</em> is the monthly interest rate (annual ÷ 12),
                  and <em>n</em> is the total number of monthly payments. This gives you a fixed monthly instalment
                  throughout the loan tenure.
                </p>
              </div>

              {/* 2 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>2</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Principal vs Interest</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  Each monthly payment is split between{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>principal</span> (reducing your debt) and{" "}
                  <span className="font-semibold" style={{ color: "#c05621" }}>interest</span> (the cost of borrowing).
                  In the early years, most of your payment goes toward interest. Over time, the balance shifts as the
                  outstanding loan shrinks and generates less interest.
                </p>
              </div>

              {/* 3 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>3</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Down Payment</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  A larger down payment means a smaller loan principal, which directly reduces both your monthly
                  repayment and total interest paid. Most Singapore banks require a minimum of{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>25%</span> for private properties
                  and <span className="font-semibold" style={{ color: "var(--on-surface)" }}>20%</span> for HDB flats,
                  though part of this can come from CPF.
                </p>
              </div>

              {/* 4 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>4</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Reading the Charts</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  The <span className="font-semibold" style={{ color: "var(--on-surface)" }}>Outstanding Balance</span> chart
                  shows your remaining debt over time. When partial repayments are added, the dashed line shows the baseline
                  (no repayments) for comparison, and green dots mark each lump-sum event.
                  The <span className="font-semibold" style={{ color: "var(--on-surface)" }}>Payment Breakdown</span> chart
                  shows how your annual principal and interest split shifts — after a partial repayment, the monthly instalment
                  drops and the interest portion shrinks faster.
                </p>
              </div>

              {/* 5 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>5</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Partial Repayments</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  A <span className="font-semibold" style={{ color: "var(--on-surface)" }}>partial repayment</span> is a
                  lump-sum payment made outside your regular monthly instalment — common in Singapore when you receive a bonus,
                  CPF refund, or asset sale proceeds. It reduces your outstanding principal immediately, and your bank
                  recalculates the monthly instalment based on the new balance over the{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>remaining tenure</span> (the tenure
                  stays fixed — this is the typical Singapore bank approach). The earlier you make a partial repayment, the
                  greater the interest saving, since less principal compounds over the remaining years.
                </p>
              </div>
            </div>

            <p
              className="text-xs mt-8 pt-6"
              style={{ color: "var(--on-surface-sub)", borderTop: "1px solid rgba(192,201,192,0.3)", lineHeight: "1.6" }}
            >
              <span className="font-semibold">Disclaimer:</span> This calculator assumes a fixed interest rate throughout
              the loan tenure. In practice, most Singapore mortgages use floating or hybrid rates that reset periodically.
              Results are for illustrative purposes only and do not account for fees, insurance, or CPF usage. Consult a
              qualified mortgage adviser for personalised guidance.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default MortgageCalculatorPage;
