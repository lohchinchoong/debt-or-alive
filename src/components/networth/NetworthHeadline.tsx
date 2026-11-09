import { SECTIONS, formatSgd, type Summary } from "@/lib/networth";

function leftOutNames(summary: Summary): string {
  return SECTIONS.flatMap(({ key }) => summary.sections[key].excluded)
    .map((r) => `${r.name.trim() === "" ? "Unnamed" : r.name.trim()} (${r.currency})`)
    .join(", ");
}

export function NetworthHeadline({ summary }: { summary: Summary }) {
  const negative = summary.netCents < 0;
  return (
    <section
      aria-label="Net worth"
      className="rounded-2xl p-5"
      style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--on-surface-sub)" }}>
        Net worth
      </p>
      <p
        className="mt-1 text-3xl sm:text-4xl font-bold break-words"
        style={{ color: negative ? "var(--danger)" : "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}
      >
        {formatSgd(summary.netCents)}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt style={{ color: "var(--on-surface-sub)" }}>Total assets</dt>
          <dd className="font-semibold" style={{ color: "var(--on-surface)" }}>{formatSgd(summary.assetsCents)}</dd>
        </div>
        <div>
          <dt style={{ color: "var(--on-surface-sub)" }}>Total debt</dt>
          <dd className="font-semibold" style={{ color: "var(--on-surface)" }}>{formatSgd(summary.debtCents)}</dd>
        </div>
      </dl>
      {summary.incomplete && (
        <p role="status" className="mt-3 text-sm font-semibold" style={{ color: "var(--warning)" }}>
          Incomplete: no rate for {leftOutNames(summary)}
        </p>
      )}
    </section>
  );
}
