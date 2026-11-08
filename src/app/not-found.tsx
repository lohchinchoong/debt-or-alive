import { GuardedLink } from "@/components/GuardedLink";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
      style={{ backgroundColor: "var(--surface-container-low)" }}
    >
      <p
        className="text-xs font-semibold tracking-widest uppercase mb-4"
        style={{ color: "var(--primary)" }}
      >
        Page not found
      </p>
      <h1
        className="text-4xl font-bold mb-4"
        style={{ color: "var(--on-surface)", letterSpacing: "-0.02em" }}
      >
        That page doesn&apos;t exist.
      </h1>
      <p className="text-base mb-8 max-w-sm" style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}>
        The link may be old or mistyped. Every tool is on the home page.
      </p>
      <GuardedLink
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm"
        style={{
          background: "linear-gradient(45deg, var(--primary-fill), var(--primary-fill-container))",
          color: "#fff",
        }}
      >
        ← Back to all tools
      </GuardedLink>
    </div>
  );
}
