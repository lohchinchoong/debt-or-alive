"use client";

import Link from "next/link";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-50 px-5 sm:px-8 lg:px-16 py-4"
      style={{
        backgroundColor: "rgba(248,250,248,0.80)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-1 select-none">
          <span
            className="text-sm font-bold tracking-tight"
            style={{ color: "var(--primary)", letterSpacing: "-0.01em" }}
          >
            Debt or Alive
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-6">
          <a
            href="#about"
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: "var(--on-surface-sub)" }}
          >
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
