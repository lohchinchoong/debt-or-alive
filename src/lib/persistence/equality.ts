function normalise(value: unknown, omit: ReadonlySet<string>): unknown {
  if (Array.isArray(value)) return value.map((v) => normalise(v, omit));
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      if (omit.has(key) || source[key] === undefined) continue;
      out[key] = normalise(source[key], omit);
    }
    return out;
  }
  return value;
}

/**
 * JSON with object keys sorted and the listed keys left out at every depth.
 * Array order is kept, because it is meaningful (for example, item order).
 */
export function stableStringify(value: unknown, omitKeys: readonly string[] = []): string {
  return JSON.stringify(normalise(value, new Set(omitKeys))) ?? "undefined";
}

/** True when two values hold the same data, ignoring key order and `savedAt`. */
export function sameData(a: unknown, b: unknown): boolean {
  return stableStringify(a, ["savedAt"]) === stableStringify(b, ["savedAt"]);
}
