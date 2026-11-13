# Architecture

## Overview

<!-- TODO: Describe what this application does at a high level and the core problem it solves. -->

## Pages & Routes

| Route | Purpose |
|---|---|
| `/` | <!-- TODO --> |

<!-- TODO: List all planned and implemented routes with a brief description of each. -->

## Components

<!-- TODO: Document major shared components, their props, and where they're used.

Example format:
### `DebtCard`
- **Location:** `src/components/DebtCard.tsx`
- **Purpose:** Displays a single debt entry with balance, interest rate, and due date.
- **Props:** `debt: Debt`, `onEdit: () => void`
-->

## Data Flow

All user data lives in the browser's localStorage. There is no backend. The full design is in
[designs/explicit-save-last-saved-dates.md](./designs/explicit-save-last-saved-dates.md).

```text
localStorage ──read──► adapter ──record──► draft hook ──draft──► page
     ▲                                        │
     └──── saveEntries (save module) ◄── Save ┘
```

- **Adapters** (`src/lib/persistence/adapters/`) know each tool's storage keys and turn stored
  data into one record and back. They read without writing. Every adapter is listed in
  `src/lib/persistence/registry.ts`, which export and import use.
- **Draft hooks** (`useToolDraft` for single-state tools, `useProfileDraft` and `useProfileList`
  for the multi-profile tools) load the record once, keep an unsaved draft beside it, and expose
  Save and Discard. Opening a page writes nothing.
- **The save module** (`saveEntries` in `src/lib/persistence/save.ts`) is the only writer of tool
  data. It writes all of a tool's keys, tries to restore them if a write fails, always reports the
  error, and writes the date last. Import also goes through it, in one call.
- **Backups**: `src/lib/persistence/backup.ts` builds and checks the backup file (a versioned JSON
  envelope) for download, share and import. `preview.ts` tells the import dialog which tools a file
  would replace and what this browser holds. It reads through read-only views, because the CPF SA
  adapter can write a legacy migration when given real storage; on a read-only view that write fails
  harmlessly. `importState.ts` holds the import flow's state changes, and `useBackupImport` runs them.
- **Exceptions** that write outside Save: list-page profile delete (after a confirm dialog), the
  one-time CPF SA migration, `useTheme`, and the release-notice flag. ESLint enforces the
  `setItem`/`removeItem` allowlist.
- **Leave guards**: `GuardedLink` and `useGuardedRouter` ask before leaving a page with unsaved
  changes, and `beforeunload` covers tab close while a page is dirty. Browser back/forward and
  iOS swipe-back are not guarded; the "Unsaved changes" bar is the main safeguard. ESLint keeps
  `next/link` and `useRouter` inside the two wrappers.

## Key Decisions

### Explicit Save replaces autosave
**Decision:** Every tool page and profile detail page has a Save button; edits stay a draft until
Save, and each tool or profile shows "Last saved: 8 Nov 2026".
**Reason:** The date should mean "the user confirmed this data", and Discard lets users try out
numbers. The cost, accepted on purpose: unsaved edits can be lost, for example when a mobile
browser closes a background tab.

### Shared links removed
**Decision:** Tools no longer read values from, or write values to, the URL. Old bookmarks with
query params load the user's saved data and have the params stripped.
**Reason:** URL values overwrote saved data and only carried a tool's plain inputs, not its lists.
Moving data between devices is done with sharing a backup, export and import.

### Share-sheet backup, Google Drive deferred
**Decision:** "Share backup" sends the backup file through the device's share sheet (Web Share API),
so the user chooses where it goes (Drive, iCloud Files, a message). Export still downloads the same
file, and import asks for confirmation before it replaces data. There is no sign-in, token or server.
**Reason:** A Google Drive integration needs a Google Cloud project, a consent screen and review, and
without a backend its sign-in lasts about an hour. The share sheet gives the easier send step with
none of that. Restore is still a manual file pick. Drive can be added later on the same `backup.ts`.
**Compatibility:** Bump the backup's `FORMAT_VERSION` only when the envelope's shape changes in a way
an older build would misread (adding a tool is not a bump). A build refuses a file with a higher
version, and each released version keeps a test fixture (`testing/backupV1.ts`). Design:
`docs/designs/share-sheet-backup.md`.

### Watch item: `cacheComponents`
Turning on `cacheComponents` would keep hidden pages alive, so drafts would survive navigation and
break "leaving a page discards its draft". Revisit the explicit-Save design before enabling it.
