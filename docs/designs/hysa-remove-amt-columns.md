# Remove the Amt Columns from the HYSA Tracker

*   **Author:** Desmond Loh
*   **Status:** Draft
*   **Date:** 2026-11-08

--------------------------------------------------------------------------------

## Overview

The High Yield Savings Account (HYSA) Tracker lets a user log, month by month, the bonus interest a bank paid for four behaviours: crediting a salary, spending on a card, buying insurance and investing.

Each of the four categories (Salary, Card Spend, Insurance, Investment) has two columns in the monthly table. **Amt** (the Amount column) holds a dollar amount. **Interest** holds the bonus interest earned.

This design removes the four Amt fields (`salaryAmount`, `cardSpendAmount`, `insureAmount`, `investAmount`). Each category keeps its Interest column, and the table goes from 11 columns to 7: Month, four Interest columns, Investment P&L and Net Gain. Saved and imported scenarios that still carry Amt values lose them when they are read.

## The Problem

The Amt values feed no calculation. Total Interest is the sum of the four Interest fields, and Net Gain is Total Interest plus Investment P&L. Amt is only displayed and added up in the year and grand total rows. The author does not use the amounts.

Removing Amt takes the table from 11 to 7 columns and removes a help-text explanation. The fix is to delete the fields from the type, the new-month defaults, the table, the totals and the help text.

Scenarios are saved in the browser's localStorage, and backup files can be imported, so older data still contains the four keys. The design removes those keys with one small function in `readAll`, so they are not shown, summed or saved again.

## Goals

*   No Amt field exists in the `HysaMonthEntry` type, in the `addMonth` defaults, in the monthly table, in the year and grand totals, or in the help text.
*   The table has 7 columns, with one header row. Each category column is labelled with its category, for example "Salary Interest".
*   A scenario saved or imported before this change loads without the four Amt keys and without errors. The draft and the snapshot come from the same `readAll` result, so it is not marked as having unsaved changes.
*   Once a scenario has been saved, or a scenario list has been written by a save, delete or import, the stored data holds no Amt keys.
*   Total Interest, Net Gain and Investment P&L are the same as before for any scenario, old or new, because the strip changes no other value.
*   The help text describes only the Interest columns.

## Non-Goals

*   Any change to how interest, Investment P&L or Net Gain are computed.
*   A new localStorage key, a schema version, or a general migration framework.
*   Rewriting localStorage when data is loaded. Storage is cleaned only by a save, delete or import.
*   Validating or repairing stored data in general. The strip deletes four known keys and changes nothing else.
*   Changing the export. `exportData()` reads raw localStorage, so an export taken before a legacy scenario is next saved still contains the Amt keys. Importing that file removes them.
*   A backup prompt, a one-time notice or telemetry when old values are dropped.
*   A hidden or optional input for qualifying amounts.
*   Merging the two near-identical `reduce` blocks that compute the year and grand totals. They are edited in place.
*   A mobile-specific redesign of the table beyond what the narrower column set requires.
*   Changes to the "Amount" fields of other tools in the repo.

The risks that follow from these choices are in Risks & Mitigations.

## Open Questions

None.

## Critical User Journeys (CUJs)

### CUJ 1: Open an existing scenario saved before this change

*   **Given**: localStorage holds a HYSA scenario whose entries contain the four Amt keys.
*   **When**: The user opens the scenario page.
*   **Then**: The table shows 7 columns with correct year and grand totals. The draft and the snapshot come from the same `readAll` result, so the save bar shows no unsaved changes. Storage is unchanged until the user saves.

### CUJ 2: Save after editing

*   **Given**: The user opened a legacy scenario and edited one Interest cell.
*   **When**: The user saves.
*   **Then**: The stored scenario has no Amt keys. Other legacy scenarios are also written back without Amt keys, because `saveProfile` reads the full list through `readAll`, replaces or appends the saved scenario by id, and writes the whole list back.

### CUJ 3: Import an old backup

*   **Given**: A backup file exported before this change, with Amt keys in its HYSA scenarios.
*   **When**: The user imports it.
*   **Then**: `importBackup` reads the incoming scenarios through `readAll` and writes the result. The imported scenarios have no Amt keys and keep the same Interest and P&L values.

## Technical Plan (Architecture)

The change has two parts: one small function in the data layer that removes the old keys, and the removal of the Amt columns from the scenario page.

### Data layer: `stripLegacyAmounts`

`readAll` in `hysa-tracker.ts` is a bare `JSON.parse(...) as HysaScenario[]`. Every read goes through it: the scenario page (`useProfileDraft`), the list page (`useProfileList`), `saveProfile`, `deleteProfile` and `importBackup` (`import.ts:53`). Putting the strip there covers storage loads, saves and imports with one change, with no change to `import.ts` or `profiles.ts`. Other adapters already transform data inside `readAll`; `cpf-sa.ts:61` is an example.

A new exported pure function in `hysa-tracker.ts`, `stripLegacyAmounts(scenario)`:

*   For a scenario that is an object with an array `entries`, it returns a copy whose entries are copies without `salaryAmount`, `cardSpendAmount`, `insureAmount` and `investAmount`.
*   Every other key is kept, including unknown ones.
*   An entry that is not an object, a scenario whose `entries` is not an array, and a root value that is not an array pass through unchanged.
*   It never throws, never drops a record and never changes a value.

`readAll` keeps its `try/catch` and returns `[]` on a parse failure, as today. For a parsed array it maps each scenario through `stripLegacyAmounts`.

```text
localStorage / backup file
        |
   readAll(storage) --stripLegacyAmounts--> HysaScenario (no Amt keys)
        |
        +--> useProfileDraft   (scenario page: draft and snapshot are one result)
        +--> useProfileList    (list page)
        +--> saveProfile / deleteProfile  (read the full list, change it, write it back)
        +--> importBackup      (read incoming scenarios, write the result)
```

Loading never writes. The stored Amt keys are removed from every scenario by the first write that goes through `saveProfile`, an import, or a `deleteProfile` that finds its id. `deleteProfile` writes nothing when the id is missing.

### Type and defaults

`HysaMonthEntry` loses `salaryAmount`, `cardSpendAmount`, `insureAmount` and `investAmount`. `addMonth` stops setting them. `updateEntry` is unchanged. Its spread (`...e`) keeps whatever keys an entry has, which is why the strip happens on read: an entry that was read already has no Amt keys.

### Scenario page

*   **Totals:** The `totals` object and the `SubtotalRow` `yt` object lose the four Amt sums.
*   **Table:** The second header row (Amt/Interest) is removed. Each category becomes one header cell labelled "<Category> Interest", keeping its `CAT_COLORS` tint. `CAT_COLORS` is the per-category colour map. Each body row loses four Amt cells. Year-total and grand-total rows lose the matching cells.
*   **Dividers and width:** The `borderLeft` dividers sat on the Amt cells, so they move onto the Interest cells to keep the categories separated. The table is narrower, so `minWidth` is lowered. The Month column stays sticky.
*   **Help text:** The subtitle and the "How It Works" items stop mentioning amounts. The Interest item explains what each Interest column holds, since the Amt columns no longer give that context.

## Risks & Mitigations

| Risk | Impact | Mitigation or acceptance |
| --- | --- | --- |
| Amt values are removed from every stored scenario by the first save, import or delete | Permanent loss of the amounts the user logged | Accepted by the author. A user who wants a copy exports before upgrading. |
| An older app build reads data saved by the new build | The old build sums Amt fields that are `undefined`, so its Amt totals show `NaN` (reasoned from the code, not reproduced) | Accepted. The pull request notes it and suggests exporting a backup first. |
| An export taken before a legacy scenario is next saved still contains the Amt keys | The file carries unused data | Accepted. Importing it removes the keys. |
| An old browser tab saves after the new build has stripped the keys | The Amt keys reappear in storage | The next read through `readAll` removes them again. |
| Corrupt stored text | The list reads as empty | Unchanged from today. The strip adds no new way to drop a record. |
| A zero Interest cell cannot be told apart from a month not yet entered, because Amt no longer shows whether a bonus condition was met | The user loses the "did I qualify" record | Accepted by the author, who does not use the amounts. |

## Alternatives Considered

The author made the final choice among these. The chosen design is Alternative A plus a strip of the stored keys.

### Alternative A: Delete the fields, no strip on load

*   **Pros**: Fewest changed lines. Leftover Amt keys in storage are harmless because nothing reads them.
*   **Cons**: Old keys stay in storage and in exports, and `updateEntry`'s spread keeps re-saving them for any entry that has them.
*   **Reason for Rejection**: The stored keys would never be cleaned, which leaves the removed fields in the data.

### Alternative B: Hide the columns but keep the data

*   **Pros**: Smallest change, and fully reversible.
*   **Cons**: The fields stay in the type, the totals code and exports, so the confusion moves from the screen into the code.
*   **Reason for Rejection**: It does not remove the fields.

### Alternative C: Versioned storage key (`hysa-tracker:scenarios:v2`), old key left untouched

*   **Pros**: A rolled-back app keeps working on its own data.
*   **Cons**: Two copies of the data can drift apart, import and export must know both keys, and it protects only rollback, which is a non-goal.
*   **Reason for Rejection**: It adds more machinery than a field removal needs.

### Alternative D: Keep qualifying amounts in a collapsed optional panel, or a per-category "met bonus" flag

*   **Pros**: Keeps the information for users who want to check whether a bonus condition was met, and lets a missed month be told apart from an empty one.
*   **Cons**: Keeps the fields and adds a toggle and extra state. A yes/no flag loses the amount and repeats what a non-zero Interest already shows.
*   **Reason for Rejection**: The author does not use the amounts, so the added state has no user.

### Alternative E: Restructure the table in the same change

*   **Pros**: One pass of layout changes instead of two.
*   **Cons**: Mixes a field removal with a redesign, so a regression is harder to trace to its cause.
*   **Reason for Rejection**: Layout work is limited to what removing the columns forces.

### Alternative F: Whitelist normalizer that rebuilds every entry and scenario

*   **Pros**: Never copies unknown keys, and can repair malformed data.
*   **Cons**: Deletes malformed records on the next save, because writes rewrite the whole list. It duplicates the entry type, so a field added later and left out of the whitelist is silently lost. It needs rules for every malformed case.
*   **Reason for Rejection**: It does more than the task needs and can destroy data the old code kept.

### Alternative G: Strip only on the write paths

*   **Pros**: Reads stay untouched.
*   **Cons**: Reads would still hand the page entries with Amt keys, and `updateEntry` would copy them into the draft.
*   **Reason for Rejection**: The old keys would still reach the page.

### Alternative H: Keep the Amt fields as deprecated optional fields for one release

*   **Pros**: Old and new builds both read the data.
*   **Cons**: The type and code keep mentioning the fields.
*   **Reason for Rejection**: It keeps the references the change is meant to remove, and rollback protection is a non-goal.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

This is one atomic change with no intermediate commits, because the type change and the page change cannot build apart. Checkpoint: `npx tsc --noEmit && npx vitest run && npm run lint && npm run build` all pass. No file is created or deleted.

### Target Files to Create/Modify

#### 1. `src/lib/persistence/adapters/hysa-tracker.ts` (Modify)

*   **Type / Scope**: TypeScript module, persistence adapter.
*   **Proposed Changes**:
    *   Remove `salaryAmount`, `cardSpendAmount`, `insureAmount` and `investAmount` (and their comments) from `HysaMonthEntry`.
    *   Remove the four zero defaults from the entry that `addMonth` appends.
    *   Add exported `stripLegacyAmounts(scenario: unknown): unknown` as described in the Technical Plan. Destructure the four keys out of each object entry and keep the rest. Do not use `delete`. Do not use `any`.
    *   Change `readAll` so the `try` block parses the text and, for a parsed array, returns each scenario mapped through `stripLegacyAmounts`, cast to `HysaScenario`. A parsed value that is not an array is returned as before. The `catch` still returns `[]`.
    *   Leave `newProfile`, `updateEntry` and `removeLastMonth` as they are.

#### 2. `src/app/tools/hysa-tracker/[scenarioId]/page.tsx` (Modify)

*   **Type / Scope**: Client component, the scenario page and its table. Anchor each edit to the named symbol, not to a line number.
*   **Proposed Changes**:
    *   `totals` and the `yt` object in `SubtotalRow`: remove the four Amt sums.
    *   `groupTh` (the group header helper): keep it, set its `colSpan` to 1, label it "<Category> Interest", keep the `CAT_COLORS` tint and right-align it to match the numeric cells below.
    *   `<thead>`: remove the second header row (Amt/Interest). Remove the `rowSpan={2}` props on Month, Investment P&L and Net Gain.
    *   Body rows: delete the four Amt `EditableCell` and `<td>` pairs. Keep the Interest cells and their `step`.
    *   `SubtotalRow` and the grand-total row: delete the Amt cells.
    *   Dividers: put the `borderLeft` on each category's Interest cell. Use `var(--divider-subtle)` in body and subtotal rows and `rgba(255,255,255,0.15)` in the grand-total row.
    *   Width: set `minWidth` to `600px` (920px was sized for 11 columns). Verify that cell content is not clipped at 375px width and that the table scrolls horizontally.
    *   Subtitle: "Click any cell to edit. Each category has an Interest column. Net Gain is computed."
    *   "How It Works": remove the "Amount columns" item. The Interest item reads "Enter the bonus interest the bank credited for each category in that month, as shown on your statement." The Investment P&L item adds "Investment P&L is separate from the Investment Interest column."
    *   No helper becomes unused. `fmtCompact` stays (used by `EditableCell`), `dash` stays (used for the Investment P&L totals), and `EditableCell` stays. Run lint to confirm.

#### 3. `src/lib/persistence/adapters/profileAdapters.test.ts` (Modify)

*   **Type / Scope**: Unit tests.
*   **Proposed Changes**:
    *   In the test "removes the last month and updates one entry without mutating the input", replace `salaryAmount` with `salaryInterest`.
    *   Add a test: `readAll` on a stored scenario whose entry has the four Amt keys plus `salaryInterest: 10`, `investmentPL: 5` and an unknown key `extra: 1`. Expect none of the four Amt keys, the other three kept, and zero writes recorded by `createMemoryStorage`.
    *   Add a test: `readAll` on a scenario with `entries: "x"`, a scenario with a `null` entry, and a scenario with an entry that has no Amt keys. Expect all three returned unchanged and no throw.
    *   Add a test: calling `readAll` twice on the same storage returns equal values.
    *   Add a test: `saveProfile(storage, hysaAdapter, scenario, now, "existing")` on storage holding two legacy scenarios. Parse the stored text and expect that neither scenario has any of the four keys.
    *   Add a test: `addMonth` appends an entry whose keys are `year`, `month`, the four Interest keys and `investmentPL`.

#### 4. `src/lib/persistence/import.test.ts` (Modify)

*   **Type / Scope**: Unit test.
*   **Proposed Changes**: Add a case that imports a backup whose `hysa-tracker:scenarios` holds a non-empty entry with the four Amt keys. After `importBackup`, `JSON.parse` the stored value and expect `Object.keys(entry)` to contain none of the four, with the Interest and `investmentPL` values unchanged. The existing `entries: []` fixture stays.

#### Files checked and not changed

*   `src/lib/persistence/import.ts` and `src/lib/persistence/profiles.ts`: both already go through `readAll`.
*   `src/hooks/useProfileList.ts` and `src/app/tools/hysa-tracker/page.tsx`: the list page reads through `readAll`, so it receives stripped data. It does not reference the Amt fields.
*   `src/lib/persistence/registry.ts`: no reference to the Amt fields.
*   `src/components/DataPortability.tsx`: export is deliberately unchanged.
*   `README.md`, `docs/` and `src/lib/tools.ts`: `grep -rniE "amt|amount" README.md docs src/lib/tools.ts` finds no HYSA Amt description to update.

### Verification Plan

*   **Compilation/Build**: `npx tsc --noEmit`, then `npm run build`. `tsc` flags any remaining read of a removed field.
*   **Unit Tests**: `npx vitest run`, including the new cases in `profileAdapters.test.ts` and `import.test.ts`. `stripLegacyAmounts` is tested for an object entry, a non-object entry, a scenario without an array `entries`, and an unknown key. No coverage tool is configured, so no coverage percentage is required.
*   **Static Analysis & Linting**: `npm run lint`. No unused imports or helpers should remain.
*   **Grep**: `grep -rnE "salaryAmount|cardSpendAmount|insureAmount|investAmount" src` returns hits only in `hysa-tracker.ts` (`stripLegacyAmounts`) and in test files. Only `src` is searched. The scenario page shows no "Amt" or "Amount" text.
*   **Manual / E2E** (numbered):
    1.  Seed localStorage with an old-shape scenario (Amt keys present) and open it.
    2.  Confirm 7 columns, with each header over its own cells.
    3.  Confirm the year and grand totals equal the sums of the visible rows.
    4.  Confirm the save bar shows no unsaved changes.
    5.  Confirm localStorage is unchanged until you save.
    6.  Edit a cell and save, then confirm the stored JSON has no Amt keys for any scenario.
    7.  Export, clear storage, re-import, and re-check steps 2-3.
    8.  At 375px width, confirm cell content is not clipped, the table scrolls horizontally and the Month column stays fixed on the left.

--------------------------------------------------------------------------------

<!-- Provenance: Indicates initial structural drafting via EGM. -->

*Drafted with EGM*
