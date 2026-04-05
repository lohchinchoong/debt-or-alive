import { ToolCard } from "@/components/ToolCard";
import { HeroSection } from "@/components/HeroSection";
import { SiteHeader } from "@/components/SiteHeader";
import { DataPortability } from "@/components/DataPortability";
import { tools } from "@/lib/tools";

export default function HomePage() {
  return (
    <div style={{ backgroundColor: "var(--surface-container-low)", minHeight: "100vh" }}>
      <SiteHeader />
      <HeroSection />

      {/* Tool Grid */}
      <section id="tools" style={{ backgroundColor: "var(--surface-container-low)" }} className="px-5 pb-24 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Section header — asymmetric */}
          <div className="mb-10 max-w-xl">
            <h2
              className="text-3xl sm:text-4xl font-bold leading-tight"
              style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
            >
              Pick your tool.<br />Start immediately.
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}
            >
              No account required. Every calculator runs in your browser — your numbers stay yours.
            </p>
            <p
              className="mt-3 text-xs leading-relaxed"
              style={{ color: "var(--outline-variant)" }}
            >
              All tools are provided without warranty and are intended for estimation purposes only.
              Results should not be construed as financial advice. Please consult a qualified financial
              adviser before making any financial decisions.
            </p>

            {/* Export / Import */}
            <div className="mt-5">
              <DataPortability />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tools.map((tool) => (
              <ToolCard key={tool.slug} {...tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{ backgroundColor: "var(--surface-container)", borderTop: `1px solid rgba(192,201,192,0.15)` }}
        className="px-5 py-10 sm:px-8 lg:px-16"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-bold text-base" style={{ color: "var(--on-surface)" }}>
              Debt or Alive
            </span>
            <p className="text-xs mt-1" style={{ color: "var(--on-surface-sub)" }}>
              Personal finance tools. No sign-up. No data stored.
            </p>
          </div>
          <p className="text-xs" style={{ color: "var(--outline-variant)" }}>
            © {new Date().getFullYear()} Debt or Alive
          </p>
        </div>
      </footer>
    </div>
  );
}
