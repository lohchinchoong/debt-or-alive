// ─── Chart helpers ────────────────────────────────────────────────────────────

export const fmtAxis = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
};

export function niceMax(rawMax: number): number {
  if (rawMax <= 0) return 1000;
  const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const niceFactors = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  const nice = niceFactors.find((f) => f * mag >= rawMax) ?? 10;
  return nice * mag;
}

// ─── ID generation ────────────────────────────────────────────────────────────

let idCounter = 0;
export function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++idCounter}`;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
