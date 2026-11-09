# CPF Ordinary Account (OA) Annuity Calculator

*   **Author:** Des with Agents
*   **Status:** Draft
*   **Date:** 2026-11-09
*   **Source brief:** [cpf-oa-annuity-calculator.brief.md](./cpf-oa-annuity-calculator.brief.md)

--------------------------------------------------------------------------------

## Overview

The CPF (Central Provident Fund) OA annuity tool shows the constant monthly payout that an Ordinary Account (OA) balance can fund. The user enters a birth year, a start drawdown age (the age payouts begin), the balance at that age and an end drawdown age (the age the balance reaches zero). The interest rate, the minimum start age of 55 and the other calculation rules are unchanged by this design.

Today the tool stores a list of saved profiles in `localStorage` under the key `cpf-oa:profiles`. Each profile is `{ id, name, savedAt?, birthYear, startDrawdownAge, balanceAtStart, endDrawdownAge }` and opens its own page.

This design turns it into one calculator page, "CPF Ordinary Account (OA) Annuity Calculator", at `/tools/cpf-oa-annuity-calculator`. There are no profiles, names or list. The page behaves like the Compound Interest calculator (see "How saving works today"): it loads one saved set of inputs and writes the record to the device only when the user presses Save. The app is local-only and single-device.

On the home page the tool moves from the Tracking Tools tab to the Calculators tab and becomes the first card there. Its tagline becomes: "Find the steady monthly payout your OA balance can fund between two ages."

### Terms

*   **Profile**: a saved item in the data and code.
*   **Scenario**: the word used in text shown to users, and in CUJ wording about that text.
*   **Legacy key**: `cpf-oa:profiles`.
*   **New key**: `tool:cpf-oa-annuity-calculator`.
*   **`legacy` date state**: a code term for a stored record that has no date. It is unrelated to the legacy key.

## The Problem

### Why change

The calculation takes a balance and two ages and returns a payout, but the tool is built as a profile manager. The list page, create flow, delete flow and name editor exist only to manage profiles, and they place the tool in the Tracking Tools tab, whose subtitle says "for your own numbers". The existing profile page, `[profileId]/page.tsx`, is 838 lines.

### Constraint: existing data

Users who saved profiles have them under the legacy key, and old backup files contain it. The design keeps the latest profile. The failure modes are in Risks & Mitigations.

### Scale and cost

The author's estimate is about 10 users (unmeasured). Without a migration each would re-enter four numbers. Keeping the latest profile touches 15 files:

*   7 source files changed: `src/lib/persistence/types.ts`, `src/lib/persistence/tool.ts`, `src/lib/persistence/adapters/cpf-oa.ts`, `src/lib/persistence/registry.ts`, `src/lib/persistence/import.ts`, `src/lib/tools.ts` and `src/app/tools/cpf-oa-annuity-calculator/page.tsx`.
*   1 route folder deleted: `src/app/tools/cpf-oa-annuity-calculator/[profileId]/`.
*   7 test files or helpers changed or added: `testing/memoryStorage.ts`, `tool.test.ts`, `adapters/profileAdapters.test.ts`, `adapters/cpf-oa.test.ts`, `adapters/toolAdapters.test.ts` and `import.test.ts` (all under `src/lib/persistence/`), and `src/lib/tools.test.ts`.

The cost is accepted to preserve the users' saved numbers, not justified by the user count (see Alternative D).

## Goals

*   One calculator page at `/tools/cpf-oa-annuity-calculator` replaces the profile list and the `[profileId]` pages.
*   The page uses the same saving pattern as the Compound Interest calculator: one record, loaded on visit, written only on Save, with the unsaved-changes guard.
*   The profile with the latest `savedAt` pre-fills the calculator, and the other profiles are deleted.
*   Old backup files that contain the legacy key import correctly: the latest `savedAt` wins, as on the device.
*   Old URLs (`/tools/cpf-oa-annuity-calculator/new` and `/tools/cpf-oa-annuity-calculator/<id>`) return the default 404.
*   The tool is renamed, gets the new tagline, moves to the Calculators tab and is the first card there.
*   A notice tells a migrated user how many other scenarios are not carried over, until the first Save.
*   The calculation results are unchanged: the maths is moved as is, and the Verification Plan compares three input sets before and after.

## Non-Goals

*   Any change to the maths (`simulate`, `solveMonthlyDrawdown`, `validate`), or moving it into `src/lib`.
*   Redirects from old profile URLs.
*   A scenario picker, a scenario download button, or a backup copy of the dropped profiles.
*   Changes to the CPF SA, CPF MA, HYSA or Savings Goal tools, or to the shared profile hooks (`useProfileList`, `useProfileDraft`, `NEW_PROFILE_ID`).
*   Changing the Calculators tab subtitle ("Quick, one-off what-ifs."). This design leaves it unchanged.
*   Renaming CPF SA or CPF MA. Only this tool's name gains "Calculator".
*   Removing the legacy key on page load (Alternative L), or changing `ManualSaveNotice` (Alternative M).
*   A line in the import summary about dropped profiles (Alternative O).
*   Making export include data that has not been saved on the calculator (see Risks & Mitigations).

## Open Questions

None. Three behaviours were reviewed and accepted as they are by the author:

*   **Import overwrites without asking.** Importing a backup replaces the device OA record and removes the device legacy key, with no confirmation (`DataPortability.tsx` has none, and the summary is the standard "Imported N tools successfully.").
*   **A single legacy profile shows no notice.** With one legacy profile, `others` is 0, so no notice appears, although "Last saved" shows a date and Save is enabled before anything is written. Nothing is lost in that case.
*   **A corrupt new key beside a valid legacy key** shows defaults and no notice. A later Save overwrites the corrupt key and removes the legacy key.

## Critical User Journeys (CUJs)

### CUJ 1: New user opens the calculator

*   **Given**: No new key and no legacy key on the device.
*   **When**: The user opens `/tools/cpf-oa-annuity-calculator`.
*   **Then**: The page shows the default inputs, the payout result and "Not saved yet". Nothing is written until the user presses Save.

### CUJ 2: Existing user with saved profiles

*   **Given**: The legacy key holds three usable profiles, and no new key exists.
*   **When**: The user opens the calculator.
*   **Then**: The inputs are filled from the profile with the latest `savedAt`, and "Last saved" shows that date. A notice says the other two scenarios are not carried over and that saving removes them. Nothing is written on load. Save is enabled although nothing was edited, because the page overrides the usual rule (see "Enabling Save during a pending migration"). When the user presses Save, the new key is written, the legacy key is removed and the notice disappears.

### CUJ 3: Importing an old backup

*   **Given**: A backup file exported before this change, with a legacy key holding at least one usable profile.
*   **When**: The user imports it.
*   **Then**: The calculator holds the inputs and `savedAt` of the most recent profile in the file, replacing whatever OA record the device had. Replacing is intended: `importBackup` treats the file as the source of truth for every key it owns. The device's legacy key, if any, is removed, which deletes its other profiles. The import summary is the standard "Imported N tools successfully." A legacy key with no usable profile is skipped, and the device record is untouched.

### CUJ 4: Visiting an old profile URL

*   **Given**: A bookmark to `/tools/cpf-oa-annuity-calculator/p_1700000000000` or `/new`.
*   **When**: The user opens it.
*   **Then**: The default 404 page appears.

### CUJ 5: Finding the tool on the home page

*   **Given**: The user is on the home page.
*   **When**: They open the Calculators tab.
*   **Then**: "CPF Ordinary Account (OA) Annuity Calculator" is the first card. The Tracking Tools tab no longer lists it.

### CUJ 6: Save fails during a pending migration

*   **Given**: A pending migration (CUJ 2) and storage that rejects the write.
*   **When**: The user presses Save.
*   **Then**: The save bar shows "Couldn't save". Nothing is removed, so the legacy key and the notice stay, and the user can try again.

### CUJ 7: Discard during a pending migration

*   **Given**: A pending migration (CUJ 2) and an edited input.
*   **When**: The user presses Discard.
*   **Then**: The inputs return to the winner's values. The notice stays, and Save stays enabled.

## Proposed Architecture

### How saving works today

The Compound Interest page (`src/app/tools/compound-interest/page.tsx`) shows its inputs and results, a "Last saved" line and a fixed bar with Save and Discard. Nothing is stored until the user presses Save. Save is disabled when there is nothing to save, so the button also tells the user the data is stored. If the user leaves the page or closes the tab with unsaved changes, the unsaved-changes guard (`useUnsavedGuard`) asks for confirmation. The OA page will work the same way.

*   **Adapter.** A `ToolAdapter` (`src/lib/persistence/types.ts`) describes how one tool is stored: `slug`, `name`, `keys`, the `dateKey` (the key whose stored object carries `savedAt`), `defaults()`, `read(storage)` and `toEntries(record, savedAt)`. `read` takes a storage object, looks up its own keys in it and returns a `ToolRead<T>`: `{ record: T, savedAt: string | null, exists: boolean }`. `createInputsAdapter` (`src/lib/persistence/inputsAdapter.ts`) builds an adapter for a tool with flat inputs. Adapters are listed in `TOOL_ADAPTERS` (`src/lib/persistence/registry.ts`). `REGISTERED_KEYS` is every key they own, and export copies exactly those keys.
*   **Hook.** `useToolDraft(adapter)` reads once (reads never write) and keeps a draft. It returns `status` (`"loading"` until the browser has mounted, then `"ready"`), the draft, `canSave`, `save()` and `discard()`. `save()` writes through `saveTool` and `saveEntries`. `canSave` is true when the draft differs from the last saved record or the date state is not `saved`.
*   **Import.** `importBackup` (`src/lib/persistence/import.ts`) builds a read-only view of storage: the backup's value for keys in the file, the device's value otherwise, and writes throw. For each adapter whose keys are in the file it reads through that view and collects entries. An adapter whose entries are collected "takes part". `owned` is the set of keys the app's adapters are responsible for. A key in the file that is not in `owned` is unknown to the app, so it is reported in `keysSkipped` and not written. Entries from all adapters are written in one `saveEntries` call, so an import succeeds or fails as a whole.

### Date states

`dateStateOf` maps a read result (`exists`, `savedAt`) to one of three states, which decide what `LastSaved` shows and whether Save is enabled with no edits:

| State | Condition | `LastSaved` text | Save with no edits |
| --- | --- | --- | --- |
| `never` | `exists` is false | "Not saved yet" | enabled |
| `legacy` | `exists` is true, `savedAt` is null | none | enabled |
| `saved` | `exists` is true, `savedAt` is set | `Last saved: <date>` (none if the date does not format) | disabled |

### Summary of changes

The OA tool becomes a single-record tool in `TOOL_ADAPTERS`, built with `createInputsAdapter`. The source files that change are listed in The Problem. `ToolAdapter` gains two optional members, `legacyKeys` and `readLegacy`. `saveTool` removes legacy keys after a successful Save. `importBackup` handles a legacy key in a backup. `useToolDraft`, `ToolRead`, `ImportResult`, `DataPortability` and `ManualSaveNotice` do not change. `cpfOaAdapter` stops being a `ProfileAdapter`, so its profile-only members (`listPath`, `newProfile`, `readAll`) and the tests that use them are removed.

### Storage

*   **New record:** `tool:cpf-oa-annuity-calculator`, stored as `{ birthYear, startDrawdownAge, balanceAtStart, endDrawdownAge, savedAt }`. This is the flat shape `createInputsAdapter` writes, with `savedAt` added at save time. In code the record is `{ inputs: CpfOaParams }` and `savedAt` travels separately.
*   **Legacy key:** `cpf-oa:profiles`. Never written by the new code. Read for migration and the notice. Removed at the next Save or import. Until then it can sit beside the new key, where it is ignored.

### Reading the legacy key (`readLegacy`)

`readLegacy(storage)` returns `{ record, savedAt, exists: true, discarded } | null` and does not write. The contract for the OA adapter:

1.  Parse the legacy key. Invalid JSON, a non-array, or an array with no usable item returns null. A usable item is a non-null, non-array object.
2.  Normalise each usable item with the rules the old `readAll` used, moved and not rewritten. Profiles saved by an earlier build stored `balanceAt55` (the balance at age 55) and started drawing at age 56, so `balanceAt55` becomes `balanceAtStart` and the start age is 56. Missing fields take `CPF_OA_DEFAULT_PARAMS`. Drop `id` and `name`.
3.  Pick the winner: the latest `savedAt` among profiles whose `savedAt` is a string that `Date.parse` accepts and that is not later than the current time. A missing, non-string, unparseable or future date counts as oldest, so one bad date cannot beat the real latest profile. On a tie, or when no date is valid, the last item in the array wins, because profiles are appended.
4.  Validate through the base adapter. The "base adapter" is the `createInputsAdapter` result that `cpfOaAdapter` wraps. Its `read` already applies the standard type check: a stored value is kept only if its type matches the default, and the rest take defaults. To reuse it instead of writing a second validator, serialise the winner's params as the flat new-key JSON, adding `savedAt` only if it was valid in step 3. Put that JSON in a small inline store. The store's `getItem` returns it for the new key and null for any other key, and its `setItem` and `removeItem` throw. The base `read` runs on that store, because `read` takes a storage object and cannot take plain values.
5.  Return the base read's `record` and `savedAt` with `exists: true`, and `discarded` equal to the usable count minus 1.

### Read path and the pending-migration helper

A private helper `legacyToMigrate(storage)` in `cpf-oa.ts` returns the `readLegacy` result when the new key is absent (`storage.getItem(newKey) === null`) and the legacy key yields a winner, and null otherwise. It is the only place that decides whether a migration is pending.

The OA adapter wraps the base adapter and replaces `read()`. It returns `legacyToMigrate(storage)` if that is not null, and otherwise delegates to the base read (which returns the stored record, or defaults). When the new key exists, the legacy key is ignored. `read()` makes no writes, so the existing zero-writes tests still hold.

`readLegacyOaState(storage)` is exported for the page and calls the same helper: `pending` is true when the helper returns a result, and `others` is its `discarded` (otherwise 0). Because both call the helper, `read()` and the page state cannot disagree.

### Save path

`saveTool` (`src/lib/persistence/tool.ts`) gets one addition: after `saveEntries` returns ok, it removes each key in `adapter.legacyKeys`. A failed removal is logged with `console.warn` and ignored. Nothing is removed unless `saveEntries` returned ok. This also clears a legacy key recreated by an old tab.

### Enabling Save during a pending migration

A migrated winner usually carries a valid `savedAt`, so the date state is `saved` and `useToolDraft` would set `canSave` to false. The page passes `canSave={draft.canSave || legacy.pending}` to the `SaveBar`, where `legacy` comes from `readLegacyOaState`. The hook is not changed. After a successful Save the page sets `legacy` to `{ pending: false, others: 0 }`.

### Notice

*   **Inputs.** The page computes `legacy` once in a `useState` initialiser from `readLegacyOaState(localStorage)`. It returns `{ pending: false, others: 0 }` when `typeof window === "undefined"`.
*   **Server and first client render.** Next renders the page on the server first, where `localStorage` does not exist. The page therefore shows the notice and uses `legacy.pending` only when `status === "ready"`, so the first client render matches the server output.
*   **Display.** The notice shows while `others` is above 0. There is no stored flag and no dismiss button, so it returns on each visit until Save is pressed. Text:
    *   One other scenario: "We kept your most recent scenario. The other scenario is not carried over, and saving removes it."
    *   N other scenarios: "We kept your most recent scenario. The other N scenarios are not carried over, and saving removes them."

### Import

`importBackup` changes as follows:

*   An adapter is considered if any of its `keys` or `legacyKeys` is in the file.
*   If the file has the new key, the normal path applies. If it also has a legacy key, that legacy key is not added to `owned`, so it is reported in `keysSkipped`.
*   If the file has only a legacy key, the loop calls `adapter.readLegacy(view)`. If it returns a winner, the adapter takes part, its entries are `toEntries(winner.record, winner.savedAt)`, and the legacy key is added to `owned`. The winner's `savedAt` is used as is (valid, or null), which differs from the existing rule that a date is kept only when the date key is in the file. The entries are written regardless of the device's record, so the backup replaces it.
*   If `readLegacy` returns null, the adapter does not take part: nothing is written for it, `toolsImported` does not change and the key goes to `keysSkipped`. A backup holding `[]` or garbage therefore never overwrites the device record with defaults.
*   `toEntries` writes only the new key, so import never writes a legacy key.
*   After `saveEntries` succeeds, import removes the `legacyKeys` of every adapter that took part, from the device's real storage and not from the read-only view. It does so even when the file had the new key. The file's legacy key (if any) is reported skipped, while the device's own legacy key is removed, because the new record now replaces it. That deletes any other profiles on the device. A failed removal is logged with `console.warn` and ignored, and the leftover key is inert.
*   `ImportResult` and the import summary do not change (Alternative O).

`FORMAT_VERSION` stays at 1. Exports contain the new flat record.

### Registry

`cpfOaAdapter` moves from `PROFILE_ADAPTERS` to `TOOL_ADAPTERS`. `REGISTERED_KEYS` does not include the legacy key, so export never emits it (see the export-gap row in Risks & Mitigations). `ManualSaveNotice` also does not know the legacy key (Alternative M).

### Routes and tools list

*   `src/app/tools/cpf-oa-annuity-calculator/[profileId]/` is deleted. That removes `/new` and every `/<id>`. No catch-all route, middleware, redirect or `generateStaticParams` entry intercepts these paths, so the default `src/app/not-found.tsx` applies.
*   `src/lib/tools.ts`: the home page groups tools by the `group` field and orders cards by array position within a group. The OA entry moves above `compound-interest` in the array, changes group to `"calculators"` and takes the new name and tagline.

### Page

`src/app/tools/cpf-oa-annuity-calculator/page.tsx` is rebuilt from the Compound Interest page shape and the body of the old `[profileId]/page.tsx`. State comes from `useToolDraft(cpfOaAdapter)`, with edits merged into `inputs`. Render order follows the Compound Interest page: `ManualSaveNotice`, the migration notice, the Back to Home link, the heading block (heading from `toolMeta(...).name`, a hard-coded tagline, `LastSaved`), the existing inputs, results and "How It Works" content, then the `SaveBar`. The tagline is hard-coded because `toolMeta` returns only `slug` and `name`, and it must match the `tools.ts` tagline (checked in the manual steps). The maths and the chart and table components are moved unchanged.

### Data flow

```text
First load, existing user (no new key, legacy key present)

  localStorage                adapter.read()               page
  cpf-oa:profiles  ───────►  legacyToMigrate: latest  ───► inputs filled, "Last saved" = winner's date
                             (no writes)                    notice: other scenarios not carried over
                                                            Save enabled (legacy.pending)
                                                                 │ Save
                                                                 ▼
                              saveEntries: write tool:cpf-oa-annuity-calculator
                              then removeItem(cpf-oa:profiles), warn on failure
                                                                 ▼
                                                            notice hidden

Import of a backup

  file has only cpf-oa:profiles ──► readLegacy(view) ──► winner?  yes ─► entries for new key (winner's date)
                                                              │                  then remove device legacy key
                                                              └─ no ──► skipped, nothing written
  file has new key (with or without legacy key) ──► normal path; legacy key skipped if present;
                                                    device legacy key removed after the save
```

## Risks & Mitigations

Security: none (local-only, no network, no data beyond the user's own numbers). Scalability: one record per device. The user count behind "likelihood" is the estimate in The Problem.

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| The new build ignores the legacy key (data not carried over) | Certain without this design | Saved numbers lost, and old backups import without OA data | `readLegacy` on the device and in import. |
| Rollback after a Save | Low (a deliberate rollback after users have saved) | The old build cannot read the new key and the legacy key is gone | Out of scope. Recovery: import a backup exported before the release. |
| The user never presses Save | Possible | The other profiles stay in storage and the notice shows on every visit | Intended. Nothing is lost until Save. |
| Save or import removes the other profiles | Certain for users with several profiles | Their inputs and names are lost | The notice says saving removes them. Import removes the device legacy key without a notice and without a confirmation. Accepted by the author. No download or backup copy (Non-Goal). |
| A wrong `savedAt` selects the wrong profile | Very low | A past date that is wrong, such as a stale or mistyped one, can lose to an older profile, and Save deletes the real latest. A future date is ignored (step 3) | Future dates count as invalid. Past dates are trusted. |
| Export before the first Save on the calculator | Low (export must fall between release and the first visit) | That backup has no OA data, although the device still holds the legacy key | Accepted by the author. The notice and enabled Save do not help a user who exports first. |
| A corrupt new key beside a valid legacy key | Very low | `read()` treats the new key as existing and shows defaults with no notice. The legacy key stays until the next Save or import | Accepted by the author. A later Save overwrites the corrupt key and removes the legacy key. |
| An old tab recreates the legacy key | Low | Legacy key beside the new key | Ignored on read. Removed at the next Save or import. |
| Two tabs open the calculator | Low | While the migration is pending, both show the notice. After one tab saves and edits, the other tab's Save overwrites those edits (the later Save wins, as for every tool) | Accepted. |
| Storage unavailable or full during Save | Low | Save fails (CUJ 6) | `saveEntries` restores written keys. The legacy key is removed only after success. |
| Removal of the legacy key fails after Save or import | Low | The legacy key stays | Logged with `console.warn`. Inert, and removed at the next Save or import. |
| Mistyped values in the legacy key or a backup | Low | Non-numbers could reach `simulate` | The winner goes through the base adapter's type check. Mistyped values take defaults. `validate` still guards the maths. |
| An unusable legacy key in a backup | Low | Could overwrite the device record with defaults | The adapter is skipped and the key is reported in `keysSkipped`. |

## Alternatives Considered

All alternatives were decided by the author. The decisions are recorded in the brief under Key Decisions ([cpf-oa-annuity-calculator.brief.md](./cpf-oa-annuity-calculator.brief.md)). Alternatives L and M were decided after [review round 2](./reviews/cpf-oa-annuity-calculator-round2/consolidated_review_report.md), and Alternative O after [review round 3](./reviews/cpf-oa-annuity-calculator-round3/consolidated_review_report.md). Each entry gives the trade-off behind the decision.

### Alternative A: Redirect old profile URLs to the calculator

*   **Pros**: Old bookmarks land on a useful page.
*   **Cons**: Needs redirect code for `/new` and every `<id>`, and hides that profiles no longer exist.
*   **Reason for Rejection**: The cost is redirect code for paths that no longer have a meaning. Without it an old bookmark gets the default 404, and the user returns via the home page.

### Alternative B: Keep profiles behind the calculator

*   **Pros**: No data migration. No profile is lost.
*   **Cons**: Keeps the list, create, delete and name-editor code and the 838-line profile page, and keeps the tool a profile manager inside the Calculators tab.
*   **Reason for Rejection**: It keeps the code and the profile concept that the change is meant to remove.

### Alternative C: Keep the old profile array under a backup key instead of deleting it

*   **Pros**: Nothing is lost.
*   **Cons**: The backup key is outside `REGISTERED_KEYS`, so export omits it, and no screen shows it. It would sit in storage permanently.
*   **Reason for Rejection**: Stored data that cannot be seen, exported or deleted.

### Alternative D: Start every user from default inputs, with no migration

*   **Pros**: Removes `readLegacy`, `legacyToMigrate`, `readLegacyOaState`, the `canSave` override and the notice. Removes the `saveTool` and import changes, and with them `types.ts`, `tool.ts`, `import.ts`, `memoryStorage.ts`, `tool.test.ts`, `import.test.ts`, `cpf-oa.test.ts` and most of `cpf-oa.ts` from the file list. The cost to users is re-entering four numbers, for the user estimate in The Problem.
*   **Cons**: Existing users lose their saved numbers on the first visit, and old backups import with the OA data dropped.
*   **Reason for Rejection**: The author prefers that the latest profile survives, and accepts the 15-file change for that (see The Problem). This is the cheapest option if the decision changes.

### Alternative E: Migrate inside `adapter.read()`

*   **Pros**: Precedent in `src/lib/persistence/adapters/cpf-sa.ts`, whose `readAll` calls `migrateLegacy`, which writes through `saveEntries`. It would remove `legacyToMigrate`, `readLegacyOaState`, the `canSave` override and the notice's separate read.
*   **Cons**: Visiting the page writes. `useToolDraft` documents that loading only reads, and `toolAdapters.test.ts` asserts zero writes on read. The notice count must be kept at migration time, since the legacy key is deleted. The import view throws on writes, so import needs its own path anyway.
*   **Reason for Rejection**: It breaks the "loading only reads" rule that the hook documents and the tests enforce for single-record tools. `cpf-sa.ts` already breaks it for profile tools; the author keeps the rule for this tool.

### Alternative F: Migrate once on mount with one `saveEntries`

*   **Pros**: A single write of the new key with the winner's `savedAt`, then removal of the legacy key. It would remove the `canSave` override and most of the notice state.
*   **Cons**: Visiting the page writes. Writing the new key and removing the legacy key are two calls, so a failed removal or an old tab still leaves both keys, as in the chosen design. A second tab can interleave. There is no codebase precedent (`cpf-sa.ts` migrates inside `read`, which is Alternative E). The notice count shows once, since the legacy key is gone afterwards.
*   **Reason for Rejection**: Same rule as E: a page view must not write.

### Alternative G: Normalise the backup before the import loop

*   **Pros**: A function `upgradeLegacyBackup(data)` would replace the legacy key with the flat new record and leave the import loop unchanged.
*   **Cons**: It must know the OA key names and the pick function, so import depends on `adapters/cpf-oa`. Removal of the device's legacy key still needs its own step.
*   **Reason for Rejection**: It moves OA-specific names into generic import code. The `readLegacy` method keeps them in the adapter.

### Alternative H: Export also emits legacy keys that still exist

*   **Pros**: Closes the export gap. Import already reads that shape.
*   **Cons**: Backups would contain a key that the new build never writes, and the key would keep appearing in exports until the user saves.
*   **Reason for Rejection**: It makes export emit a key format that no current build writes, to fix a gap that affects one tool for the users in The Problem's estimate.

### Alternative I: Export through each adapter's `read()`

*   **Pros**: The fallback winner is exported as the new record, with no legacy key in backups.
*   **Cons**: Export changes from copying raw keys to calling every adapter, and exported values are normalised.
*   **Reason for Rejection**: It changes export for every tool to fix a gap that affects one tool.

### Alternative J: Notice with a stored dismissal flag

*   **Pros**: The user can dismiss the notice.
*   **Cons**: The flag is a meta key outside `REGISTERED_KEYS` that backups do not carry. It has no effect after the first Save, because Save deletes the legacy key.
*   **Reason for Rejection**: It adds stored state for a notice that disappears at the first Save.

### Alternative K: Enable Save through the shared hook or a null date

*   **Pros**: A null `savedAt` in the fallback gives the `legacy` date state, so `canSave` is true with no page override. A `needsSave` field in `ToolRead` or the hook keeps the rule in one place.
*   **Cons**: A null date loses the winner's "Last saved" on the device. A `ToolRead` or hook change touches code that every tool uses.
*   **Reason for Rejection**: The author wants the winner's date shown, and prefers one page-level expression to a change in shared code.

### Alternative L: Remove a leftover legacy key on page load

*   **Pros**: Cleans up a legacy key beside the new key, or one holding `[]`, without waiting for a Save.
*   **Cons**: A leftover legacy key is inert, because `read()` ignores it once the new key exists and the next Save or import removes it. A mount effect adds a write on visit, an exception to "written only on Save", more tests and more risk rows. If the new key were corrupt, "the new key exists" would delete the only valid data.
*   **Reason for Rejection**: The added write and the data-loss hazard outweigh removing an inert key.

### Alternative M: Make `ManualSaveNotice` count the legacy key as data

*   **Pros**: A user whose only data is the legacy key sees the existing one-time manual-save notice.
*   **Cons**: Needs a `LEGACY_KEYS` export, a change to a shared component and a manual test, to show one notice once.
*   **Reason for Rejection**: A user with only a legacy key is treated as new and does not see that one notice.

### Alternative N: Notice with a download of the old profiles, or a picker

*   **Pros**: Lets the user recover the dropped profiles or choose which to keep.
*   **Cons**: Adds UI and a file path for data deleted at the first Save. A picker brings back the profile concept.
*   **Reason for Rejection**: The cost is new UI and an export path for the users in The Problem's estimate, and the notice already says what saving removes.

### Alternative O: A count of dropped profiles in the import summary

*   **Pros**: Tells a user restoring an old backup that only the latest profile was kept.
*   **Cons**: Needs a required `legacyDiscarded` field on `ImportResult` set on four return paths, a change to `DataPortability.tsx` (three edits) and more tests.
*   **Reason for Rejection**: Three more touchpoints in shared import code for one tool. Import takes the latest profile without a message.

### Alternative P: Read-only fallback with no notice and no Save override

*   **Pros**: Removes the notice, `legacy.pending`, `readLegacyOaState`, the `canSave` override and the page state. The page would pre-fill from the winner and the first edit plus Save would overwrite.
*   **Cons**: The user is not told that saving deletes the other profiles. A user who never edits keeps the legacy key and sees a "Last saved" date for a record that was never written.
*   **Reason for Rejection**: The author wants users told before Save deletes profiles.

## Detailed Implementation Plan

Before coding, read the Next.js guides `dynamic-routes.md` and `not-found.md` under `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/` (per `CLAUDE.md`). If `.next/types` exists locally, delete it before `npm run build`, so the removed route leaves no stale types. This is a local step; `.next` is gitignored.

### Phases

At the end of every phase, `npm test`, `npm run lint` and `npm run build` must pass.

1.  **Phase 1, additive persistence changes**: items 1 to 4. Nothing uses the new members yet, so the old pages are not affected.
2.  **Phase 2, switch the OA tool**: items 5 to 11.
    *   **Baseline step, before any Phase 2 code:** with the old build running, record the maths baseline (see Verification Plan).
    *   Items 5 to 9 form one atomic change, because `cpf-oa.ts` stops exporting profile members that the old pages and tests use.
    *   Copy the body of `[profileId]/page.tsx` into the new `page.tsx` (item 7) before deleting it (item 8).
    *   Items 10 and 11 add tests for the new adapter and land in the same phase, before its gate.
    *   Until Phase 4, the page heading still shows the old name, "CPF Ordinary Account (OA) Annuity", because it comes from `tools.ts`. Check the heading and tagline after Phase 4.
3.  **Phase 3, import**: items 12 and 13.
    *   Ship Phases 2 and 3 in the same release.
    *   Reason: between them the registry no longer owns the legacy key and `import.ts` (which iterates only `TOOL_ADAPTERS` and `PROFILE_ADAPTERS`) would skip an old backup as an unknown key.
4.  **Phase 4, tools list**: items 14 and 15.

### Files to Create/Modify/Delete

#### 1. `src/lib/persistence/types.ts` (Modify, Phase 1)

*   **Changes**: Add to `ToolAdapter` the optional `legacyKeys?: readonly string[]` and `readLegacy?(storage: StorageLike): (ToolRead<T> & { discarded: number }) | null`. Comment on `legacyKeys`: keys an older build wrote; read by import; removed after a successful Save or import; never written.
*   No change to `ProfileAdapter`, `ToolRead` or `SaveResult`.

#### 2. `src/lib/persistence/tool.ts` (Modify, Phase 1)

*   **Changes**: After `saveEntries` returns ok, call `storage.removeItem` for each key in `adapter.legacyKeys ?? []`, each in its own try/catch that calls `console.warn`. Return the original ok result regardless. Remove nothing if `saveEntries` fails.
*   Update the doc comment to say that after a successful save the adapter's legacy keys are removed.

#### 3. `src/lib/persistence/testing/memoryStorage.ts` (Modify, Phase 1)

*   **Changes**: Add `failOnRemove?: (call: number, key: string) => boolean` to `MemoryStorageOptions` and its comment. Mirror `failOnSet`: keep a separate 1-based `removeCalls` counter, and throw before `writes += 1`.
*   Rollback `removeItem` calls inside `saveEntries` count toward the counter. The tests below avoid this, because `failOnSet` fails the save before any legacy removal.

#### 4. `src/lib/persistence/tool.test.ts` (Modify, Phase 1)

*   **Changes**: Build a spread copy of `demoAdapter` with `legacyKeys: ["demo:legacy"]` and seed `demo:legacy` in storage. Cases:
    *   The legacy key is removed after a successful save.
    *   The legacy key is kept when `saveEntries` fails (`failOnSet`).
    *   With `failOnRemove: (call, key) => key === "demo:legacy"`, the save result is still ok and `console.warn` is called. Spy with `vi.spyOn(console, "warn").mockImplementation(() => {})` and restore it afterwards.

#### 5. `src/lib/persistence/adapters/cpf-oa.ts` (Rewrite, Phase 2)

*   **Changes**:
    *   Keep `CpfOaParams` and `CPF_OA_DEFAULT_PARAMS`. Remove `CpfOaProfile`, `listPath`, `newProfile` and `readAll`. Keep the stored legacy shape as an unexported type, `StoredLegacyProfile`.
    *   `const OA_LEGACY_KEY = "cpf-oa:profiles"`.
    *   `const base = createInputsAdapter({ slug: "cpf-oa-annuity-calculator", inputDefaults: () => ({ ...CPF_OA_DEFAULT_PARAMS }), lists: {} })`. Use `base.dateKey` where the new key is needed.
    *   `export const cpfOaAdapter: typeof base = { ...base, legacyKeys: [OA_LEGACY_KEY], readLegacy, read }`, behaving as in "Reading the legacy key" and "Read path and the pending-migration helper". `read` delegates to `base.read`, never to `cpfOaAdapter.read`, which would recurse.
    *   The normalisation rules are moved from `readAll`, not rewritten.
    *   Private `legacyToMigrate(storage)`, and exported `readLegacyOaState(storage)` built on it.
    *   Do not import `registry.ts` or `singleStateTools.ts`: the registry imports adapters, so an import in the other direction would form a cycle.

#### 6. `src/lib/persistence/registry.ts` (Modify, Phase 2)

*   **Changes**: Remove `cpfOaAdapter` from `PROFILE_ADAPTERS` and append it last in `TOOL_ADAPTERS`. No other change.

#### 7. `src/app/tools/cpf-oa-annuity-calculator/page.tsx` (Rewrite, Phase 2)

*   The existing content of this file (the profile list page) is replaced, not merged. Start from the body of `[profileId]/page.tsx`.
*   **Keep unchanged**: `YearRow`, `OA_RATE`, `MIN_START_AGE`, `fmt`, `simulate`, `solveMonthlyDrawdown`, `validate`, `FocusInput`, `StatCard`, `OaChart`, `YearlyTable`, the header icon badge, and the JSX for the parameters card, stat cards, error text, chart, table, input hints and "How It Works" with its disclaimer.
*   **Remove**: `useParams`, `useGuardedRouter`, `NEW_PROFILE_ID`, `useProfileDraft`, the `ProfileNameEditor` definition and its use, the not-found effect, the URL replacement after Save, the "All Scenarios" link, `const { name } = profile`, the `profile ?? ...` fallbacks and the `profile === null` branch. Remove `useEffect` from the React import, because its only use was the not-found effect.
*   **Imports**:
    *   Keep: `useState`, `useMemo`, `toolMeta`, `GuardedLink`, `LastSaved`, `ManualSaveNotice`, `SaveBar`, `SiteHeader`, `fmtAxis` and `niceMax` from `@/lib/utils`, `cpfOaAdapter` and `type CpfOaParams`.
    *   Add: `useToolDraft` from `@/hooks/useToolDraft`, and `readLegacyOaState` from `@/lib/persistence/adapters/cpf-oa`.
*   **State**:
    *   Read `birthYear`, `startDrawdownAge`, `balanceAtStart` and `endDrawdownAge` from `draft.draft.inputs`, as the Compound Interest page does with `const s = draft.draft.inputs`.
    *   `set` becomes `(changes: Partial<CpfOaParams>) => draft.setDraft((d) => ({ ...d, inputs: { ...d.inputs, ...changes } }))`.
    *   `legacy` state as in "Notice".
    *   A save handler calls `draft.save()` and, if ok, resets `legacy`.
    *   `SaveBar` gets `canSave={draft.canSave || legacy.pending}`.
*   **Layout**: add the Back to Home `GuardedLink` with `href="/"` (markup copied from the Compound Interest page). Declare every hook before the `status !== "ready"` early return, as that page does. Render order is as in "Page".
*   **Tagline**: the hard-coded string "Find the steady monthly payout your OA balance can fund between two ages." (also used in item 14).
*   **Notice card**: copy the card from `ManualSaveNotice`: a container with `rounded-xl p-4 text-sm`, `--surface-container-lowest` background and `--shadow-botanical`, and a paragraph with `--on-surface` colour and line-height 1.6. No button (so no flex layout) and no `role` attribute.
*   **Exports**: a named `CpfOaAnnuityCalculatorPage` function plus `export default CpfOaAnnuityCalculatorPage;`, as `compound-interest/page.tsx` does. Next requires only the default export.

#### 8. `src/app/tools/cpf-oa-annuity-calculator/[profileId]/page.tsx` (Delete, Phase 2)

*   **Changes**: Delete the file and folder after the Phase 2 baseline step and the copy in item 7. `/new` and `/<id>` then reach `src/app/not-found.tsx`.

#### 9. `src/lib/persistence/adapters/profileAdapters.test.ts` (Modify, Phase 2)

*   **Changes**: Remove the `cpfOaAdapter` import, its entry in the adapter table and the "cpf-oa legacy shape" block (this item only removes cases). Its `balanceAt55` case moves to item 10. Keep the existing `REGISTERED_KEYS` duplicate-key test.

#### 10. `src/lib/persistence/adapters/cpf-oa.test.ts` (Create, Phase 2)

*   **Changes**: Unit tests with `createMemoryStorage`, one expected outcome per test. Fixtures (legacy-array items; backups carry them as parsed JSON arrays, with `id` and `name` included):

| Fixture | id | name | birthYear | startDrawdownAge | balanceAtStart | endDrawdownAge | savedAt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | `p_a` | Plan A | 1980 | 55 | 100000 | 75 | `2026-01-01T00:00:00.000Z` |
| B | `p_b` | Plan B | 1982 | 60 | 200000 | 80 | `2026-03-01T00:00:00.000Z` |
| C | `p_c` | Plan C | 1984 | 65 | 300000 | 85 | none |
| C1 | `p_c1` | Plan C1 | 1986 | 56 | 110000 | 70 | none |
| C2 | `p_c2` | Plan C2 | 1988 | 57 | 120000 | 71 | none |
| F | `p_f` | Plan F | 1990 | 58 | 130000 | 72 | `2999-01-01T00:00:00.000Z` |
| L | `p_l` | Plan L | 1970 | (missing) | (missing; `balanceAt55` is 80000) | 70 | none |

*   **`readLegacy` winner selection**:
    *   `[A, B, C]` returns B's values.
    *   `[A, C]` returns A, because a missing date is oldest.
    *   `[C1, C2]` returns C2, the last item.
    *   Two profiles with the same `savedAt` return the last.
    *   `[A, F]` returns A, because the future date counts as invalid.
    *   A winner with `savedAt` `"garbage"` returns `savedAt: null`.
    *   A winner with a numeric `savedAt` returns `savedAt: null`.
*   **`readLegacy` normalisation and counts**:
    *   `[L]` gives start age 56 and `balanceAtStart` 80000.
    *   A string `birthYear` takes its default.
    *   `discarded` equals the usable count minus 1 (`[A, B, C]` gives 2).
    *   Non-object items among objects are skipped and not counted (`[A, null, 5]` gives `discarded` 0).
*   **`readLegacy` null cases**: invalid JSON, a non-array, `[]` and `[1, null]` return null.
*   **`read`**:
    *   The legacy fallback returns the winner's inputs, `savedAt` and `exists: true` with `storage.writes === 0`.
    *   The new key present ignores the legacy key.
    *   Neither key returns defaults.
    *   A corrupt new key beside a legacy key returns defaults and leaves the legacy key in place.
*   **`readLegacyOaState`**:
    *   `[A, B, C]` gives `{ pending: true, others: 2 }`.
    *   `[A]` gives `{ pending: true, others: 0 }`.
    *   The new key present gives `{ pending: false, others: 0 }`.
    *   No keys give `{ pending: false, others: 0 }`.

#### 11. `src/lib/persistence/adapters/toolAdapters.test.ts` (Modify, Phase 2)

*   **Changes**: Add `{ adapter: cpfOaAdapter as ToolAdapter<unknown>, data: { "tool:cpf-oa-annuity-calculator": '{"birthYear":1980,"startDrawdownAge":55,"balanceAtStart":1,"endDrawdownAge":70}' } }` to the `legacy` table, with the import. The table keeps its name, and `describe.each(legacy)` runs the same checks on every entry (empty-storage read, zero writes on read, round trip, save with a date). For OA the entry holds a new-format record.
*   Add a test that `REGISTERED_KEYS` contains the new key and does not contain `cpf-oa:profiles`.

#### 12. `src/lib/persistence/import.ts` (Modify, Phase 3)

*   **Changes**: As in "Import".
    *   Process an adapter if any `keys` or `legacyKeys` entry is in the file, guarding with `adapter.legacyKeys ?? []` and `adapter.readLegacy?.(view)`.
    *   For a legacy-only file call `readLegacy(view)`, use the winner's `savedAt` as is, and skip the adapter on null. Add a one-line comment that this differs from the "date only if the date key is in the file" rule.
    *   Add used legacy keys to `owned`.
    *   After a successful `saveEntries`, call `removeItem` on the real `storage` (not on `view`) for the `legacyKeys` of every adapter that took part, each in try/catch with `console.warn`.
    *   `ImportResult` is unchanged. Update the doc comment to mention the legacy path.

#### 13. `src/lib/persistence/import.test.ts` (Modify, Phase 3)

*   **Changes**: Cases, using fixtures A, B and C from item 10. Backup `data` holds parsed JSON values.
    *   `{ "cpf-oa:profiles": [A, B, C] }` writes the new key with B's values and B's `savedAt`, replaces an existing device record and removes the device legacy key.
    *   `{ "cpf-oa:profiles": [C] }` writes the new key with no date.
    *   A backup with both keys uses the new key and lists the legacy key in `keysSkipped`.
    *   A new-format backup onto a device with a legacy key writes the new key and removes the legacy key.
    *   A legacy key holding `[]`, `[1, null]` or the string `"not json"` leaves the device record untouched, writes nothing, leaves `toolsImported` unchanged and lists the key in `keysSkipped`.
    *   With `failOnSet: (call) => call === 1` the save fails and no legacy key is removed.
    *   With `failOnRemove: (_call, key) => key === "cpf-oa:profiles"` the import still returns ok and `console.warn` is called (spy as in item 4).

#### 14. `src/lib/tools.ts` (Modify, Phase 4)

*   **Changes**: Move the `cpf-oa-annuity-calculator` entry to the first position in the array, above `compound-interest`. Set `name` to "CPF Ordinary Account (OA) Annuity Calculator", `tagline` to the string in item 7, and `group` to `"calculators"`. Keep `slug`, `category` and `icon`.

#### 15. `src/lib/tools.test.ts` (Modify, Phase 4)

*   **Changes**:
    *   Change the expected OA name to "CPF Ordinary Account (OA) Annuity Calculator".
    *   Add: the tool is in the `calculators` group.
    *   Add: the first `calculators` tool has slug `cpf-oa-annuity-calculator`.
    *   Add: `existsSync(path.join(process.cwd(), "src/app/tools/cpf-oa-annuity-calculator/[profileId]"))` is false, using the `existsSync` and `path` imports already in this file.

### Verification Plan

*   **Build, tests, lint**: `npm run build`, `npm test` (vitest) and `npm run lint` at the end of every phase, as stated under Phases. The existing duplicate-key test in `profileAdapters.test.ts` still passes.
*   **Coverage checklist**: each case listed in items 4, 10, 11, 13 and 15 exists and passes. Item 9 only removes cases. The import summary and `ManualSaveNotice` are unchanged, so they have no new test. The page logic (`canSave || legacy.pending`, the reset after Save, the server guard) has no unit test; the manual steps below cover it.
*   **Maths comparison (manual, Phase 2 baseline step)**: in the old build, enter these input sets (birth year / start age / balance / end age): 1982 / 55 / 150000 / 75; 1990 / 60 / 50000 / 80; and a set that triggers a validation error, such as a start age of 54 (below `MIN_START_AGE`; the field may still accept typing it). For each, expand the yearly table and copy the displayed monthly payout, the table text and any error message into a scratch file outside the repository, for example `~/oa-baseline.txt`. After Phase 2, enter the same inputs in the new calculator. Every value must match exactly as displayed, including currency formatting and whitespace. This is a regression check, because item 7 keeps the maths unchanged.
*   **E2E/Integration (manual, `npm run dev`)**: each step is "Do X. Expected: Y." The seeded profiles are fixtures A, B and C from item 10.
    *   Do: seed `localStorage["cpf-oa:profiles"]` with `[A, B, C]` and open `/tools/cpf-oa-annuity-calculator`. Expected: the inputs are 1982 / 60 / 200000 / 80 (B), "Last saved" shows B's date, the notice says two scenarios are not carried over, and Save is enabled.
    *   Do: check the browser's Local Storage view. Expected: there is no `tool:cpf-oa-annuity-calculator`.
    *   Do: press Save. Expected: the notice disappears, `tool:cpf-oa-annuity-calculator` exists and `cpf-oa:profiles` is gone in the Local Storage view.
    *   Do: reload. Expected: the inputs are the same, and there is no notice.
    *   Do: hard-reload the page with the seed in place. Expected: the browser console shows no hydration warning.
    *   Do: seed a new-format record and a legacy key together and open the page. Expected: the legacy key is still there.
    *   Do: edit an input and press Save. Expected: the legacy key is gone.
    *   Do: import a backup that has only `cpf-oa:profiles` with `[A, B, C]`. Expected: the summary says "Imported 1 tool successfully." and the calculator shows B's values.
    *   Do: visit `/tools/cpf-oa-annuity-calculator/new` and `/tools/cpf-oa-annuity-calculator/p_123`. Expected: both show the 404 page.
    *   Do: open the home page Calculators tab. Expected: the OA calculator is first, the Tracking Tools tab does not list it, and the card tagline matches the page tagline.

--------------------------------------------------------------------------------

<!-- Provenance: Indicates initial structural drafting via EGM. -->

*Drafted with EGM*
