"use client";

import Link from "next/link";
import { useState, useRef } from "react";

function AboutPopover() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  // Small delay on leave so the popover doesn't vanish if the cursor briefly exits
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        className="text-sm font-medium transition-colors duration-200"
        style={{ color: "var(--on-surface-sub)", background: "none", border: "none", cursor: "pointer", fontFamily: "Manrope, sans-serif", padding: 0 }}
      >
        About
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 w-80 rounded-xl p-5 z-50"
          style={{
            backgroundColor: "rgba(248,250,248,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 20px 40px rgba(14,77,49,0.10), 0 2px 8px rgba(14,77,49,0.06)",
          }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {/* Header */}
          <p
            className="text-[0.8125rem] font-bold mb-3"
            style={{ color: "var(--primary)", letterSpacing: "-0.01em" }}
          >
            Debt or Alive
          </p>

          {/* Body */}
          <p
            className="text-[0.8125rem] leading-relaxed mb-3"
            style={{ color: "var(--on-surface)", lineHeight: "1.65" }}
          >
            A curated suite of personal finance tools — built for anyone who&apos;d rather
            crunch numbers than pretend they don&apos;t exist. No fluff, no upsells,
            no &ldquo;speak to a financial advisor&rdquo; pop-ups every 30 seconds.
            Just honest calculators that help you think clearly about money.
          </p>

          {/* Privacy note */}
          <div
            className="rounded-lg px-3.5 py-3"
            style={{ backgroundColor: "var(--surface-container-low)" }}
          >
            <p
              className="text-[0.75rem] leading-relaxed"
              style={{ color: "var(--on-surface-sub)", lineHeight: "1.6" }}
            >
              <span className="font-semibold" style={{ color: "var(--on-surface)" }}>
                Your data stays yours.
              </span>{" "}
              Every number you enter lives only in your browser — saved locally
              for your convenience, invisible to us. We don&apos;t have a server
              watching your net worth with envy.
            </p>
          </div>

          {/* Tagline */}
          <p
            className="text-[0.6875rem] mt-3 text-right"
            style={{ color: "var(--outline-variant)" }}
          >
            Your money. Your choice.
          </p>
        </div>
      )}
    </div>
  );
}

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
          <AboutPopover />
        </nav>
      </div>
    </header>
  );
}
