// ─── Theme ────────────────────────────────────────────────────────────────────

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "doa-theme";

/**
 * Lifts a deep hue toward the text colour in dark mode (no-op in light mode).
 * "category" is strong enough for text; "chart" is gentler so fills keep their hue.
 */
export function liftColor(hex: string, strength: "category" | "chart" = "category"): string {
  return `color-mix(in srgb, ${hex}, var(--on-surface) var(--${strength}-lift))`;
}

/**
 * Runs inline in <head> before first paint so the page never flashes the wrong
 * theme. Saved choice wins; otherwise follow the OS preference.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();`;
