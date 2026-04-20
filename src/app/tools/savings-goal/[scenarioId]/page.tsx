"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { useSavingsGoal, SavingsItem, SavingsScenario } from "@/hooks/useSavingsGoal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtAxis = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
};

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function niceMax(rawMax: number): number {
  if (rawMax <= 0) return 1000;
  const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const niceFactors = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  const nice = niceFactors.find((f) => f * mag >= rawMax) ?? 10;
  return nice * mag;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthsBetween(fromISO: string, toISO: string): number {
  if (!fromISO || !toISO) return 0;
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  const months = (ty - fy) * 12 + (tm - fm) + (td - fd) / 30;
  return Math.max(0, months);
}

// ─── ScenarioNameEditor ───────────────────────────────────────────────────────

function ScenarioNameEditor({
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
          if (e.key === "Enter") e.currentTarget.blur();
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
  type = "number",
  min,
  step = 1,
  hint,
}: {
  label: string;
  value: number | string;
  onChange: (v: string) => void;
  type?: "number" | "date";
  min?: number;
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
        type={type}
        value={value}
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

// ─── SavingsChart ─────────────────────────────────────────────────────────────

type CumulativePoint = { date: string; value: number; label?: string };

function SavingsChart({
  items,
  targetAmount,
  targetDate,
}: {
  items: SavingsItem[];
  targetAmount: number;
  targetDate: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sorted = useMemo(
    () => [...items].filter((i) => i.date).sort((a, b) => a.date.localeCompare(b.date)),
    [items]
  );

  if (sorted.length === 0 && targetAmount === 0) return null;

  const today = todayISO();
  const earliest = sorted[0]?.date ?? today;
  const latest = sorted[sorted.length - 1]?.date ?? today;
  const xMin = earliest < today ? earliest : today;
  const xMax = targetDate > latest ? targetDate : latest;
  if (!xMax || xMax <= xMin) return null;

  let cumulative = 0;
  const points: CumulativePoint[] = [{ date: xMin, value: 0, label: "Start" }];
  for (const item of sorted) {
    cumulative += item.amount;
    points.push({ date: item.date, value: cumulative, label: item.name });
  }
  if (points[points.length - 1].date < xMax) {
    points.push({ date: xMax, value: cumulative, label: "Now" });
  }

  const rawMax = Math.max(targetAmount, cumulative);
  const yMax = niceMax(rawMax);

  const toDays = (d: string) => Math.floor(new Date(d).getTime() / 86_400_000);
  const xMinDays = toDays(xMin);
  const xMaxDays = toDays(xMax);
  const xSpan = xMaxDays - xMinDays || 1;

  const W = 700;
  const H = 260;
  const PAD = { top: 24, right: 20, bottom: 44, left: 60 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const xOf = (d: string) => PAD.left + ((toDays(d) - xMinDays) / xSpan) * CW;
  const yOf = (v: number) => PAD.top + CH - (v / yMax) * CH;

  const pts = points.map((p) => `${xOf(p.date).toFixed(1)},${yOf(p.value).toFixed(1)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${xOf(xMax).toFixed(1)},${(PAD.top + CH).toFixed(1)} L ${xOf(xMin).toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  const targetY = targetAmount > 0 ? yOf(targetAmount) : null;
  const targetDateX = targetDate ? xOf(targetDate) : null;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * yMax);

  // X-axis labels
  const spanDays = xSpan;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const xLabels: { x: number; label: string }[] = [];
  const startDate = new Date(xMin);
  const endDate = new Date(xMax);
  const monthStep = spanDays < 400 ? 2 : spanDays < 1100 ? 4 : 12;
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (cursor <= endDate) {
    const iso = cursor.toISOString().slice(0, 10);
    xLabels.push({
      x: xOf(iso),
      label: monthStep >= 12
        ? `${cursor.getFullYear()}`
        : `${months[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`,
    });
    cursor.setMonth(cursor.getMonth() + monthStep);
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const fraction = Math.max(0, Math.min(1, (svgX - PAD.left) / CW));
    setHoveredIdx(Math.round(fraction * (points.length - 1)));
  };

  const hd = hoveredIdx !== null ? points[hoveredIdx] : null;
  const hx = hd ? xOf(hd.date) : 0;
  const TW = 176;
  const TH = 56;
  const tooltipX = hd ? (hx < PAD.left + CW / 2 ? hx + 10 : hx - TW - 10) : 0;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[0.9375rem] font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
        Projected Savings Progress
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", overflow: "visible", cursor: "crosshair" }}
        aria-label="Savings goal progress chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          <linearGradient id="savings-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00351f" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00351f" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {yTicks.map((v) => (
          <line key={v} x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)}
            stroke="#c0c9c0" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.7" />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((v) => (
          <text key={v} x={PAD.left - 6} y={yOf(v) + 4} textAnchor="end"
            fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            {fmtAxis(v)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={H - 6} textAnchor="middle"
            fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            {l.label}
          </text>
        ))}

        {/* Target horizontal line */}
        {targetY !== null && (
          <>
            <line x1={PAD.left} y1={targetY} x2={W - PAD.right} y2={targetY}
              stroke="#00351f" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.75" />
            <text x={W - PAD.right - 4} y={targetY - 6} textAnchor="end"
              fontSize="10" fill="#00351f" fontWeight="700" fontFamily="Manrope, sans-serif">
              Target {fmtAxis(targetAmount)}
            </text>
          </>
        )}

        {/* Target date vertical line */}
        {targetDateX !== null && targetDate >= xMin && targetDate <= xMax && (
          <>
            <line x1={targetDateX} y1={PAD.top} x2={targetDateX} y2={PAD.top + CH}
              stroke="#c0c9c0" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
            <text x={targetDateX + 4} y={PAD.top + 12} fontSize="9" fill="#3d4a41"
              fontFamily="Manrope, sans-serif" opacity="0.8">
              Target date
            </text>
          </>
        )}

        {/* Data */}
        <path d={area} fill="url(#savings-fill)" />
        <path d={line} fill="none" stroke="#00351f" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Item dots */}
        {points.slice(1, points[points.length - 1].label === "Now" ? -1 : undefined).map((p, i) => (
          <circle key={i} cx={xOf(p.date)} cy={yOf(p.value)} r="3.5"
            fill="#00351f" stroke="white" strokeWidth="1.5" />
        ))}

        {/* Legend */}
        <g transform={`translate(${PAD.left}, 10)`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke="#00351f" strokeWidth="2" />
          <text x="23" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">
            Cumulative Savings
          </text>
          <line x1="150" y1="0" x2="168" y2="0" stroke="#00351f" strokeWidth="1.5" strokeDasharray="6 4" />
          <text x="173" y="4" fontSize="10" fill="#3d4a41" fontFamily="Manrope, sans-serif">Target</text>
        </g>

        {/* Hover tooltip */}
        {hd && (
          <g pointerEvents="none">
            <line x1={hx} y1={PAD.top} x2={hx} y2={PAD.top + CH}
              stroke="#3d4a41" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle cx={hx} cy={yOf(hd.value)} r="4" fill="#00351f" stroke="white" strokeWidth="1.5" />
            <rect x={tooltipX} y={PAD.top + 4} width={TW} height={TH} rx="5"
              fill="white" stroke="#c0c9c0" strokeWidth="0.75" />
            <text x={tooltipX + 10} y={PAD.top + 20} fontSize="10" fontWeight="700"
              fill="#00351f" fontFamily="Manrope, sans-serif">
              {hd.label ?? "Point"}
            </text>
            <text x={tooltipX + 10} y={PAD.top + 36} fontSize="10" fill="#3d4a41"
              fontFamily="Manrope, sans-serif">
              {fmtDate(hd.date)}
            </text>
            <text x={tooltipX + 10} y={PAD.top + 50} fontSize="10" fontWeight="600" fill="#3d4a41"
              fontFamily="Manrope, sans-serif">
              {`Cumulative: ${fmt(hd.value)}`}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── ItemForm ─────────────────────────────────────────────────────────────────

type ItemDraft = { name: string; amount: string; date: string };

function ItemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: ItemDraft;
  onSave: (draft: ItemDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ItemDraft>(initial);
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({});

  const handleSave = () => {
    const errs: { name?: string; amount?: string } = {};
    if (!draft.name.trim()) errs.name = "Name is required";
    const amt = parseFloat(draft.amount);
    if (draft.amount === "" || isNaN(amt) || amt < 0) errs.amount = "Enter a valid amount";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(draft);
  };

  const inputStyle = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid var(--outline-variant)",
    background: "var(--surface-container-lowest)",
    color: "var(--on-surface)",
    fontFamily: "Manrope, sans-serif",
    fontSize: "0.875rem",
    outline: "none",
  } as React.CSSProperties;

  const labelStyle = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--on-surface-sub)",
    marginBottom: "0.3rem",
    letterSpacing: "0.02em",
  } as React.CSSProperties;

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        backgroundColor: "var(--surface-container-low)",
        border: "1px solid var(--outline-variant)",
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <label style={labelStyle}>Name</label>
          <input
            style={{ ...inputStyle, borderColor: errors.name ? "var(--error, #ba1a1a)" : "var(--outline-variant)" }}
            placeholder="e.g. Cash savings"
            value={draft.name}
            onChange={(e) => { setDraft({ ...draft, name: e.target.value }); setErrors((prev) => ({ ...prev, name: undefined })); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel(); }}
          />
          {errors.name && <p className="text-xs mt-1" style={{ color: "var(--error, #ba1a1a)" }}>{errors.name}</p>}
        </div>

        <div>
          <label style={labelStyle}>Amount (S$)</label>
          <input
            type="number"
            min="0"
            step="100"
            style={{ ...inputStyle, borderColor: errors.amount ? "var(--error, #ba1a1a)" : "var(--outline-variant)" }}
            placeholder="0"
            value={draft.amount}
            onChange={(e) => { setDraft({ ...draft, amount: e.target.value }); setErrors((prev) => ({ ...prev, amount: undefined })); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel(); }}
          />
          {errors.amount && <p className="text-xs mt-1" style={{ color: "var(--error, #ba1a1a)" }}>{errors.amount}</p>}
        </div>

        <div>
          <label style={labelStyle}>Target Date</label>
          <input
            type="date"
            style={inputStyle}
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onCancel(); }}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            background: "var(--surface-container)",
            color: "var(--on-surface-sub)",
            border: "none",
            cursor: "pointer",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  onEdit,
  onDelete,
}: {
  item: SavingsItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3 px-1"
      style={{ borderBottom: "1px solid var(--outline-variant)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--on-surface)" }}>
          {item.name}
        </p>
        {item.date && (
          <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-sub)" }}>
            {fmtDate(item.date)}
          </p>
        )}
      </div>

      <span className="text-sm font-semibold tabular-nums flex-shrink-0" style={{ color: "var(--on-surface)" }}>
        {fmt(item.amount)}
      </span>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          title="Edit"
          className="p-1.5 rounded-lg"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--on-surface-sub)", opacity: 0.5 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.5")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="p-1.5 rounded-lg"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--on-surface-sub)", opacity: 0.5 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.5")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type EditingState =
  | { mode: "edit"; id: string; name: string; amount: string; date: string }
  | { mode: "add"; name: string; amount: string; date: string }
  | null;

export default function SavingsGoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params.scenarioId as string;

  const { scenarios, updateScenario, addItem, removeItem, updateItem } = useSavingsGoal();
  const scenario = scenarios.find((s) => s.id === scenarioId);

  const [editing, setEditing] = useState<EditingState>(null);

  useEffect(() => {
    if (scenarios.length > 0 && !scenario) {
      router.replace("/tools/savings-goal");
    }
  }, [scenario, scenarios.length, router]);

  if (!scenario) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen" style={{ backgroundColor: "var(--surface-container-low)" }} />
      </>
    );
  }

  const { name, targetAmount, targetDate, items } = scenario;

  const total = items.reduce((sum, it) => sum + it.amount, 0);
  const progress = targetAmount > 0 ? Math.min(100, (total / targetAmount) * 100) : 0;
  const remaining = Math.max(0, targetAmount - total);
  const monthsLeft = monthsBetween(todayISO(), targetDate);
  const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : 0;

  const handleSaveNew = (draft: { name: string; amount: string; date: string }) => {
    addItem(scenarioId, {
      name: draft.name.trim(),
      amount: parseFloat(draft.amount),
      date: draft.date,
    });
    setEditing(null);
  };

  const handleSaveEdit = (id: string, draft: { name: string; amount: string; date: string }) => {
    updateItem(scenarioId, id, {
      name: draft.name.trim(),
      amount: parseFloat(draft.amount),
      date: draft.date,
    });
    setEditing(null);
  };

  const handleDelete = (itemId: string, itemName: string) => {
    if (confirm(`Delete "${itemName}"? This cannot be undone.`)) {
      removeItem(scenarioId, itemId);
      if (editing && editing.mode === "edit" && editing.id === itemId) setEditing(null);
    }
  };

  const statusCaption = targetAmount === 0
    ? "Set a target above"
    : total >= targetAmount
      ? "Goal reached!"
      : `${progress.toFixed(1)}% complete`;

  return (
    <>
      <SiteHeader />
      <main
        className="min-h-screen px-5 sm:px-8 lg:px-16 py-10"
        style={{ backgroundColor: "var(--surface-container-low)" }}
      >
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Back link ─────────────────────────────────────────────────── */}
          <div>
            <Link
              href="/tools/savings-goal"
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
              style={{ color: "var(--on-surface-sub)", textDecoration: "none" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              All Goals
            </Link>

            {/* Header */}
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: "linear-gradient(45deg, var(--primary), var(--primary-container))",
                  boxShadow: "0 8px 24px rgba(0,53,31,0.2)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
                  <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
                  <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                </svg>
              </div>
              <div>
                <ScenarioNameEditor
                  name={name}
                  onSave={(newName) => updateScenario(scenarioId, { name: newName })}
                />
                <h1
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                >
                  Savings Goal
                </h1>
                <p className="mt-2 text-base max-w-xl" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Define your target, add every line item contributing to it, and see your projected progress.
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
                Desired savings amount and timeframe
              </p>

              <div className="space-y-5">
                <FocusInput
                  label="Desired Savings Amount (S$)"
                  value={targetAmount}
                  onChange={(v) => updateScenario(scenarioId, { targetAmount: parseFloat(v) || 0 })}
                  type="number"
                  min={0}
                  step={1000}
                />

                <FocusInput
                  label="Target Date"
                  value={targetDate}
                  onChange={(v) => updateScenario(scenarioId, { targetDate: v })}
                  type="date"
                  hint={
                    monthsLeft > 0
                      ? `${monthsLeft.toFixed(1)} months from today`
                      : targetDate
                        ? "Target date has passed"
                        : undefined
                  }
                />
              </div>
            </div>

            {/* Right — Stat Cards */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Progress"
                  sublabel={`of ${fmt(targetAmount)}`}
                  value={`${progress.toFixed(0)}%`}
                  caption={statusCaption}
                  gradient
                />
                <StatCard
                  label="Saved So Far"
                  sublabel={`across ${items.length} item${items.length !== 1 ? "s" : ""}`}
                  value={fmt(total)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Remaining"
                  sublabel="to hit your target"
                  value={fmt(remaining)}
                  caption={
                    remaining === 0 && targetAmount > 0
                      ? "You're fully funded"
                      : undefined
                  }
                />
                <StatCard
                  label="Monthly Needed"
                  sublabel={
                    monthsLeft > 0
                      ? `over ${monthsLeft.toFixed(1)} months`
                      : "No time left"
                  }
                  value={monthsLeft > 0 ? fmt(monthlyNeeded) : "—"}
                  caption={
                    monthlyNeeded > 0 && monthsLeft > 0
                      ? "Average monthly savings to reach goal"
                      : undefined
                  }
                />
              </div>
            </div>
          </div>

          {/* ── Chart ─────────────────────────────────────────────────────── */}
          <SavingsChart items={items} targetAmount={targetAmount} targetDate={targetDate} />

          {/* ── Items Section ─────────────────────────────────────────────── */}
          <div
            className="rounded-xl px-5 pb-5 pt-4"
            style={{
              backgroundColor: "var(--surface-container-lowest)",
              boxShadow: "var(--shadow-botanical)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold" style={{ color: "var(--on-surface)" }}>
                Savings Items
              </h2>
              {editing?.mode !== "add" && (
                <button
                  onClick={() => setEditing({ mode: "add", name: "", amount: "", date: "" })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                  style={{
                    background: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Item
                </button>
              )}
            </div>

            {items.length === 0 && editing?.mode !== "add" && (
              <div className="py-10 text-center">
                <p className="text-sm" style={{ color: "var(--on-surface-sub)" }}>
                  No items yet. Add a line item to get started.
                </p>
              </div>
            )}

            {items.map((item) =>
              editing?.mode === "edit" && editing.id === item.id ? (
                <div key={item.id} className="py-2">
                  <ItemForm
                    initial={{ name: editing.name, amount: editing.amount, date: editing.date }}
                    onSave={(draft) => handleSaveEdit(item.id, draft)}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              ) : (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={() =>
                    setEditing({
                      mode: "edit",
                      id: item.id,
                      name: item.name,
                      amount: String(item.amount),
                      date: item.date,
                    })
                  }
                  onDelete={() => handleDelete(item.id, item.name)}
                />
              )
            )}

            {editing?.mode === "add" && (
              <div className="pt-3">
                <ItemForm
                  initial={{ name: editing.name, amount: editing.amount, date: editing.date }}
                  onSave={handleSaveNew}
                  onCancel={() => setEditing(null)}
                />
              </div>
            )}

            {items.length > 0 && (
              <div className="flex items-center justify-between pt-4 mt-2">
                <span className="text-sm font-semibold" style={{ color: "var(--on-surface-sub)" }}>
                  Total
                </span>
                <span className="text-base font-bold tabular-nums" style={{ color: "var(--on-surface)" }}>
                  {fmt(total)}
                </span>
              </div>
            )}
          </div>

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
                  heading: "Set Your Target",
                  body: (
                    <>
                      Enter a <strong>Desired Savings Amount</strong> and <strong>Target Date</strong>.
                      This is the finish line you&apos;re working towards — a house down payment, a wedding fund,
                      or any lump sum you need by a specific deadline.
                    </>
                  ),
                },
                {
                  heading: "Add Line Items",
                  body: (
                    <>
                      Break the target down into individual savings sources: cash savings, year-end bonus,
                      CPF transfers, investment proceeds. Each item has a <strong>name</strong>, <strong>amount</strong>,
                      and <strong>expected date</strong>.
                    </>
                  ),
                },
                {
                  heading: "Track Progress",
                  body: (
                    <>
                      The tool sums every item against your target and shows the{" "}
                      <strong>progress percentage</strong>, <strong>amount remaining</strong>, and the{" "}
                      <strong>monthly savings rate</strong> required to close the gap before your deadline.
                    </>
                  ),
                },
                {
                  heading: "Visualise Your Path",
                  body: (
                    <>
                      The chart plots cumulative savings over time. The dashed horizontal line marks your
                      target amount; the dashed vertical line marks your deadline. A shortfall between the
                      trajectory and the target line is your funding gap.
                    </>
                  ),
                },
                {
                  heading: "Compare Multiple Goals",
                  body: "Create a separate scenario for each goal — short-term emergency fund, medium-term down payment, long-term retirement top-up. Each scenario has its own timeline and line items.",
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
              <span className="font-semibold">Disclaimer:</span> This tool is for personal planning only.
              Projections are based on line items you enter and do not model interest, inflation, or
              investment returns. Actual outcomes depend on your discipline in executing the plan.
              This is not financial advice.
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
