"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useToolState } from "@/hooks/useToolState";

// ─── Types ────────────────────────────────────────────────────────────────────

type BudgetCategory =
  | "Insurance"
  | "Utilities"
  | "Food"
  | "Education"
  | "Tuition"
  | "Allowance"
  | "Car"
  | "Home"
  | "Holiday"
  | "Saving"
  | "Investment"
  | "Grocery"
  | "Entertainment";

type BudgetItem = {
  id: string;
  label: string;
  category: BudgetCategory;
  planned: number; // monthly SGD
};

type SliceData = {
  key: string;
  label: string;
  value: number;
  color: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY_ITEMS = "budget:items";
const STORAGE_KEY_STATE = "tool:budget-planner";

const CATEGORIES: BudgetCategory[] = [
  "Insurance",
  "Utilities",
  "Food",
  "Education",
  "Tuition",
  "Allowance",
  "Car",
  "Home",
  "Holiday",
  "Saving",
  "Investment",
  "Grocery",
  "Entertainment",
];

const MANDATORY_CATEGORIES = new Set<BudgetCategory>([
  "Insurance",
  "Utilities",
  "Food",
  "Education",
  "Car",
  "Home",
  "Grocery",
]);

const CATEGORY_COLORS: Record<BudgetCategory, string> = {
  Insurance:     "#00351f",
  Utilities:     "#1a6b42",
  Home:          "#2d8a5e",
  Car:           "#0d5c38",
  Education:     "#3ba373",
  Tuition:       "#5bbf8a",
  Food:          "#c05621",
  Allowance:     "#d97c3a",
  Holiday:       "#8b5cf6",
  Saving:        "#4f46e5",
  Investment:    "#0891b2",
  Grocery:       "#b45309",
  Entertainment: "#be185d",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

let idCounter = 0;
function genId(): string {
  return `bi_${Date.now()}_${++idCounter}`;
}

function loadArray<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
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

// SVG arc path for a pie/donut slice.
// startAngle and endAngle are in radians; 0 = top, clockwise.
function slicePath(
  cx: number,
  cy: number,
  r: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
): string {
  // Clamp to just under 2π to avoid degenerate full-circle case (start === end point)
  const sweep = Math.min(endAngle - startAngle, Math.PI * 2 - 0.0001);

  const x1 = cx + r * Math.sin(startAngle);
  const y1 = cy - r * Math.cos(startAngle);
  const x2 = cx + r * Math.sin(startAngle + sweep);
  const y2 = cy - r * Math.cos(startAngle + sweep);
  const largeArc = sweep > Math.PI ? 1 : 0;

  if (innerR <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      "Z",
    ].join(" ");
  }

  const ix1 = cx + innerR * Math.sin(startAngle);
  const iy1 = cy - innerR * Math.cos(startAngle);
  const ix2 = cx + innerR * Math.sin(startAngle + sweep);
  const iy2 = cy - innerR * Math.cos(startAngle + sweep);

  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${ix2.toFixed(2)} ${iy2.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1.toFixed(2)} ${iy1.toFixed(2)}`,
    "Z",
  ].join(" ");
}

// ─── FocusInput ──────────────────────────────────────────────────────────────

function FocusInput({
  label,
  value,
  onChange,
  min,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
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
        type="number"
        value={value}
        min={min}
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

// ─── InlineSelect ─────────────────────────────────────────────────────────────

function InlineSelect({
  value,
  onChange,
}: {
  value: BudgetCategory;
  onChange: (v: BudgetCategory) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BudgetCategory)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "var(--surface-container-highest)",
          border: "none",
          borderBottom: `2px solid ${focused ? "var(--primary)" : "var(--outline-variant)"}`,
          borderRadius: "0.25rem 0.25rem 0 0",
          padding: "0.5rem 1.5rem 0.5rem 0.375rem",
          fontSize: "0.875rem",
          fontFamily: "Manrope, sans-serif",
          fontWeight: 500,
          color: "var(--on-surface)",
          outline: "none",
          transition: "border-color 0.15s ease",
          appearance: "none",
          cursor: "pointer",
        }}
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      {/* Custom chevron */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--on-surface-sub)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: "absolute",
          right: "0.375rem",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

// ─── BudgetItemRow ────────────────────────────────────────────────────────────

function BudgetItemRow({
  item,
  onChangeLabel,
  onChangeCategory,
  onChangePlanned,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  item: BudgetItem;
  onChangeLabel: (id: string, label: string) => void;
  onChangeCategory: (id: string, cat: BudgetCategory) => void;
  onChangePlanned: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const isMandatory = MANDATORY_CATEGORIES.has(item.category);
  return (
    <div className="grid grid-cols-[3fr_3fr_3fr_auto] gap-2 items-start">
      {/* Label */}
      <div className="flex flex-col">
        <InlineInput
          value={item.label}
          onChange={(v) => onChangeLabel(item.id, v)}
          placeholder="e.g. NTUC"
        />
        <div className="h-[1.25rem]" />
      </div>

      {/* Category */}
      <div className="flex flex-col">
        <InlineSelect
          value={item.category}
          onChange={(cat) => onChangeCategory(item.id, cat)}
        />
        <p
          className="text-[0.625rem] mt-1 font-semibold tracking-wide"
          style={{ color: isMandatory ? "var(--primary)" : "#c05621", lineHeight: "1.25rem" }}
        >
          {isMandatory ? "Mandatory" : "Discretionary"}
        </p>
      </div>

      {/* Planned amount */}
      <div className="flex flex-col">
        <InlineInput
          value={item.planned || ""}
          onChange={(v) => onChangePlanned(item.id, parseFloat(v) || 0)}
          type="number"
          placeholder="0"
          min={0}
          step={50}
        />
        <p
          className="text-[0.625rem] mt-1 font-semibold tracking-wide"
          style={{ color: "var(--primary)", lineHeight: "1.25rem" }}
        >
          = {fmt(item.planned * 12)} / yr
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
          onClick={() => onDelete(item.id)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem" }}
          title="Remove item"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tertiary)" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── PieChart ─────────────────────────────────────────────────────────────────

function PieChart({
  slices,
  size = 220,
  innerRadius = 60,
  centerLabel,
}: {
  slices: SliceData[];
  size?: number;
  innerRadius?: number;
  centerLabel?: { top: string; bottom: string };
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;

  const total = slices.reduce((s, sl) => s + sl.value, 0);

  if (total <= 0) {
    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full"
        style={{ fontFamily: "Manrope, sans-serif", maxWidth: `${size}px` }}
      >
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--outline-variant)"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity={0.5}
        />
        {innerRadius > 0 && (
          <circle
            cx={cx} cy={cy} r={innerRadius}
            fill="none"
            stroke="var(--outline-variant)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity={0.35}
          />
        )}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="var(--on-surface-sub)" fontWeight="500">
          No data
        </text>
        <text x={cx} y={cy + 9} textAnchor="middle" fontSize="9" fill="var(--on-surface-sub)">
          Add budget items
        </text>
      </svg>
    );
  }

  let cursor = 0;
  const builtSlices = slices.map((sl) => {
    const fraction = sl.value / total;
    const startAngle = cursor;
    const endAngle = cursor + fraction * Math.PI * 2;
    cursor = endAngle;
    return { ...sl, startAngle, endAngle, fraction };
  });

  const hoveredSlice = hovered ? builtSlices.find((s) => s.key === hovered) ?? null : null;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full"
      style={{ fontFamily: "Manrope, sans-serif", maxWidth: `${size}px` }}
      onMouseLeave={() => setHovered(null)}
    >
      {builtSlices.map((sl) => {
        const isHovered = hovered === sl.key;
        return (
          <path
            key={sl.key}
            d={slicePath(cx, cy, r, innerRadius, sl.startAngle, sl.endAngle)}
            fill={sl.color}
            stroke="white"
            strokeWidth={1.5}
            opacity={hovered === null || isHovered ? 1 : 0.5}
            style={{ transition: "opacity 0.15s ease", cursor: "pointer" }}
            onMouseEnter={() => setHovered(sl.key)}
          />
        );
      })}

      {/* Center text — hover info takes priority over centerLabel */}
      {innerRadius > 0 && (
        <>
          {hoveredSlice ? (
            <>
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={hoveredSlice.color}
              >
                {hoveredSlice.label}
              </text>
              <text
                x={cx}
                y={cy + 9}
                textAnchor="middle"
                fontSize="9"
                fill="var(--on-surface-sub)"
              >
                {(hoveredSlice.fraction * 100).toFixed(1)}%
              </text>
            </>
          ) : centerLabel ? (
            <>
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="var(--on-surface)"
              >
                {centerLabel.top}
              </text>
              <text
                x={cx}
                y={cy + 9}
                textAnchor="middle"
                fontSize="9"
                fill="var(--on-surface-sub)"
              >
                {centerLabel.bottom}
              </text>
            </>
          ) : null}
        </>
      )}
    </svg>
  );
}

// ─── CategoryBreakdownChart ───────────────────────────────────────────────────

function CategoryBreakdownChart({ items }: { items: BudgetItem[] }) {
  const aggregates = useMemo(() => {
    const map = new Map<BudgetCategory, number>();
    for (const item of items) {
      map.set(item.category, (map.get(item.category) ?? 0) + item.planned);
    }
    return CATEGORIES
      .map((cat) => ({ category: cat, total: map.get(cat) ?? 0, color: CATEGORY_COLORS[cat] }))
      .filter((a) => a.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [items]);

  const slices: SliceData[] = aggregates.map((a) => ({
    key: a.category,
    label: a.category,
    value: a.total,
    color: a.color,
  }));

  const total = aggregates.reduce((s, a) => s + a.total, 0);

  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="font-bold text-[1rem] mb-0.5" style={{ color: "var(--on-surface)" }}>
        Spending by Category
      </p>
      <p className="text-sm mb-5" style={{ color: "var(--on-surface-sub)" }}>
        How your budget is distributed across categories
      </p>

      <div className="flex justify-center mb-5">
        <PieChart
          slices={slices}
          centerLabel={total > 0 ? { top: fmt(total), bottom: "per month" } : undefined}
        />
      </div>

      {aggregates.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {aggregates.map((a) => (
            <div key={a.category} className="flex items-center gap-2 min-w-0">
              <span
                className="flex-shrink-0"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  backgroundColor: a.color,
                  display: "inline-block",
                }}
              />
              <span
                className="text-[0.75rem] font-medium truncate"
                style={{ color: "var(--on-surface)", flex: 1 }}
              >
                {a.category}
              </span>
              <span
                className="text-[0.75rem] font-semibold flex-shrink-0"
                style={{ color: "var(--on-surface-sub)" }}
              >
                {fmt(a.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SpendingSplitChart ───────────────────────────────────────────────────────

function SpendingSplitChart({
  items,
  monthlyIncome,
}: {
  items: BudgetItem[];
  monthlyIncome: number;
}) {
  const { mandatoryTotal, discretionaryTotal, surplusMonthly, surplusAnnual } = useMemo(() => {
    const mandatory = items
      .filter((item) => MANDATORY_CATEGORIES.has(item.category))
      .reduce((s, item) => s + item.planned, 0);
    const discretionary = items
      .filter((item) => !MANDATORY_CATEGORIES.has(item.category))
      .reduce((s, item) => s + item.planned, 0);
    return {
      mandatoryTotal: mandatory,
      discretionaryTotal: discretionary,
      surplusMonthly: monthlyIncome - mandatory,
      surplusAnnual: (monthlyIncome - mandatory) * 12,
    };
  }, [items, monthlyIncome]);

  const total = mandatoryTotal + discretionaryTotal;

  const slices: SliceData[] = [
    { key: "mandatory",     label: "Mandatory",     value: mandatoryTotal,     color: "#00351f" },
    { key: "discretionary", label: "Discretionary", value: discretionaryTotal, color: "#c05621" },
  ].filter((sl) => sl.value > 0);

  const isPositive = surplusMonthly >= 0;

  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="font-bold text-[1rem] mb-0.5" style={{ color: "var(--on-surface)" }}>
        Mandatory vs Discretionary
      </p>
      <p className="text-sm mb-5" style={{ color: "var(--on-surface-sub)" }}>
        Fixed obligations vs flexible spending
      </p>

      <div className="flex justify-center mb-5">
        <PieChart slices={slices} />
      </div>

      {/* Legend */}
      <div className="space-y-3 mb-5">
        {[
          { label: "Mandatory",     color: "#00351f", value: mandatoryTotal,     desc: "Insurance, Utilities, Food, Education, Car, Home, Grocery" },
          { label: "Discretionary", color: "#c05621", value: discretionaryTotal, desc: "Tuition, Allowance, Holiday, Saving, Investment, Entertainment" },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex items-center gap-3">
              <span
                className="flex-shrink-0"
                style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: row.color, display: "inline-block" }}
              />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-[0.8125rem] font-semibold" style={{ color: "var(--on-surface)" }}>
                  {row.label}
                </span>
                <span className="text-[0.8125rem] font-bold" style={{ color: "var(--on-surface)" }}>
                  {fmt(row.value)}
                  <span className="text-[0.625rem] font-medium ml-1" style={{ color: "var(--on-surface-sub)" }}>/mo</span>
                </span>
              </div>
            </div>
            <p className="text-[0.625rem] mt-0.5 pl-[22px]" style={{ color: "var(--on-surface-sub)" }}>
              {total > 0 ? `${((row.value / total) * 100).toFixed(1)}% of total spending` : "—"}
            </p>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--outline-variant)", marginBottom: "1rem" }} />

      {/* Surplus callout */}
      <div>
        <p className="text-[0.6875rem] font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--on-surface-sub)" }}>
          Surplus after mandatory costs
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p
              className="text-xl font-bold"
              style={{ color: isPositive ? "var(--primary)" : "var(--tertiary)", letterSpacing: "-0.02em" }}
            >
              {fmt(surplusMonthly)}
            </p>
            <p className="text-[0.6875rem] mt-0.5" style={{ color: "var(--on-surface-sub)" }}>per month</p>
          </div>
          <div>
            <p
              className="text-xl font-bold"
              style={{ color: isPositive ? "var(--primary)" : "var(--tertiary)", letterSpacing: "-0.02em" }}
            >
              {fmt(surplusAnnual)}
            </p>
            <p className="text-[0.6875rem] mt-0.5" style={{ color: "var(--on-surface-sub)" }}>per year</p>
          </div>
        </div>
        {!isPositive && (
          <p className="text-[0.75rem] mt-2.5" style={{ color: "var(--tertiary)" }}>
            Mandatory costs exceed income — review your fixed obligations.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── BudgetPlannerPage ────────────────────────────────────────────────────────

export default function BudgetPlannerPage() {
  const [s, set] = useToolState(STORAGE_KEY_STATE, { annualSalary: 72000 });
  const monthlyIncome = s.annualSalary / 12;

  const [items, setItemsRaw] = useState<BudgetItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItemsRaw(loadArray<BudgetItem>(STORAGE_KEY_ITEMS, []));
    setMounted(true);
  }, []);

  const setItems = useCallback((fn: (prev: BudgetItem[]) => BudgetItem[]) => {
    setItemsRaw((prev) => {
      const next = fn(prev);
      saveArray(STORAGE_KEY_ITEMS, next);
      return next;
    });
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, { id: genId(), label: "", category: "Food", planned: 0 }]);
  };

  const updateLabel = useCallback((id: string, label: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, label } : item));
  }, [setItems]);

  const updateCategory = useCallback((id: string, cat: BudgetCategory) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, category: cat } : item));
  }, [setItems]);

  const updatePlanned = useCallback((id: string, amount: number) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, planned: amount } : item));
  }, [setItems]);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, [setItems]);

  const moveItem = useCallback((index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, [setItems]);

  const totalMonthly = useMemo(
    () => items.reduce((s, item) => s + item.planned, 0),
    [items],
  );

  const remainingMonthly = monthlyIncome - totalMonthly;

  const tableRows = useMemo(() => {
    const map = new Map<BudgetCategory, number>();
    for (const item of items) {
      map.set(item.category, (map.get(item.category) ?? 0) + item.planned);
    }
    return Array.from(map.entries())
      .map(([cat, total]) => ({ cat, total }))
      .sort((a, b) => b.total - a.total);
  }, [items]);

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

          {/* ── Page Header ─────────────────────────────────────────── */}
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
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <path d="M14 17h7M17.5 14v7" />
                </svg>
              </div>

              <div>
                <h1
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                >
                  Budget Planner
                </h1>
                <p className="mt-2 text-base max-w-xl" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Plan your monthly spending, see where your money goes, and understand how much flexibility you really have.
                </p>
              </div>
            </div>
          </div>

          {/* ── Main Grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left — Input */}
            <div className="lg:col-span-5 space-y-5">

              {/* Salary Card */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
              >
                <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                  Annual Net Salary
                </p>
                <p className="text-sm mt-0.5 mb-5" style={{ color: "var(--on-surface-sub)" }}>
                  After tax and CPF deductions
                </p>
                <FocusInput
                  label="Annual net salary (S$)"
                  value={s.annualSalary}
                  onChange={(v) => set({ annualSalary: v })}
                  min={0}
                  step={1000}
                  hint={`Monthly income: ${fmt(monthlyIncome)} / mo`}
                />
              </div>

              {/* Budget Items Card */}
              <div
                className="rounded-xl p-6"
                style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-[1rem]" style={{ color: "var(--on-surface)" }}>
                    Budget Items
                  </p>
                  <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                    {fmt(totalMonthly)} / mo
                  </span>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                  Add each spending item with a label, category, and monthly amount.
                </p>

                {/* Column headers */}
                <div className="grid grid-cols-[3fr_3fr_3fr_auto] gap-2 mb-2">
                  <p className="text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Label</p>
                  <p className="text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Category</p>
                  <p className="text-[0.625rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>Monthly (S$)</p>
                  <p style={{ width: "2.75rem" }} />
                </div>

                <div className="space-y-2">
                  {items.map((item, i) => (
                    <BudgetItemRow
                      key={item.id}
                      item={item}
                      onChangeLabel={updateLabel}
                      onChangeCategory={updateCategory}
                      onChangePlanned={updatePlanned}
                      onDelete={deleteItem}
                      onMoveUp={i > 0 ? () => moveItem(i, -1) : undefined}
                      onMoveDown={i < items.length - 1 ? () => moveItem(i, 1) : undefined}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontFamily: "Manrope, sans-serif", padding: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add budget item
                </button>
              </div>
            </div>

            {/* Right — Charts & Stats */}
            <div className="lg:col-span-7 space-y-5">

              {/* Primary stat cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Monthly Income — hero card */}
                <div
                  className="rounded-xl p-5 flex flex-col justify-between"
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                    boxShadow: "0 12px 32px rgba(0,53,31,0.20)",
                    minHeight: "7.5rem",
                  }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.65)" }}>
                    Monthly Income
                  </p>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold leading-none mt-3" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
                      {fmt(monthlyIncome)}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                      Annual: {fmt(s.annualSalary)}
                    </p>
                  </div>
                </div>

                {/* Total Spending */}
                <div
                  className="rounded-xl p-5 flex flex-col justify-between"
                  style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)", minHeight: "7.5rem" }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase" style={{ color: "var(--on-surface-sub)" }}>
                    Total Spending
                  </p>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold leading-none mt-3" style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}>
                      {fmt(totalMonthly)}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "var(--on-surface-sub)" }}>
                      {items.length} item{items.length !== 1 ? "s" : ""} budgeted
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
                  <p
                    className="text-[0.6875rem] font-semibold tracking-widest uppercase mb-2"
                    style={{ color: remainingMonthly >= 0 ? "var(--primary)" : "var(--tertiary)" }}
                  >
                    Remaining Budget
                  </p>
                  <p
                    className="text-xl font-bold"
                    style={{ color: remainingMonthly >= 0 ? "var(--primary)" : "var(--tertiary)", letterSpacing: "-0.01em" }}
                  >
                    {fmt(remainingMonthly)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                    {remainingMonthly >= 0 ? "Unallocated this month" : "Budget exceeds income"}
                  </p>
                </div>

                <div
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
                >
                  <p className="text-[0.6875rem] font-semibold tracking-widest uppercase mb-2" style={{ color: "var(--on-surface-sub)" }}>
                    Annual Spending
                  </p>
                  <p className="text-xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
                    {fmt(totalMonthly * 12)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
                    {s.annualSalary > 0
                      ? `${((totalMonthly * 12 / s.annualSalary) * 100).toFixed(1)}% of annual income`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Pie Chart 1 — Category Breakdown */}
              <CategoryBreakdownChart items={items} />

              {/* Pie Chart 2 — Mandatory vs Discretionary */}
              <SpendingSplitChart items={items} monthlyIncome={monthlyIncome} />

            </div>
          </div>

          {/* ── Summary Table ─────────────────────────────────────────── */}
          {tableRows.length > 0 && (
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
            >
              <p className="font-bold text-[1rem] mb-4" style={{ color: "var(--on-surface)" }}>
                Budget Summary
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Category", "Type", "Monthly", "Annual", "% of Income"].map((h) => (
                        <th
                          key={h}
                          className="text-left text-[0.6875rem] font-semibold tracking-widest uppercase pb-3 pr-4"
                          style={{ color: "var(--on-surface-sub)", borderBottom: "1px solid var(--outline-variant)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, i) => {
                      const isMandatory = MANDATORY_CATEGORIES.has(row.cat);
                      const pctOfIncome = s.annualSalary > 0 ? (row.total / (s.annualSalary / 12)) * 100 : 0;
                      return (
                        <tr
                          key={row.cat}
                          style={{ backgroundColor: i % 2 === 1 ? "var(--surface-container-low)" : "transparent" }}
                        >
                          <td className="py-2.5 pr-4" style={{ color: "var(--on-surface)", fontWeight: 600 }}>
                            <div className="flex items-center gap-2">
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 2,
                                  backgroundColor: CATEGORY_COLORS[row.cat],
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}
                              />
                              {row.cat}
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span
                              className="text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: isMandatory ? "var(--primary)" : "#c05621",
                                color: "#fff",
                              }}
                            >
                              {isMandatory ? "Mandatory" : "Discretionary"}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 font-semibold" style={{ color: "var(--on-surface)" }}>
                            {fmt(row.total)}
                          </td>
                          <td className="py-2.5 pr-4" style={{ color: "var(--on-surface-sub)" }}>
                            {fmt(row.total * 12)}
                          </td>
                          <td className="py-2.5" style={{ color: "var(--on-surface-sub)" }}>
                            {pctOfIncome.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total row */}
                    <tr style={{ borderTop: "2px solid var(--outline-variant)" }}>
                      <td className="py-3 pr-4 font-bold" style={{ color: "var(--on-surface)" }} colSpan={2}>
                        Total
                      </td>
                      <td className="py-3 pr-4 font-bold" style={{ color: "var(--on-surface)" }}>
                        {fmt(totalMonthly)}
                      </td>
                      <td className="py-3 pr-4 font-bold" style={{ color: "var(--on-surface)" }}>
                        {fmt(totalMonthly * 12)}
                      </td>
                      <td className="py-3 font-bold" style={{ color: "var(--on-surface)" }}>
                        {s.annualSalary > 0
                          ? `${((totalMonthly / (s.annualSalary / 12)) * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── How It Works ─────────────────────────────────────────── */}
          <div
            className="rounded-xl p-8"
            style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
          >
            <h2 className="text-xl font-bold mb-6" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                {
                  n: 1,
                  title: "Annual Net Salary",
                  body: "Enter your post-tax, post-CPF take-home pay. The tool divides this by 12 to derive your monthly income. All surplus calculations use this figure as the baseline.",
                },
                {
                  n: 2,
                  title: "Mandatory vs Discretionary",
                  body: "Mandatory categories are fixed obligations that cannot easily be cut: Insurance, Utilities, Food, Education, Car, Home, and Grocery. Everything else is discretionary — spending you can adjust freely.",
                },
                {
                  n: 3,
                  title: "Surplus After Mandatory Costs",
                  body: "The surplus is your income minus mandatory spending only. This is your real spending ceiling — the maximum available for discretionary costs, savings, and investments combined.",
                },
                {
                  n: 4,
                  title: "Reading the Charts",
                  body: "The first pie chart shows spending across all 13 categories. The second chart splits your budget into mandatory vs discretionary, making it clear where flexibility exists.",
                },
              ].map(({ n, title, body }) => (
                <div key={n}>
                  <div className="flex items-center gap-3 mb-2.5">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: "var(--primary)", color: "#fff" }}
                    >
                      {n}
                    </span>
                    <h3 className="font-semibold text-[0.9375rem]" style={{ color: "var(--on-surface)" }}>
                      {title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed pl-9" style={{ color: "var(--on-surface-sub)" }}>
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
