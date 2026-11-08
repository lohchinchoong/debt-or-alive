# Stage 6: Comprehension Test

*   **Target:** `docs/designs/explicit-save-last-saved-dates.md` (FeatureRange 1..749, DetailedRange 750..1267)
*   **Reviewer:** `egm-comprehension`, which read the document alone with no other files
*   **Date:** 2026-11-08

## Paraphrase: Feature Specification

**What this proposes.** Debt or Alive is a browser-only app with 12 finance tools. All data lives in localStorage and every tool currently autosaves. The design replaces autosave with an explicit Save button and shows a "Last saved: D Mon YYYY" date. Single-state tools get one date per tool. The five multi-profile tools (CPF SA, CPF MA, CPF OA annuity, HYSA, savings goal) get one date per profile, shown only on that profile's detail page.

Edits, including list-item add, delete and reorder, stay in an in-memory draft until Save. Save writes all of a tool's keys or none, writes the date last, and changes the date only when the data actually changed. A never-saved tool or profile may always be saved once. Each tool or profile is in one of three date states: saved, never saved ("Not saved yet"), or legacy (data from before this feature with no date, which shows nothing). New profiles exist only in a `/new` detail route until their first Save. Deleting a profile from the list page writes straight away after a confirm dialog, as a declared exception.

Shared-link URL params are removed entirely. Leave warnings are best effort: in-app links and pushes use `window.confirm`, and tab close uses `beforeunload`. Browser back, iOS swipe-back and tab eviction are knowingly unguarded. A one-time notice tells users about manual saving. Export and import carry the dates, and the missing HYSA key is added to export first as its own fix. vitest is added for the pure storage logic.

**How the existing system works, per this document.** Every tool writes to localStorage on every keystroke. `useToolState` (shared by five tools) also writes on page load, and so do the SRS calculator's effects. When the URL carries values, `useToolState` writes them over the user's saved data. Writes are spread across about 15 setters: the shared hook, five per-tool profile hooks, and page-level list setters that use `loadArray`/`saveArray`. Errors are swallowed. The export list in `DataPortability.tsx` is hand-written and misses `hysa-tracker:scenarios`. CPF SA has a one-time migration from an old key. The savings-goal loader gives records that lack an id a new `Date.now()` id on every load.

## Paraphrase: Detailed Implementation

The work ships in seven stages.

1.  A one-line export fix for HYSA.
2.  vitest (node environment, TZ pinned to Asia/Singapore) plus pure modules: `formatSavedDate`, shared types (`StorageLike`, `StorageEntry`, `ToolAdapter`, `ProfileAdapter`, `DateState`), `stableStringify`/`sameData`, `saveEntries` with snapshot-and-rollback, `saveProfile`/`deleteProfile`, `saveTool`/`dateStateOf`, and 12 adapter files. The adapters take over each tool's types, defaults and normalisers and put the date-carrying key last. Stage 2 also adds a registry that builds `EXPORT_KEYS`, an in-memory storage fake, and unit tests.
3.  Unwired React pieces: a module-level unsaved store with `confirmLeave()`, `useUnsavedGuard` (registers with the store and manages `beforeunload`), `useToolDraft`, `useProfileDraft` (adds `"new"` mode and `notFound`), `useProfileList` (read-only plus `remove`), `useGuardedRouter` (guarded `push`, unguarded `replace`), `GuardedLink`, `LastSaved`, `SaveBar` and `ManualSaveNotice`.
4.  CPF SA moves over as the first full slice: list page, detail page and a new `new/page.tsx` that re-exports the detail page. The old hook is deleted.
5.  The other four profile tools move the same way, with HYSA and savings-goal item edits becoming draft changes.
6.  The seven single-state pages move to `useToolDraft` with one combined record each. `useToolState`, `loadArray` and `saveArray` are removed, header and card links switch to `GuardedLink`, and an ESLint rule bans direct `next/link` and `useRouter` imports.
7.  Export uses the registry. Import strips a stale `savedAt` when a file has some of a single-state tool's keys but not its date key.

Docs and README are updated. Verification covers build, lint and tests after every stage, a grep for `localStorage.setItem`, and a manual QA list on desktop Chrome and iOS Safari.

## Findings

**🟡 Major: "Save on all 12 tools and on the 5 detail pages" misstates where Save appears (lines 20-21, 67-68, 1247-1249).**
-   A naive reader adds this up to 17 Save surfaces. But list pages have no draft and no Save bar (line 338), and they show no dates (line 130). So the 5 multi-profile tools' own pages (their list pages) have no Save. The real count looks like 7 single-state pages plus 5 detail pages (plus the 5 `/new` routes).
-   Manual QA step 1 then says each of "the 17 pages" shows "Not saved yet" with Save enabled and Discard hidden. On a fresh profile that cannot be true of list pages. A detail page cannot even be opened without a profile, because an unknown id redirects.
-   Suggested fix: state the Save surfaces exactly, for example "the 7 single-state tool pages and the 5 multi-profile detail pages (including their `/new` mode)". Rewrite QA step 1 to list exactly which pages are checked and what each should show. List pages should show no date and no Save bar, and `/new` should show "Not saved yet".

**🟡 Major: The grep check cannot work as written (lines 1236-1241).**
-   `saveEntries` and the adapters receive an injected `storage: StorageLike` (lines 816-817, 842, 979), so their code would read `storage.setItem`, not `localStorage.setItem`. `save.ts` and the CPF SA migration in `adapters/cpf-sa.ts` would therefore not match. Any new code that writes through an injected `storage` would also pass unnoticed.
-   A reader can't tell whether the check is meant to prove "only these files write" or is just a rough grep.
-   Suggested fix: grep for `\.setItem\(` and `\.removeItem\(` across `src`, and list the expected matches. Alternatively, say that only `useToolDraft`, `useProfileDraft`, `useProfileList` and the exceptions touch the global `localStorage`, and grep for `localStorage` itself.

**🟡 Major: Who sees the "one-time notice" is unclear (lines 106-108, 1049-1060, 1045).**
-   The Goals say existing users are told about the change. The implementation shows the notice to everyone until it is dismissed, and nothing checks whether the user had any prior data. So brand-new users would also see "Changes are no longer saved automatically".
-   Suggested fix: either say outright that every user sees it, new or existing, and that this is accepted, or define the condition, for example "shown only when any tool key exists and the dismissed flag is absent".

**🟢 Nit: The Save bar text in the legacy and clean-load states is not specified (lines 370-373, 1041-1042).**
-   The bar has four texts: "Not saved yet", "Unsaved changes", "Saved" and "Couldn't save". A reader can't tell what a clean page with legacy data shows (CUJ 6), or a clean page loaded with a date. Presumably both show "Saved", but legacy data has never been saved under the new model.
-   Suggested fix: add a small table mapping (dateState, isDirty, saveError) to the bar text.

**🟢 Nit: "Plain router" vs `useGuardedRouter().replace` (line 357 vs lines 993-995, 1009-1013).**
-   The Technical Plan says the redirect and post-create replaces "use the plain router". The detailed plan instead routes them through `useGuardedRouter().replace` (unguarded) and bans direct `useRouter` imports. Line 994 also reads as if a hook is called inside a save callback.
-   Suggested fix: reword line 357 to "use the unguarded `replace` from `useGuardedRouter`". In item 18, say the hook gets `replace` at the top level and calls it after save.

**🟢 Nit: The lint rule's scope differs between sections (lines 364-366 vs 1186-1192).**
-   §4 says the rule applies "in tool pages and shared components" and covers `next/link` only. Item 36 says all of `src/**`, and adds `useRouter`.
-   Suggested fix: align §4 with item 36.

**🟢 Nit: `useIsClient()` is not defined (line 975).**
-   This looks like a project hook, and the document never says what it is or whether it already exists.
-   Suggested fix: add "(existing hook in `src/hooks/…` that returns true after hydration)", or list it as a file to create.

**🟢 Nit: The "about 15 setters" count doesn't add up (lines 47-49, 493-494).**
-   The breakdown given is 1 shared hook, 5 profile hooks and setters in 6 tools, which is 12 sources. A reader will wonder where 15 comes from.
-   Suggested fix: say "about 15 setters across 12 places", or list them.

**🟢 Nit: Current URL-sync behaviour is only implied (lines 26, 43-46, 646-652).**
-   Alternative R's cons (which fields go into the URL, and that list items do not) assume the reader knows which tools sync which fields to the URL today. Its last sentence also repeats the first.
-   Suggested fix: add one sentence to The Problem describing the current URL sync (which tools, scalar fields only, written on every edit), and remove the repeat in Alternative R.

**🟢 Nit: The delete function has two names (line 335 vs line 1001).**
-   The Technical Plan calls it `deleteProfile(id)` on `useProfileList`. Item 19 calls the hook's function `remove(id)`, and `deleteProfile` is the pure function in `profiles.ts`.
-   Suggested fix: use `remove` in §3, or note the mapping.

**🟢 Nit: Old backups containing `tool:srs-calculator` (lines 397, 1202-1203).**
-   The export drops this "unused" key, but the document doesn't say what import does when an older file contains it.
-   Suggested fix: add one line, for example "import still writes it as-is and it is ignored" or "import skips it".

The review is complete: I read the persona file and the whole target document (lines 1-1267). No other files were read, per the task.
