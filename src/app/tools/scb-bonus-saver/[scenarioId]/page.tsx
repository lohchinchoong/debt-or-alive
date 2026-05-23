"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { useScbScenarios, ScbMonthEntry } from "@/hooks/useScbScenarios";
import { fmtAxis, niceMax } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const RATES = {
  base:               0.001,   // 0.10% p.a.
  salary:             0.010,   // 1.00% p.a. on first S$80K
  cardLow:            0.010,   // 1.00% p.a. for card spend ≥ S$500
  cardHigh:           0.020,   // 2.00% p.a. for card spend ≥ S$2,000
  insure:             0.015,   // 1.50% p.a.
  invest:             0.015,   // 1.50% p.a.
  grow:               0.005,   // 0.50% p.a.
  bonusCap:           80_000,  // Bonus interest applies on first S$80K only
  salaryThreshold:    3_000,   // Minimum salary credit to qualify
  cardLowThreshold:   500,     // Card spend tier 1
  cardHighThreshold:  2_000,   // Card spend tier 2
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Types ────────────────────────────────────────────────────────────────────

type ComputedRow = {
  year:               number;
  month:              number;
  openingBalance:     number;
  saved:              number;
  salaryAmount:       number;
  cardSpendAmount:    number;
  insureAmount:       number;
  investAmount:       number;
  baseInterest:       number;
  salaryInterest:     number;
  cardInterest:       number;
  insureInterest:     number;
  investBonusInterest:number;
  growInterest:       number;
  totalBankInterest:  number;
  investPL:           number;
  investIncome:       number;
  netGain:            number;
  closingBalance:     number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtCompact = (n: number) => {
  if (n === 0) return "—";
  return new Intl.NumberFormat("en-SG", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
};

function computeRows(entries: ScbMonthEntry[], initialBalance: number): ComputedRow[] {
  const rows: ComputedRow[] = [];
  let balance = initialBalance;

  for (const e of entries) {
    const openingBalance = balance;
    const eligible = Math.min(openingBalance, RATES.bonusCap);

    const baseInterest        = openingBalance * RATES.base / 12;
    const salaryInterest      = e.salaryAmount >= RATES.salaryThreshold ? eligible * RATES.salary / 12 : 0;
    const cardInterest        = e.cardSpendAmount >= RATES.cardHighThreshold
                                  ? eligible * RATES.cardHigh / 12
                                  : e.cardSpendAmount >= RATES.cardLowThreshold
                                  ? eligible * RATES.cardLow / 12
                                  : 0;
    const insureInterest      = e.insureAmount > 0 ? eligible * RATES.insure / 12 : 0;
    const investBonusInterest = e.investAmount > 0 ? eligible * RATES.invest / 12 : 0;
    // Grow bonus: net balance increase of at least S$500 this month
    const growActive          = e.monthSaved >= 500;
    const growInterest        = growActive ? eligible * RATES.grow / 12 : 0;

    const totalBankInterest = baseInterest + salaryInterest + cardInterest + insureInterest + investBonusInterest + growInterest;
    const netGain           = totalBankInterest + e.investmentPL + e.investmentIncome;
    const closingBalance    = openingBalance + e.monthSaved + totalBankInterest;

    rows.push({
      year: e.year, month: e.month,
      openingBalance, saved: e.monthSaved,
      salaryAmount: e.salaryAmount, cardSpendAmount: e.cardSpendAmount,
      insureAmount: e.insureAmount, investAmount: e.investAmount,
      baseInterest, salaryInterest, cardInterest,
      insureInterest, investBonusInterest, growInterest,
      totalBankInterest,
      investPL: e.investmentPL, investIncome: e.investmentIncome,
      netGain, closingBalance,
    });

    balance = closingBalance;
  }

  return rows;
}

// ─── ProfileNameEditor ────────────────────────────────────────────────────────

function ProfileNameEditor({ name, onSave }: { name: string; onSave: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => { onSave(draft.trim() || "Unnamed"); setEditing(false); };

  if (editing) {
    return (
      <input
        autoFocus value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") { setDraft(name); setEditing(false); }
        }}
        style={{
          background: "transparent", border: "none",
          borderBottom: "2px solid var(--primary)", outline: "none",
          fontSize: "0.875rem", fontFamily: "Manrope, sans-serif", fontWeight: 600,
          color: "var(--on-surface)", padding: "0.125rem 0",
          minWidth: "8rem", maxWidth: "24rem",
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
        background: "none", border: "none", cursor: "text", padding: "0.125rem 0",
        fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: "0.875rem",
        color: "var(--on-surface-sub)", display: "inline-flex", alignItems: "center", gap: "0.375rem",
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

function FocusInput({ label, value, onChange, min, max, step = 1, hint }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <p className="text-[0.8125rem] font-medium mb-1.5" style={{ color: "var(--on-surface-sub)" }}>{label}</p>
      <input
        type="number" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", background: "var(--surface-container-highest)",
          border: "none", borderBottom: `2px solid ${focused ? "var(--primary)" : "var(--outline-variant)"}`,
          borderRadius: "0.25rem 0.25rem 0 0",
          padding: "0.625rem 0.5rem", fontSize: "0.9375rem",
          fontFamily: "Manrope, sans-serif", fontWeight: 500,
          color: "var(--on-surface)", outline: "none", transition: "border-color 0.15s ease",
        }}
      />
      {hint && <p className="text-[0.75rem] mt-1" style={{ color: "var(--on-surface-sub)" }}>{hint}</p>}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, sublabel, value, caption, gradient }: {
  label: string; sublabel?: string; value: string; caption?: string; gradient?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col justify-between"
      style={{
        background: gradient
          ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)"
          : "var(--surface-container-lowest)",
        boxShadow: gradient ? "0 12px 32px rgba(0,53,31,0.20)" : "var(--shadow-botanical)",
        minHeight: "7.5rem",
      }}
    >
      <div>
        <p className="text-[0.6875rem] font-semibold tracking-widest uppercase"
          style={{ color: gradient ? "rgba(255,255,255,0.65)" : "var(--primary)" }}>
          {label}
        </p>
        {sublabel && (
          <p className="text-[0.75rem] mt-0.5"
            style={{ color: gradient ? "rgba(255,255,255,0.50)" : "var(--on-surface-sub)" }}>
            {sublabel}
          </p>
        )}
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-bold leading-none mt-3"
          style={{ color: gradient ? "#fff" : "var(--on-surface)", letterSpacing: "-0.02em" }}>
          {value}
        </p>
        {caption && (
          <p className="text-xs mt-1.5"
            style={{ color: gradient ? "rgba(255,255,255,0.55)" : "var(--on-surface-sub)" }}>
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── EditableCell ─────────────────────────────────────────────────────────────

function EditableCell({ value, onChange, step = 100, allowNegative = false }: {
  value: number; onChange: (v: number) => void; step?: number; allowNegative?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const v = parseFloat(raw);
    if (!isNaN(v)) onChange(v);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus type="number" value={draft} step={step}
        min={allowNegative ? undefined : 0}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditing(false);
        }}
        style={{
          width: "100%", minWidth: "80px", textAlign: "right",
          background: "var(--surface-container-highest)",
          border: "none", borderBottom: "2px solid var(--primary)", outline: "none",
          fontFamily: "Manrope, sans-serif", fontSize: "0.8125rem",
          color: "var(--on-surface)", padding: "2px 4px",
        }}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      style={{
        background: "none", border: "none", cursor: "text",
        width: "100%", textAlign: "right", display: "block",
        fontFamily: "Manrope, sans-serif", fontSize: "0.8125rem",
        color: value === 0 ? "var(--on-surface-sub)" : "var(--on-surface)",
        padding: "2px 4px", opacity: value === 0 ? 0.4 : 1,
      }}
    >
      {value === 0 ? "—" : fmtCompact(value)}
    </button>
  );
}

// ─── GainChart ────────────────────────────────────────────────────────────────

function GainChart({ rows }: { rows: ComputedRow[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const byYear = new Map<number, ComputedRow[]>();
    for (const r of rows) {
      if (!byYear.has(r.year)) byYear.set(r.year, []);
      byYear.get(r.year)!.push(r);
    }

    type Bar = { label: string; subLabel?: string; value: number; bankInterest: number; investNet: number; isAnnual: boolean };
    const bars: Bar[] = [];

    for (const [year, yr] of byYear.entries()) {
      if (yr.length === 12) {
        const value        = yr.reduce((s, r) => s + r.netGain, 0);
        const bankInterest = yr.reduce((s, r) => s + r.totalBankInterest, 0);
        const investNet    = yr.reduce((s, r) => s + r.investPL + r.investIncome, 0);
        bars.push({ label: String(year), value, bankInterest, investNet, isAnnual: true });
      } else {
        for (const r of yr) {
          bars.push({
            label: MONTH_NAMES[r.month - 1],
            subLabel: yr.length < rows.length || yr === [...byYear.values()][byYear.size - 1] ? String(year) : undefined,
            value: r.netGain,
            bankInterest: r.totalBankInterest,
            investNet: r.investPL + r.investIncome,
            isAnnual: false,
          });
        }
      }
    }
    return bars;
  }, [rows]);

  if (chartData.length === 0) return null;

  const W   = 700;
  const H   = 230;
  const PAD = { top: 24, right: 20, bottom: 48, left: 68 };
  const CW  = W - PAD.left - PAD.right;
  const CH  = H - PAD.top - PAD.bottom;

  const values  = chartData.map((b) => b.value);
  const rawMax  = Math.max(0.01, ...values);
  const rawMin  = Math.min(0, ...values);
  const yMax    = niceMax(rawMax);
  const yMin    = rawMin < 0 ? -niceMax(Math.abs(rawMin)) : 0;
  const yRange  = yMax - yMin;

  const xOf = (i: number, centre = true) => PAD.left + (i + (centre ? 0.5 : 0)) * (CW / chartData.length);
  const yOf = (v: number) => PAD.top + CH - ((v - yMin) / yRange) * CH;
  const zeroY = yOf(0);

  const barW    = CW / chartData.length;
  const barGap  = Math.max(2, barW * 0.12);

  const yTicks  = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + t * yRange);
  if (yMin < 0 && !yTicks.includes(0)) yTicks.push(0);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const idx  = Math.floor((svgX - PAD.left) / barW);
    setHoveredIdx(idx >= 0 && idx < chartData.length ? idx : null);
  };

  const hd   = hoveredIdx !== null ? chartData[hoveredIdx] : null;
  const TW   = 180;
  const TH   = 72;
  const hx   = hoveredIdx !== null ? xOf(hoveredIdx) : 0;
  const ttX  = hd && hx < PAD.left + CW / 2 ? hx + 8 : (hd ? hx - TW - 8 : 0);
  const ttY  = PAD.top + 4;

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}>
      <p className="text-[0.9375rem] font-semibold mb-1" style={{ color: "var(--on-surface)" }}>Monthly Gains / Loss</p>
      <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)" }}>
        Completed years roll up to a single annual bar.
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Y-axis ticks */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)}
              stroke={v === 0 ? "#3d4a41" : "#c0c9c0"} strokeWidth={v === 0 ? 0.75 : 0.5}
              strokeDasharray={v === 0 ? "" : "3 5"} opacity="0.7" />
            <text x={PAD.left - 6} y={yOf(v) + 4} textAnchor="end"
              fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
              {fmtAxis(v)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {chartData.map((bar, i) => {
          const bH    = Math.abs(yOf(bar.value) - zeroY);
          const bY    = bar.value >= 0 ? yOf(bar.value) : zeroY;
          const bX    = PAD.left + i * barW + barGap;
          const bW    = barW - barGap * 2;
          const color = bar.value >= 0 ? "#00351f" : "#b91c1c";
          const alpha = bar.isAnnual ? "1" : (hoveredIdx === i ? "0.9" : "0.72");

          return (
            <g key={i}>
              <rect x={bX} y={bY} width={Math.max(1, bW)} height={Math.max(1, bH)}
                fill={color} opacity={alpha} rx="2" />
              <text x={xOf(i)} y={H - (bar.subLabel ? 24 : 8)} textAnchor="middle"
                fontSize={bar.isAnnual ? "11" : "9"} fontWeight={bar.isAnnual ? "700" : "400"}
                fill="#3d4a41" fontFamily="Manrope, sans-serif">
                {bar.label}
              </text>
              {bar.subLabel && (
                <text x={xOf(i)} y={H - 8} textAnchor="middle" fontSize="8"
                  fill="#3d4a41" fontFamily="Manrope, sans-serif" opacity="0.6">
                  {bar.subLabel}
                </text>
              )}
            </g>
          );
        })}

        {/* Tooltip */}
        {hd && (
          <g pointerEvents="none">
            <rect x={ttX} y={ttY} width={TW} height={TH} rx="5"
              fill="white" stroke="#c0c9c0" strokeWidth="0.75" />
            <text x={ttX + 10} y={ttY + 16} fontSize="10" fontWeight="700"
              fill="#00351f" fontFamily="Manrope, sans-serif">
              {hd.label}{hd.isAnnual ? " (Annual)" : ""}
            </text>
            <text x={ttX + 10} y={ttY + 32} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
              {`Net gain: $${fmtAxis(hd.value)}`}
            </text>
            <text x={ttX + 10} y={ttY + 47} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
              {`Bank interest: $${fmtAxis(hd.bankInterest)}`}
            </text>
            <text x={ttX + 10} y={ttY + 62} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
              {`Invest net: $${fmtAxis(hd.investNet)}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── SpreadsheetTable ─────────────────────────────────────────────────────────

function SpreadsheetTable({
  rows,
  onUpdate,
}: {
  rows: ComputedRow[];
  onUpdate: (year: number, month: number, changes: Partial<ScbMonthEntry>) => void;
}) {
  if (rows.length === 0) return null;

  // Group rows by year for subtotals
  const byYear = new Map<number, ComputedRow[]>();
  for (const r of rows) {
    if (!byYear.has(r.year)) byYear.set(r.year, []);
    byYear.get(r.year)!.push(r);
  }

  const totals = {
    saved:              rows.reduce((s, r) => s + r.saved, 0),
    baseInterest:       rows.reduce((s, r) => s + r.baseInterest, 0),
    salaryInterest:     rows.reduce((s, r) => s + r.salaryInterest, 0),
    cardInterest:       rows.reduce((s, r) => s + r.cardInterest, 0),
    insureInterest:     rows.reduce((s, r) => s + r.insureInterest, 0),
    investBonusInterest:rows.reduce((s, r) => s + r.investBonusInterest, 0),
    growInterest:       rows.reduce((s, r) => s + r.growInterest, 0),
    totalBankInterest:  rows.reduce((s, r) => s + r.totalBankInterest, 0),
    investPL:           rows.reduce((s, r) => s + r.investPL, 0),
    investIncome:       rows.reduce((s, r) => s + r.investIncome, 0),
    netGain:            rows.reduce((s, r) => s + r.netGain, 0),
  };

  const thBase: React.CSSProperties = {
    padding: "0.5rem 0.75rem", textAlign: "right" as const,
    fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.04em",
    textTransform: "uppercase" as const, color: "var(--on-surface-sub)",
    backgroundColor: "var(--surface-container-low)", whiteSpace: "nowrap" as const,
    borderBottom: "1px solid rgba(192,201,192,0.3)",
  };
  const thLeft: React.CSSProperties = { ...thBase, textAlign: "left" as const };
  const thCenter: React.CSSProperties = { ...thBase, textAlign: "center" as const };

  const tdNum: React.CSSProperties = {
    padding: "0.375rem 0.75rem", textAlign: "right", fontSize: "0.8125rem",
    fontFamily: "Manrope, sans-serif", whiteSpace: "nowrap",
  };
  const tdMonth: React.CSSProperties = {
    padding: "0.375rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600,
    fontFamily: "Manrope, sans-serif", whiteSpace: "nowrap",
    color: "var(--on-surface)", position: "sticky", left: 0, zIndex: 1,
  };

  const groupHeader = (label: string, colSpan: number, color = "var(--primary)"): React.ReactNode => (
    <th colSpan={colSpan} style={{
      ...thCenter, color, borderBottom: "1px solid rgba(192,201,192,0.3)",
      fontSize: "0.6875rem", fontWeight: 700,
    }}>{label}</th>
  );

  function intColor(v: number) { return v > 0 ? "#007a3d" : v < 0 ? "#b91c1c" : "var(--on-surface-sub)"; }

  function SubtotalRow({ yr, yearRows }: { yr: number; yearRows: ComputedRow[] }) {
    const yTotals = {
      saved:               yearRows.reduce((s, r) => s + r.saved, 0),
      baseInterest:        yearRows.reduce((s, r) => s + r.baseInterest, 0),
      salaryInterest:      yearRows.reduce((s, r) => s + r.salaryInterest, 0),
      cardInterest:        yearRows.reduce((s, r) => s + r.cardInterest, 0),
      insureInterest:      yearRows.reduce((s, r) => s + r.insureInterest, 0),
      investBonusInterest: yearRows.reduce((s, r) => s + r.investBonusInterest, 0),
      growInterest:        yearRows.reduce((s, r) => s + r.growInterest, 0),
      totalBankInterest:   yearRows.reduce((s, r) => s + r.totalBankInterest, 0),
      investPL:            yearRows.reduce((s, r) => s + r.investPL, 0),
      investIncome:        yearRows.reduce((s, r) => s + r.investIncome, 0),
      netGain:             yearRows.reduce((s, r) => s + r.netGain, 0),
    };
    const last = yearRows[yearRows.length - 1];

    const stBg: React.CSSProperties = {
      backgroundColor: "var(--surface-container-low)",
      borderTop: "1px solid rgba(192,201,192,0.4)",
      borderBottom: "1px solid rgba(192,201,192,0.4)",
    };
    const stTd: React.CSSProperties = { ...tdNum, fontWeight: 700, ...stBg };

    return (
      <tr>
        <td style={{ ...tdMonth, ...stBg, fontSize: "0.75rem", color: "var(--primary)" }}>{yr} Total</td>
        {/* account */}
        <td style={{ ...stTd, color: "var(--on-surface-sub)" }}>—</td>
        <td style={{ ...stTd }}>{fmt(yTotals.saved)}</td>
        <td style={{ ...stTd }}>{fmt(last.closingBalance)}</td>
        {/* categories */}
        <td style={{ ...stTd, color: "var(--on-surface-sub)" }}>—</td>
        <td style={{ ...stTd, color: "var(--on-surface-sub)" }}>—</td>
        <td style={{ ...stTd, color: "var(--on-surface-sub)" }}>—</td>
        <td style={{ ...stTd, color: "var(--on-surface-sub)" }}>—</td>
        {/* interest */}
        <td style={{ ...stTd, color: "#007a3d" }}>{fmt(yTotals.baseInterest)}</td>
        <td style={{ ...stTd, color: "#007a3d" }}>{fmt(yTotals.salaryInterest)}</td>
        <td style={{ ...stTd, color: "#007a3d" }}>{fmt(yTotals.cardInterest)}</td>
        <td style={{ ...stTd, color: "#007a3d" }}>{fmt(yTotals.insureInterest)}</td>
        <td style={{ ...stTd, color: "#007a3d" }}>{fmt(yTotals.investBonusInterest)}</td>
        <td style={{ ...stTd, color: "#007a3d" }}>{fmt(yTotals.growInterest)}</td>
        <td style={{ ...stTd, color: "#007a3d" }}>{fmt(yTotals.totalBankInterest)}</td>
        {/* investment */}
        <td style={{ ...stTd, color: intColor(yTotals.investPL) }}>{yTotals.investPL !== 0 ? fmt(yTotals.investPL) : "—"}</td>
        <td style={{ ...stTd, color: intColor(yTotals.investIncome) }}>{yTotals.investIncome !== 0 ? fmt(yTotals.investIncome) : "—"}</td>
        {/* net gain */}
        <td style={{ ...stTd, color: intColor(yTotals.netGain) }}>{fmt(yTotals.netGain)}</td>
      </tr>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-botanical)" }}>
      <div style={{ backgroundColor: "var(--surface-container-lowest)" }} className="px-6 py-4">
        <p className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Monthly Tracker</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-sub)" }}>Click any white cell to edit. Shaded cells are calculated.</p>
      </div>
      <div className="overflow-x-auto" style={{ backgroundColor: "var(--surface-container-lowest)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1200px" }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...thLeft, position: "sticky", left: 0, zIndex: 2, width: "90px" }}>Month</th>
              {groupHeader("Account", 3)}
              {groupHeader("Category Amounts", 4, "#1a4d35")}
              {groupHeader("BonusSaver Interest", 7, "#007a3d")}
              {groupHeader("Investment", 2, "#c85a00")}
              <th rowSpan={2} style={{ ...thBase, color: "var(--on-surface)", fontWeight: 700 }}>Net Gain</th>
            </tr>
            <tr>
              {/* Account */}
              <th style={thBase}>Opening</th>
              <th style={thBase}>Saved</th>
              <th style={thBase}>Closing</th>
              {/* Categories */}
              <th style={thBase}>Salary</th>
              <th style={thBase}>Card Spend</th>
              <th style={thBase}>Insure</th>
              <th style={thBase}>Invest</th>
              {/* Interest */}
              <th style={thBase}>Base</th>
              <th style={thBase}>Salary</th>
              <th style={thBase}>Card</th>
              <th style={thBase}>Insure</th>
              <th style={thBase}>Invest</th>
              <th style={thBase}>Grow</th>
              <th style={{ ...thBase, color: "#007a3d" }}>Total</th>
              {/* Investment */}
              <th style={{ ...thBase, color: "#c85a00" }}>P&amp;L</th>
              <th style={{ ...thBase, color: "#c85a00" }}>Income</th>
            </tr>
          </thead>
          <tbody>
            {[...byYear.entries()].map(([yr, yearRows]) => (
              <React.Fragment key={yr}>
                {yearRows.map((row, ri) => {
                  const rowBg = ri % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)";
                  const calcBg = ri % 2 === 0 ? "rgba(192,201,192,0.08)" : "rgba(192,201,192,0.14)";

                  return (
                    <tr key={`${row.year}-${row.month}`}>
                      <td style={{ ...tdMonth, backgroundColor: rowBg }}>
                        {MONTH_NAMES[row.month - 1]} {row.year}
                      </td>
                      {/* Account — opening & closing are computed, saved is editable */}
                      <td style={{ ...tdNum, backgroundColor: calcBg, color: "var(--on-surface-sub)" }}>
                        {fmt(row.openingBalance)}
                      </td>
                      <td style={{ ...tdNum, backgroundColor: rowBg }}>
                        <EditableCell
                          value={row.saved} step={500} allowNegative
                          onChange={(v) => onUpdate(row.year, row.month, { monthSaved: v })}
                        />
                      </td>
                      <td style={{ ...tdNum, backgroundColor: calcBg, fontWeight: 600, color: "var(--on-surface)" }}>
                        {fmt(row.closingBalance)}
                      </td>
                      {/* Categories — editable */}
                      <td style={{ ...tdNum, backgroundColor: rowBg }}>
                        <EditableCell
                          value={row.salaryAmount} step={500}
                          onChange={(v) => onUpdate(row.year, row.month, { salaryAmount: v })}
                        />
                      </td>
                      <td style={{ ...tdNum, backgroundColor: rowBg }}>
                        <EditableCell
                          value={row.cardSpendAmount} step={100}
                          onChange={(v) => onUpdate(row.year, row.month, { cardSpendAmount: v })}
                        />
                      </td>
                      <td style={{ ...tdNum, backgroundColor: rowBg }}>
                        <EditableCell
                          value={row.insureAmount} step={100}
                          onChange={(v) => onUpdate(row.year, row.month, { insureAmount: v })}
                        />
                      </td>
                      <td style={{ ...tdNum, backgroundColor: rowBg }}>
                        <EditableCell
                          value={row.investAmount} step={1000}
                          onChange={(v) => onUpdate(row.year, row.month, { investAmount: v })}
                        />
                      </td>
                      {/* Computed interest columns */}
                      <td style={{ ...tdNum, backgroundColor: calcBg, color: "#007a3d" }}>{fmt(row.baseInterest)}</td>
                      <td style={{ ...tdNum, backgroundColor: calcBg, color: row.salaryInterest > 0 ? "#007a3d" : "var(--on-surface-sub)" }}>
                        {row.salaryInterest > 0 ? fmt(row.salaryInterest) : "—"}
                      </td>
                      <td style={{ ...tdNum, backgroundColor: calcBg, color: row.cardInterest > 0 ? "#007a3d" : "var(--on-surface-sub)" }}>
                        {row.cardInterest > 0 ? fmt(row.cardInterest) : "—"}
                      </td>
                      <td style={{ ...tdNum, backgroundColor: calcBg, color: row.insureInterest > 0 ? "#007a3d" : "var(--on-surface-sub)" }}>
                        {row.insureInterest > 0 ? fmt(row.insureInterest) : "—"}
                      </td>
                      <td style={{ ...tdNum, backgroundColor: calcBg, color: row.investBonusInterest > 0 ? "#007a3d" : "var(--on-surface-sub)" }}>
                        {row.investBonusInterest > 0 ? fmt(row.investBonusInterest) : "—"}
                      </td>
                      <td style={{ ...tdNum, backgroundColor: calcBg, color: row.growInterest > 0 ? "#007a3d" : "var(--on-surface-sub)" }}>
                        {row.growInterest > 0 ? fmt(row.growInterest) : "—"}
                      </td>
                      <td style={{ ...tdNum, backgroundColor: calcBg, color: "#007a3d", fontWeight: 700 }}>
                        {fmt(row.totalBankInterest)}
                      </td>
                      {/* Investment — editable */}
                      <td style={{ ...tdNum, backgroundColor: rowBg }}>
                        <EditableCell
                          value={row.investPL} step={100} allowNegative
                          onChange={(v) => onUpdate(row.year, row.month, { investmentPL: v })}
                        />
                      </td>
                      <td style={{ ...tdNum, backgroundColor: rowBg }}>
                        <EditableCell
                          value={row.investIncome} step={100}
                          onChange={(v) => onUpdate(row.year, row.month, { investmentIncome: v })}
                        />
                      </td>
                      {/* Net gain */}
                      <td style={{ ...tdNum, backgroundColor: calcBg, fontWeight: 700, color: intColor(row.netGain) }}>
                        {fmt(row.netGain)}
                      </td>
                    </tr>
                  );
                })}
                <SubtotalRow yr={yr} yearRows={yearRows} />
              </React.Fragment>
            ))}

            {/* Grand Total */}
            {rows.length > 0 && (() => {
              const lastRow = rows[rows.length - 1];
              return (
                <tr>
                  <td style={{ ...tdMonth, backgroundColor: "var(--primary)", color: "#fff", fontSize: "0.75rem" }}>Grand Total</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "rgba(255,255,255,0.5)" }}>—</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "#fff", fontWeight: 700 }}>{fmt(totals.saved)}</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "#fff", fontWeight: 700 }}>{fmt(lastRow.closingBalance)}</td>
                  <td colSpan={4} style={{ ...tdNum, backgroundColor: "var(--primary)", color: "rgba(255,255,255,0.5)" }}>—</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "rgba(255,255,255,0.85)" }}>{fmt(totals.baseInterest)}</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "rgba(255,255,255,0.85)" }}>{fmt(totals.salaryInterest)}</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "rgba(255,255,255,0.85)" }}>{fmt(totals.cardInterest)}</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "rgba(255,255,255,0.85)" }}>{fmt(totals.insureInterest)}</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "rgba(255,255,255,0.85)" }}>{fmt(totals.investBonusInterest)}</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "rgba(255,255,255,0.85)" }}>{fmt(totals.growInterest)}</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "#fff", fontWeight: 700 }}>{fmt(totals.totalBankInterest)}</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "rgba(255,255,255,0.85)" }}>{totals.investPL !== 0 ? fmt(totals.investPL) : "—"}</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "rgba(255,255,255,0.85)" }}>{totals.investIncome !== 0 ? fmt(totals.investIncome) : "—"}</td>
                  <td style={{ ...tdNum, backgroundColor: "var(--primary)", color: "#fff", fontWeight: 700 }}>{fmt(totals.netGain)}</td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScbBonusSaverTrackerPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const router         = useRouter();
  const { scenarios, updateScenario, updateEntry, addMonth, removeLastMonth } = useScbScenarios();

  const scenario = scenarios.find((s) => s.id === scenarioId);

  useEffect(() => {
    if (scenarios.length > 0 && !scenario) router.replace("/tools/scb-bonus-saver");
  }, [scenario, scenarios.length, router]);

  const rows = useMemo(
    () => (scenario ? computeRows(scenario.entries, scenario.initialBalance) : []),
    [scenario]
  );

  if (!scenario) return null;

  const set = (changes: Partial<Omit<typeof scenario, "id" | "entries">>) => updateScenario(scenarioId, changes);
  const onUpdate = (year: number, month: number, changes: Partial<ScbMonthEntry>) =>
    updateEntry(scenarioId, year, month, changes);

  const totalInterest  = rows.reduce((s, r) => s + r.totalBankInterest, 0);
  const totalNetGain   = rows.reduce((s, r) => s + r.netGain, 0);
  const totalInvestPL  = rows.reduce((s, r) => s + r.investPL + r.investIncome, 0);
  const currentBalance = rows.length > 0 ? rows[rows.length - 1].closingBalance : scenario.initialBalance;
  const startLabel     = `${MONTH_NAMES[scenario.startMonth - 1]} ${scenario.startYear}`;

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen px-5 sm:px-8 lg:px-16 py-10" style={{ backgroundColor: "var(--surface-container-low)" }}>
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Page Header ───────────────────────────────────────────────── */}
          <div>
            <Link href="/tools/scb-bonus-saver" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6" style={{ color: "var(--on-surface-sub)", textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              All Scenarios
            </Link>

            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "linear-gradient(45deg, var(--primary), var(--primary-container))", boxShadow: "0 8px 24px rgba(0,53,31,0.2)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20M6 15h2M10 15h4" />
                </svg>
              </div>
              <div>
                <ProfileNameEditor name={scenario.name} onSave={(name) => set({ name })} />
                <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                  SCB BonusSaver Tracker
                </h1>
                <p className="mt-2 text-base max-w-xl" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Tracking from {startLabel} · {rows.length} {rows.length === 1 ? "month" : "months"} logged
                </p>
              </div>
            </div>
          </div>

          {/* ── Config + Stats Grid ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Config panel */}
            <div className="lg:col-span-4 rounded-xl p-6" style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}>
              <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>Configuration</p>
              <p className="text-sm mt-0.5 mb-6" style={{ color: "var(--on-surface-sub)" }}>
                Set your starting balance and when tracking begins
              </p>
              <div className="space-y-5">
                <FocusInput
                  label="Initial Balance (S$)"
                  value={scenario.initialBalance}
                  onChange={(v) => set({ initialBalance: v })}
                  min={0} step={1000}
                  hint="Your BonusSaver balance at the start of tracking"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FocusInput
                    label="Start Year"
                    value={scenario.startYear}
                    onChange={(v) => {
                      if (scenario.entries.length === 0) set({ startYear: Math.round(v) });
                    }}
                    min={2000} step={1}
                    hint={scenario.entries.length > 0 ? "Remove all months to change" : undefined}
                  />
                  <FocusInput
                    label="Start Month"
                    value={scenario.startMonth}
                    onChange={(v) => {
                      if (scenario.entries.length === 0) set({ startMonth: Math.min(12, Math.max(1, Math.round(v))) });
                    }}
                    min={1} max={12} step={1}
                    hint={scenario.entries.length > 0 ? "Remove all months to change" : undefined}
                  />
                </div>
              </div>

              {/* Rates reference */}
              <div className="mt-6 rounded-lg p-4 space-y-2" style={{ backgroundColor: "var(--surface-container-low)" }}>
                <p className="text-[0.75rem] font-semibold uppercase tracking-wider" style={{ color: "var(--primary)" }}>Bonus Interest Rates</p>
                {[
                  ["Base", "0.10% p.a. (all balance)"],
                  ["Salary ≥S$3K", "+1.00% p.a."],
                  ["Card ≥S$500", "+1.00% p.a."],
                  ["Card ≥S$2K", "+2.00% p.a."],
                  ["Insure", "+1.50% p.a."],
                  ["Invest", "+1.50% p.a."],
                  ["Grow ≥S$500", "+0.50% p.a."],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span style={{ color: "var(--on-surface-sub)" }}>{k}</span>
                    <span className="font-medium" style={{ color: "var(--on-surface)" }}>{v}</span>
                  </div>
                ))}
                <p className="text-[0.7rem] pt-1" style={{ color: "var(--on-surface-sub)" }}>
                  Bonus rates apply on first S$80,000. Card tiers are alternative (≥S$2K replaces ≥S$500 tier).
                </p>
              </div>
            </div>

            {/* Stat cards */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-2 gap-4">
              <StatCard
                label="Current Balance"
                sublabel={rows.length > 0 ? `End of ${MONTH_NAMES[rows[rows.length-1].month-1]} ${rows[rows.length-1].year}` : "Initial balance"}
                value={fmt(currentBalance)}
                gradient
              />
              <StatCard
                label="Total Bank Interest"
                sublabel={`Over ${rows.length} months`}
                value={fmt(totalInterest)}
                caption={rows.length > 0 && scenario.initialBalance > 0
                  ? `${((totalInterest / scenario.initialBalance) * 100).toFixed(2)}% of initial balance`
                  : undefined}
              />
              <StatCard
                label="Total Net Gain"
                sublabel="Interest + invest P&L + income"
                value={fmt(totalNetGain)}
                caption={totalInvestPL !== 0 ? `Invest contribution: ${fmt(totalInvestPL)}` : undefined}
              />
              <StatCard
                label="Months Tracked"
                sublabel={rows.length > 0 ? `${startLabel} – ${MONTH_NAMES[rows[rows.length-1].month-1]} ${rows[rows.length-1].year}` : "—"}
                value={String(rows.length)}
                caption={rows.length > 0
                  ? `Avg gain: ${fmt(totalNetGain / rows.length)}/mo`
                  : "Add a month to begin"}
              />
            </div>
          </div>

          {/* ── Chart ─────────────────────────────────────────────────────── */}
          {rows.length > 0 && <GainChart rows={rows} />}

          {/* ── Spreadsheet Table ─────────────────────────────────────────── */}
          {rows.length > 0 && (
            <SpreadsheetTable rows={rows} onUpdate={onUpdate} />
          )}

          {/* ── Add / Remove Month ────────────────────────────────────────── */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => addMonth(scenarioId)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                color: "#fff", border: "none", cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,53,31,0.2)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Month
            </button>

            {rows.length > 0 && (
              <button
                onClick={() => {
                  const last = scenario.entries[scenario.entries.length - 1];
                  if (confirm(`Remove ${MONTH_NAMES[last.month - 1]} ${last.year}? This cannot be undone.`)) {
                    removeLastMonth(scenarioId);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
                style={{
                  background: "var(--surface-container-lowest)",
                  color: "var(--on-surface-sub)", border: "1px solid rgba(192,201,192,0.5)",
                  cursor: "pointer", fontFamily: "Manrope, sans-serif",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                </svg>
                Remove Last Month
              </button>
            )}

            {rows.length === 0 && (
              <p className="text-sm" style={{ color: "var(--on-surface-sub)" }}>
                Click &ldquo;Add Month&rdquo; to log your first month of data.
              </p>
            )}
          </div>

          {/* ── How It Works ──────────────────────────────────────────────── */}
          <div className="rounded-xl p-8" style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
              How It Works
            </h2>
            <ul className="space-y-4">
              {[
                {
                  heading: "Salary Credit",
                  body: "Credit your salary of at least S$3,000 into the account in a calendar month to earn the +1.00% p.a. bonus on your first S$80,000. Enter the credited amount in the Salary column — any value ≥ S$3,000 activates the bonus.",
                },
                {
                  heading: "Card Spend",
                  body: "Spend on eligible SCB credit cards linked to the account. ≥ S$500 earns +1.00% p.a.; ≥ S$2,000 earns +2.00% p.a. (the higher tier replaces, not stacks on, the lower tier). Bonus applies to the first S$80,000.",
                },
                {
                  heading: "Insure Bonus",
                  body: "Purchase an eligible insurance plan through SCB. Enter any amount > S$0 in the Insure column to flag the bonus as active for that month. The bonus of +1.50% p.a. typically applies for 12 months from the date of purchase.",
                },
                {
                  heading: "Invest Bonus",
                  body: "Make an eligible investment through SCB (unit trusts, structured deposits, etc.). Enter the invested amount > S$0 to activate the +1.50% p.a. bonus for that month.",
                },
                {
                  heading: "Grow Bonus",
                  body: "Automatically awarded when your net deposit (Saved column) for the month is at least S$500. Earns +0.50% p.a. on the first S$80,000. This is an approximation — your actual eligibility is based on average daily balance growth.",
                },
                {
                  heading: "Investment Tracking",
                  body: "The P&L and Income columns under Investment are separate from BonusSaver account interest. Use them to track unrealised/realised gains or losses and any dividends or coupon income from investments you hold. These flow into the Net Gain column but do not affect your account balance.",
                },
                {
                  heading: "Annual Rollup in Chart",
                  body: "Once all 12 months of a calendar year have entries, the chart collapses that year into a single taller bar showing the full-year net gain. Months in the current (incomplete) year are shown individually.",
                },
              ].map(({ heading, body }) => (
                <li key={heading} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--primary)", marginTop: "0.55rem" }} />
                  <span>
                    <span className="font-semibold" style={{ color: "var(--on-surface)" }}>{heading}: </span>
                    {body}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs mt-8 pt-6" style={{ color: "var(--on-surface-sub)", borderTop: "1px solid rgba(192,201,192,0.3)", lineHeight: "1.6" }}>
              <span className="font-semibold">Disclaimer:</span> Interest rates, bonus criteria, and bonus caps are based on publicly available SCB BonusSaver information as of 2026 and are subject to change. Results are illustrative only. Verify current rates at the Standard Chartered Singapore website before making financial decisions. This tool does not constitute financial advice.
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
