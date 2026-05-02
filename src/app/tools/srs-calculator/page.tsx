"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useToolState } from "@/hooks/useToolState";
import { fmtAxis, niceMax, loadArray, saveArray, genId, todayISO } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Deposit = {
  id: string;
  name: string;       // e.g. "T-Bills", "OCBC FD"
  amount: number;     // SGD
  startDate: string;  // YYYY-MM-DD
  interestRate: number; // % p.a.
};

type WithdrawalSettings = {
  startDate: string;   // YYYY-MM-DD — first withdrawal year
  years: number;       // 1–10 consecutive years
};

type ProjectionPoint = {
  year: number;         // calendar year
  balance: number;      // portfolio balance at end of year
  deposits: number;     // cumulative deposits to date
  withdrawals: number;  // cumulative withdrawals to date
  interest: number;     // cumulative interest to date
  annualWithdrawal: number; // withdrawal in this year (0 during accumulation)
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);


function yearFromISO(iso: string): number {
  return parseInt(iso.slice(0, 4), 10);
}

// Weighted average interest rate across all deposits
function weightedAvgRate(deposits: Deposit[]): number {
  const totalAmt = deposits.reduce((s, d) => s + Math.max(0, d.amount), 0);
  if (totalAmt === 0) return 0;
  const weightedSum = deposits.reduce(
    (s, d) => s + Math.max(0, d.amount) * d.interestRate,
    0,
  );
  return weightedSum / totalAmt;
}

// ─── Projection ──────────────────────────────────────────────────────────────
/**
 * Projects the SRS portfolio year-by-year:
 *   • Accumulation phase: all deposits compound at their respective rates
 *   • Withdrawal phase: total portfolio value spread evenly over `years` years
 *     (simple model — assumes withdrawal drawn at end of year, rest compounds)
 *
 * Returns one data point per calendar year from the earliest deposit year up
 * to the final withdrawal year + 2 (for visual tail).
 */
function projectSRS(
  deposits: Deposit[],
  withdrawal: WithdrawalSettings,
): ProjectionPoint[] {
  if (deposits.length === 0) return [];

  const today = new Date();
  const currentYear = today.getFullYear();

  const earliestDepositYear = deposits.reduce(
    (min, d) => Math.min(min, yearFromISO(d.startDate)),
    currentYear,
  );

  const withdrawalStartYear = yearFromISO(withdrawal.startDate);
  const withdrawalEndYear = withdrawalStartYear + withdrawal.years - 1;
  const projectionEndYear = withdrawalEndYear + 1; // show one year after last withdrawal

  // Track each deposit's balance independently
  const balances = deposits.map((d) => Math.max(0, d.amount));
  const rates = deposits.map((d) => d.interestRate / 100);
  const depositYears = deposits.map((d) => yearFromISO(d.startDate));

  let cumulativeDeposits = deposits.reduce((s, d) => s + Math.max(0, d.amount), 0);
  let cumulativeInterest = 0;
  let cumulativeWithdrawals = 0;

  const points: ProjectionPoint[] = [];

  // Snapshot at start of earliest deposit year
  const startBalance = balances.reduce((s, b) => s + b, 0);
  points.push({
    year: earliestDepositYear,
    balance: startBalance,
    deposits: cumulativeDeposits,
    withdrawals: 0,
    interest: 0,
    annualWithdrawal: 0,
  });

  for (let yr = earliestDepositYear + 1; yr <= projectionEndYear; yr++) {
    const isWithdrawalYear = yr >= withdrawalStartYear && yr <= withdrawalEndYear;

    // 1. Apply annual interest on all active balances
    let yearInterest = 0;
    for (let i = 0; i < deposits.length; i++) {
      if (yr < depositYears[i]) continue; // deposit hasn't started yet
      const interest = balances[i] * rates[i];
      balances[i] += interest;
      yearInterest += interest;
    }
    cumulativeInterest += yearInterest;

    // 2. Compute total portfolio value
    const totalBalance = balances.reduce((s, b) => s + b, 0);

    // 3. Handle withdrawal
    let annualWithdrawal = 0;
    if (isWithdrawalYear) {
      // The total amount to distribute = portfolio value at start of withdrawal phase
      // We recalculate from the live balance each year (evenly over remaining years)
      const yearsRemaining = withdrawalEndYear - yr + 1;
      annualWithdrawal = totalBalance / yearsRemaining;

      // Deduct proportionally from each source
      const withdrawFraction = annualWithdrawal / totalBalance;
      for (let i = 0; i < balances.length; i++) {
        balances[i] -= balances[i] * withdrawFraction;
      }
      cumulativeWithdrawals += annualWithdrawal;
    }

    const balanceAfterWithdrawal = balances.reduce((s, b) => s + b, 0);

    points.push({
      year: yr,
      balance: balanceAfterWithdrawal,
      deposits: cumulativeDeposits,
      withdrawals: cumulativeWithdrawals,
      interest: cumulativeInterest,
      annualWithdrawal,
    });
  }

  return points;
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
        <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── DepositRow ───────────────────────────────────────────────────────────────
function DepositRow({
  deposit,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  deposit: Deposit;
  onUpdate: (id: string, field: keyof Deposit, value: string | number) => void;
  onDelete: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [nameFocused, setNameFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);
  const [dateFocused, setDateFocused] = useState(false);
  const [rateFocused, setRateFocused] = useState(false);

  const inputStyle = (focused: boolean) => ({
    width: "100%",
    minWidth: 0,
    background: "var(--surface-container-highest)",
    border: "none",
    borderBottom: `2px solid ${focused ? "var(--primary)" : "var(--outline-variant)"}`,
    borderRadius: "0.25rem 0.25rem 0 0",
    padding: "0.5rem 0.375rem",
    fontSize: "0.875rem",
    fontFamily: "Manrope, sans-serif",
    fontWeight: 500 as const,
    color: "var(--on-surface)",
    outline: "none",
    transition: "border-color 0.15s ease",
  });

  return (
    <div className="grid grid-cols-[4fr_3fr_3fr_2fr_auto] gap-2 items-end">
      {/* Name */}
      <div>
        <input
          type="text"
          value={deposit.name}
          placeholder="e.g. T-Bills"
          onChange={(e) => onUpdate(deposit.id, "name", e.target.value)}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          style={inputStyle(nameFocused)}
        />
      </div>

      {/* Amount */}
      <div className="min-w-0">
        <input
          type="number"
          value={deposit.amount}
          min={0}
          step={1000}
          onChange={(e) => onUpdate(deposit.id, "amount", parseFloat(e.target.value) || 0)}
          onFocus={() => setAmountFocused(true)}
          onBlur={() => setAmountFocused(false)}
          style={inputStyle(amountFocused)}
        />
      </div>

      {/* Start Date */}
      <div className="min-w-0">
        <input
          type="date"
          value={deposit.startDate}
          onChange={(e) => onUpdate(deposit.id, "startDate", e.target.value)}
          onFocus={() => setDateFocused(true)}
          onBlur={() => setDateFocused(false)}
          style={inputStyle(dateFocused)}
        />
      </div>

      {/* Interest Rate */}
      <div className="min-w-0">
        <input
          type="number"
          value={deposit.interestRate}
          min={0}
          max={50}
          step={0.01}
          onChange={(e) => onUpdate(deposit.id, "interestRate", parseFloat(e.target.value) || 0)}
          onFocus={() => setRateFocused(true)}
          onBlur={() => setRateFocused(false)}
          style={inputStyle(rateFocused)}
        />
      </div>

      {/* Reorder + Delete */}
      <div className="flex items-center gap-0.5">
        <div className="flex flex-col">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            style={{ background: "none", border: "none", cursor: onMoveUp ? "pointer" : "default", padding: "0 0.125rem", opacity: onMoveUp ? 1 : 0.25 }}
            title="Move up"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-sub)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            style={{ background: "none", border: "none", cursor: onMoveDown ? "pointer" : "default", padding: "0 0.125rem", opacity: onMoveDown ? 1 : 0.25 }}
            title="Move down"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-sub)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={() => onDelete(deposit.id)}
          className="p-1.5 rounded-md transition-colors hover:bg-red-50"
          style={{ color: "var(--on-surface-sub)", lineHeight: 1 }}
          aria-label="Remove deposit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── ProjectionChart ──────────────────────────────────────────────────────────
function ProjectionChart({ data, withdrawalStartYear, withdrawalEndYear }: {
  data: ProjectionPoint[];
  withdrawalStartYear: number;
  withdrawalEndYear: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (data.length < 2) return null;

  const W = 600;
  const H = 260;
  const PAD = { top: 24, right: 20, bottom: 40, left: 58 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const maxBalance = Math.max(...data.map((d) => d.balance));
  const yMax = niceMax(maxBalance);
  const yTicks = 4;

  const xMin = data[0].year;
  const xMax = data[data.length - 1].year;
  const xRange = Math.max(1, xMax - xMin);

  const xPos = (year: number) => PAD.left + ((year - xMin) / xRange) * CW;
  const yPos = (val: number) => PAD.top + (1 - val / yMax) * CH;

  // Build SVG path for balance line
  const balancePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xPos(d.year).toFixed(1)},${yPos(d.balance).toFixed(1)}`)
    .join(" ");

  // Area fill under balance line
  const areaPath = `${balancePath} L${xPos(xMax).toFixed(1)},${(PAD.top + CH).toFixed(1)} L${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  // Withdrawal phase shading band
  const wStartX = xPos(Math.max(xMin, withdrawalStartYear));
  const wEndX = xPos(Math.min(xMax, withdrawalEndYear));

  // Hover tooltip
  const hovered = hoveredIdx !== null ? data[hoveredIdx] : null;
  const tooltipX = hovered ? xPos(hovered.year) : 0;
  const tooltipY = hovered ? yPos(hovered.balance) : 0;
  const tooltipRight = tooltipX > W * 0.65;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="srs-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Withdrawal phase band */}
        {withdrawalStartYear <= xMax && withdrawalEndYear >= xMin && (
          <rect
            x={wStartX}
            y={PAD.top}
            width={Math.max(0, wEndX - wStartX)}
            height={CH}
            fill="var(--primary)"
            fillOpacity="0.06"
          />
        )}

        {/* Y-axis grid + labels */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const val = (yMax * i) / yTicks;
          const y = yPos(val);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + CW}
                y2={y}
                stroke="var(--outline-variant)"
                strokeWidth="0.8"
                strokeDasharray="4 3"
              />
              <text
                x={PAD.left - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--on-surface-sub)"
                fontFamily="Manrope, sans-serif"
              >
                {fmtAxis(val)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#srs-area-grad)" />

        {/* Balance line */}
        <path
          d={balancePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Withdrawal start marker */}
        {withdrawalStartYear >= xMin && withdrawalStartYear <= xMax && (
          <line
            x1={xPos(withdrawalStartYear)}
            y1={PAD.top}
            x2={xPos(withdrawalStartYear)}
            y2={PAD.top + CH}
            stroke="var(--primary)"
            strokeWidth="1.5"
            strokeDasharray="5 3"
            strokeOpacity="0.6"
          />
        )}

        {/* X-axis labels — show every N years */}
        {data
          .filter((_, i) => {
            const step = data.length <= 10 ? 1 : data.length <= 20 ? 2 : 5;
            return i % step === 0 || i === data.length - 1;
          })
          .map((d) => (
            <text
              key={d.year}
              x={xPos(d.year)}
              y={PAD.top + CH + 16}
              textAnchor="middle"
              fontSize="10"
              fill="var(--on-surface-sub)"
              fontFamily="Manrope, sans-serif"
            >
              {d.year}
            </text>
          ))}

        {/* Hover invisible hit areas */}
        {data.map((d, i) => (
          <rect
            key={d.year}
            x={xPos(d.year) - CW / (2 * data.length)}
            y={PAD.top}
            width={CW / data.length}
            height={CH}
            fill="transparent"
            onMouseEnter={() => setHoveredIdx(i)}
          />
        ))}

        {/* Hovered dot */}
        {hovered && (
          <circle
            cx={tooltipX}
            cy={tooltipY}
            r="4"
            fill="var(--primary)"
            stroke="white"
            strokeWidth="2"
          />
        )}

        {/* Tooltip */}
        {hovered && (
          <g transform={`translate(${tooltipRight ? tooltipX - 148 : tooltipX + 8}, ${Math.max(PAD.top, tooltipY - 60)})`}>
            <rect x={0} y={0} width={140} height={hovered.annualWithdrawal > 0 ? 68 : 52} rx="6" ry="6"
              fill="var(--surface-container-highest)" stroke="var(--outline-variant)" strokeWidth="1" />
            <text x={8} y={17} fontSize="10.5" fontWeight="700" fill="var(--on-surface)" fontFamily="Manrope, sans-serif">
              {hovered.year}
            </text>
            <text x={8} y={32} fontSize="10" fill="var(--on-surface-sub)" fontFamily="Manrope, sans-serif">
              Balance: {fmt(hovered.balance)}
            </text>
            <text x={8} y={46} fontSize="10" fill="var(--on-surface-sub)" fontFamily="Manrope, sans-serif">
              Interest: +{fmt(hovered.interest)}
            </text>
            {hovered.annualWithdrawal > 0 && (
              <text x={8} y={60} fontSize="10" fill="var(--tertiary)" fontFamily="Manrope, sans-serif">
                Withdrawal: {fmt(hovered.annualWithdrawal)}
              </text>
            )}
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 flex-wrap" style={{ paddingLeft: `${PAD.left}px` }}>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 20, height: 3, background: "var(--primary)", borderRadius: 2 }} />
          <span style={{ fontSize: "0.6875rem", color: "var(--on-surface-sub)", fontFamily: "Manrope, sans-serif" }}>Portfolio Balance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 14, height: 10, background: "var(--primary)", opacity: 0.18, borderRadius: 2 }} />
          <span style={{ fontSize: "0.6875rem", color: "var(--on-surface-sub)", fontFamily: "Manrope, sans-serif" }}>Withdrawal Phase</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const DEPOSITS_KEY = "srs:deposits";
const WITHDRAWAL_KEY = "srs:withdrawal";

const DEFAULT_WITHDRAWAL: WithdrawalSettings = {
  startDate: `${new Date().getFullYear() + 20}-01-01`,
  years: 10,
};

const DEFAULT_DEPOSITS: Deposit[] = [
  { id: "srs_default_1", name: "T-Bills", amount: 15400, startDate: todayISO(), interestRate: 3.5 },
];

export function SRSCalculatorPage() {
  // ── Persisted settings ──
  const [s] = useToolState("srs-calculator", {});

  // ── Deposits array ──
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // ── Withdrawal settings ──
  const [withdrawal, setWithdrawal] = useState<WithdrawalSettings>(DEFAULT_WITHDRAWAL);

  useEffect(() => {
    setDeposits(loadArray<Deposit>(DEPOSITS_KEY, DEFAULT_DEPOSITS));
    const raw = localStorage.getItem(WITHDRAWAL_KEY);
    if (raw) {
      try {
        setWithdrawal(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
    setHydrated(true);
  }, []);

  // Persist deposits
  useEffect(() => {
    if (!hydrated) return;
    saveArray(DEPOSITS_KEY, deposits);
  }, [deposits, hydrated]);

  // Persist withdrawal settings
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(WITHDRAWAL_KEY, JSON.stringify(withdrawal));
    } catch {
      // ignore
    }
  }, [withdrawal, hydrated]);

  // ── Deposit CRUD ──
  const addDeposit = useCallback(() => {
    setDeposits((prev) => [
      ...prev,
      { id: genId("srs"), name: "", amount: 10000, startDate: todayISO(), interestRate: 3.5 },
    ]);
  }, []);

  const updateDeposit = useCallback(
    (id: string, field: keyof Deposit, value: string | number) => {
      setDeposits((prev) =>
        prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
      );
    },
    [],
  );

  const deleteDeposit = useCallback((id: string) => {
    setDeposits((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // ── Withdrawal helpers ──
  const updateWithdrawal = useCallback(
    (field: keyof WithdrawalSettings, value: string | number) => {
      setWithdrawal((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // ── Derived stats ──
  const totalDeposits = useMemo(
    () => deposits.reduce((s, d) => s + Math.max(0, d.amount), 0),
    [deposits],
  );

  const avgRate = useMemo(() => weightedAvgRate(deposits), [deposits]);

  const withdrawalStartYear = yearFromISO(withdrawal.startDate);
  const withdrawalEndYear = withdrawalStartYear + withdrawal.years - 1;

  const projectionData = useMemo(
    () => projectSRS(deposits, withdrawal),
    [deposits, withdrawal],
  );

  // Find balance at withdrawal start
  const balanceAtWithdrawal = useMemo(() => {
    const pt = projectionData.find((p) => p.year === withdrawalStartYear);
    return pt?.balance ?? totalDeposits;
  }, [projectionData, withdrawalStartYear, totalDeposits]);

  // Annual withdrawal amount (from first withdrawal year data point)
  const firstYearWithdrawal = useMemo(() => {
    const pt = projectionData.find((p) => p.annualWithdrawal > 0);
    return pt?.annualWithdrawal ?? 0;
  }, [projectionData]);

  const totalInterestEarned = useMemo(() => {
    const last = projectionData[projectionData.length - 1];
    return last?.interest ?? 0;
  }, [projectionData]);

  if (!hydrated) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <SiteHeader />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
          style={{ color: "var(--on-surface-sub)", textDecoration: "none" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
          Back to Home
        </Link>

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 48,
              height: 48,
              background: "var(--primary)",
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
              SRS Fund
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-sub)" }}>
              Track SRS deposits and investments. Plan your tax-efficient drawdown over up to 10 years.
            </p>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[560px_1fr] gap-6">
          {/* ── Left: Inputs ── */}
          <div className="flex flex-col gap-5">

            {/* Deposits Section */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "var(--surface-container-low)",
                border: "1px solid var(--outline-variant)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                  SRS Deposits & Investments
                </h2>
              </div>
              <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)" }}>
                Add each SRS-funded account or instrument with its balance, start date, and interest rate.
              </p>

              {deposits.length > 0 && (
                <div className="mb-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-[4fr_3fr_3fr_2fr_auto] gap-2 mb-1.5">
                    {["Name", "Amount ($)", "Start Date", "Rate %", ""].map((h) => (
                      <p key={h} className="text-[0.7rem] font-semibold uppercase tracking-wide"
                        style={{ color: "var(--on-surface-sub)", paddingLeft: "0.375rem" }}>
                        {h}
                      </p>
                    ))}
                  </div>

                  {/* Rows */}
                  <div className="flex flex-col gap-3">
                    {deposits.map((d, i) => (
                      <DepositRow
                        key={d.id}
                        deposit={d}
                        onUpdate={updateDeposit}
                        onDelete={deleteDeposit}
                        onMoveUp={i > 0 ? () => setDeposits((prev) => { const a = [...prev]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; }) : undefined}
                        onMoveDown={i < deposits.length - 1 ? () => setDeposits((prev) => { const a = [...prev]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a; }) : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}

              {deposits.length === 0 && (
                <p className="text-sm py-4 text-center" style={{ color: "var(--on-surface-sub)" }}>
                  No deposits added yet.
                </p>
              )}

              <button
                type="button"
                onClick={addDeposit}
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontFamily: "Manrope, sans-serif", padding: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Deposit / Investment
              </button>
            </div>

            {/* Withdrawal Section */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "var(--surface-container-low)",
                border: "1px solid var(--outline-variant)",
              }}
            >
              <h2 className="text-base font-bold mb-1" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                Withdrawal Plan
              </h2>
              <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)" }}>
                Drawdown spread evenly across consecutive years (max 10 years per MAS regulations).
              </p>

              <div className="flex flex-col gap-4">
                {/* Withdrawal start date */}
                <div>
                  <p className="text-[0.8125rem] font-medium mb-1.5" style={{ color: "var(--on-surface-sub)" }}>
                    Withdrawal Start Date
                  </p>
                  <input
                    type="date"
                    value={withdrawal.startDate}
                    onChange={(e) => updateWithdrawal("startDate", e.target.value)}
                    style={{
                      width: "100%",
                      background: "var(--surface-container-highest)",
                      border: "none",
                      borderBottom: "2px solid var(--outline-variant)",
                      borderRadius: "0.25rem 0.25rem 0 0",
                      padding: "0.625rem 0.5rem",
                      fontSize: "0.9375rem",
                      fontFamily: "Manrope, sans-serif",
                      fontWeight: 500,
                      color: "var(--on-surface)",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Withdrawal years (1–10) */}
                <div>
                  <p className="text-[0.8125rem] font-medium mb-1.5" style={{ color: "var(--on-surface-sub)" }}>
                    Withdrawal Period (Years)
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => updateWithdrawal("years", yr)}
                        className="w-9 h-9 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          background: withdrawal.years === yr ? "var(--primary)" : "var(--surface-container-highest)",
                          color: withdrawal.years === yr ? "white" : "var(--on-surface)",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "Manrope, sans-serif",
                        }}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: "var(--on-surface-sub)" }}>
                    Withdrawal window: {withdrawalStartYear} – {withdrawalEndYear}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Stats + Chart ── */}
          <div className="flex flex-col gap-5">

            {/* Stat cards row 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Total Deposits */}
              <div
                className="rounded-2xl p-4 col-span-2"
                style={{
                  background: "var(--primary)",
                  color: "white",
                }}
              >
                <p className="text-[0.6875rem] font-semibold uppercase tracking-widest opacity-80 mb-1">
                  Total Deposits
                </p>
                <p className="text-2xl font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>
                  {fmt(totalDeposits)}
                </p>
                <p className="text-xs mt-1 opacity-70">
                  Across {deposits.length} {deposits.length === 1 ? "entry" : "entries"}
                </p>
              </div>

              {/* Weighted Avg Rate */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "var(--surface-container-low)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <p className="text-[0.6875rem] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-sub)" }}>
                  Avg Rate
                </p>
                <p className="text-2xl font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                  {avgRate.toFixed(2)}%
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                  Weighted p.a.
                </p>
              </div>

              {/* Balance at withdrawal */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "var(--surface-container-low)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <p className="text-[0.6875rem] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-sub)" }}>
                  Value at {withdrawalStartYear}
                </p>
                <p className="text-2xl font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                  {fmt(balanceAtWithdrawal)}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                  Before withdrawals
                </p>
              </div>
            </div>

            {/* Stat cards row 2 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Annual withdrawal */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "var(--surface-container-low)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <p className="text-[0.6875rem] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-sub)" }}>
                  Est. Annual Withdrawal
                </p>
                <p className="text-2xl font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                  {fmt(firstYearWithdrawal)}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                  {fmt(firstYearWithdrawal / 12)}/mth (Yr 1)
                </p>
              </div>

              {/* Withdrawal window */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "var(--surface-container-low)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <p className="text-[0.6875rem] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-sub)" }}>
                  Withdrawal Window
                </p>
                <p className="text-2xl font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                  {withdrawal.years} yr{withdrawal.years !== 1 ? "s" : ""}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                  {withdrawalStartYear} – {withdrawalEndYear}
                </p>
              </div>

              {/* Total interest earned */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "var(--surface-container-low)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <p className="text-[0.6875rem] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--on-surface-sub)" }}>
                  Total Interest
                </p>
                <p className="text-2xl font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                  {fmt(totalInterestEarned)}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                  Earned over full period
                </p>
              </div>
            </div>

            {/* Portfolio Projection Chart */}
            {projectionData.length > 1 && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "var(--surface-container-low)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <h2 className="text-base font-bold mb-4" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                  Portfolio Projection
                </h2>
                <ProjectionChart
                  data={projectionData}
                  withdrawalStartYear={withdrawalStartYear}
                  withdrawalEndYear={withdrawalEndYear}
                />
              </div>
            )}

            {/* Deposits Breakdown Table */}
            {deposits.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "var(--surface-container-low)",
                  border: "1px solid var(--outline-variant)",
                }}
              >
                <h2 className="text-base font-bold mb-4" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                  Deposits Breakdown
                </h2>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                        {["Name", "Amount", "Start Date", "Rate % p.a.", "Share"].map((h) => (
                          <th key={h} style={{
                            padding: "0.375rem 0.75rem",
                            textAlign: "left",
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "var(--on-surface-sub)",
                            fontFamily: "Manrope, sans-serif",
                            whiteSpace: "nowrap",
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.map((d, i) => {
                        const share = totalDeposits > 0 ? (d.amount / totalDeposits) * 100 : 0;
                        return (
                          <tr
                            key={d.id}
                            style={{
                              borderBottom: i < deposits.length - 1 ? "1px solid var(--outline-variant)" : "none",
                              background: i % 2 === 0 ? "transparent" : "var(--surface-container-highest)",
                            }}
                          >
                            <td style={{ padding: "0.5rem 0.75rem", color: "var(--on-surface)", fontWeight: 600, fontFamily: "Manrope, sans-serif" }}>
                              {d.name || "—"}
                            </td>
                            <td style={{ padding: "0.5rem 0.75rem", color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                              {fmt(d.amount)}
                            </td>
                            <td style={{ padding: "0.5rem 0.75rem", color: "var(--on-surface-sub)", fontFamily: "Manrope, sans-serif", whiteSpace: "nowrap" }}>
                              {d.startDate}
                            </td>
                            <td style={{ padding: "0.5rem 0.75rem", color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                              {d.interestRate.toFixed(2)}%
                            </td>
                            <td style={{ padding: "0.5rem 0.75rem", fontFamily: "Manrope, sans-serif" }}>
                              <div className="flex items-center gap-2">
                                <div style={{ width: 48, height: 6, background: "var(--outline-variant)", borderRadius: 3, overflow: "hidden" }}>
                                  <div style={{ width: `${share}%`, height: "100%", background: "var(--primary)", borderRadius: 3 }} />
                                </div>
                                <span style={{ color: "var(--on-surface-sub)", fontSize: "0.8125rem" }}>
                                  {share.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Totals row */}
                      <tr style={{ borderTop: "2px solid var(--outline-variant)", background: "var(--surface-container-highest)" }}>
                        <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700, color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                          Total
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem", fontWeight: 700, color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
                          {fmt(totalDeposits)}
                        </td>
                        <td colSpan={2} style={{ padding: "0.5rem 0.75rem", color: "var(--on-surface-sub)", fontFamily: "Manrope, sans-serif" }}>
                        </td>
                        <td style={{ padding: "0.5rem 0.75rem", color: "var(--on-surface-sub)", fontFamily: "Manrope, sans-serif" }}>
                          100%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div
          className="rounded-2xl p-5 mt-6"
          style={{
            background: "var(--surface-container-low)",
            border: "1px solid var(--outline-variant)",
          }}
        >
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
            How It Works
          </h2>
          <ol className="flex flex-col gap-2">
            {[
              "Add each SRS account or instrument (T-Bills, fixed deposits, unit trusts, etc.) with its balance, start date and annual interest / return rate.",
              "The projection compounds each instrument at its own rate from its start date until the withdrawal phase begins.",
              "During the withdrawal window, the total portfolio value is drawn down evenly across the years you specify (1–10 consecutive years, per MAS rules).",
              "Each year during drawdown, the remaining balance continues to earn interest before the year's withdrawal is made.",
              "SRS withdrawals are taxed at 50% of the withdrawn amount — consult a tax adviser for your specific liability.",
            ].map((text, i) => (
              <li key={i} className="flex gap-3 text-sm" style={{ color: "var(--on-surface-sub)" }}>
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "var(--primary-container)", color: "var(--on-primary-container)", marginTop: "0.1rem" }}
                >
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}

export default SRSCalculatorPage;
