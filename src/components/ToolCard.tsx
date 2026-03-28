import Link from "next/link";
import type { Tool } from "@/lib/tools";
import { categoryColors } from "@/lib/tools";

type ToolCardProps = Tool;

const CATEGORY_LABELS: Record<string, string> = {
  Property:   "Property",
  CPF:        "CPF",
  Debt:       "Debt",
  Savings:    "Savings",
  Investment: "Investment",
  Planning:   "Planning",
};

// Inline SVG paths for the icons we use (subset of lucide)
const ICONS: Record<string, string> = {
  House:         "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  Scale:         "M12 3v18 M3 6h18 M6 6l3 12 M18 6l-3 12",
  PiggyBank:     "M19 5c-1.5 0-2.5 1-2.5 1H5a3 3 0 0 0 0 6h.5v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1h2v1a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3.5c1.1-.4 2-1.4 2-2.5V8c0-1.7-1.3-3-3-3z M12 5V3",
  ArrowRightLeft:"M21 7H3 M3 7l4-4M3 7l4 4 M3 17h18 M21 17l-4-4M21 17l-4 4",
  Receipt:       "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z M8 10h8 M8 14h4",
  TrendingDown:  "M22 17l-8.5-8.5-5 5L2 7 M16 17h6v-6",
  GitCompare:    "M18 3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12z M8 12h8 M12 8v8",
  ShieldCheck:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4",
  Target:        "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  TrendingUp:    "M22 7l-8.5 8.5-5-5L2 17 M16 7h6v6",
  Flame:         "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  LayoutList:    "M3 5h2 M7 5h14 M3 10h2 M7 10h14 M3 15h2 M7 15h14 M3 20h2 M7 20h14",
  Wallet:        "M21 12V7H5a2 2 0 0 1 0-4h14v4 M3 5v14a2 2 0 0 0 2 2h16v-5 M18 12a2 2 0 0 0 0 4h3v-4z",
};

function ToolIcon({ name, color }: { name: string; color: string }) {
  const path = ICONS[name] ?? ICONS["Wallet"];
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {path.split(" M").map((segment, i) => (
        <path key={i} d={i === 0 ? segment : "M" + segment} />
      ))}
    </svg>
  );
}

export function ToolCard({ slug, name, tagline, category, icon, accent, comingSoon }: ToolCardProps) {
  const accentColor = accent === "tertiary" ? "var(--tertiary)" : "var(--primary)";
  const categoryColor = categoryColors[category];

  if (comingSoon) {
    return (
      <div
        className="block rounded-xl p-5"
        style={{
          backgroundColor: "var(--surface-container-lowest)",
          boxShadow: "var(--shadow-botanical)",
          cursor: "default",
        }}
      >
        {/* Top row: icon + coming soon pill */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${categoryColor}0d` }}
          >
            <ToolIcon name={icon} color="var(--on-surface-sub)" />
          </div>
          <span
            className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "var(--surface-container-high)",
              color: "var(--on-surface-sub)",
            }}
          >
            Coming soon
          </span>
        </div>

        {/* Name */}
        <h3
          className="font-bold text-[15px] leading-snug mb-2"
          style={{ color: "var(--on-surface)", letterSpacing: "-0.01em", opacity: 0.55 }}
        >
          {name}
        </h3>

        {/* Tagline */}
        <p
          className="text-xs leading-relaxed"
          style={{ color: "var(--on-surface-sub)", lineHeight: "1.6", opacity: 0.7 }}
        >
          {tagline}
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`/tools/${slug}`}
      className="group block rounded-xl p-5 transition-all duration-200"
      style={{
        backgroundColor: "var(--surface-container-lowest)",
        boxShadow: "var(--shadow-botanical)",
        textDecoration: "none",
      }}
    >
      <style>{`
        a[href="/tools/${slug}"]:hover {
          background-color: var(--surface-container-low) !important;
          box-shadow: var(--shadow-botanical-hover) !important;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Top row: icon + category pill */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${categoryColor}12` }}
        >
          <ToolIcon name={icon} color={accentColor} />
        </div>
        <span
          className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${categoryColor}10`,
            color: categoryColor,
          }}
        >
          {CATEGORY_LABELS[category]}
        </span>
      </div>

      {/* Name */}
      <h3
        className="font-bold text-[15px] leading-snug mb-2"
        style={{ color: "var(--on-surface)", letterSpacing: "-0.01em" }}
      >
        {name}
      </h3>

      {/* Tagline */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}
      >
        {tagline}
      </p>

      {/* Arrow — appears on hover */}
      <div className="mt-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-xs font-semibold" style={{ color: accentColor }}>
          Open tool
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
