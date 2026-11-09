import { formatSgd, type ChartRow } from "@/lib/networth";

const WIDTH = 360;
const ROW_HEIGHT = 56;
const FONT = "Manrope, sans-serif";

function describe(row: ChartRow): string {
  if (row.percent === null) return `${row.label}: ${formatSgd(row.cents)}, no target set.${row.incomplete ? " Incomplete." : ""}`;
  return `${row.label}: ${formatSgd(row.cents)} of ${formatSgd(row.targetCents)} target, ${row.percent}%.${row.incomplete ? " Incomplete." : ""}`;
}

export function TargetChart({ rows, axisMaxDollars }: { rows: ChartRow[]; axisMaxDollars: number }) {
  const height = rows.length * ROW_HEIGHT + 8;
  const x = (cents: number) => Math.min(WIDTH, Math.max(0, (cents / 100 / axisMaxDollars) * WIDTH));

  return (
    <section
      aria-label="Current against target"
      className="rounded-2xl p-5"
      style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}
    >
      <h2 className="text-base font-bold" style={{ color: "var(--on-surface)", fontFamily: FONT }}>
        Current vs target
      </h2>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="mt-3 w-full h-auto"
        role="img"
        aria-label={rows.map(describe).join(" ")}
      >
        <defs>
          <pattern id="nw-over" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="4" height="4" style={{ fill: "var(--amber)" }} />
            <line x1="0" y1="0" x2="0" y2="4" strokeWidth="2" style={{ stroke: "var(--on-surface)", strokeOpacity: 0.35 }} />
          </pattern>
        </defs>
        {rows.map((row, i) => {
          const top = i * ROW_HEIGHT;
          const hasTarget = row.targetCents > 0;
          const barEnd = x(row.cents);
          const targetX = x(row.targetCents);
          const over = hasTarget && row.cents > row.targetCents;
          return (
            <g key={row.section} transform={`translate(0 ${top})`}>
              <text x={0} y={16} fontSize={12} fontWeight={700} fontFamily={FONT} style={{ fill: "var(--on-surface)" }}>
                {row.label}
              </text>
              <text x={WIDTH} y={16} fontSize={12} fontWeight={600} fontFamily={FONT} textAnchor="end" style={{ fill: "var(--on-surface-sub)" }}>
                {row.percent === null ? "Set a target" : `${row.percent}% of target${row.incomplete ? "*" : ""}`}
              </text>
              <text x={0} y={32} fontSize={11} fontFamily={FONT} style={{ fill: "var(--on-surface-sub)" }}>
                {hasTarget ? `${formatSgd(row.cents)} of ${formatSgd(row.targetCents)}` : formatSgd(row.cents)}
              </text>
              <rect x={0} y={40} width={WIDTH} height={10} style={{ fill: "var(--surface-container-high)" }} />
              {hasTarget && row.cents > 0 && (
                <>
                  <rect x={0} y={40} width={over ? targetX : barEnd} height={10} style={{ fill: "var(--primary-fill)" }} />
                  {over && <rect x={targetX} y={40} width={Math.max(0, barEnd - targetX)} height={10} fill="url(#nw-over)" />}
                </>
              )}
              {hasTarget && (
                <line x1={targetX} x2={targetX} y1={36} y2={54} strokeWidth={2} style={{ stroke: "var(--on-surface)" }} />
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs" style={{ color: "var(--on-surface-sub)" }}>
        The line marks each target. The striped part of a bar is above its target.
      </p>
    </section>
  );
}
