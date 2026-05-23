"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { useHysaScenarios, HysaScenario } from "@/hooks/useHysaScenarios";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface-container-highest)", border: "none",
          borderBottom: "2px solid var(--primary)", borderRadius: "0.25rem 0.25rem 0 0",
          outline: "none", fontSize: "1rem", fontFamily: "Manrope, sans-serif",
          fontWeight: 700, color: "var(--on-surface)", padding: "0.25rem 0.375rem", width: "100%",
        }}
      />
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setDraft(name); setEditing(true); }}
      title="Click to rename"
      style={{
        background: "none", border: "none", cursor: "text", padding: 0,
        fontFamily: "Manrope, sans-serif", fontWeight: 700, fontSize: "1rem",
        color: "var(--on-surface)", display: "inline-flex", alignItems: "center",
        gap: "0.375rem", textAlign: "left",
      }}
    >
      {name}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, flexShrink: 0 }}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
}

// ─── ProfileCard ──────────────────────────────────────────────────────────────
function ProfileCard({
  scenario, onDelete, onRename,
}: {
  scenario: HysaScenario; onDelete: () => void; onRename: (name: string) => void;
}) {
  const router = useRouter();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${scenario.name}"? This cannot be undone.`)) onDelete();
  };

  const first = scenario.entries[0];
  const last  = scenario.entries[scenario.entries.length - 1];
  const totalInterest = scenario.entries.reduce(
    (s, e) => s + (e.salaryInterest ?? 0) + (e.cardInterest ?? 0) + (e.insureInterest ?? 0) + (e.investInterest ?? 0),
    0
  );

  return (
    <div
      onClick={() => router.push(`/tools/hysa-tracker/${scenario.id}`)}
      className="rounded-xl p-5 flex flex-col gap-4 cursor-pointer transition-colors"
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-container-low)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-container-lowest)")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <ProfileNameEditor name={scenario.name} onSave={onRename} />
        </div>
        <button
          onClick={handleDelete}
          title="Delete scenario"
          style={{
            background: "none", border: "none", cursor: "pointer", padding: "0.25rem",
            color: "var(--on-surface-sub)", opacity: 0.5, flexShrink: 0, display: "flex", alignItems: "center",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.5")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
        </button>
      </div>

      <div className="space-y-1.5">
        <StatLine
          label="Period"
          value={
            first && last
              ? `${MONTH_NAMES[first.month - 1]} ${first.year} – ${MONTH_NAMES[last.month - 1]} ${last.year}`
              : "No months logged yet"
          }
        />
        <StatLine label="Months logged" value={String(scenario.entries.length)} />
        {totalInterest > 0 && (
          <StatLine
            label="Total interest"
            value={`S$${totalInterest.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
        )}
      </div>

      <div className="flex justify-end">
        <span className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: "var(--primary)" }}>
          Open Tracker
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: "var(--on-surface-sub)" }}>{label}</span>
      <span className="font-medium" style={{ color: "var(--on-surface)" }}>{value}</span>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{
          background: "linear-gradient(45deg, var(--primary), var(--primary-container))",
          boxShadow: "0 8px 24px rgba(0,53,31,0.15)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20M6 15h2M10 15h4" />
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
        No scenarios yet
      </h2>
      <p className="text-sm mb-8 max-w-xs" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
        Create a scenario to start logging monthly interest from your high-yield savings account.
      </p>
      <button
        onClick={onAdd}
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
        Add first scenario
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HysaLandingPage() {
  const router = useRouter();
  const { scenarios, addScenario, removeScenario, updateScenario } = useHysaScenarios();

  const handleAdd = () => {
    const id = addScenario();
    router.push(`/tools/hysa-tracker/${id}`);
  };

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen px-5 sm:px-8 lg:px-16 py-10" style={{ backgroundColor: "var(--surface-container-low)" }}>
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Page Header ───────────────────────────────────────────────── */}
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6" style={{ color: "var(--on-surface-sub)", textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Home
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
                  <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                    High Yield Savings Account Tracker
                  </h1>
                  <p className="mt-2 text-base max-w-xl" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                    Log monthly interest and investment gains across your high-yield savings accounts.
                  </p>
                </div>
              </div>

              {scenarios.length > 0 && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm w-full sm:w-auto flex-shrink-0"
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
                  Add Scenario
                </button>
              )}
            </div>
          </div>

          {/* ── Grid or Empty State ───────────────────────────────────────── */}
          {scenarios.length === 0 ? (
            <EmptyState onAdd={handleAdd} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <ProfileCard
                  key={scenario.id}
                  scenario={scenario}
                  onDelete={() => removeScenario(scenario.id)}
                  onRename={(name) => updateScenario(scenario.id, { name })}
                />
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
