"use client";

import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { Download, Share2, Upload } from "lucide-react";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/backupButtonStyles";
import { ImportConfirmDialog } from "@/components/ImportConfirmDialog";
import { useBackupImport } from "@/hooks/useBackupImport";
import { useIsClient } from "@/hooks/useIsClient";
import { downloadBackup } from "@/lib/downloadBackup";
import { backupFileName, buildBackup, serializeBackup } from "@/lib/persistence/backup";
import { canShareBackupFile, shareBackupFile } from "@/lib/shareBackup";

// The backup controls: share a backup, download one, or import one. Building,
// reading and applying a backup live in src/lib/persistence (backup.ts,
// preview.ts, import.ts); this component lays out the controls and shows messages.

const EMPTY_MESSAGE = "Nothing to back up yet. Save some data in a tool first.";
const SHARE_FAILED_MESSAGE = "Couldn't open the share sheet. Use Export Data to download the backup instead.";
const PRIVACY_NOTE =
  "Your backup file is plain readable text and includes your CPF, debt and net worth figures. This app keeps " +
  "no copy: the file lives wherever you send it, and anyone who can open that place can read it. Data in this " +
  "browser is lost if you clear browser data, so back up first.";

type Message = { kind: "info" | "error"; text: string };

function ActionGroup({ description, children }: { description: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:max-w-[14rem]">
      {children}
      <p className="text-xs leading-snug" style={{ color: "var(--on-surface-sub)" }}>
        {description}
      </p>
    </div>
  );
}

export function DataPortability() {
  const isClient = useIsClient();
  const canShare = useMemo(() => (isClient ? canShareBackupFile() : false), [isClient]);
  const importer = useBackupImport();
  const [message, setMessage] = useState<Message | null>(null);
  const [sharing, setSharing] = useState(false);

  const { state, dismiss, selectFile, confirm, cancel } = importer;

  // Starting any action clears the last message, from the page or from the import hook.
  function startAction() {
    dismiss();
    setMessage(null);
  }

  async function handleShare() {
    startAction();
    const now = new Date();
    const payload = buildBackup(localStorage, now);
    if (!payload) {
      setMessage({ kind: "info", text: EMPTY_MESSAGE });
      return;
    }
    const file = new File([serializeBackup(payload)], backupFileName(now), { type: "application/json" });

    // The share must start before any await, so the browser still sees the tap as its cause.
    setSharing(true);
    try {
      const outcome = await shareBackupFile(file);
      if (outcome === "failed") setMessage({ kind: "error", text: SHARE_FAILED_MESSAGE });
    } finally {
      setSharing(false);
    }
  }

  function handleExport() {
    startAction();
    const now = new Date();
    const payload = buildBackup(localStorage, now);
    if (!payload) {
      setMessage({ kind: "info", text: EMPTY_MESSAGE });
      return;
    }
    downloadBackup(payload, now);
  }

  function handleDownloadCurrent() {
    const now = new Date();
    const payload = buildBackup(localStorage, now);
    if (payload) downloadBackup(payload, now);
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    startAction();
    void selectFile(file);
    // Reset so the same file can be picked again.
    input.value = "";
  }

  // The import hook's result, when it has one, replaces the page's own message.
  const shown: Message | null =
    state.status === "done"
      ? { kind: "info", text: state.message }
      : state.status === "error"
        ? { kind: "error", text: state.message }
        : message;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
        Backup file on this device
      </h2>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {canShare && (
          <ActionGroup description="Send a backup file to Drive, iCloud, a message or another app.">
            <button type="button" onClick={handleShare} disabled={sharing} className={BUTTON_PRIMARY}>
              <Share2 size={15} aria-hidden="true" />
              Share backup
            </button>
          </ActionGroup>
        )}

        <ActionGroup description="Download a backup file to this device.">
          <button type="button" onClick={handleExport} className={canShare ? BUTTON_SECONDARY : BUTTON_PRIMARY}>
            <Download size={15} aria-hidden="true" />
            Export Data
          </button>
        </ActionGroup>

        <ActionGroup description="Restore from a backup file you saved earlier.">
          <label className={BUTTON_SECONDARY}>
            <Upload size={15} aria-hidden="true" />
            Import Data
            <input type="file" accept=".json" onChange={handleFile} className="hidden" />
          </label>
        </ActionGroup>
      </div>

      {shown && (
        <p
          role={shown.kind === "error" ? "alert" : "status"}
          className="px-1 text-xs font-medium"
          style={{ color: shown.kind === "error" ? "var(--tertiary)" : "var(--primary)" }}
        >
          {shown.text}
        </p>
      )}

      <p className="text-xs leading-relaxed" style={{ color: "var(--on-surface-sub)" }}>
        {PRIVACY_NOTE}
      </p>

      {state.status === "awaiting-confirmation" && (
        <ImportConfirmDialog
          open
          exportedAt={state.payload.exportedAt}
          preview={state.preview}
          onConfirm={confirm}
          onCancel={cancel}
          onDownloadCurrent={handleDownloadCurrent}
        />
      )}
    </div>
  );
}
