"use client";

import { GuardedLink } from "@/components/GuardedLink";
import { SiteHeader } from "@/components/SiteHeader";
import { useGuardedRouter } from "@/hooks/useGuardedRouter";
import { useProfileList } from "@/hooks/useProfileList";
import { savingsGoalAdapter, type SavingsScenario } from "@/lib/persistence/adapters/savings-goal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtAmount = (n: number) =>
  `S$${n.toLocaleString("en-SG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtMonthYear = (iso: string) => {
  if (!iso) return "—";
  const [y, m] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m) - 1]} ${y}`;
};

// ─── StatLine ─────────────────────────────────────────────────────────────────

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: "var(--on-surface-sub)" }}>{label}</span>
      <span className="font-medium" style={{ color: "var(--on-surface)" }}>{value}</span>
    </div>
  );
}

// ─── ScenarioCard ─────────────────────────────────────────────────────────────

function ScenarioCard({
  scenario,
  onDelete,
}: {
  scenario: SavingsScenario;
  onDelete: () => void;
}) {
  const { push } = useGuardedRouter();

  const total = scenario.items.reduce((sum, item) => sum + item.amount, 0);
  const progress =
    scenario.targetAmount > 0
      ? Math.min(100, (total / scenario.targetAmount) * 100)
      : 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${scenario.name}"? This cannot be undone.`)) onDelete();
  };

  return (
    <div
      onClick={() => push(`${savingsGoalAdapter.listPath}/${scenario.id}`)}
      className="rounded-xl p-5 flex flex-col gap-4 cursor-pointer transition-colors"
      style={{
        backgroundColor: "var(--surface-container-lowest)",
        boxShadow: "var(--shadow-botanical)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-container-low)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-container-lowest)")}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base truncate" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>{scenario.name}</p>
        </div>
        <button
          onClick={handleDelete}
          title="Delete goal"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.25rem",
            color: "var(--on-surface-sub)",
            opacity: 0.5,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.5")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      <div className="space-y-1.5">
        <StatLine label="Target" value={fmtAmount(scenario.targetAmount)} />
        <StatLine label="Saved" value={`${fmtAmount(total)} (${progress.toFixed(0)}%)`} />
        <StatLine label="By" value={fmtMonthYear(scenario.targetDate)} />
      </div>

      {/* Progress bar */}
      {scenario.targetAmount > 0 && (
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: "6px", backgroundColor: "var(--surface-container-high)" }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(135deg, var(--primary-fill) 0%, var(--primary-fill-container) 100%)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {/* Open link */}
      <div className="flex justify-end">
        <span className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: "var(--primary)" }}>
          Open Goal
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
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
          background: "linear-gradient(45deg, var(--primary-fill), var(--primary-fill-container))",
          boxShadow: "0 8px 24px rgba(0,53,31,0.15)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
          <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}>
        No goals yet
      </h2>
      <p className="text-sm mb-8 max-w-xs" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
        Create a goal to start tracking your savings targets and line items.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm"
        style={{
          background: "linear-gradient(135deg, var(--primary-fill) 0%, var(--primary-fill-container) 100%)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0,53,31,0.2)",
          fontFamily: "Manrope, sans-serif",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add first goal
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavingsGoalLandingPage() {
  const { push } = useGuardedRouter();
  const { status, profiles: scenarios, remove } = useProfileList(savingsGoalAdapter);

  // Nothing is written until the new item's first Save on its detail page.
  const handleAdd = () => push(`${savingsGoalAdapter.listPath}/new`);

  const handleDelete = (id: string) => {
    const result = remove(id);
    if (!result.ok) alert("Couldn't delete. Please try again.");
  };

  if (status !== "ready") {
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

          {/* ── Page Header ───────────────────────────────────────────────── */}
          <div>
            <GuardedLink
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
              style={{ color: "var(--on-surface-sub)", textDecoration: "none" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Home
            </GuardedLink>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: "linear-gradient(45deg, var(--primary-fill), var(--primary-fill-container))",
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
                  <h1
                    className="text-3xl sm:text-4xl font-bold"
                    style={{ color: "var(--on-surface)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
                  >
                    Savings Goal
                  </h1>
                  <p className="mt-2 text-base max-w-xl" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
                    Set a desired savings amount and deadline. Track every line item against the target.
                  </p>
                </div>
              </div>

              {scenarios.length > 0 && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm w-full sm:w-auto flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, var(--primary-fill) 0%, var(--primary-fill-container) 100%)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(0,53,31,0.2)",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Goal
                </button>
              )}
            </div>
          </div>

          {/* ── Scenario Grid or Empty State ──────────────────────────────── */}
          {scenarios.length === 0 ? (
            <EmptyState onAdd={handleAdd} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  onDelete={() => handleDelete(scenario.id)}
                />
              ))}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
