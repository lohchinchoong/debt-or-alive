"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useToolState } from "@/hooks/useToolState";

// ─── Types ────────────────────────────────────────────────────────────────────
type SavingsSource = {
  id: string;
  name: string;
  balance: number;
  startDate: string; // YYYY-MM-DD
  interestRate: number; // % p.a.
};

type ProjectionPoint = {
  month: number;
  total: number;
  interest: number;
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

let idCounter = 0;
function genId(): string {
  return `sf_${Date.now()}_${++idCounter}`;
}

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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Projection ──────────────────────────────────────────────────────────────
function projectSavings(
  sources: SavingsSource[],
  projectionMonths: number,
): ProjectionPoint[] {
  if (sources.length === 0) return [];

  const points: ProjectionPoint[] = [];
  const initialTotal = sources.reduce((s, src) => s + Math.max(0, src.balance), 0);
  points.push({ month: 0, total: initialTotal, interest: 0 });

  // Track each source's balance individually
  const balances = sources.map((src) => Math.max(0, src.balance));
  let totalInterest = 0;

  for (let m = 1; m <= projectionMonths; m++) {
    let monthTotal = 0;
    for (let i = 0; i < sources.length; i++) {
      const monthlyRate = sources[i].interestRate / 100 / 12;
      const interest = balances[i] * monthlyRate;
      balances[i] += interest;
      totalInterest += interest;
      monthTotal += balances[i];
    }
    points.push({ month: m, total: monthTotal, interest: totalInterest });
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

// ─── SourceRow ───────────────────────────────────────────────────────────────
function SourceRow({
  source,
  onUpdate,
  onDelete,
}: {
  source: SavingsSource;
  onUpdate: (id: string, field: keyof SavingsSource, value: string | number) => void;
  onDelete: (id: string) => void;
}) {
  const [nameFocused, setNameFocused] = useState(false);
  const [balanceFocused, setBalanceFocused] = useState(false);
  const [dateFocused, setDateFocused] = useState(false);
  const [rateFocused, setRateFocused] = useState(false);

  const inputStyle = (focused: boolean) => ({
    width: "100%",
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
    <div className="grid grid-cols-[3fr_3fr_3fr_2fr_auto] gap-2 items-end">
      {/* Name */}
      <div>
        <input
          type="text"
          value={source.name}
          placeholder="e.g. OCBC 360"
          onChange={(e) => onUpdate(source.id, "name", e.target.value)}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          style={inputStyle(nameFocused)}
        />
      </div>

      {/* Balance */}
      <div>
        <input
          type="number"
          value={source.balance}
          min={0}
          step={1000}
          onChange={(e) => onUpdate(source.id, "balance", parseFloat(e.target.value) || 0)}
          onFocus={() => setBalanceFocused(true)}
          onBlur={() => setBalanceFocused(false)}
          style={inputStyle(balanceFocused)}
        />
      </div>

      {/* Start Date */}
      <div>
        <input
          type="date"
          value={source.startDate}
          onChange={(e) => onUpdate(source.id, "startDate", e.target.value)}
          onFocus={() => setDateFocused(true)}
          onBlur={() => setDateFocused(false)}
          style={inputStyle(dateFocused)}
        />
      </div>

      {/* Interest Rate */}
      <div>
        <input
          type="number"
          value={source.interestRate}
          min={0}
          max={50}
          step={0.1}
          onChange={(e) => onUpdate(source.id, "interestRate", parseFloat(e.target.value) || 0)}
          onFocus={() => setRateFocused(true)}
          onBlur={() => setRateFocused(false)}
          style={inputStyle(rateFocused)}
        />
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(source.id)}
        className="p-1.5 rounded-md transition-colors hover:bg-red-50"
        style={{ color: "var(--on-surface-sub)", lineHeight: 1 }}
        aria-label="Remove source"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ─── ProjectionChart ─────────────────────────────────────────────────────────
function ProjectionChart({
  data,
  targetAmount,
  monthlyExpenses,
}: {
  data: ProjectionPoint[];
  targetAmount: number;
  monthlyExpenses: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  if (data.length < 2) return null;

  const W = 600;
  const H = 260;
  const PAD = { top: 24, right: 20, bottom: 40, left: 58 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const totalMonths = data[data.length - 1].month;
  const maxVal = Math.max(
    ...data.map((d) => d.total),
    targetAmount > 0 ? targetAmount : 0,
  );
  const yMax = niceMax(maxVal);

  const xOf = (m: number) => PAD.left + (m / totalMonths) * CW;
  const yOf = (v: number) => PAD.top + CH - (v / yMax) * CH;

  // Total savings path
  const pts = data.map((d) => `${xOf(d.month).toFixed(1)},${yOf(d.total).toFixed(1)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${xOf(totalMonths).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${PAD.left.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  // X-axis labels (in years)
  const totalYears = totalMonths / 12;
  const xStep = totalYears <= 3 ? 6 : totalYears <= 5 ? 12 : 24;
  const xLabels: number[] = [];
  for (let m = 0; m <= totalMonths; m += xStep) xLabels.push(m);
  if (xLabels[xLabels.length - 1] !== totalMonths) {
    const last = xLabels[xLabels.length - 1];
    if (totalMonths - last > xStep * 0.4) xLabels.push(totalMonths);
  }

  // Hover logic
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const fraction = Math.max(0, Math.min(1, (svgX - PAD.left) / CW));
    setHoveredIdx(Math.round(fraction * (data.length - 1)));
  };

  const hd = hoveredIdx !== null ? data[hoveredIdx] : null;
  const hx = hd ? xOf(hd.month) : 0;
  const TW = 190;
  const TH = 78;
  const tooltipX = hd ? (hx < PAD.left + CW / 2 ? hx + 10 : hx - TW - 10) : 0;

  // Target line
  const targetY = targetAmount > 0 ? yOf(targetAmount) : -1;
  const showTarget = targetAmount > 0 && targetY >= PAD.top - 5 && targetY <= PAD.top + CH + 5;

  // Find month where savings first exceed target
  const crossMonth = targetAmount > 0 ? data.find((d) => d.total >= targetAmount)?.month ?? -1 : -1;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[0.9375rem] font-semibold mb-1" style={{ color: "var(--on-surface)" }}>
        Savings Projection
      </p>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: "#00351f" }} />
          <span className="text-[0.6875rem]" style={{ color: "var(--on-surface-sub)" }}>Total savings</span>
        </div>
        {showTarget && (
          <div className="flex items-center gap-1.5">
            <div style={{ width: 14, height: 2, borderRadius: 2, backgroundColor: "#c05621", opacity: 0.7 }} />
            <span className="text-[0.6875rem]" style={{ color: "var(--on-surface-sub)" }}>Target</span>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        aria-label="Savings projection chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="ef-fill" x1="0" y1="0" x2="0" y2="1">
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
        {xLabels.map((m) => (
          <text key={m} x={xOf(m)} y={H - 6} textAnchor="middle" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            {m === 0 ? "Now" : m < 12 ? `${m}m` : `Yr ${Math.round(m / 12)}`}
          </text>
        ))}

        {/* Target line */}
        {showTarget && (
          <line x1={PAD.left} y1={targetY} x2={W - PAD.right} y2={targetY} stroke="#c05621" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
        )}

        {/* Area fill */}
        <path d={area} fill="url(#ef-fill)" />

        {/* Savings line */}
        <path d={line} fill="none" stroke="#00351f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Cross point marker */}
        {crossMonth > 0 && (
          <circle cx={xOf(crossMonth)} cy={yOf(data[crossMonth]?.total ?? 0)} r="4" fill="#00351f" stroke="#fff" strokeWidth="1.5" />
        )}

        {/* Hover crosshair & tooltip */}
        {hd && (
          <>
            <line x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + CH} stroke="#00351f" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.5" />
            <circle cx={hx} cy={yOf(hd.total)} r="4" fill="#00351f" stroke="#fff" strokeWidth="1.5" />

            <g transform={`translate(${tooltipX},${Math.max(PAD.top, yOf(hd.total) - TH / 2)})`}>
              <rect width={TW} height={TH} rx="6" fill="var(--surface-container-lowest)" stroke="var(--outline-variant)" strokeWidth="0.75" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.12))" />
              <text x="10" y="18" fontSize="11" fontWeight="700" fill="var(--on-surface)" fontFamily="Manrope, sans-serif">
                {hd.month === 0 ? "Now" : hd.month < 12 ? `Month ${hd.month}` : `Year ${(hd.month / 12).toFixed(1)}`}
              </text>
              <text x="10" y="36" fontSize="10" fill="var(--on-surface-sub)" fontFamily="Manrope, sans-serif">
                Total: {fmt(hd.total)}
              </text>
              <text x="10" y="52" fontSize="10" fill="var(--primary)" fontFamily="Manrope, sans-serif">
                Interest earned: {fmt(hd.interest)}
              </text>
              <text x="10" y="68" fontSize="10" fill="var(--on-surface-sub)" fontFamily="Manrope, sans-serif">
                Covers: {monthlyExpenses > 0 ? `${(hd.total / monthlyExpenses).toFixed(1)} months` : "—"}
              </text>
            </g>
          </>
        )}
      </svg>
    </div>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, target }: { current: number; target: number }) {
  if (target <= 0) return null;
  const pct = Math.min((current / target) * 100, 100);
  const achieved = current >= target;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[0.9375rem] font-semibold" style={{ color: "var(--on-surface)" }}>
          Progress to Target
        </p>
        <p className="text-sm font-bold" style={{ color: achieved ? "var(--primary)" : "var(--on-surface)" }}>
          {pct.toFixed(0)}%
        </p>
      </div>

      <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-container-high)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: achieved
              ? "linear-gradient(90deg, var(--primary), var(--primary-container))"
              : "linear-gradient(90deg, var(--primary), #2a7355)",
          }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <p className="text-xs" style={{ color: "var(--on-surface-sub)" }}>
          {fmt(current)}
        </p>
        <p className="text-xs" style={{ color: "var(--on-surface-sub)" }}>
          Target: {fmt(target)}
        </p>
      </div>

      {achieved && (
        <p className="text-xs font-semibold mt-2" style={{ color: "var(--primary)" }}>
          Target reached! Your emergency fund is fully funded.
        </p>
      )}
    </div>
  );
}

// ─── SourcesTable ────────────────────────────────────────────────────────────
function SourcesTable({ sources }: { sources: SavingsSource[] }) {
  if (sources.length === 0) return null;

  const totalBalance = sources.reduce((s, src) => s + Math.max(0, src.balance), 0);
  const today = todayISO();

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <div className="px-6 pt-5 pb-3">
        <p className="text-[0.9375rem] font-semibold" style={{ color: "var(--on-surface)" }}>
          Sources Breakdown
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(192,201,192,0.3)" }}>
              <th className="px-6 py-3 text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Source</th>
              <th className="px-6 py-3 text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Balance</th>
              <th className="px-6 py-3 text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Start Date</th>
              <th className="px-6 py-3 text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Duration</th>
              <th className="px-6 py-3 text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Rate</th>
              <th className="px-6 py-3 text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((src, i) => {
              const balance = Math.max(0, src.balance);
              const days = src.startDate ? daysBetween(src.startDate, today) : 0;
              const share = totalBalance > 0 ? (balance / totalBalance) * 100 : 0;
              const durationLabel = days <= 0 ? "—" : days < 365 ? `${Math.round(days / 30)}m` : `${(days / 365).toFixed(1)}y`;

              return (
                <tr
                  key={src.id}
                  style={{ backgroundColor: i % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)" }}
                >
                  <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
                    {src.name || "Unnamed"}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                    {fmt(balance)}
                  </td>
                  <td className="px-6 py-3.5 text-sm" style={{ color: "var(--on-surface-sub)" }}>
                    {formatDate(src.startDate)}
                  </td>
                  <td className="px-6 py-3.5 text-sm" style={{ color: "var(--on-surface-sub)" }}>
                    {durationLabel}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-semibold" style={{ color: "var(--primary)" }}>
                    {src.interestRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-3.5 text-sm" style={{ color: "var(--on-surface-sub)" }}>
                    {share.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid rgba(192,201,192,0.3)" }}>
              <td className="px-6 py-3.5 text-sm font-bold" style={{ color: "var(--on-surface)" }}>Total</td>
              <td className="px-6 py-3.5 text-sm font-bold" style={{ color: "var(--on-surface)" }}>{fmt(totalBalance)}</td>
              <td colSpan={3} />
              <td className="px-6 py-3.5 text-sm font-bold" style={{ color: "var(--on-surface)" }}>100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function EmergencyFundPage() {
  const [s, set] = useToolState("tool:emergency-fund", {
    monthlyExpenses: 3000,
    targetMonths: 6,
  });

  const { monthlyExpenses, targetMonths } = s;
  const projectionYears = 5;

  // ── Savings sources (dynamic array, localStorage) ──
  const [sources, setSourcesRaw] = useState<SavingsSource[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSourcesRaw(loadArray<SavingsSource>("emergency-fund:sources", []));
    setMounted(true);
  }, []);

  const setSources = useCallback((fn: (prev: SavingsSource[]) => SavingsSource[]) => {
    setSourcesRaw((prev) => {
      const next = fn(prev);
      saveArray("emergency-fund:sources", next);
      return next;
    });
  }, []);

  const addSource = () => {
    setSources((prev) => [
      ...prev,
      { id: genId(), name: "", balance: 0, startDate: todayISO(), interestRate: 0 },
    ]);
  };

  const updateSource = (id: string, field: keyof SavingsSource, value: string | number) => {
    setSources((prev) =>
      prev.map((src) => (src.id === id ? { ...src, [field]: value } : src)),
    );
  };

  const deleteSource = (id: string) => {
    setSources((prev) => prev.filter((src) => src.id !== id));
  };

  // ── Derived ──
  const totalSavings = useMemo(
    () => sources.reduce((s, src) => s + Math.max(0, src.balance), 0),
    [sources],
  );

  const targetAmount = monthlyExpenses * targetMonths;
  const monthsCovered = monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;

  // Weighted average interest rate
  const weightedRate = useMemo(() => {
    if (totalSavings <= 0) return 0;
    return sources.reduce((s, src) => s + Math.max(0, src.balance) * src.interestRate, 0) / totalSavings;
  }, [sources, totalSavings]);

  // Projection data
  const projectionData = useMemo(
    () => projectSavings(sources, projectionYears * 12),
    [sources],
  );

  // Projected interest earned
  const projectedInterest = projectionData.length > 0 ? projectionData[projectionData.length - 1].interest : 0;

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
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>

              <div>
                <h1
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                >
                  Savings / Emergency Fund
                </h1>
                <p className="mt-2 text-base max-w-xl" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Track your savings across multiple accounts. See how interest grows your safety net and whether you&apos;ve hit your target.
                </p>
              </div>
            </div>
          </div>

          {/* ── Main Grid ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left — Parameters */}
            <div className="lg:col-span-5 space-y-5">
              {/* Target Settings */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
              >
                <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                  Target Settings
                </p>
                <p className="text-sm mt-0.5 mb-6" style={{ color: "var(--on-surface-sub)" }}>
                  Set your monthly expenses and savings target
                </p>

                <div className="space-y-5">
                  <FocusInput
                    label="Monthly Expenses (S$)"
                    value={monthlyExpenses}
                    onChange={(v) => set({ monthlyExpenses: v })}
                    min={0}
                    step={100}
                    hint={`Annual: ${fmt(monthlyExpenses * 12)}`}
                  />
                  <FocusInput
                    label="Target (Months)"
                    value={targetMonths}
                    onChange={(v) => set({ targetMonths: v })}
                    min={1}
                    max={36}
                    hint="Recommended: 3–6 months"
                  />
                </div>

                {/* Target amount strip */}
                <div
                  className="mt-6 rounded-lg px-4 py-3.5"
                  style={{ backgroundColor: "var(--surface-container-low)" }}
                >
                  <p className="text-[0.75rem] font-medium mb-0.5" style={{ color: "var(--on-surface-sub)" }}>
                    Target Amount
                  </p>
                  <p className="text-xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
                    {fmt(targetAmount)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-sub)" }}>
                    {targetMonths} months × {fmt(monthlyExpenses)}/month
                  </p>
                </div>
              </div>

              {/* Savings Sources */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                    Savings Sources
                  </p>
                  {weightedRate > 0 && (
                    <p className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                      Avg {weightedRate.toFixed(2)}% p.a.
                    </p>
                  )}
                </div>
                <p className="text-sm mt-0.5 mb-5" style={{ color: "var(--on-surface-sub)" }}>
                  Add your savings accounts, fixed deposits, or any liquid funds.
                </p>

                {/* Column headers */}
                {sources.length > 0 && (
                  <div className="grid grid-cols-[3fr_3fr_3fr_2fr_auto] gap-2 mb-2">
                    <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Name</p>
                    <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Balance ($)</p>
                    <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Start Date</p>
                    <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Rate %</p>
                    <div style={{ width: 28 }} />
                  </div>
                )}

                {/* Source rows */}
                <div className="space-y-2.5">
                  {sources.map((src) => (
                    <SourceRow
                      key={src.id}
                      source={src}
                      onUpdate={updateSource}
                      onDelete={deleteSource}
                    />
                  ))}
                </div>

                {/* Add button */}
                <button
                  type="button"
                  onClick={addSource}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
                  style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "Manrope, sans-serif", padding: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add savings source
                </button>
              </div>
            </div>

            {/* Right — Results */}
            <div className="lg:col-span-7 space-y-5">
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Total Savings — gradient */}
                <div
                  className="rounded-xl p-5 flex flex-col justify-between"
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                    boxShadow: "0 12px 32px rgba(0,53,31,0.20)",
                    minHeight: "7.5rem",
                  }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.65)" }}>
                    Total Savings
                  </p>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold leading-none mt-3" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
                      {fmt(totalSavings)}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                      Across {sources.length} source{sources.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Months Covered */}
                <div
                  className="rounded-xl p-5 flex flex-col justify-between"
                  style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)", minHeight: "7.5rem" }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: monthsCovered >= targetMonths ? "var(--primary)" : "#c05621" }}>
                    Months Covered
                  </p>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold leading-none mt-3" style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}>
                      {monthsCovered > 0 ? monthsCovered.toFixed(1) : "—"}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "var(--on-surface-sub)" }}>
                      {monthsCovered >= targetMonths
                        ? `Target of ${targetMonths} months met`
                        : monthsCovered > 0
                          ? `${(targetMonths - monthsCovered).toFixed(1)} months to go`
                          : "Add savings sources"}
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
                    Weighted Avg Rate
                  </p>
                  <p className="text-xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
                    {weightedRate > 0 ? `${weightedRate.toFixed(2)}%` : "—"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                    Per annum, across all sources
                  </p>
                </div>

                <div
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase mb-2" style={{ color: projectedInterest > 0 ? "var(--primary)" : "var(--on-surface-sub)" }}>
                    Projected Interest
                  </p>
                  <p className="text-xl font-bold" style={{ color: projectedInterest > 0 ? "var(--primary)" : "var(--on-surface)", letterSpacing: "-0.01em" }}>
                    {projectedInterest > 0 ? fmt(projectedInterest) : "—"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                    Over {projectionYears} year{projectionYears !== 1 ? "s" : ""} (no withdrawals)
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <ProgressBar current={totalSavings} target={targetAmount} />

              {/* Projection chart */}
              <ProjectionChart
                data={projectionData}
                targetAmount={targetAmount}
                monthlyExpenses={monthlyExpenses}
              />
            </div>
          </div>

          {/* ── Sources Table ──────────────────────────────────────────── */}
          <SourcesTable sources={sources} />

          {/* ── How It Works ───────────────────────────────────────────── */}
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

              {/* 1 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>1</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Why an Emergency Fund?</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  An emergency fund protects you from unexpected events — job loss, medical bills, or urgent repairs — without
                  taking on debt. Financial advisers typically recommend saving{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>3 to 6 months</span> of living expenses
                  in easily accessible accounts.
                </p>
              </div>

              {/* 2 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>2</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Multiple Sources</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  Your savings might be spread across high-yield savings accounts, fixed deposits, or money market funds —
                  each with different interest rates. This tool lets you track them all in one place and see the combined picture.
                </p>
              </div>

              {/* 3 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>3</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Interest Projection</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  Each source grows at its own interest rate, compounded monthly. The chart shows how your total savings
                  evolve over time — even without additional contributions. The{" "}
                  <span className="font-semibold" style={{ color: "var(--on-surface)" }}>weighted average rate</span> reflects
                  the effective rate across all your sources, weighted by balance.
                </p>
              </div>

              {/* 4 */}
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: "var(--primary)", color: "#fff" }}>4</span>
                  <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Months Covered</h3>
                </div>
                <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  The <span className="font-semibold" style={{ color: "var(--on-surface)" }}>Months Covered</span> metric
                  divides your total savings by monthly expenses to show how long you could sustain yourself without income.
                  The progress bar tracks how close you are to your target number of months.
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
              <span className="font-semibold">Disclaimer:</span> Projections assume a constant interest rate and no
              additional contributions or withdrawals. Actual returns may vary. This tool does not constitute financial advice.
              Please consult a qualified financial adviser before making financial decisions.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default EmergencyFundPage;
