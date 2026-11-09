import { formatSgd, type ChartRow } from "@/lib/networth";

// Each asset section is its own small SVG, so text keeps a fixed small size
// however wide the card is. All bars share one scale (`axisMaxDollars`).
const WIDTH = 300;
const HEIGHT = 50;
const FONT = "Manrope, sans-serif";

function describe(row: ChartRow): string {
  if (row.percent === null) return `${row.label}: ${formatSgd(row.cents)}, no target set.${row.incomplete ? " Incomplete." : ""}`;
  return `${row.label}: ${formatSgd(row.cents)} of ${formatSgd(row.targetCents)} target, ${row.percent}%.${row.incomplete ? " Incomplete." : ""}`;
}

function ChartBar({ row, axisMaxDollars }: { row: ChartRow; axisMaxDollars: number }) {
  const x = (cents: number) => Math.min(WIDTH, Math.max(0, (cents / 100 / axisMaxDollars) * WIDTH));
  const hasTarget = row.targetCents > 0;
  const barEnd = x(row.cents);
  const targetX = x(row.targetCents);
  const over = hasTarget && row.cents > row.targetCents;
  const pattern = `nw-over-${row.section}`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" role="img" aria-label={describe(row)}>
      <defs>
        <pattern id={pattern} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="4" style={{ fill: "var(--amber)" }} />
          <line x1="0" y1="0" x2="0" y2="4" strokeWidth="2" style={{ stroke: "var(--on-surface)", strokeOpacity: 0.35 }} />
        </pattern>
      </defs>
      <text x={0} y={12} fontSize={11} fontWeight={700} fontFamily={FONT} style={{ fill: "var(--on-surface)" }}>
        {row.label}
      </text>
      <text x={WIDTH} y={12} fontSize={11} fontWeight={600} fontFamily={FONT} textAnchor="end" style={{ fill: "var(--on-surface-sub)" }}>
        {row.percent === null ? "Set a target" : `${row.percent}% of target${row.incomplete ? "*" : ""}`}
      </text>
      <text x={0} y={26} fontSize={10} fontFamily={FONT} style={{ fill: "var(--on-surface-sub)" }}>
        {hasTarget ? `${formatSgd(row.cents)} of ${formatSgd(row.targetCents)}` : formatSgd(row.cents)}
      </text>
      <rect x={0} y={33} width={WIDTH} height={8} style={{ fill: "var(--surface-container-high)" }} />
      {hasTarget && row.cents > 0 && (
        <>
          <rect x={0} y={33} width={over ? targetX : barEnd} height={8} style={{ fill: "var(--primary-fill)" }} />
          {over && <rect x={targetX} y={33} width={Math.max(0, barEnd - targetX)} height={8} fill={`url(#${pattern})`} />}
        </>
      )}
      {hasTarget && <line x1={targetX} x2={targetX} y1={30} y2={44} strokeWidth={2} style={{ stroke: "var(--on-surface)" }} />}
    </svg>
  );
}

export function TargetChart({ rows, axisMaxDollars }: { rows: ChartRow[]; axisMaxDollars: number }) {
  return (
    <section
      aria-label="Current against target"
      className="rounded-2xl p-4"
      style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-bold" style={{ color: "var(--on-surface)", fontFamily: FONT }}>
          Current vs target
        </h2>
        <p className="text-[0.7rem]" style={{ color: "var(--on-surface-sub)" }}>
          The line marks each target. The striped part of a bar is above its target.
        </p>
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
        {rows.map((row) => (
          <ChartBar key={row.section} row={row} axisMaxDollars={axisMaxDollars} />
        ))}
      </div>
    </section>
  );
}
