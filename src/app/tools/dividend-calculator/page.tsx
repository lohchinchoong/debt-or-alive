"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

type YieldSource = {
  id: string;
  name: string;
  value: number;
  yieldRate: number; // annual %
};

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
  return `div_${Date.now()}_${++idCounter}`;
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

// ─── InlineInput ─────────────────────────────────────────────────────────────

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
        padding: "0.5rem 0.375rem",
        fontSize: "0.875rem",
        fontFamily: "Manrope, sans-serif",
        fontWeight: 500,
        color: "var(--on-surface)",
        outline: "none",
        transition: "border-color 0.15s ease",
      }}
    />
  );
}

// ─── SourceRow ───────────────────────────────────────────────────────────────

function SourceRow({
  name,
  value,
  rate,
  annualIncome,
  onChangeName,
  onChangeValue,
  onChangeRate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  name: string;
  value: number;
  rate: number;
  annualIncome: number;
  onChangeName: (v: string) => void;
  onChangeValue: (v: number) => void;
  onChangeRate: (v: number) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <div className="grid grid-cols-[3fr_3fr_3fr_auto] gap-2 items-start">
      {/* Name */}
      <div className="flex flex-col">
        <InlineInput value={name} onChange={onChangeName} placeholder="Name" />
        <div className="h-[1.25rem]" />
      </div>

      {/* Value */}
      <div className="flex flex-col">
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

      {/* Yield Rate + monthly income */}
      <div className="flex flex-col">
        <InlineInput
          value={rate}
          onChange={(v) => onChangeRate(parseFloat(v) || 0)}
          type="number"
          placeholder="% p.a."
          min={0}
          step={0.1}
        />
        <p
          className="text-[0.625rem] mt-1 font-semibold tracking-wide"
          style={{ color: "var(--primary)", lineHeight: "1.25rem" }}
        >
          = {fmt(annualIncome / 12)} / mth
        </p>
      </div>

      {/* Reorder + Delete */}
      <div className="flex items-center gap-0.5 pt-[0.35rem]">
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

// ─── BreakdownChart (horizontal bar chart of income by source) ───────────────

function BreakdownChart({
  sources,
}: {
  sources: { name: string; annualIncome: number; color: string }[];
}) {
  const totalIncome = sources.reduce((s, src) => s + src.annualIncome, 0);
  if (totalIncome <= 0) return null;

  const W = 640;
  const H = Math.max(140, sources.length * 40 + 60);
  const pad = { top: 28, right: 24, bottom: 12, left: 120 };
  const plotW = W - pad.left - pad.right;
  const barH = 22;
  const gap = 14;
  const maxVal = niceMax(Math.max(...sources.map((s) => s.annualIncome)));

  const xOf = (v: number) => pad.left + (v / maxVal) * plotW;

  // Fixed reference lines at income milestones
  const refLines = [600, 1200, 2400, 6000].filter((v) => v <= maxVal);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ fontFamily: "Manrope, sans-serif" }}>
      {/* Reference lines */}
      {refLines.map((v, i) => (
        <g key={i}>
          <line
            x1={xOf(v)} y1={pad.top - 8}
            x2={xOf(v)} y2={H - pad.bottom}
            stroke="var(--outline-variant)" strokeWidth="1" opacity={0.35}
          />
          <text x={xOf(v)} y={pad.top - 14} textAnchor="middle" fontSize="9" fill="var(--on-surface-sub)">
            {fmtAxis(v)}
          </text>
        </g>
      ))}

      {/* Bars */}
      {sources.map((src, i) => {
        const y = pad.top + i * (barH + gap);
        const barW = Math.max(0, (src.annualIncome / maxVal) * plotW);
        return (
          <g key={i}>
            {/* Label */}
            <text
              x={pad.left - 8} y={y + barH / 2 + 1}
              textAnchor="end" dominantBaseline="middle"
              fontSize="11" fontWeight="600" fill="var(--on-surface)"
            >
              {src.name || "Untitled"}
            </text>
            {/* Bar */}
            <rect
              x={pad.left} y={y}
              width={barW} height={barH}
              rx={4} fill={src.color} opacity={0.85}
            />
            {/* Value label */}
            {barW > 60 && (
              <text
                x={pad.left + barW - 6} y={y + barH / 2 + 1}
                textAnchor="end" dominantBaseline="middle"
                fontSize="10" fontWeight="700" fill="#fff"
              >
                {fmt(src.annualIncome)} / yr
              </text>
            )}
            {barW <= 60 && (
              <text
                x={pad.left + barW + 6} y={y + barH / 2 + 1}
                textAnchor="start" dominantBaseline="middle"
                fontSize="10" fontWeight="600" fill="var(--on-surface-sub)"
              >
                {fmt(src.annualIncome)} / yr
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── GrowthChart (line chart of portfolio + cumulative income over time) ─────

function GrowthChart({
  sources,
  years,
}: {
  sources: YieldSource[];
  years: number;
}) {
  const data = useMemo(() => {
    const rows: { year: number; portfolio: number; cumulativeIncome: number; annualIncome: number }[] = [];
    let vals = sources.map((s) => s.value);
    let cumIncome = 0;

    for (let y = 0; y <= years; y++) {
      const portfolio = vals.reduce((a, b) => a + b, 0);
      const annualIncome = sources.reduce((sum, s, i) => sum + vals[i] * (s.yieldRate / 100), 0);
      rows.push({ year: y, portfolio, cumulativeIncome: cumIncome, annualIncome });
      cumIncome += annualIncome;
      // Reinvest dividends: grow each source by its yield
      vals = vals.map((v, i) => v * (1 + sources[i].yieldRate / 100));
    }
    return rows;
  }, [sources, years]);

  if (data.length === 0 || sources.length === 0) return null;

  const W = 640;
  const H = 280;
  const pad = { top: 28, right: 24, bottom: 44, left: 62 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const maxY = niceMax(Math.max(...data.map((d) => Math.max(d.portfolio, d.cumulativeIncome)), 1));
  const xOf = (i: number) => pad.left + (i / Math.max(years, 1)) * plotW;
  const yOf = (v: number) => pad.top + plotH - (v / maxY) * plotH;

  // Grid
  const yTicks = 5;
  const xTicks = Math.min(years, 10);

  const portfolioPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xOf(d.year).toFixed(1)},${yOf(d.portfolio).toFixed(1)}`).join(" ");
  const incomePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xOf(d.year).toFixed(1)},${yOf(d.cumulativeIncome).toFixed(1)}`).join(" ");

  // Fill area under portfolio
  const portfolioFill = `${portfolioPath} L${xOf(years).toFixed(1)},${yOf(0).toFixed(1)} L${xOf(0).toFixed(1)},${yOf(0).toFixed(1)} Z`;

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ fontFamily: "Manrope, sans-serif" }}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      <defs>
        <linearGradient id="divPortGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Y grid */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (maxY / yTicks) * i;
        return (
          <g key={`yg${i}`}>
            <line x1={pad.left} y1={yOf(v)} x2={W - pad.right} y2={yOf(v)} stroke="var(--outline-variant)" strokeWidth="1" opacity={0.3} />
            <text x={pad.left - 8} y={yOf(v) + 3} textAnchor="end" fontSize="9" fill="var(--on-surface-sub)">
              {fmtAxis(v)}
            </text>
          </g>
        );
      })}

      {/* X labels */}
      {Array.from({ length: xTicks + 1 }, (_, i) => {
        const yr = Math.round((years / xTicks) * i);
        return (
          <text key={`xl${i}`} x={xOf(yr)} y={H - pad.bottom + 20} textAnchor="middle" fontSize="9" fill="var(--on-surface-sub)">
            Yr {yr}
          </text>
        );
      })}

      {/* Portfolio fill + line */}
      <path d={portfolioFill} fill="url(#divPortGrad)" />
      <path d={portfolioPath} fill="none" stroke="var(--primary)" strokeWidth="2" />

      {/* Cumulative income line */}
      <path d={incomePath} fill="none" stroke="var(--tertiary)" strokeWidth="2" strokeDasharray="5 3" />

      {/* Hover interaction */}
      {data.map((d, i) => (
        <rect
          key={i}
          x={xOf(d.year) - plotW / years / 2}
          y={pad.top}
          width={plotW / Math.max(years, 1)}
          height={plotH}
          fill="transparent"
          onMouseEnter={() => setHoveredIdx(i)}
        />
      ))}

      {/* Hover tooltip */}
      {hoveredIdx !== null && (() => {
        const d = data[hoveredIdx];
        const tx = Math.min(Math.max(xOf(d.year), pad.left + 70), W - pad.right - 70);
        const ty = pad.top + 10;
        return (
          <g>
            <line x1={xOf(d.year)} y1={pad.top} x2={xOf(d.year)} y2={pad.top + plotH} stroke="var(--on-surface-sub)" strokeWidth="1" opacity={0.3} />
            <circle cx={xOf(d.year)} cy={yOf(d.portfolio)} r={4} fill="var(--primary)" />
            <circle cx={xOf(d.year)} cy={yOf(d.cumulativeIncome)} r={4} fill="var(--tertiary)" />
            <rect x={tx - 68} y={ty - 4} width={136} height={48} rx={6} fill="var(--surface-container-highest)" opacity={0.95} />
            <text x={tx} y={ty + 10} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--primary)">
              Portfolio: {fmt(d.portfolio)}
            </text>
            <text x={tx} y={ty + 23} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--tertiary)">
              Cum. Income: {fmt(d.cumulativeIncome)}
            </text>
            <text x={tx} y={ty + 36} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--on-surface-sub)">
              Year {d.year} &middot; {fmt(d.annualIncome)}/yr
            </text>
          </g>
        );
      })()}

      {/* Legend */}
      <circle cx={pad.left + 4} cy={H - 8} r={4} fill="var(--primary)" />
      <text x={pad.left + 14} y={H - 5} fontSize="9" fontWeight="600" fill="var(--on-surface-sub)">Portfolio (reinvested)</text>
      <circle cx={pad.left + 164} cy={H - 8} r={4} fill="var(--tertiary)" />
      <text x={pad.left + 174} y={H - 5} fontSize="9" fontWeight="600" fill="var(--on-surface-sub)">Cumulative Income</text>
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function DividendCalculatorPage() {
  const [sources, setSourcesRaw] = useState<YieldSource[]>([]);
  const [projectionYears, setProjectionYears] = useState(20);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSourcesRaw(
      loadArray<YieldSource>("dividend:sources", [
        { id: genId(), name: "Dividend ETF", value: 50000, yieldRate: 5 },
        { id: genId(), name: "REITs", value: 30000, yieldRate: 6 },
      ]),
    );
    const savedYears = localStorage.getItem("dividend:projection-years");
    if (savedYears) setProjectionYears(parseInt(savedYears) || 20);
    setMounted(true);
  }, []);

  const setSources = useCallback((fn: (prev: YieldSource[]) => YieldSource[]) => {
    setSourcesRaw((prev) => {
      const next = fn(prev);
      saveArray("dividend:sources", next);
      return next;
    });
  }, []);

  const handleYearsChange = useCallback((v: number) => {
    setProjectionYears(v);
    try { localStorage.setItem("dividend:projection-years", String(v)); } catch {}
  }, []);

  // Computed values
  const totalValue = sources.reduce((s, src) => s + src.value, 0);
  const totalAnnualIncome = sources.reduce((s, src) => s + src.value * (src.yieldRate / 100), 0);
  const totalMonthlyIncome = totalAnnualIncome / 12;
  const weightedYield = totalValue > 0 ? (totalAnnualIncome / totalValue) * 100 : 0;

  // Colors for bar chart
  const barColors = [
    "#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2",
    "#1b4332", "#b7e4c7", "#d8f3dc", "#367658", "#4a9e73",
  ];

  const chartSources = useMemo(
    () =>
      sources
        .map((src, i) => ({
          name: src.name || "Untitled",
          annualIncome: src.value * (src.yieldRate / 100),
          color: barColors[i % barColors.length],
        }))
        .sort((a, b) => b.annualIncome - a.annualIncome),
    [sources],
  );

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
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  <path d="M2 20a6 6 0 0 1 12 0" />
                  <path d="M15 4a4 4 0 1 1 0 8" />
                  <path d="M22 20a6 6 0 0 0-6-6" />
                </svg>
              </div>

              <div>
                <h1
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                >
                  Dividend Calculator
                </h1>
                <p className="mt-2 text-base max-w-xl" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Track your dividend portfolio. Add yield sources and see your annual and monthly passive income at a glance.
                </p>
              </div>
            </div>
          </div>

          {/* ── Main Grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left — Yield Sources */}
            <div className="lg:col-span-5 space-y-5">
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                    Yield Sources
                  </p>
                  <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                    {fmt(totalValue)}
                  </span>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Dividend stocks, REITs, bonds, ETFs — add each income-producing holding.
                </p>

                {/* Column headers */}
                <div className="grid grid-cols-[3fr_3fr_3fr_auto] gap-2 mb-2">
                  <p className="text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Name</p>
                  <p className="text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Value ($)</p>
                  <p className="text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Yield % p.a.</p>
                  <p style={{ width: "2.75rem" }} />
                </div>

                <div className="space-y-2">
                  {sources.map((src, i) => (
                    <SourceRow
                      key={src.id}
                      name={src.name}
                      value={src.value}
                      rate={src.yieldRate}
                      annualIncome={src.value * (src.yieldRate / 100)}
                      onChangeName={(v) => setSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, name: v } : s)))}
                      onChangeValue={(v) => setSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, value: v } : s)))}
                      onChangeRate={(v) => setSources((prev) => prev.map((s) => (s.id === src.id ? { ...s, yieldRate: v } : s)))}
                      onDelete={() => setSources((prev) => prev.filter((s) => s.id !== src.id))}
                      onMoveUp={i > 0 ? () => setSources((prev) => { const a = [...prev]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; }) : undefined}
                      onMoveDown={i < sources.length - 1 ? () => setSources((prev) => { const a = [...prev]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a; }) : undefined}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSources((prev) => [...prev, { id: genId(), name: "", value: 0, yieldRate: 5 }])}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontFamily: "Manrope, sans-serif", padding: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add yield source
                </button>
              </div>

              {/* Projection Years */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
              >
                <p className="font-bold text-[1rem] mb-1" style={{ color: "var(--on-surface)" }}>
                  Growth Projection
                </p>
                <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Assumes dividends are fully reinvested each year.
                </p>
                <div>
                  <p className="text-[0.8125rem] font-medium mb-1.5" style={{ color: "var(--on-surface-sub)" }}>
                    Projection Horizon (years)
                  </p>
                  <input
                    type="number"
                    value={projectionYears}
                    min={1}
                    max={50}
                    step={1}
                    onChange={(e) => handleYearsChange(parseInt(e.target.value) || 1)}
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
              </div>
            </div>

            {/* Right — Results & Charts */}
            <div className="lg:col-span-7 space-y-5">

              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Portfolio", value: fmt(totalValue), color: "var(--primary)" },
                  { label: "Annual Income", value: fmt(totalAnnualIncome), color: "var(--primary)" },
                  { label: "Monthly Income", value: fmt(totalMonthlyIncome), color: "var(--primary)" },
                  { label: "Weighted Yield", value: `${weightedYield.toFixed(2)}%`, color: "var(--tertiary)" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-xl p-4"
                    style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
                  >
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--on-surface-sub)" }}>
                      {card.label}
                    </p>
                    <p className="text-lg font-bold" style={{ color: card.color }}>
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Income Breakdown — per source */}
              {sources.length > 0 && (
                <div
                  className="rounded-xl p-6"
                  style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                      Income Breakdown
                    </p>
                    <p className="text-xs font-medium" style={{ color: "var(--on-surface-sub)" }}>
                      {sources.length} {sources.length === 1 ? "source" : "sources"}
                    </p>
                  </div>
                  <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                    Annual dividend income from each source.
                  </p>

                  {/* Per-source table */}
                  <div className="mb-4">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-1.5 text-sm">
                      <p className="text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Source</p>
                      <p className="text-[0.625rem] font-semibold tracking-widest uppercase text-right" style={{ color: "var(--on-surface-sub)" }}>Annual</p>
                      <p className="text-[0.625rem] font-semibold tracking-widest uppercase text-right" style={{ color: "var(--on-surface-sub)" }}>Monthly</p>
                      <p className="text-[0.625rem] font-semibold tracking-widest uppercase text-right" style={{ color: "var(--on-surface-sub)" }}>Need for $50/mo</p>
                      {sources
                        .map((src, i) => ({
                          ...src,
                          annual: src.value * (src.yieldRate / 100),
                          color: barColors[i % barColors.length],
                        }))
                        .sort((a, b) => b.annual - a.annual)
                        .map((src) => (
                          <React.Fragment key={src.id}>
                            <p className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--on-surface)" }}>
                              <span className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: src.color }} />
                              {src.name || "Untitled"}
                            </p>
                            <p className="text-sm font-semibold text-right" style={{ color: "var(--on-surface)" }}>{fmt(src.annual)}</p>
                            <p className="text-sm font-semibold text-right" style={{ color: "var(--on-surface-sub)" }}>{fmt(src.annual / 12)}</p>
                            <p className="text-sm font-semibold text-right" style={{ color: "var(--on-surface-sub)" }}>
                              {src.yieldRate > 0 ? fmt(600 / (src.yieldRate / 100)) : "—"}
                            </p>
                          </React.Fragment>
                        ))}
                    </div>
                  </div>

                  <BreakdownChart sources={chartSources} />
                </div>
              )}

              {/* Growth Projection Chart */}
              {sources.length > 0 && (
                <div
                  className="rounded-xl p-6"
                  style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
                >
                  <p className="font-bold text-[1rem] mb-1" style={{ color: "var(--on-surface)" }}>
                    Growth Projection
                  </p>
                  <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                    Portfolio value and cumulative income over {projectionYears} years with full dividend reinvestment.
                  </p>

                  <GrowthChart sources={sources} years={projectionYears} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default DividendCalculatorPage;
