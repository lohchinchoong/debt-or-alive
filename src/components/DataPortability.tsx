"use client";

import { useState, useRef } from "react";

// ─── All localStorage keys managed by the app ────────────────────────────────
const STORAGE_KEYS = [
  "tool:compound-interest",
  "cpf-sa:profiles",
  "cpf-ma:profiles",
  "tool:fire-calculator",
  "tool:mortgage-calculator",
  "tool:emergency-fund",
  "fire:yield-sources-v2",
  "fire:drawdown-sources-v2",
  "mortgage:partial-repayments",
  "emergency-fund:sources",
  "tool:srs-calculator",
  "srs:deposits",
  "srs:withdrawal",
  "tool:budget-planner",
  "budget:items",
  "savings-goal:scenarios",
  "dividend:sources",
  "dividend:projection-years",
];

const APP_ID = "debtoralive";
const FORMAT_VERSION = 1;

type ExportPayload = {
  app: string;
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
};

// ─── Export ──────────────────────────────────────────────────────────────────

function exportData() {
  const data: Record<string, unknown> = {};

  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw; // store as-is if not valid JSON
      }
    }
  }

  if (Object.keys(data).length === 0) {
    alert("Nothing to export — no saved data found.");
    return;
  }

  const payload: ExportPayload = {
    app: APP_ID,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `debtoralive-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ─── Import ──────────────────────────────────────────────────────────────────

function importData(file: File): Promise<{ keysImported: number; keysSkipped: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = reader.result as string;
        const payload = JSON.parse(text) as ExportPayload;

        // Validate structure
        if (payload.app !== APP_ID) {
          reject(new Error(`Invalid file — expected app "${APP_ID}", got "${payload.app}".`));
          return;
        }

        if (typeof payload.version !== "number" || !payload.data || typeof payload.data !== "object") {
          reject(new Error("Invalid file format — missing version or data."));
          return;
        }

        let keysImported = 0;
        const keysSkipped: string[] = [];

        for (const [key, value] of Object.entries(payload.data)) {
          if (STORAGE_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(value));
            keysImported++;
          } else {
            keysSkipped.push(key);
          }
        }

        resolve({ keysImported, keysSkipped });
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err instanceof Error ? err.message : "unknown error"}`));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DataPortability() {
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { keysImported, keysSkipped } = await importData(file);

      if (keysImported === 0) {
        setImportStatus({ type: "error", message: "No recognised data found in file." });
      } else {
        const msg = `Imported ${keysImported} tool${keysImported !== 1 ? "s" : ""} successfully.${
          keysSkipped.length > 0 ? ` ${keysSkipped.length} unknown key${keysSkipped.length !== 1 ? "s" : ""} skipped.` : ""
        }`;
        setImportStatus({ type: "success", message: msg });

        // Reload after a short delay so user sees the message
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      setImportStatus({ type: "error", message: err instanceof Error ? err.message : "Import failed." });
    }

    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* Export button */}
        <button
          type="button"
          onClick={exportData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            color: "var(--on-surface)",
            border: "1px solid var(--outline-variant)",
            cursor: "pointer",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Data
        </button>

        {/* Import button */}
        <label
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
          style={{
            backgroundColor: "var(--surface-container-lowest)",
            color: "var(--on-surface)",
            border: "1px solid var(--outline-variant)",
            cursor: "pointer",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import Data
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Status message */}
      {importStatus && (
        <p
          className="text-xs font-medium px-1"
          style={{
            color: importStatus.type === "success" ? "var(--primary)" : "var(--tertiary)",
            transition: "opacity 0.3s ease",
          }}
        >
          {importStatus.message}
        </p>
      )}
    </div>
  );
}
