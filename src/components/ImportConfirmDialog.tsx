"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from "@/components/backupButtonStyles";
import { formatSavedDate } from "@/lib/formatSavedDate";
import type { ImportPreview } from "@/lib/persistence/preview";

type ImportConfirmDialogProps = {
  open: boolean;
  /** The file's export date, or null when it has none. */
  exportedAt: string | null;
  preview: ImportPreview;
  onConfirm: () => void;
  onCancel: () => void;
  onDownloadCurrent: () => void;
};

function dateText(iso: string | null): string | null {
  return iso === null ? null : formatSavedDate(iso);
}

function toolCount(n: number): string {
  return `${n} tool${n === 1 ? "" : "s"}`;
}

/** Asks the user to confirm before an imported file replaces data in this browser. */
export function ImportConfirmDialog({
  open,
  exportedAt,
  preview,
  onConfirm,
  onCancel,
  onDownloadCurrent,
}: ImportConfirmDialogProps) {
  const exported = dateText(exportedAt);
  const fileNewest = dateText(preview.fileLatestSavedAt);
  const localNewest = dateText(preview.local.latestSavedAt);
  const hasLocalData = preview.local.toolCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogTitle>Replace data in this browser?</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="flex flex-col gap-2">
            <p>This file was exported {exported ? `on ${exported}` : "on an unknown date"}.</p>
            <p>{fileNewest ? `Newest save in this file: ${fileNewest}.` : "No save dates in this file."}</p>
            <p>Tools in this file: {preview.fileTools.join(", ")}.</p>
            <p>
              {hasLocalData
                ? `This browser: ${toolCount(preview.local.toolCount)} with saved data${
                    localNewest ? `, newest save ${localNewest}` : ""
                  }.`
                : "This browser has no saved data."}
            </p>
            <p>
              Importing replaces the data for the tools in this file. A tool in the file replaces that
              tool&apos;s saved data entirely, and for tools with several profiles the file&apos;s list replaces
              the whole list. Tools that are not in the file are kept.
            </p>
          </div>
        </AlertDialogDescription>
        {hasLocalData && (
          <button
            type="button"
            onClick={onDownloadCurrent}
            className="cursor-pointer justify-self-start text-sm font-semibold text-[var(--primary)] underline underline-offset-2"
          >
            Download current data
          </button>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel className={`${BUTTON_SECONDARY} w-full sm:w-auto`}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={`${BUTTON_PRIMARY} w-full sm:w-auto`}
            onClick={(event) => {
              // Keep the dialog open until the import state changes.
              event.preventDefault();
              onConfirm();
            }}
          >
            Replace data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
