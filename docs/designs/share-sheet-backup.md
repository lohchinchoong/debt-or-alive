# Share-Sheet Backup

*   **Author:** Des with Agents
*   **Status:** Proposed
*   **Date:** 2026-11-12 (revised 2026-11-13 after review)

--------------------------------------------------------------------------------

## Overview

Debt or Alive keeps all user data in the browser (`localStorage`). A user moves data to another device by downloading a JSON backup, moving the file by hand, and uploading it with the import button.

This design adds a "Share backup" button as the main backup action. It opens the device's share sheet through the Web Share API, so the user can send the backup file to Drive, iCloud Files, AirDrop, or a message or email to themselves. The app signs in to nothing and sends data nowhere itself. The destination is the user's choice. This fits the app's existing model: it is static, browser-only and has no accounts (see `docs/architecture.md`).

Restore uses the existing "Import Data" button and the phone's file picker, which can browse Drive and iCloud. Import gets a confirmation step, because a file from another device can now replace newer data. Where the browser cannot share files, "Export Data" (the current download) stays as the main button.

In this document, a "tool" is one of the app's calculators or trackers (for example the mortgage calculator). Each tool owns one or more `localStorage` keys through an adapter in `src/lib/persistence/adapters/`.

## The Problem

To move data between devices today, a user downloads a file, moves it to the other device, and uploads it. Users have asked for something easier. The easier send step is what this design delivers. Restore stays a manual file pick.

Two further problems sit behind this:

*   **Import can replace newer data without warning.** Import has no confirmation and replaces every tool present in the file. Today the file nearly always comes from the same device, so the risk is low. Once files travel between devices, a user can import an older file and lose newer edits, or import onto a new device and lose data already entered there.
*   **Backup code cannot be reused.** The backup format (`APP_ID`, `FORMAT_VERSION`, the payload type, the `localStorage` loop, validation, download and file reading) sits inside the `DataPortability` component and is not exported. A share button would copy it, and the copies would drift. The version check only tests that `version` is a number, so a file from a future format version is imported as if it were version 1.

The solution is to share the backup file through the share sheet, confirm before import, and move the backup logic into tested functions with a version guard. A Google Drive integration with sign-in was considered and deferred (see Alternatives Considered).

## Goals

*   A user on a mobile browser that can share files presses "Share backup", then picks a destination, to send a backup to their own cloud storage or another device.
*   "Share backup" is the main backup button where sharing is available. "Export Data" (download) is the main button where it is not, and stays available as a secondary button otherwise.
*   The backup file keeps today's contents and name: the versioned JSON envelope, named `debtoralive-backup-YYYY-MM-DD.json`.
*   Importing a file shows a confirmation with the file's dates, the tools it holds, and a summary of the data in this browser, and states what import replaces. Nothing changes until the user confirms. The dialog offers an optional "Download current data" link.
*   A file from a newer format version is refused with a message to update the app.
*   Backup building and parsing live in one tested module that download, share and import all use.
*   A cancelled share shows nothing. A failed share shows a message that points to "Export Data".
*   A privacy note near the buttons says the backup is readable text, that the app keeps no copy, and that it lives wherever the user sends it.
*   The app stays fully usable offline and with no account.

## Non-Goals

*   Google sign-in, OAuth, tokens, Drive API calls, or any server. Deferred. The module extraction and version guard carry over to a later Drive design.
*   A one-press "Restore from Drive". Restore stays a file pick.
*   Automatic or background sync, merging, or conflict resolution beyond the import confirmation.
*   A single always-current cloud file. Each share creates a new file.
*   Registering the app as a share target (web app manifest and installable app).
*   A Markdown backup format, client-side encryption, or backup version history.
*   A `.txt` fallback when a platform refuses `.json`.
*   A Content Security Policy.
*   A required "download current data first" step on every import.

## Critical User Journeys

### CUJ 1: Share a backup from a phone

*   **Given**: A user has saved data in several tools. Their browser can share files.
*   **When**: They press "Share backup" and choose "Save to Drive" (or iCloud Files, or a message to themselves).
*   **Then**: `debtoralive-backup-YYYY-MM-DD.json` is delivered to the place they chose. The app shows no error, changes no data, and contacts no server.

### CUJ 2: Restore on a second device with no data

*   **Given**: A backup file is in the user's Drive. The second device's browser has no saved data.
*   **When**: The user presses "Import Data", picks the file in the phone's file picker, and confirms.
*   **Then**: The dialog showed the file's dates and tools and "This browser has no saved data." After confirming, the data is applied all-or-nothing, the app shows how many tools were imported, and the page reloads.

### CUJ 3: Restore an older file onto a device with newer data

*   **Given**: This browser's newest save is 12 Nov. The chosen file's newest save is 1 Oct.
*   **When**: The user picks the file in "Import Data".
*   **Then**: The dialog shows "Newest save in this file: 1 Oct 2026" and "This browser: 5 tools with saved data, newest save 12 Nov 2026", and says importing replaces those tools' data. Nothing changes until the user presses "Replace data". "Cancel" leaves all data unchanged. "Download current data" downloads a backup of this browser and leaves the dialog open.

### CUJ 4: Import a file from a newer app version

*   **Given**: The file's `version` is higher than this build's `FORMAT_VERSION`.
*   **When**: The user picks the file.
*   **Then**: No dialog opens. The app says the file was made by a newer version and asks the user to update. Nothing changes.

### CUJ 5: Sharing is not available

*   **Given**: The browser cannot share files (for example Firefox on desktop).
*   **When**: The user opens the home page.
*   **Then**: "Share backup" is not shown. "Export Data" is the main button and downloads the same file as today.

### CUJ 6: The user cancels the share sheet

*   **Given**: The user pressed "Share backup".
*   **When**: They close the share sheet without choosing a destination.
*   **Then**: Nothing is shown and no data changes.

## Proposed Architecture

Backup logic moves out of `DataPortability.tsx` into pure functions. Three transports use them: download, share and import. Import becomes three steps: read and check the file, show a confirmation, then apply it with the existing `importBackup`. The storage write path is unchanged.

```text
 Export (download)       Share (Web Share API)       Import (file picker)
 downloadBackup.ts       shareBackup.ts              useBackupImport (hook)
        \                      |                            |
         \                     |                  prepareImport (pure)
          \                    |                   parseBackup -> previewBackup
           \                   |                            |
            +--------- backup.ts (build, serialize) ----+   ImportConfirmDialog
                                                            |
                                                  importBackup (unchanged)
                                                            |
                                          result message, then page reload
```

### Backup module (`src/lib/persistence/backup.ts`, pure, no DOM)

*   Holds `APP_ID` (`"debtoralive"`), `FORMAT_VERSION` (`1`) and the `BackupPayload` type (`{ app, version, exportedAt, data }`), moved from `DataPortability.tsx`.
*   `buildBackup(storage, now)` reads `REGISTERED_KEYS`, keeps parsed JSON (or the raw string if parsing fails), and returns the envelope, or `null` when no key holds data. `serializeBackup` writes it as today. `backupFileName(now)` returns the same name as today, using the UTC date, so the name does not change.
*   `parseBackup(text)` returns a result and never throws. Checks, in this order: valid JSON, `app` equals `APP_ID`, `version` is a positive integer, `version` is not greater than `FORMAT_VERSION`, and `data` is a plain object (not `null`, not an array). The error kinds and messages are:
    *   `not-json`: "This file isn't a valid backup. It couldn't be read as JSON."
    *   `wrong-app`: "This file isn't a Debt or Alive backup."
    *   `bad-shape` (a bad `version` or `data`): "This backup file is damaged or in an unknown format."
    *   `too-new`: "This file was made by a newer version of Debt or Alive. Update the app and try again."
*   Behavior changes versus today's import: a newer `version` is refused; `version` must be a positive integer (today any number passes); `data` may not be an array; and the user-visible messages change as in the table below. There is no size limit: the user picks their own file.
*   Compatibility policy (also written in this file's header comment): bump `FORMAT_VERSION` only when the envelope's shape changes in a way an older build would misread. Adding a tool, or a key inside a tool's record, is not a bump. A build refuses a higher version. Files from older builds import as today: `importBackup` reads a tool's legacy keys when the file has no current key for it. Only the CPF OA tool declares legacy keys (`cpf-oa:profiles`). `tool:cpf-sa-calculator` is not in `REGISTERED_KEYS`, so a file that holds it reports it as ignored; the CPF SA migration reads it only from this browser's own storage. `buildBackup` never exports legacy keys. This guard does not stop an older build from importing a file that holds a tool it does not know; those keys are reported in the result message as ignored.

Messages that change (from `DataPortability.tsx`):

| Situation | Today | After this change |
| --- | --- | --- |
| Nothing saved to back up | "Nothing to export — no saved data found." (an `alert`) | "Nothing to back up yet. Save some data in a tool first." (status line) |
| File is not JSON | "Failed to parse file: {reason}" | "This file isn't a valid backup. It couldn't be read as JSON." |
| Wrong `app` | "Invalid file — expected app "debtoralive", got "{app}"." | "This file isn't a Debt or Alive backup." |
| Bad `version` or `data` | "Invalid file format — missing version or data." | "This backup file is damaged or in an unknown format." |
| Newer `version` | (imported as if version 1) | "This file was made by a newer version of Debt or Alive. Update the app and try again." |
| File cannot be read | "Failed to read file." | "Couldn't read this file." |
| No tool recognised | "No recognised data found in file." (after import) | "No recognised data found in this file." (before the dialog) |
| Import succeeds | "Imported N tool(s) successfully." plus " N unknown key(s) skipped." | "Imported 1 tool successfully." or "Imported N tools successfully.", plus " Some data in this file isn't supported by this version of the app and was ignored." when keys were skipped |
| Import write fails | "Couldn't import. Nothing was changed. ({reason})" | unchanged |

### Import preview (`src/lib/persistence/preview.ts`, pure, read-only)

*   `previewBackup(storage, data)` returns the tools the file would replace, the newest save date inside the file, and a summary of this browser: `{ fileTools: string[]; fileLatestSavedAt: string | null; local: { toolCount: number; latestSavedAt: string | null } }`. It never writes.
*   Tools in the file follow the rule `importBackup` uses (`import.ts` L46-74). It reads through the read-only view `overlay(storage, data)`, which `import.ts` now exports:
    1.  A tool adapter is in the file when any of its current keys is in `data`. Its date is `adapter.read(view).savedAt` when `adapter.dateKey` is in `data`, otherwise none.
    2.  Otherwise it is in the file when one of its legacy keys is in `data` and `adapter.readLegacy(view)` returns a record. Its date is that record's `savedAt`.
    3.  A profile adapter is in the file when its `key` is in `data`. Its dates come from `adapter.readAll(view)`, read defensively (see below).
    4.  `fileLatestSavedAt` is the latest valid date among these, or `null`.
*   Reading dates defensively: `importBackup` (`import.ts` L68-74) counts a profile tool as imported whenever its key is in the file, and stores `JSON.stringify(adapter.readAll(view))` without checking its shape. Some adapters return the stored value unchanged: `hysaAdapter.readAll` returns a non-array value as is, and passes `null` entries through. So the preview treats a non-array result as no profiles, skips entries that are not objects, and takes `savedAt` only when it is a string. The tool still counts as in the file. Without this, the preview could call a file "damaged" that `importBackup` would import.
*   A date is valid when `Date.parse` returns a number. "Latest" compares by `Date.parse`, not by string order. A date in the future counts.
*   The summary of this browser reads through the read-only view `overlay(storage, {})`. The rules:
    1.  A tool adapter counts when `read(view).exists` is true. Its date is `read(view).savedAt`. Local data held only in a legacy key counts through the adapter's own read (the CPF OA adapter returns `exists: true` with the legacy date).
    2.  A profile adapter counts when `readAll(view)`, read defensively as above, holds at least one object. Its dates are each profile's `savedAt`.
    3.  `local.toolCount` is the number of adapters that count. `local.latestSavedAt` is the latest valid date among their dates, or `null`.
    4.  An adapter that throws on the local read is skipped (counted as no data).
*   Why the view is read-only: `cpfSaAdapter.readAll` (`adapters/cpf-sa.ts` L37-66) migrates an old single-profile key through `saveEntries` when the new key is missing. `saveEntries` (`save.ts` L13-45) wraps `setItem` in a try and catch and returns `{ ok: false }`, and `migrateLegacy` ignores that result. On the read-only view the write fails, nothing is written, and `readAll` returns the profile it would have migrated, which counts. No other adapter writes during `read`, `readAll` or `readLegacy`.
*   A drift-guard test keeps the preview and `importBackup` aligned. For each fixture it checks that the number of `fileTools` equals `toolsImported` and that the names equal a fixed expected list. The fixtures are: `backupV1`; a file with only the legacy CPF OA key; a file with both CPF OA keys; a file whose `hysa-tracker:scenarios` value is not an array; and a file whose HYSA list holds a `null` entry.
*   `prepareImport(storage, text)` joins the steps for the import hook: `parseBackup`, then `previewBackup`. It returns `{ ok: true, payload, preview }`, or `{ ok: false, message }` for a parse failure, for a file with no recognised tool ("No recognised data found in this file."), or for an adapter that throws while reading the file ("This backup file is damaged or in an unknown format."). It is pure, so it is tested without a browser.

### Share and download

*   `src/lib/shareBackup.ts`: `canShareBackupFile()` returns true only when `navigator.canShare` exists and `navigator.canShare({ files: [probe] }) === true`, where `probe` is an empty `File` named `probe.json` of type `application/json` (a probe, not the shared file). It does not call React hooks. `shareBackupFile(file)` calls `navigator.share({ files: [file], title: "Debt or Alive backup" })` and returns `"shared"`, `"cancelled"` (an `AbortError`, raised when the user closes the sheet) or `"failed"`. Backup data is never put in `title` or `text`.
*   `src/lib/downloadBackup.ts`: `downloadBackup(payload, now)` runs the existing Blob and anchor download that now sits inline in `exportData`, with the same cleanup timer. Export and the dialog's "Download current data" link both call it.
*   The share handler builds the payload and the `File` (`new File([serializeBackup(payload)], backupFileName(now), { type: "application/json" })`) and calls `shareBackupFile` before any `await`, so the browser still treats the tap as the cause of the share.

### Import flow (`src/lib/persistence/importState.ts`, `src/hooks/useBackupImport.ts`)

*   The state changes are a pure reducer, `importReducer(state, action)`, in `src/lib/persistence/importState.ts`, so they are tested without a browser. Actions: `prepared` (with the payload and preview), `failed` (with a message), `confirmed` (with the result message), `cancelled` and `dismissed`.
*   `useBackupImport()` (client hook) wraps the reducer with `useReducer` and returns `{ state, selectFile, confirm, cancel, dismiss }`. `state` is `{ status: "idle" }`, `{ status: "awaiting-confirmation"; payload; preview }`, `{ status: "done"; message }` or `{ status: "error"; message }`.

| From | Call | To |
| --- | --- | --- |
| idle, done or error | `selectFile(file)`, `prepareImport` succeeds | awaiting-confirmation |
| idle, done or error | `selectFile(file)`, `File.text()` rejects or `prepareImport` fails | error, with the message |
| awaiting-confirmation | `confirm()`, `importBackup` succeeds | done, with the result message; reload scheduled after 1500 ms |
| awaiting-confirmation | `confirm()`, `importBackup` fails | error: "Couldn't import. Nothing was changed. (reason)" |
| awaiting-confirmation | `cancel()` | idle; storage untouched |
| done or error | `dismiss()` | idle |

*   The reducer ignores `prepared` and `failed` while the state is `done`, because the page is about to reload. The hook clears the reload timer when the component unmounts, and keeps the 1500 ms timer and the `window.location.reload()` call, which are not in the reducer. The hook reads `localStorage` only inside `selectFile` and `confirm`, which run in event handlers, so nothing touches `localStorage` while rendering.
*   `selectFile` reads the file with `File.text()` inside a try and catch. A rejection dispatches `failed` with "Couldn't read this file."
*   The component, not the hook, resets the file input (`value = ""`, through the event target) in its `onChange` handler right after calling `selectFile`, so the same file can be picked again. The input keeps `accept=".json"`.
*   Result message on success is in the messages table above. The reload stays because tool pages read `localStorage` at mount.

### Import confirmation (`src/components/ImportConfirmDialog.tsx`)

*   Built on a new `src/components/ui/alert-dialog.tsx`, written by hand in the style of `tabs.tsx` with the project's CSS variables. It uses the one new dependency this design allows, `@radix-ui/react-alert-dialog`. (The shadcn CLI output was not used: it assumes theme tokens such as `popover` and `muted` that this project does not define, and it imports `cn` from the wrong package.) The dialog must trap focus and close on Escape, which the Radix primitive provides.
*   Props: `open` (true while the hook state is `awaiting-confirmation`), `exportedAt: string | null`, `preview: ImportPreview`, `onConfirm()`, `onCancel()` and `onDownloadCurrent()`. The "Download current data" link is shown only when `preview.local.toolCount` is greater than 0.
*   The dialog is controlled by `open`. Its `onOpenChange(false)` (Escape, a click outside, or the Cancel button) calls `onCancel`. The "Replace data" button uses `AlertDialogAction`, and its click handler calls `event.preventDefault()` and then `onConfirm()`, so Radix does not close the dialog before the hook state changes. The dialog closes when the hook leaves `awaiting-confirmation`.
*   Tool names are `preview.fileTools`, which are `adapter.name` values in registry order (tool adapters, then profile adapters), joined with ", ". Dates use `formatSavedDate` and its `null` result selects the fallback wording. Counts read "1 tool" and "N tools".
*   Text:
    *   Title: "Replace data in this browser?"
    *   "This file was exported on {date}." (or "on an unknown date" when `exportedAt` is missing or not a valid date.)
    *   "Newest save in this file: {date}." (or "No save dates in this file.")
    *   "Tools in this file: {names}."
    *   "This browser: {N} tools with saved data, newest save {date}." (or "This browser: {N} tools with saved data." when no save date exists, or "This browser has no saved data.")
    *   "Importing replaces the data for the tools in this file. A tool in the file replaces that tool's saved data entirely, and for tools with several profiles the file's list replaces the whole list. Tools that are not in the file are kept."
    *   Link "Download current data". Buttons "Cancel" and "Replace data".
*   On a small screen the buttons stack full width and a long tool list scrolls.

### Buttons and layout (`src/components/DataPortability.tsx`)

*   Keeps its name and named export, so `src/app/page.tsx` does not change. It only lays out the buttons, the dialog, one status line and the privacy note.
*   The three buttons sit under an `<h2>` ("Backup file on this device", `text-sm font-semibold`). Each button has one sentence below it, and the button and sentence form one group. The groups stack in a column on small screens and sit in a row from the `sm:` breakpoint, in the order Share backup (when shown), Export Data, Import Data:
    *   Share backup: "Send a backup file to Drive, iCloud, a message or another app."
    *   Export Data: "Download a backup file to this device."
    *   Import Data: "Restore from a backup file you saved earlier."
*   Share backup is shown after mount (`useIsClient()`) when `canShareBackupFile()` is true; the check runs once and its result is kept in state. Export Data is always shown, as the main button when sharing is unavailable and the secondary button otherwise.
*   The three buttons and the dialog's two buttons share two class constants, `BUTTON_PRIMARY` and `BUTTON_SECONDARY`, defined in `src/components/backupButtonStyles.ts`, written as Tailwind classes that translate today's inline styles: both have `inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85`. `BUTTON_PRIMARY` adds `bg-[var(--primary)] text-[var(--on-primary)]`. `BUTTON_SECONDARY` adds `border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-[var(--on-surface)]`. The body font (Manrope) is already the page default, so the buttons do not set it. There is no `button.tsx`.
*   One status line, a `<p>`, shows the latest message and keeps it until the next action. Success and information use `role="status"` and the `--primary` colour; errors use `role="alert"` and the `--tertiary` colour (the colours the current import message uses). The component owns share and export messages. Import messages come from the hook state, so the line shows the hook's message when the hook state is `done` or `error`, and the component's message otherwise.
*   Share handler, in this order: (1) call the hook's `dismiss()` and clear the component's message; (2) `const now = new Date()`; (3) `buildBackup(localStorage, now)`, and if it returns `null`, show the empty-data message and stop; (4) build the `File`; (5) set a `sharing` flag, which disables the Share button, so a second tap does nothing; (6) `await shareBackupFile(file)`, the first `await` in the handler; (7) in a `finally`, clear `sharing`. `"shared"` and `"cancelled"` show nothing; `"failed"` shows the failure message. The Export handler is the same without steps 4 to 7: it calls `downloadBackup(payload, now)`. The Import file input's `onChange` calls `dismiss()`, clears the component's message, calls `selectFile(file)`, then resets the input.
*   Messages written by the component: empty data on Share or Export: "Nothing to back up yet. Save some data in a tool first." Share failed: "Couldn't open the share sheet. Use Export Data to download the backup instead." The hook writes "Couldn't read this file." and the import messages.
*   Privacy note below the buttons, on the page only (it does not appear before the share sheet opens): "Your backup file is plain readable text and includes your CPF, debt and net worth figures. This app keeps no copy: the file lives wherever you send it, and anyone who can open that place can read it. Data in this browser is lost if you clear browser data, so back up first."

### What does not change

*   `importBackup`, `saveEntries`, the adapters, the registry and the backup file's format and version (1) stay as they are. The only change to `import.ts` is exporting `overlay`. Files made before this change still import.

## Risks and Mitigations

| Risk | Mitigation or accepted consequence |
| --- | --- |
| A platform refuses `.json` files in the share sheet. The design assumes iOS Safari and Android Chrome accept them. | Checked on real devices after implementation (the device checks in the Verification Plan). Pass: on an iPhone with Safari and an Android phone with Chrome, Share backup opens the share sheet, the file reaches Drive, and it imports on a second device. Fail: either platform refuses the file, or the receiving device cannot import it. A platform that refuses stays on the download path. If both refuse, drop Share and ship the confirmation and extraction only (Alternative B). |
| `canShare` passes but the share fails later. | The "failed" message points to Export Data, which is always shown. |
| The share loses the tap's user activation, or the page is not on HTTPS. | The handler builds the file and calls share before any `await`. The app is served over HTTPS; `localhost` also works for development. |
| The preview or the local summary writes to storage. | Both read through read-only views. A test with a legacy CPF SA fixture checks zero writes. |
| The dates in the dialog mislead. | The dialog compares the newest save in the file with the newest save in this browser, and shows the export date separately. It is one date per side, not per tool, so a user with many tools may see a newer date on one side while the tools in the file differ. Accepted. |
| File name uses the UTC date and the dialog uses local time, so they can differ by a day around midnight (in Singapore, a share between 00:00 and 08:00 local time carries the previous day's date). | Accepted. The author chose to keep UTC so the name does not change from today's export files. |
| Two shares on one day have the same name. | Accepted. Users tell them apart by the destination's modified time. |
| An older build imports a newer file and drops tools it does not know. | The version guard catches envelope changes only. Unknown keys are reported as ignored in the result message. Accepted. |
| The backup is plain text and a user sends it by message or email. | The privacy note sits next to the buttons. Encryption is deferred. Accepted. |
| Other open tabs keep old data after an import and can overwrite it on their next Save. | The reload covers only the importing tab. Accepted. |
| A very large file is chosen for import. | There is no size limit; the user picks the file. Accepted. |

## Alternatives Considered

### Alternative A: Google Drive sign-in with Backup and Restore buttons

*   **Pros**: One-press restore. Could keep one file updated in place and compare the Drive file's modified time before overwriting.
*   **Cons**: Needs a Google Cloud project, a consent screen, a privacy policy page, a verified domain and Google's review. With no backend there is no refresh token, so sign-in lasts about an hour and each press may need a popup that blockers can stop. Needs a scope choice (`drive.appdata` hides the file; `drive.file` can lose track of a moved file). Adds a third-party script to a page that holds financial data.
*   **Reason not chosen**: Setup and moving parts outweigh the benefit for now. Deferred. `backup.ts`, the version guard and the confirmation carry over unchanged.

### Alternative B: Confirmation and extraction only, no Share button

*   **Pros**: Solves two of the three problems (unguarded import, unreusable code) with no dependence on browser file-sharing support.
*   **Cons**: Does not make sending the file easier, which is what users asked for.
*   **Reason not chosen**: It misses the request. It is the fallback if neither mobile platform accepts shared `.json` files.

### Alternative C: Confirmation shows the file only, with no summary of this browser

*   **Pros**: Reads nothing from local storage.
*   **Cons**: The user must remember what they last did on this device, which is the case the confirmation exists to protect.
*   **Reason not chosen**: It removes the information needed to notice that local data is newer.

### Alternative D: Per-tool comparison in the confirmation

*   **Pros**: Each tool shows the file's date next to this browser's date.
*   **Cons**: Needs rules for tools with no date and for profile lists, and the dialog grows long on a small screen.
*   **Reason not chosen**: More code and a longer dialog than the problem needs. Two newest-save dates are chosen instead.

### Alternative E: Native `<dialog>` or an inline panel for the confirmation

*   **Pros**: No new dependency.
*   **Cons**: A native dialog is a hand-written component with its own backdrop styling and does not follow the project rule to use shadcn where it fits. An inline panel does not block other taps and can scroll off-screen on a phone.
*   **Reason not chosen**: The Radix alert-dialog primitive costs one dependency and follows the pattern of `tabs.tsx`.

### Alternative F: Split `importBackup` into a plan step and an apply step

*   **Pros**: One copy of the tool-selection rule, so the preview and the import cannot drift, and no `overlay` export.
*   **Cons**: Changes the only writer of tool data in this work, and needs a regression pass on `import.test.ts`.
*   **Reason not chosen**: The rule changes only when a new adapter kind is added, and the drift-guard test covers it. Revisit if the rule changes again.

### Alternative G: Other formats and transports

*   A Markdown backup needs a second parser and loses types. A backend with refresh tokens adds secrets and running cost. The File System Access API is missing in Safari and Firefox. A QR code or pasted string is no easier than a file. Automatic sync and merging need a backend. A multi-provider sync interface has one provider.
*   **Reason not chosen**: Each costs more than a manual share and does not fit a static, no-account app.

## Future Improvements

*   **Google Drive integration**: sign-in, one file updated in place, and a modified-time check before overwrite, reusing `backup.ts`, the version guard and the confirmation.
*   **Per-tool comparison in the confirmation**, if users report that two dates mislead.
*   **Share target**: let the app receive a shared file on Android through a web app manifest.
*   **Undo import** from a snapshot, and a "last backed up" reminder, if users lose data.
*   **No reload after import**: tool pages could subscribe to a "data replaced" event instead of reading storage once at mount.
*   **Passphrase encryption** of the backup file.

## Additional Resources

*   `docs/architecture.md`: the save module, the adapters, and the "Shared links removed" decision that points users to export and import.
*   `docs/designs/explicit-save-last-saved-dates.md`: the only-writer rule and the `savedAt` dates the preview reads.

## Open Questions

*   **Mobile file sharing**: assumed to work on iOS Safari and Android Chrome. Confirmed or refuted in the device checks in the Verification Plan (pass and fail criteria are in the first Risks row).

--------------------------------------------------------------------------------

## Detailed Implementation Plan

Before writing the components and hook, read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, as `CLAUDE.md` requires for this Next.js version. All new components and hooks use named exports. Vitest runs in a Node environment on `src/**/*.test.ts`, so the hook, `ImportConfirmDialog` and `DataPortability` have no automated tests. The state changes in the import flow are in the pure `importReducer`, which is tested. What remains in those three files is rendering, event wiring and the reload timer, and the manual checks below cover it.

Each phase ends with `npm test`, `npm run lint` and `npm run build` all exiting 0.

### Phase 1: Backup module

Nothing calls the new module until Phase 5, so the app's behavior does not change before then.

*   `src/lib/persistence/backup.ts` (Create): the module described under "Backup module", with the compatibility policy in its header comment.
*   `src/lib/persistence/testing/backupV1.ts` (Create): exports `BACKUP_V1_TEXT`, a hand-written version 1 backup with made-up values, in a folder where ESLint already allows test helpers. The envelope is `{ "app": "debtoralive", "version": 1, "exportedAt": "2026-11-08T04:00:00.000Z", "data": { ... } }`. `data` holds `tool:mortgage-calculator`, `mortgage:partial-repayments`, `cpf-sa:profiles`, `hysa-tracker:scenarios` and `dividend:projection-years`, each with the value shape used in the `fullBackup` object at the top of `src/lib/persistence/import.test.ts` (copy those values, with `savedAt` `2026-11-08T04:00:00Z`), plus `"unknown:example": 1`. Expected result: 4 tools imported (mortgage, CPF SA, HYSA, dividend), `keysSkipped` equal to `["unknown:example"]`, and a newest save of `2026-11-08T04:00:00Z`.
*   `src/lib/persistence/backup.test.ts` (Create). Cases:
    *   `buildBackup`: returns `null` for empty storage; includes only registered keys (seed an unregistered key too); keeps a non-JSON string value as a string; sets `exportedAt` from `now`.
    *   `serializeBackup`: equals `JSON.stringify(payload, null, 2)` (two-space indent, as today).
    *   `backupFileName`: for the instant `2026-11-08T20:00:00Z` it returns `debtoralive-backup-2026-11-08.json` (the UTC date, although it is already 9 November in Singapore).
    *   `parseBackup`: a valid file; `not-json` for an empty string and for `{`; `wrong-app` for a missing and for another `app`; `bad-shape` for `version` missing, `0`, `-1`, `1.5` and `"1"`, and for `data` missing, `null`, an array and a string at version 1; `too-new` for `version: 2`; `too-new` (not `bad-shape`) for `version: 2` with no `data`, which fixes the check order; a valid file with `exportedAt` missing still parses.
    *   Round trip: build from one memory storage, serialize, parse, and `importBackup` into a second memory storage; for every registered key present in the first, the value parsed from the second equals the value parsed from the first.
    *   Fixture: `BACKUP_V1_TEXT` parses, and `importBackup` into empty memory storage reports 4 tools and `keysSkipped` of `["unknown:example"]`.

### Phase 2: Preview and import state

*   `src/lib/persistence/import.ts` (Modify): add `export` to `overlay` and update its doc comment to say the preview reuses it. Nothing else changes.
*   `src/lib/persistence/import.test.ts` (Modify): add a test that `overlay` returns the file's value (stringified when it is not a string) for a key in the file and the stored value otherwise, and throws on `setItem` and on `removeItem`.
*   `src/lib/persistence/preview.ts` (Create): `previewBackup`, `prepareImport` and the local summary, as described under "Import preview".
*   `src/lib/persistence/preview.test.ts` (Create). Cases:
    *   Tools in the file for `BACKUP_V1_TEXT`'s data (4 names), for a file with only the legacy CPF OA key (1 tool; its date is the latest profile's `savedAt`; use profiles shaped like `A`, `B`, `C` in `import.test.ts` under "importBackup with a legacy OA key"), for a file with both CPF OA keys (1 tool, using the current key), and for a file with only an unknown key (none).
    *   Defensive dates: a file whose `hysa-tracker:scenarios` value is an object (not an array) counts the tool with no date; a HYSA list holding a `null` entry counts the tool and ignores the entry; a `savedAt` that is not a string is ignored; an unparsable date is ignored; the latest date is chosen by `Date.parse`.
    *   Local summary: empty storage gives `{ toolCount: 0, latestSavedAt: null }`; several tools and a profile list give the right count and latest date; data saved with no date counts and leaves `latestSavedAt` unchanged; an adapter that throws on the local read is skipped.
    *   Read-only: storage holding only the legacy `tool:cpf-sa-calculator` key gives a count of 1 for CPF SA and `createMemoryStorage().writes` stays 0.
    *   Drift guard: the fixtures and expected name lists in "Import preview", checked against `importBackup`'s `toolsImported`.
    *   `prepareImport`: success; not-JSON text; a newer version; a file with no recognised tool; an adapter that throws while reading the file.
*   `src/lib/persistence/importState.ts` (Create): `ImportState`, `ImportAction` and `importReducer`, as described under "Import flow".
*   `src/lib/persistence/importState.test.ts` (Create): one test per row of the transitions table; `prepared` and `failed` are ignored while the state is `done`; `dismissed` from `done` and from `error` returns `idle`.

### Phase 3: Share and download

*   `src/lib/shareBackup.ts` (Create): `canShareBackupFile` and `shareBackupFile`, as described under "Share and download".
*   `src/lib/shareBackup.test.ts` (Create): stub `navigator` with `vi.stubGlobal` and call `vi.unstubAllGlobals` in cleanup. Cases: no `navigator`; no `canShare`; `canShare` returning false, and true; the probe passed to `canShare` is a `File` named `probe.json`; `share` resolving; rejecting with `AbortError`; rejecting with another error; and the `share` argument holds one `File`, the title `Debt or Alive backup` and no `text`.
*   `src/lib/downloadBackup.ts` (Create): `downloadBackup(payload, now)`, the Blob and anchor download moved from `exportData` (`DataPortability.tsx` L48-61) with the same cleanup timer. It uses the DOM, so it has no unit test; the manual checks cover it.

### Phase 4: Dialog primitive

*   `package.json` and `package-lock.json` (Modify): add `@radix-ui/react-alert-dialog`, the one new dependency, in the version style of `@radix-ui/react-tabs`.
*   `src/components/ui/alert-dialog.tsx` (Create): written by hand in the style of `tabs.tsx` (named exports, `cn` from `@/lib/cn`, `"use client"`, the project's CSS variables).
*   `npx shadcn@latest add alert-dialog` was tried and not used. Its output imported `cn` from an unrelated npm package (`cn`, which it also added to `package.json`), imported from the unified `radix-ui` package (not installed), and relied on theme tokens this project does not define. It also generated `src/components/ui/button.tsx`, which is not needed. If someone re-runs the CLI, remove those additions.

### Phase 5: Hook, dialog and page component

*   `src/hooks/useBackupImport.ts` (Create, `"use client"`): the hook described under "Import flow".
*   `src/components/backupButtonStyles.ts` (Create): the `BUTTON_PRIMARY` and `BUTTON_SECONDARY` class constants.
*   `src/components/ImportConfirmDialog.tsx` (Create, `"use client"`): the dialog described under "Import confirmation".
*   `src/components/DataPortability.tsx` (Modify): remove the constants, the payload type, `exportData`, `importData` and the `alert()`. Lay out the buttons, dialog, status line and privacy note as described under "Buttons and layout".

### Phase 6: Docs and acceptance

*   `docs/architecture.md` (Modify): in the persistence list (the "Adapters" and "The save module" bullets), say that `backup.ts` builds and parses backups for download, share and import, and that `preview.ts` reads through read-only views because the CPF SA adapter can write a legacy migration when given real storage. Under "Shared links removed", mention sharing a backup. Add a decision entry, "Share-sheet backup, Drive deferred", with the reason and the compatibility policy.
*   `graphify-out/` (Regenerate): after the final build, run `graphify update .`. The `graph.json` diff is expected. Do not edit by hand.
*   Run the device checks below.

### Verification Plan

*   **Commands**: `npm test`, `npm run lint` and `npm run build` all exit 0 at the end of each phase.
*   **Automated coverage**: no project threshold. Each exported function in `backup.ts`, `preview.ts`, `importState.ts` and `shareBackup.ts` has a test for each error kind and each branch described in the design sections above.
*   **Where the device checks run**: Share needs HTTPS and a URL the phone can reach. Use a deployed preview or an HTTPS tunnel to the dev server. `localhost` on a phone is not the development machine. The author runs the checks on real phones. They run after Phase 5 because they need the finished Share button, which is the smallest part of the work. If they fail, Alternative B remains and Phases 1, 2 and 4 still ship.
*   **Manual checks**. Mark each separately. Pass and fail criteria for the share checks are in the first row of the Risks table.
    *   On an iPhone in Safari, press Share backup and send the file to Files or Drive (CUJ 1).
    *   On an iPhone in Safari, press Share backup and close the share sheet without choosing; nothing is shown (CUJ 6).
    *   On an Android phone in Chrome, press Share backup and send the file to Drive (CUJ 1).
    *   On a second device with no saved data, pick the file from Drive in Import Data; the dialog lists the file's dates and tools and says "This browser has no saved data", and after confirming the result message is correct (CUJ 2).
    *   On a device whose newest save is newer than the file's, import the older file; the dialog shows both dates, and Cancel leaves all data unchanged (CUJ 3).
    *   In that dialog, press "Download current data"; a backup file downloads and the dialog stays open. On a browser with no saved data the link is absent.
    *   Edit a copy of a backup to `"version": 2` and pick it; no dialog opens and the update message shows (CUJ 4).
    *   Pick a file that holds only unknown keys; the message "No recognised data found in this file." shows.
    *   Pick a text file that is not JSON; the message "This file isn't a valid backup. It couldn't be read as JSON." shows.
    *   Save `BACKUP_V1_TEXT` as a file and import it; the result reads "Imported 4 tools successfully." followed by the sentence about ignored data.
    *   After Cancel, pick the same file again; the dialog opens again.
    *   Failed import: in the browser console run `Storage.prototype.setItem = () => { throw new Error("x") }`, then confirm an import; the message "Couldn't import. Nothing was changed. (x)" shows, and after a reload the data is unchanged.
    *   Failed share: in the console on a browser where Share is shown, run `navigator.share = () => Promise.reject(new Error("x"))`, then press Share backup; the share-failed message shows.
    *   On desktop, press Export Data; a file named `debtoralive-backup-YYYY-MM-DD.json` downloads, holds the two-space-indented envelope, and imports back with Import Data.
    *   On desktop Firefox, Share backup is hidden and Export Data is the main button (CUJ 5).
    *   On an empty browser, Share and Export both show "Nothing to back up yet. Save some data in a tool first."
    *   While sharing and importing, the browser's network panel shows no request made by the app.
    *   At 360 px wide, the buttons, descriptions, dialog and privacy note fit without horizontal scrolling.

--------------------------------------------------------------------------------

<!-- Provenance: Indicates initial structural drafting via EGM. -->

*Drafted with EGM*
