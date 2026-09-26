"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className="relative -my-2.5 flex items-center h-10 w-[3.75rem] p-1 rounded-full cursor-pointer border-0 bg-transparent outline-primary focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {/* Track */}
      <span
        aria-hidden
        className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-7 rounded-full bg-surface-highest transition-colors duration-200"
      />
      {/* Thumb */}
      <span
        aria-hidden
        className={`relative flex items-center justify-center w-6 h-6 ml-0.5 rounded-full transition-transform duration-200 ${
          isDark ? "translate-x-[1.5rem]" : "translate-x-0"
        }`}
        style={{
          background: "linear-gradient(45deg, var(--primary-fill), var(--primary-fill-container))",
          color: "var(--on-primary)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        {isDark ? <Moon size={13} strokeWidth={2.25} /> : <Sun size={13} strokeWidth={2.25} />}
      </span>
    </button>
  );
}
