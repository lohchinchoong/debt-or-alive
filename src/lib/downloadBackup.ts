import { backupFileName, serializeBackup, type BackupPayload } from "@/lib/persistence/backup";

/** Downloads the backup as a JSON file. Uses the DOM, so call it from a browser event handler. */
export function downloadBackup(payload: BackupPayload, now: Date): void {
  const blob = new Blob([serializeBackup(payload)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = backupFileName(now);
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
