"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { useHysaScenarios, HysaMonthEntry } from "@/hooks/useHysaScenarios";
import { fmtAxis, niceMax } from "@/lib/utils";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Types ────────────────────────────────────────────────────────────────────

type Row = HysaMonthEntry & { totalInterest: number; netGain: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtCompact = (n: number) =>
  new Intl.NumberFormat("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

function toRows(entries: HysaMonthEntry[]): Row[] {
  return entries.map((e) => {
    const totalInterest = (e.salaryInterest ?? 0) + (e.cardInterest ?? 0) + (e.insureInterest ?? 0) + (e.investInterest ?? 0);
    return { ...e, totalInterest, netGain: totalInterest + (e.investmentPL ?? 0) };
  });
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
          width: "100%", minWidth: "72px", textAlign: "right",
          background: "var(--surface-container-highest)",
          border: "none", borderBottom: "2px solid var(--primary)", outline: "none",
          fontFamily: "Manrope, sans-serif", fontSize: "0.8125rem",
          color: "var(--on-surface)", padding: "2px 4px",
        }}
      />
    );
  }

  const display = value === 0 ? "—" : fmtCompact(value);
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
      {display}
    </button>
  );
}

// ─── MonthCell ────────────────────────────────────────────────────────────────

function MonthCell({ year, month, onSave }: {
  year: number; month: number; onSave: (year: number, month: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftYear, setDraftYear]   = useState(year);
  const [draftMonth, setDraftMonth] = useState(month);

  const open = () => { setDraftYear(year); setDraftMonth(month); setEditing(true); };
  const commit = () => { onSave(draftYear, draftMonth); setEditing(false); };
  const cancel = () => setEditing(false);

  const inputBase: React.CSSProperties = {
    background: "var(--surface-container-highest)",
    border: "none", borderBottom: "2px solid var(--primary)", outline: "none",
    fontFamily: "Manrope, sans-serif", fontSize: "0.8125rem",
    color: "var(--on-surface)", padding: "2px 4px",
  };

  if (editing) {
    return (
      <div
        style={{ display: "flex", gap: "4px", alignItems: "center" }}
        onBlur={(e) => {
          // Only commit when focus leaves the entire editing widget
          if (!e.currentTarget.contains(e.relatedTarget as Node)) commit();
        }}
      >
        <select
          autoFocus
          value={draftMonth}
          onChange={(e) => setDraftMonth(Number(e.target.value))}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
          style={{ ...inputBase, width: "52px", cursor: "pointer" }}
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>
        <input
          type="number" value={draftYear} min={2000} max={2099} step={1}
          onChange={(e) => setDraftYear(Number(e.target.value))}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
          style={{ ...inputBase, width: "52px", textAlign: "right" }}
        />
      </div>
    );
  }

  return (
    <button
      onClick={open}
      title="Click to edit month"
      style={{
        background: "none", border: "none", cursor: "text",
        fontFamily: "Manrope, sans-serif", fontWeight: 600, fontSize: "0.8125rem",
        color: "var(--on-surface)", padding: "2px 4px", display: "inline-flex",
        alignItems: "center", gap: "0.3rem", width: "100%",
      }}
    >
      {MONTH_NAMES[month - 1]} {year}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, flexShrink: 0 }}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
}

// ─── GainChart ────────────────────────────────────────────────────────────────

function GainChart({ rows }: { rows: Row[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartData = useMemo(() => {
    const byYear = new Map<number, Row[]>();
    for (const r of rows) {
      if (!byYear.has(r.year)) byYear.set(r.year, []);
      byYear.get(r.year)!.push(r);
    }

    type Bar = { label: string; subLabel?: string; value: number; interest: number; investPL: number; isAnnual: boolean };
    const bars: Bar[] = [];

    const lastYear = Math.max(...byYear.keys());

    for (const [year, yr] of byYear.entries()) {
      // Roll up if all 12 months are present, or if a later year has entries (this year is done)
      if (yr.length === 12 || year < lastYear) {
        bars.push({
          label: String(year),
          value:    yr.reduce((s, r) => s + r.netGain, 0),
          interest: yr.reduce((s, r) => s + r.totalInterest, 0),
          investPL: yr.reduce((s, r) => s + (r.investmentPL ?? 0), 0),
          isAnnual: true,
        });
      } else {
        for (const r of yr) {
          bars.push({
            label: MONTH_NAMES[r.month - 1],
            subLabel: byYear.size > 1 ? String(year) : undefined,
            value: r.netGain, interest: r.totalInterest, investPL: r.investmentPL ?? 0,
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

  const values = chartData.map((b) => b.value);
  const yMax   = niceMax(Math.max(0.01, ...values));
  const rawMin = Math.min(0, ...values);
  const yMin   = rawMin < 0 ? -niceMax(Math.abs(rawMin)) : 0;
  const yRange = yMax - yMin;

  const xOf  = (i: number) => PAD.left + (i + 0.5) * (CW / chartData.length);
  const yOf  = (v: number) => PAD.top + CH - ((v - yMin) / yRange) * CH;
  const zero = yOf(0);
  const barW = CW / chartData.length;
  const gap  = Math.max(2, barW * 0.12);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + t * yRange);
  if (yMin < 0 && !yTicks.includes(0)) yTicks.push(0);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const idx  = Math.floor((svgX - PAD.left) / barW);
    setHoveredIdx(idx >= 0 && idx < chartData.length ? idx : null);
  };

  const hd  = hoveredIdx !== null ? chartData[hoveredIdx] : null;
  const TW  = 180;
  const TH  = 68;
  const hx  = hoveredIdx !== null ? xOf(hoveredIdx) : 0;
  const ttX = hd && hx < PAD.left + CW / 2 ? hx + 8 : (hd ? hx - TW - 8 : 0);

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}>
      <p className="text-[0.9375rem] font-semibold mb-1" style={{ color: "var(--on-surface)" }}>Monthly Gains / Loss</p>
      <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)" }}>Completed years roll up to a single annual bar.</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)}
              stroke={v === 0 ? "#3d4a41" : "#c0c9c0"} strokeWidth={v === 0 ? 0.75 : 0.5}
              strokeDasharray={v === 0 ? "" : "3 5"} opacity="0.7" />
            <text x={PAD.left - 6} y={yOf(v) + 4} textAnchor="end"
              fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">{fmtAxis(v)}</text>
          </g>
        ))}

        {chartData.map((bar, i) => {
          const bH    = Math.abs(yOf(bar.value) - zero);
          const bY    = bar.value >= 0 ? yOf(bar.value) : zero;
          const color = bar.value >= 0 ? "#00351f" : "#b91c1c";
          const alpha = bar.isAnnual ? "1" : (hoveredIdx === i ? "0.9" : "0.72");
          return (
            <g key={i}>
              <rect x={PAD.left + i * barW + gap} y={bY}
                width={Math.max(1, barW - gap * 2)} height={Math.max(1, bH)}
                fill={color} opacity={alpha} rx="2" />
              <text x={xOf(i)} y={H - (bar.subLabel ? 24 : 8)} textAnchor="middle"
                fontSize={bar.isAnnual ? "11" : "9"} fontWeight={bar.isAnnual ? "700" : "400"}
                fill="#3d4a41" fontFamily="Manrope, sans-serif">{bar.label}</text>
              {bar.subLabel && (
                <text x={xOf(i)} y={H - 8} textAnchor="middle" fontSize="8"
                  fill="#3d4a41" fontFamily="Manrope, sans-serif" opacity="0.6">{bar.subLabel}</text>
              )}
            </g>
          );
        })}

        {hd && (
          <g pointerEvents="none">
            <rect x={ttX} y={PAD.top + 4} width={TW} height={TH} rx="5"
              fill="white" stroke="#c0c9c0" strokeWidth="0.75" />
            <text x={ttX + 10} y={PAD.top + 20} fontSize="10" fontWeight="700"
              fill="#00351f" fontFamily="Manrope, sans-serif">
              {hd.label}{hd.isAnnual ? " (Annual)" : ""}
            </text>
            <text x={ttX + 10} y={PAD.top + 36} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
              {`Net gain: $${fmtAxis(hd.value)}`}
            </text>
            <text x={ttX + 10} y={PAD.top + 51} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
              {`Interest: $${fmtAxis(hd.interest)}`}
            </text>
            <text x={ttX + 10} y={PAD.top + 66} fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
              {`Invest P&L: $${fmtAxis(hd.investPL)}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── SpreadsheetTable ─────────────────────────────────────────────────────────

function SpreadsheetTable({ rows, onUpdate }: {
  rows: Row[];
  onUpdate: (year: number, month: number, changes: Partial<HysaMonthEntry>) => void;
}) {
  if (rows.length === 0) return null;

  const byYear = new Map<number, Row[]>();
  for (const r of rows) {
    if (!byYear.has(r.year)) byYear.set(r.year, []);
    byYear.get(r.year)!.push(r);
  }

  const totals = {
    salaryAmount:    rows.reduce((s, r) => s + r.salaryAmount, 0),
    salaryInterest:  rows.reduce((s, r) => s + (r.salaryInterest ?? 0), 0),
    cardSpendAmount: rows.reduce((s, r) => s + r.cardSpendAmount, 0),
    cardInterest:    rows.reduce((s, r) => s + (r.cardInterest ?? 0), 0),
    insureAmount:    rows.reduce((s, r) => s + r.insureAmount, 0),
    insureInterest:  rows.reduce((s, r) => s + (r.insureInterest ?? 0), 0),
    investAmount:    rows.reduce((s, r) => s + r.investAmount, 0),
    investInterest:  rows.reduce((s, r) => s + (r.investInterest ?? 0), 0),
    investmentPL:    rows.reduce((s, r) => s + (r.investmentPL ?? 0), 0),
    totalInterest:   rows.reduce((s, r) => s + r.totalInterest, 0),
    netGain:         rows.reduce((s, r) => s + r.netGain, 0),
  };

  // ── Shared styles ──────────────────────────────────────────────────────────
  const thBase: React.CSSProperties = {
    padding: "0.4rem 0.5rem", textAlign: "right" as const,
    fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.04em",
    textTransform: "uppercase" as const, color: "var(--on-surface-sub)",
    backgroundColor: "var(--surface-container-low)", whiteSpace: "nowrap" as const,
    borderBottom: "1px solid rgba(192,201,192,0.3)",
  };
  const thLeft: React.CSSProperties = { ...thBase, textAlign: "left" as const };
  const thCenter: React.CSSProperties = { ...thBase, textAlign: "center" as const };
  const tdNum: React.CSSProperties = {
    padding: "0.35rem 0.5rem", textAlign: "right", fontSize: "0.8125rem",
    fontFamily: "Manrope, sans-serif", whiteSpace: "nowrap",
  };
  const tdMonth: React.CSSProperties = {
    padding: "0.35rem 0.75rem", fontSize: "0.8125rem", fontWeight: 600,
    fontFamily: "Manrope, sans-serif", whiteSpace: "nowrap",
    color: "var(--on-surface)", position: "sticky", left: 0, zIndex: 1,
  };

  function intColor(v: number) {
    return v > 0 ? "#007a3d" : v < 0 ? "#b91c1c" : "var(--on-surface-sub)";
  }

  // Category group colors
  const CAT_COLORS = {
    salary:   "#1a5c3b",
    card:     "#1a4d6b",
    insure:   "#5c3b1a",
    invest:   "#3b1a5c",
  };

  function groupTh(label: string, color: string): React.ReactNode {
    return (
      <th colSpan={2} style={{
        ...thCenter, color, borderBottom: "1px solid rgba(192,201,192,0.3)",
        fontSize: "0.625rem", fontWeight: 700,
        borderLeft: "1px solid rgba(192,201,192,0.2)",
      }}>{label}</th>
    );
  }

  function SubtotalRow({ yr, yearRows }: { yr: number; yearRows: Row[] }) {
    const yt = {
      salaryAmount:    yearRows.reduce((s, r) => s + r.salaryAmount, 0),
      salaryInterest:  yearRows.reduce((s, r) => s + (r.salaryInterest ?? 0), 0),
      cardSpendAmount: yearRows.reduce((s, r) => s + r.cardSpendAmount, 0),
      cardInterest:    yearRows.reduce((s, r) => s + (r.cardInterest ?? 0), 0),
      insureAmount:    yearRows.reduce((s, r) => s + r.insureAmount, 0),
      insureInterest:  yearRows.reduce((s, r) => s + (r.insureInterest ?? 0), 0),
      investAmount:    yearRows.reduce((s, r) => s + r.investAmount, 0),
      investInterest:  yearRows.reduce((s, r) => s + (r.investInterest ?? 0), 0),
      investmentPL:    yearRows.reduce((s, r) => s + (r.investmentPL ?? 0), 0),
      totalInterest:   yearRows.reduce((s, r) => s + r.totalInterest, 0),
      netGain:         yearRows.reduce((s, r) => s + r.netGain, 0),
    };
    const stBg: React.CSSProperties = {
      backgroundColor: "var(--surface-container-low)",
      borderTop: "1px solid rgba(192,201,192,0.4)",
      borderBottom: "1px solid rgba(192,201,192,0.4)",
    };
    const st: React.CSSProperties = { ...tdNum, fontWeight: 700, ...stBg };
    const dash = (v: number) => v !== 0 ? fmt(v) : "—";
    return (
      <tr>
        <td style={{ ...tdMonth, ...stBg, fontSize: "0.75rem", color: "var(--primary)" }}>{yr} Total</td>
        <td style={{ ...st, color: "var(--on-surface-sub)", borderLeft: "1px solid rgba(192,201,192,0.2)" }}>{dash(yt.salaryAmount)}</td>
        <td style={{ ...st, color: "#007a3d" }}>{fmt(yt.salaryInterest)}</td>
        <td style={{ ...st, color: "var(--on-surface-sub)", borderLeft: "1px solid rgba(192,201,192,0.2)" }}>{dash(yt.cardSpendAmount)}</td>
        <td style={{ ...st, color: "#007a3d" }}>{fmt(yt.cardInterest)}</td>
        <td style={{ ...st, color: "var(--on-surface-sub)", borderLeft: "1px solid rgba(192,201,192,0.2)" }}>{dash(yt.insureAmount)}</td>
        <td style={{ ...st, color: "#007a3d" }}>{fmt(yt.insureInterest)}</td>
        <td style={{ ...st, color: "var(--on-surface-sub)", borderLeft: "1px solid rgba(192,201,192,0.2)" }}>{dash(yt.investAmount)}</td>
        <td style={{ ...st, color: "#007a3d" }}>{fmt(yt.investInterest)}</td>
        <td style={{ ...st, color: intColor(yt.investmentPL) }}>{dash(yt.investmentPL)}</td>
        <td style={{ ...st, color: intColor(yt.netGain) }}>{fmt(yt.netGain)}</td>
      </tr>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ boxShadow: "var(--shadow-botanical)" }}>
      <div style={{ backgroundColor: "var(--surface-container-lowest)" }} className="px-6 py-4">
        <p className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>Monthly Tracker</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-sub)" }}>
          Click any cell to edit. Each category has an Amount column and an Interest column. Net Gain is computed.
        </p>
      </div>
      <div className="overflow-x-auto" style={{ backgroundColor: "var(--surface-container-lowest)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "920px" }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ ...thLeft, position: "sticky", left: 0, zIndex: 2, width: "88px" }}>Month</th>
              {groupTh("Salary", CAT_COLORS.salary)}
              {groupTh("Card Spend", CAT_COLORS.card)}
              {groupTh("Insurance", CAT_COLORS.insure)}
              {groupTh("Investment", CAT_COLORS.invest)}
              <th rowSpan={2} style={{ ...thBase, color: "#c85a00" }}>Invest P&amp;L</th>
              <th rowSpan={2} style={{ ...thBase, color: "var(--on-surface)", fontWeight: 700 }}>Net Gain</th>
            </tr>
            <tr>
              <th style={{ ...thBase, borderLeft: "1px solid rgba(192,201,192,0.2)" }}>Amt</th>
              <th style={{ ...thBase, color: "#007a3d" }}>Interest</th>
              <th style={{ ...thBase, borderLeft: "1px solid rgba(192,201,192,0.2)" }}>Amt</th>
              <th style={{ ...thBase, color: "#007a3d" }}>Interest</th>
              <th style={{ ...thBase, borderLeft: "1px solid rgba(192,201,192,0.2)" }}>Amt</th>
              <th style={{ ...thBase, color: "#007a3d" }}>Interest</th>
              <th style={{ ...thBase, borderLeft: "1px solid rgba(192,201,192,0.2)" }}>Amt</th>
              <th style={{ ...thBase, color: "#007a3d" }}>Interest</th>
            </tr>
          </thead>
          <tbody>
            {[...byYear.entries()].map(([yr, yearRows]) => (
              <React.Fragment key={yr}>
                {yearRows.map((row, ri) => {
                  const rowBg  = ri % 2 === 0 ? "var(--surface-container-lowest)" : "var(--surface-container-low)";
                  const intBg  = ri % 2 === 0 ? "rgba(0,122,61,0.04)" : "rgba(0,122,61,0.09)";
                  return (
                    <tr key={`${row.year}-${row.month}`}>
                      <td style={{ ...tdMonth, backgroundColor: rowBg }}>
                        <MonthCell
                          year={row.year} month={row.month}
                          onSave={(newYear, newMonth) =>
                            onUpdate(row.year, row.month, { year: newYear, month: newMonth })
                          }
                        />
                      </td>
                      {/* Salary */}
                      <td style={{ ...tdNum, backgroundColor: rowBg, borderLeft: "1px solid rgba(192,201,192,0.2)" }}>
                        <EditableCell value={row.salaryAmount} step={500}
                          onChange={(v) => onUpdate(row.year, row.month, { salaryAmount: v })} />
                      </td>
                      <td style={{ ...tdNum, backgroundColor: intBg }}>
                        <EditableCell value={row.salaryInterest ?? 0} step={1}
                          onChange={(v) => onUpdate(row.year, row.month, { salaryInterest: v })} />
                      </td>
                      {/* Card Spend */}
                      <td style={{ ...tdNum, backgroundColor: rowBg, borderLeft: "1px solid rgba(192,201,192,0.2)" }}>
                        <EditableCell value={row.cardSpendAmount} step={100}
                          onChange={(v) => onUpdate(row.year, row.month, { cardSpendAmount: v })} />
                      </td>
                      <td style={{ ...tdNum, backgroundColor: intBg }}>
                        <EditableCell value={row.cardInterest ?? 0} step={1}
                          onChange={(v) => onUpdate(row.year, row.month, { cardInterest: v })} />
                      </td>
                      {/* Insurance */}
                      <td style={{ ...tdNum, backgroundColor: rowBg, borderLeft: "1px solid rgba(192,201,192,0.2)" }}>
                        <EditableCell value={row.insureAmount} step={100}
                          onChange={(v) => onUpdate(row.year, row.month, { insureAmount: v })} />
                      </td>
                      <td style={{ ...tdNum, backgroundColor: intBg }}>
                        <EditableCell value={row.insureInterest ?? 0} step={1}
                          onChange={(v) => onUpdate(row.year, row.month, { insureInterest: v })} />
                      </td>
                      {/* Investment */}
                      <td style={{ ...tdNum, backgroundColor: rowBg, borderLeft: "1px solid rgba(192,201,192,0.2)" }}>
                        <EditableCell value={row.investAmount} step={1000}
                          onChange={(v) => onUpdate(row.year, row.month, { investAmount: v })} />
                      </td>
                      <td style={{ ...tdNum, backgroundColor: intBg }}>
                        <EditableCell value={row.investInterest ?? 0} step={1}
                          onChange={(v) => onUpdate(row.year, row.month, { investInterest: v })} />
                      </td>
                      {/* Invest P&L */}
                      <td style={{ ...tdNum, backgroundColor: rowBg }}>
                        <EditableCell value={row.investmentPL ?? 0} step={100} allowNegative
                          onChange={(v) => onUpdate(row.year, row.month, { investmentPL: v })} />
                      </td>
                      {/* Net Gain — computed */}
                      <td style={{
                        ...tdNum, fontWeight: 700,
                        backgroundColor: ri % 2 === 0 ? "rgba(0,53,31,0.04)" : "rgba(0,53,31,0.08)",
                        color: row.netGain > 0 ? "#007a3d" : row.netGain < 0 ? "#b91c1c" : "var(--on-surface-sub)",
                      }}>
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
              const p = "var(--primary)";
              const w = "#fff";
              const mw = "rgba(255,255,255,0.6)";
              const dash = (v: number) => v !== 0 ? fmt(v) : "—";
              return (
                <tr>
                  <td style={{ ...tdMonth, backgroundColor: p, color: w, fontSize: "0.75rem" }}>Grand Total</td>
                  <td style={{ ...tdNum, backgroundColor: p, color: mw, borderLeft: "1px solid rgba(255,255,255,0.15)" }}>{dash(totals.salaryAmount)}</td>
                  <td style={{ ...tdNum, backgroundColor: p, color: w, fontWeight: 700 }}>{fmt(totals.salaryInterest)}</td>
                  <td style={{ ...tdNum, backgroundColor: p, color: mw, borderLeft: "1px solid rgba(255,255,255,0.15)" }}>{dash(totals.cardSpendAmount)}</td>
                  <td style={{ ...tdNum, backgroundColor: p, color: w, fontWeight: 700 }}>{fmt(totals.cardInterest)}</td>
                  <td style={{ ...tdNum, backgroundColor: p, color: mw, borderLeft: "1px solid rgba(255,255,255,0.15)" }}>{dash(totals.insureAmount)}</td>
                  <td style={{ ...tdNum, backgroundColor: p, color: w, fontWeight: 700 }}>{fmt(totals.insureInterest)}</td>
                  <td style={{ ...tdNum, backgroundColor: p, color: mw, borderLeft: "1px solid rgba(255,255,255,0.15)" }}>{dash(totals.investAmount)}</td>
                  <td style={{ ...tdNum, backgroundColor: p, color: w, fontWeight: 700 }}>{fmt(totals.investInterest)}</td>
                  <td style={{ ...tdNum, backgroundColor: p, color: "rgba(255,255,255,0.85)" }}>{dash(totals.investmentPL)}</td>
                  <td style={{ ...tdNum, backgroundColor: p, color: w, fontWeight: 700 }}>{fmt(totals.netGain)}</td>
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

export default function HysaTrackerPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const router         = useRouter();
  const { scenarios, updateScenario, updateEntry, addMonth, removeLastMonth } = useHysaScenarios();

  const scenario = scenarios.find((s) => s.id === scenarioId);

  useEffect(() => {
    if (scenarios.length > 0 && !scenario) router.replace("/tools/hysa-tracker");
  }, [scenario, scenarios.length, router]);

  const rows = useMemo(() => (scenario ? toRows(scenario.entries) : []), [scenario]);

  if (!scenario) return null;

  const set      = (changes: Partial<Omit<typeof scenario, "id" | "entries">>) => updateScenario(scenarioId, changes);
  const onUpdate = (year: number, month: number, changes: Partial<HysaMonthEntry>) =>
    updateEntry(scenarioId, year, month, changes);

  const totalInterest = rows.reduce((s, r) => s + r.totalInterest, 0);
  const totalNetGain  = rows.reduce((s, r) => s + r.netGain, 0);
  const totalInvestPL = rows.reduce((s, r) => s + (r.investmentPL ?? 0), 0);

  const firstRow   = rows[0];
  const lastRow    = rows[rows.length - 1];
  const rangeLabel = firstRow && lastRow
    ? `${MONTH_NAMES[firstRow.month - 1]} ${firstRow.year} – ${MONTH_NAMES[lastRow.month - 1]} ${lastRow.year}`
    : "—";

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen px-5 sm:px-8 lg:px-16 py-10" style={{ backgroundColor: "var(--surface-container-low)" }}>
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Page Header ───────────────────────────────────────────────── */}
          <div>
            <Link href="/tools/hysa-tracker" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6" style={{ color: "var(--on-surface-sub)", textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              All Scenarios
            </Link>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "linear-gradient(45deg, var(--primary), var(--primary-container))", boxShadow: "0 8px 24px rgba(0,53,31,0.2)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20M6 15h2M10 15h4" />
                </svg>
              </div>
              <div>
                <ProfileNameEditor name={scenario.name} onSave={(name) => set({ name })} />
                <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                  High Yield Savings Account Tracker
                </h1>
                <p className="mt-2 text-base max-w-xl" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  {rows.length > 0 ? `${rangeLabel} · ${rows.length} ${rows.length === 1 ? "month" : "months"} logged` : "No months logged yet"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Stat Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Total Interest Earned"
              sublabel={`Over ${rows.length} month${rows.length !== 1 ? "s" : ""}`}
              value={fmt(totalInterest)}
              gradient
            />
            <StatCard
              label="Total Net Gain"
              sublabel="Interest + Invest P&L"
              value={fmt(totalNetGain)}
              caption={totalInvestPL !== 0 ? `Invest P&L: ${fmt(totalInvestPL)}` : undefined}
            />
            <StatCard
              label="Months Tracked"
              sublabel={rangeLabel !== "—" ? rangeLabel : undefined}
              value={String(rows.length)}
              caption={rows.length === 0 ? "Add a month to begin" : undefined}
            />
            <StatCard
              label="Avg Monthly Gain"
              sublabel="Net gain per month"
              value={rows.length > 0 ? fmt(totalNetGain / rows.length) : "—"}
              caption={rows.length > 0 && totalInterest > 0
                ? `Avg interest: ${fmt(totalInterest / rows.length)}/mo`
                : undefined}
            />
          </div>

          {/* ── Spreadsheet Table ─────────────────────────────────────────── */}
          {rows.length > 0 && <SpreadsheetTable rows={rows} onUpdate={onUpdate} />}

          {/* ── Add / Remove Month ────────────────────────────────────────── */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => addMonth(scenarioId)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                color: "#fff", border: "none", cursor: "pointer",
                boxShadow: "0 8px 24px rgba(0,53,31,0.2)", fontFamily: "Manrope, sans-serif",
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

          {/* ── Chart ─────────────────────────────────────────────────────── */}
          {rows.length > 0 && <GainChart rows={rows} />}

          {/* ── How It Works ──────────────────────────────────────────────── */}
          <div className="rounded-xl p-8" style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
              How It Works
            </h2>
            <ul className="space-y-4">
              {[
                {
                  heading: "Amount columns",
                  body: "For each category (Salary, Card Spend, Insurance, Investment), log the dollar amount you spent or used that month — e.g. salary credited, total card spend, insurance premium paid, or investment amount contributed.",
                },
                {
                  heading: "Interest columns",
                  body: "Alongside each amount, enter the actual interest earned from that category as shown on your bank statement. This lets you see which category is generating the most interest over time.",
                },
                {
                  heading: "Invest P&L",
                  body: "Separately record your investment portfolio's profit or loss for the month — unrealised or realised gains and losses. Negative values are supported. This flows directly into Net Gain.",
                },
                {
                  heading: "Net Gain",
                  body: "Automatically computed as the sum of all four category interest amounts plus Invest P&L. This is your total financial gain from all sources tracked here.",
                },
                {
                  heading: "Annual Rollup in Chart",
                  body: "Once all 12 months of a calendar year have entries, the chart collapses that year into a single taller bar showing the full-year net gain. Months in the current (incomplete) year are shown individually.",
                },
              ].map(({ heading, body }) => (
                <li key={heading} className="flex gap-3 text-sm" style={{ color: "var(--on-surface-sub)", lineHeight: "1.7" }}>
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--primary)", marginTop: "0.55rem" }} />
                  <span>
                    <span className="font-semibold" style={{ color: "var(--on-surface)" }}>{heading}: </span>
                    {body}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </main>
    </>
  );
}
