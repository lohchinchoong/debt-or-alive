const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/**
 * Formats an ISO instant as "8 Nov 2026" in the viewer's local time zone.
 * Uses a fixed month list rather than Intl, so September is always "Sep".
 * Returns null for a string that is not a valid date.
 */
export function formatSavedDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
