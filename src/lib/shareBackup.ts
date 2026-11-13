export type ShareOutcome = "shared" | "cancelled" | "failed";

/**
 * True when this browser can share a JSON file through the share sheet. The
 * check uses an empty probe file; the real file is built at share time. This
 * is not a React hook: callers decide when to run it (after mount).
 */
export function canShareBackupFile(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") return false;
  try {
    const probe = new File([], "probe.json", { type: "application/json" });
    return navigator.canShare({ files: [probe] }) === true;
  } catch {
    return false;
  }
}

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}

/**
 * Opens the share sheet with the backup file. Call it straight from a tap
 * handler, before any `await`, or the browser may refuse. Backup data goes in
 * the file only, never in `title` or `text`. A closed share sheet is
 * "cancelled", not a failure.
 */
export async function shareBackupFile(file: File): Promise<ShareOutcome> {
  try {
    await navigator.share({ files: [file], title: "Debt or Alive backup" });
    return "shared";
  } catch (error) {
    return isAbortError(error) ? "cancelled" : "failed";
  }
}
