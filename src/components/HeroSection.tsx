export function HeroSection() {
  return (
    <section
      className="relative px-5 sm:px-8 lg:px-16 pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden"
      style={{
        background:
          "linear-gradient(to right, #d0e6d8 0%, #e2ede6 25%, #edf2ee 55%, #f8faf8 100%)",
      }}
    >
      {/* Layered radial depth blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 w-[560px] h-[560px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,53,31,0.07) 0%, transparent 68%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -left-32 w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(14,77,49,0.05) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 w-[300px] h-[200px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(179,240,202,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_auto] gap-16 items-center">
        {/* Left — editorial copy */}
        <div className="max-w-2xl">
          <h1
            className="text-6xl sm:text-7xl lg:text-8xl font-extrabold leading-[1.02] mb-6"
            style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
          >
            Your money.<br />
            <span
              style={{
                backgroundImage: "linear-gradient(45deg, var(--primary), var(--primary-container))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Your choice.
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl mb-10 max-w-lg"
            style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}
          >
            A curated suite of personal finance calculators — from mortgage repayments to debt payoff strategies.
          </p>

          <a
            href="#tools"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-sm transition-opacity duration-200 hover:opacity-90"
            style={{
              background: "linear-gradient(45deg, var(--primary), var(--primary-container))",
              color: "#fff",
              boxShadow: "var(--shadow-botanical-hover)",
            }}
          >
            Explore all tools
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>

        {/* Right — mini finance widgets */}
        <div className="hidden lg:flex flex-col gap-4 min-w-[260px]">
          <PortfolioCard offsetClass="ml-8" />
          <DebtProgressCard offsetClass="mr-4" />
          <BudgetSplitCard offsetClass="ml-3" />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, #f2f4f2)",
        }}
      />
    </section>
  );
}

/* ─── Widget 1: Portfolio Growth sparkline ─── */
function PortfolioCard({ offsetClass }: { offsetClass: string }) {
  // Normalised y-coords (SVG top = 0) for an upward trend
  const points = [48, 42, 44, 35, 38, 28, 30, 20, 22, 12];
  const w = 200;
  const h = 56;
  const step = w / (points.length - 1);

  const polyline = points.map((y, i) => `${i * step},${y}`).join(" ");
  const areaPath = `M0,${points[0]} ` + points.map((y, i) => `L${i * step},${y}`).join(" ") + ` L${w},${h} L0,${h} Z`;

  return (
    <div
      className={`${offsetClass} px-5 py-4 rounded-2xl`}
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color: "var(--on-surface-sub)" }}>
            Portfolio Value
          </p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}>
            $124,500
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
          style={{ backgroundColor: "rgba(0,53,31,0.08)", color: "var(--primary)" }}
        >
          +12.4%
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00351f" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00351f" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sparkFill)" />
        <polyline points={polyline} fill="none" stroke="#00351f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* End dot */}
        <circle cx={w} cy={points[points.length - 1]} r="3" fill="#00351f" />
      </svg>
      <p className="text-[10px] mt-2" style={{ color: "var(--outline-variant)" }}>Past 10 months</p>
    </div>
  );
}

/* ─── Widget 2: Debt payoff ring ─── */
function DebtProgressCard({ offsetClass }: { offsetClass: string }) {
  const pct = 68;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div
      className={`${offsetClass} px-5 py-4 rounded-2xl`}
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <p className="text-[11px] font-medium tracking-wide uppercase mb-3" style={{ color: "var(--on-surface-sub)" }}>
        Debt Cleared
      </p>
      <div className="flex items-center gap-4">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#e1e3e1" strokeWidth="7" />
          <circle
            cx="36" cy="36" r={r}
            fill="none"
            stroke="#00351f"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            strokeDashoffset={circ * 0.25}
          />
          <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#191c1b" fontFamily="Manrope, sans-serif">
            {pct}%
          </text>
        </svg>
        <div>
          <p className="text-xl font-bold" style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}>$18,240</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-sub)" }}>of $26,800 paid</p>
          <p className="text-[10px] mt-2 font-medium" style={{ color: "var(--tertiary)" }}>$8,560 remaining</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Widget 3: Budget split bars ─── */
function BudgetSplitCard({ offsetClass }: { offsetClass: string }) {
  const segments = [
    { label: "Needs",   pct: 50, color: "#00351f" },
    { label: "Wants",   pct: 30, color: "#1c3d2c" },
    { label: "Savings", pct: 20, color: "#b3f0ca" },
  ];

  return (
    <div
      className={`${offsetClass} px-5 py-4 rounded-2xl`}
      style={{ backgroundColor: "var(--surface-container-lowest)", boxShadow: "var(--shadow-botanical)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color: "var(--on-surface-sub)" }}>
            Monthly Budget
          </p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}>
            $5,200
          </p>
        </div>
      </div>
      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden h-2.5 mb-3 gap-0.5">
        {segments.map((s) => (
          <div key={s.label} style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
        ))}
      </div>
      {/* Legend */}
      <div className="flex gap-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
            <span className="text-[10px] font-medium" style={{ color: "var(--on-surface-sub)" }}>
              {s.label} {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
