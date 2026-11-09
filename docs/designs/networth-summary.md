# Networth Summary

*   **Author:** Des with Agents
*   **Status:** Draft
*   **Date:** 2026-11-09

--------------------------------------------------------------------------------

## Overview

Networth Summary is a new tool in the Tracking tab, placed first. It gives a one-page view of what the user is worth: the rough balance of each wealth platform they use, grouped into four asset sections (CPF, SRS, Cash Savings, Cash Investments) plus a Debt section.

The user types each record by hand: Name, Platform, estimated amount, currency (SGD, USD or AUD) and the date it was last updated. The user also types the USD to SGD and AUD to SGD rates. Every figure on the page is shown in SGD, and the page says plainly that the rates are the user's own.

Each asset section has a subtotal and a user-set SGD target. A small SVG chart shows current against target for the four asset sections. Debt has a subtotal only. The headline figure is total assets minus debt.

## The Problem

The user's money sits in many places: CPF, SRS, bank accounts, brokers and in three currencies. The existing tools each cover one slice (CPF accounts, SRS, high-yield savings) in detail. None of them answers the quick question "roughly what am I worth, and how far am I from my targets?" Today that answer means opening several tools or accounts and adding the numbers up.

The proposed tool is a deliberately rough, manual summary. It does not replace the detailed tools and does not read from them. It is for a glance, with occasional updates. It does not hide uncertainty: if a USD or AUD rate has not been typed in, the page says the headline is incomplete instead of showing a wrong number.

## Goals

*   Show net worth (total assets minus debt, in SGD) as the first figure on the page.
*   Provide four fixed asset sections and one Debt section, each holding manual records with Name, Platform, Est. Amount, Currency (SGD, USD, AUD; SGD by default) and Last Updated (a manual date).
*   Convert USD and AUD records to SGD using rates the user types, and show the rates in use with a clear note that they are manual.
*   Show an SGD subtotal for every section, and an SGD target for each of the four asset sections.
*   Show current against target for the four asset sections in a small inline SVG chart. A bar over target visibly extends past the target marker, and the label states the percent of target so colour is not the only signal.
*   Never leave a missing exchange rate unmarked. A record whose currency has no rate is left out of the totals, and the page shows a visible notice naming it and marks the headline incomplete. Saved data that cannot be read is repaired without a notice (see Reading and checking saved data).
*   Save, export and import like the other tools, using the existing persistence layer and no new storage scheme.
*   Work on small screens first. Sections are always expanded, with no collapse control.

## Non-Goals

*   No table view. Records are a simple form-row list (cards on small screens).
*   No history or snapshots over time. Amounts are stored in their own currency, which leaves room for this later.
*   No stale-record flags and no rate "as of" date. Last Updated is a plain date and no logic reads it. Keeping rates current is the user's job.
*   No pulling balances from the CPF, SRS or HYSA tools. A line on the page says figures are typed here separately and may differ from those tools.
*   No live exchange rates. No public Google exchange-rate API was found, and scraping a Google page is fragile and against its terms of service.
*   No user-defined sections and no currencies beyond SGD, USD and AUD.
*   No target and no chart bar for Debt.
*   No chart library and no new dependency.

## Open Questions

None. Decided: a record whose currency has no rate is left out of the totals and named, and the headline is marked incomplete. SGD is the default currency of a new record, and a missing or unknown stored currency becomes SGD.

## Technical Plan (Architecture)

The tool is one client page, one pure calculation module and one persistence adapter. It follows the adapter interface used by the SRS and dividend tools (`src/lib/persistence/adapters/srs-calculator.ts`, `dividend-calculator.ts`) but stores one nested object, which is a new storage shape. It adds no dependency.

```text
 localStorage                 adapter                     page (client)
 ------------                 -------                     -------------
 tool:networth-summary  --->  read(): check every   --->  useToolDraft(adapter)
   { usdSgd, audSgd,          field, repair or drop        draft state
     targets{4},              bad values silently           |
     records[],                                             v
     savedAt }                                           networth.ts (pure)
        ^                                                convert -> subtotals
        |                                                -> net worth -> chart rows
   toEntries(): one entry                                    |
        ^                                                    v
        +------------------ Save (SaveBar) <------  Headline, Rates panel,
                                                     Chart, 5 SectionCards
```

### Terms and existing files

*   `useToolDraft` (`src/hooks/useToolDraft.ts`): holds the unsaved draft, the saved snapshot and Save.
*   `ToolAdapter` and `ToolRead` (`src/lib/persistence/types.ts`): the interface every tool's adapter implements, and the `{ record, savedAt, exists }` value its `read()` returns.
*   `toolMeta` (`src/lib/persistence/toolMeta.ts`): looks a tool up in `tools.ts` and throws if the slug is missing.
*   `saveTool` and `sameData` (`src/lib/persistence/tool.ts`, `equality.ts`): the one write path, and the draft-versus-saved comparison used for the "Unsaved changes" state.
*   `genId` and `niceMax` (`src/lib/utils.ts`): id generation, and the chart axis rounding that returns 1000 for a value of 0.
*   `SaveBar`, `LastSaved`, `ManualSaveNotice`, `GuardedLink`, `SiteHeader` (`src/components/`): page chrome shared by the tool pages.
*   `createMemoryStorage` (`src/lib/persistence/testing/memoryStorage.ts`): in-memory storage for tests.
*   Date key: the stored key whose object carries `savedAt`.
*   CPF is the Central Provident Fund, SRS the Supplementary Retirement Scheme, HYSA a high-yield savings account. Platform is the bank or broker holding the money.

### Data model and storage

The tool uses a single nested object under one key. The SRS and dividend adapters use two keys each, so this is a new storage shape on the same adapter interface.

*   **Key:** `tool:networth-summary`. It holds one JSON object that also carries the save timestamp (`savedAt`), so it is the date key. This key becomes part of the backup format, so the names below are fixed once shipped.
*   **Shape of the stored object:**
    *   `usdSgd`: a number above 0 and at most 1,000, or `null` when blank.
    *   `audSgd`: same.
    *   `targets`: `{ cpf, srs, cashSavings, cashInvestments }`, each a number from 0 to 10,000,000,000. 0 means "no target set".
    *   `records`: array of `{ id, section, name, platform, amount, currency, lastUpdated }`.
    *   `savedAt`: ISO string, written only by Save.
*   **Record fields:** `section` is one of `cpf`, `srs`, `cashSavings`, `cashInvestments`, `debt`. `amount` is a number from 0 to 10,000,000,000 in the record's own currency. `currency` is `SGD`, `USD` or `AUD`. `lastUpdated` is a `YYYY-MM-DD` string that the user types; it may be empty. Debt amounts are entered as positive numbers and subtracted once.
*   **Defaults:** both rates `null`, all targets 0, no records. There are no demo rows. The empty state shows a short prompt in each section.
*   **Currency stays per record.** Amounts are never stored pre-converted, so changing a rate updates every figure.

### Reading and checking saved data

The base helper does not check list items, so this adapter checks everything itself in `read()`. It never writes.

*   A missing key (`null`) gives defaults with `exists` false. A present value that is not valid JSON or not an object gives defaults with `exists` true, so the page treats it as saved data with no date.
*   A rate that is not a finite number above 0 and at most 1,000 becomes `null`. A target that is not a finite number from 0 to 10,000,000,000 becomes 0.
*   `records` not an array: treated as empty.
*   Each record: a non-object, or one with an unknown `section`, is dropped. A missing or non-string `id` is regenerated. An `amount` that is not a finite number from 0 to 10,000,000,000 becomes 0. A missing or unknown `currency` becomes SGD. A `lastUpdated` that is not a valid `YYYY-MM-DD` becomes an empty string. `name` and `platform` become strings.
*   A `lastUpdated` must also be a real calendar date, so `2026-02-30` becomes an empty string. A numeric string is not accepted: an `amount` given as text becomes 0 and a rate given as text becomes `null`. A `targets` value that is not an object makes all four targets 0, and a missing target is 0. If two records share an id, the later one gets a new id.
*   Repairs are silent, decided by the author. The page shows no notice when a record is dropped or a value is repaired, and `read()` returns the standard `ToolRead` shape with no extra count. The cost: a dropped record is gone for good after the next Save, and a bad amount becomes 0 without a sign. The missing-rate notice is the only data-quality notice on the page.
*   Import goes through the same `read()`, because the import code reads each adapter through an overlay view. A hand-edited backup is therefore repaired the same way as local data.

### Calculations (`src/lib/networth.ts`, pure)

*   One constant list of sections (key, label, one-line helper text, whether it is an asset) and one list of currencies drive labels, targets, subtotals and the dropdown.
*   **Conversion:** SGD amount = amount when the currency is SGD, amount times the rate for USD or AUD, or "no rate" when that rate is `null`. Each record is converted and rounded once to whole cents with `Math.round(amount * rate * 100)`. A result above 10,000,000,000,000 cents (SGD 100 billion), or one that is not finite, is also handled like a blank rate. With the maxima above, this keeps every sum below 2^53 for up to about 900 records. All sums add those cent values as integers, so a section subtotal and the headline always agree.
*   **Subtotal per section:** the sum of converted records, plus the list of records left out because their rate is blank.
*   **Headline:** total assets (four asset subtotals) minus the Debt subtotal. It is marked incomplete when any record was left out, including a Debt record, which would otherwise make net worth look higher than it is. Left-out records are named. A negative result shows a minus sign and distinct styling.
*   **Percent of target:** subtotal divided by target, or "not set" when the target rounds to 0 cents.
*   **Chart rows:** for each asset section, the subtotal, target and percent. One shared axis maximum is `niceMax(1.15 * largest)` in dollars, where `largest` is the largest of the four asset subtotals and four targets (Debt is not charted). `niceMax` rounds up to 1, 1.5, 2, 2.5, 3, 4, 5, 7.5 or 10 times a power of ten, so the headroom is at least 15% and at most about 72%. A row with a target of 0 is drawn as described under Chart.
*   **Local date helper:** returns today's date in the user's time zone for new records. The existing `todayISO()` is UTC and is a day off in Singapore before 8am.

### Chart

A hand-written inline SVG in the style of the HYSA and SRS pages, using theme colour variables.

*   One horizontal bar per asset section, all on the shared scale.
*   A vertical marker line at each section's target. The part of a bar beyond its target is drawn in a different fill, with a pattern or outline so it still reads without colour.
*   Each row has a text label: subtotal, target and percent of target ("120% of target"). A row with a target of 0 shows its subtotal and "Set a target" and no bar, even when the subtotal is above 0, because there is nothing to compare it against. A row whose section has a left-out record shows an asterisk after its percent, and the chart description says the figure is incomplete.
*   The SVG has a `viewBox` so it scales to small screens, `role="img"` and a text description listing each section's subtotal, target and percent.
*   Debt does not appear in the chart.

### Page layout and components

One column on a phone, which is the design size. From the `lg` breakpoint the page is a two-column grid: the headline on the left and the exchange rates on the right, the chart across both columns, and the section cards in two columns below it (CPF and SRS, then Cash Savings and Cash Investments, then Debt on the left). The order of items is the same in both layouts:

1.  Site header, the manual-save notice, a "Back to Home" link, and the page header (an icon tile, the title "Networth Summary", the tagline, and the last-saved date beneath it).
2.  Headline: Net worth, with total assets and total debt as smaller figures, and an "incomplete" notice that names the records left out.
3.  Rates panel: "1 USD = [ ] SGD" and "1 AUD = [ ] SGD", with a note that rates are entered by the user and that SGD is the base. Each field accepts at least 4 decimals and commits only values above 0.
4.  The chart.
5.  CPF, SRS, Cash Savings and Cash Investments sections, then Debt last. All are always expanded, with no collapse control.
6.  One line saying figures here are typed separately and may differ from the CPF, SRS and HYSA tools.
7.  SaveBar. Export and import are on the home page, not on tool pages.

Components: one `SectionCard` serves all five sections (title, helper text, subtotal, target field for asset sections, record rows, add button). A record row has Name, Platform (free text with suggestions from platforms already entered), Est. Amount, a native currency select, and a date input. Rows are always cards: one field per line on a phone, and two fields per line from the `sm` breakpoint, which fits a half-width column. They are a form-row list, not a table. The page shows nothing until the client has loaded, as other tools do, so the server render and first client render match.

### Registration

*   `tools.ts`: new entry `networth-summary`, group `tracking`, category `Planning`, icon `Wallet` (already in the hand-copied icon map), placed before `cpf-sa-calculator`, which makes it first in the Tracking tab. The name "Networth Summary" contains no "Calculator".
*   `registry.ts`: the adapter is added to `TOOL_ADAPTERS`. If this step is missed, export and import silently ignore the tool.
*   No `[id]` route: there is one record set, not profiles.

### Testing approach

*   Pure tests for `networth.ts`: conversion, rounding, a blank rate, a zero target, an overshoot, a negative headline, debt subtraction and the chart scale.
*   Adapter tests: empty storage, round trip, each repair rule, dropped rows (absent from the record), import of a damaged backup, and that `savedAt` never appears in the record.
*   A `tools.test.ts` check that `networth-summary` is the first Tracking tool.

## Risks and Mitigations

*   **Silent repair drops data.** A record with an unknown section is dropped on read, and the next Save writes the smaller list permanently. A bad amount becomes 0 with no sign. Accepted by the author. Recovery depends on the user having exported a backup beforehand. The page does not prompt for one, and the backup file itself is not changed by an import.
*   **Whole-key rewrite.** Every Save rewrites the single key. Acceptable at this data size.
*   **No schema version.** Stored names are fixed once shipped. A version field is added only when the shape has to change.
*   **Storage quota.** A few hundred records are far below the localStorage limit. No record limit is enforced.
*   **Overflow.** Amounts and targets are limited to 10,000,000,000 and rates to 1,000, both in the inputs and when reading stored data. `toSgdCents` returns `null` for a result above SGD 100 billion or one that is not finite, so the record is left out and named, and integer-cent sums stay exact.
*   **Plain-text data.** Balances are stored and exported unencrypted, like every other tool.
*   **Missed registration.** If the adapter is not in `TOOL_ADAPTERS`, export and import ignore the tool without an error. The registration test covers it.

## Alternatives Considered

### Alternative A: One record list with a `section` field, plus flat inputs

Two keys: `tool:networth-summary` holds the rates, targets and `savedAt`, and a second key holds one array of records, each with a `section` field. The adapter wraps `createInputsAdapter` with a per-record check.

*   **Pros**: Reuses the shared helper. Debt uses the same record type as the assets.
*   **Cons**: Two keys that must be kept in step. Import restores all keys in one save, so partial restore is limited to a backup file that omits some keys. The helper does not check list items, so a wrapper is still needed.
*   **Reason for Rejection**: Rejected by author: one key makes a read, a write and an import a single atomic operation with no way for the rates and the records to disagree, which outweighs reusing the helper.

### Alternative B: Five record lists, one per section

Five array keys, one per section, plus the flat inputs key, using the helper's list support directly.

*   **Pros**: Matches the helper's list pattern. No `section` field.
*   **Cons**: Six keys in the backup. A backup file that omits some keys restores some sections and not others. The helper does not check list items, so all five lists need the same check.
*   **Reason for Rejection**: Rejected by author: more keys and more partial-restore cases than one key. Per-section keys would allow per-section dirty tracking, but the page tracks one draft, so that gain is not used.

### Alternative C: Per-bar chart scale

Each bar's axis tops out at the larger of its own current value and target.

*   **Pros**: Every bar is easy to read on its own.
*   **Cons**: Two bars of the same length can mean very different amounts. An over-target bar only reaches the edge, so it looks like exactly on target, which fails the "visibly overshoot" requirement.
*   **Reason for Rejection**: Rejected by author: it cannot show an overshoot. The chosen design uses one shared scale with headroom and a target marker.

### Alternative D: Clip at the track with an overflow arrow

Bars stop at the track edge, and an arrow marks any overshoot.

*   **Pros**: The layout never breaks, whatever the values.
*   **Cons**: It hides how far over target a section is.
*   **Reason for Rejection**: Rejected by author: clipping hides how far over target a section is, which is the point of showing an overshoot. The design has no cap. A very large target shrinks the other bars on the shared scale, which is accepted.

### Alternative E: Pre-filled default rates, or a blank rate counted as 0 or 1

Start with built-in USD and AUD rates, or treat a missing rate as 0 or 1.

*   **Pros**: No empty state. The headline is always a single number.
*   **Cons**: It invents a rate the user did not enter, or silently understates or overstates the headline.
*   **Reason for Rejection**: Rejected by author: a wrong number shown as right is worse than an incomplete number labelled incomplete. Rates start blank, and a record with no rate is left out with a visible warning.

### Alternative F: Live exchange rates

Fetch USD and AUD rates when the page loads.

*   **Pros**: Rates are current without typing.
*   **Cons**: No public Google exchange-rate API was found, and scraping a Google page is fragile and against its terms of service. A free rates API would still add a server route, a network dependency and a failure mode to a tool that otherwise works offline.
*   **Reason for Rejection**: Rejected by author: rates are typed by hand. Amounts are stored in their own currency, so live rates can be added later without changing the stored data.

### Alternative G: Store amounts already converted to SGD

*   **Pros**: Simple display, with no conversion at render time.
*   **Cons**: A rate change does not update old records, and the original currency amount is lost.
*   **Reason for Rejection**: Rejected by author: amounts stay in their own currency and are converted for display.

### Alternative H: Inputs first, or a sticky summary

Put the record forms first with the summary below, or keep a summary pinned on screen.

*   **Pros**: Inputs first follows the order of data entry. A sticky summary is always visible.
*   **Cons**: Inputs first hides the point of the tool below a long form. A sticky summary uses scarce phone screen space.
*   **Reason for Rejection**: Rejected by author: the headline and chart come first, and records are edited below them.

### Alternative I: Pull balances from the CPF, SRS and HYSA tools

*   **Pros**: No double entry, and the figures would not drift apart.
*   **Cons**: It couples this tool to three other storage formats, so any change to those tools could break this one.
*   **Reason for Rejection**: Rejected by author: reading the CPF, SRS and HYSA records would tie this tool to three storage formats, so a change in any of them could break this page.

### Alternative J: Auto-stamp Last Updated, or show a rate "as of" date

Set Last Updated to today whenever an amount changes, or show a date next to each rate.

*   **Pros**: Reduces the chance of stale dates and stale rates.
*   **Cons**: Auto-stamping adds logic that rewrites a field the user controls. A rate date adds a date display for data the user already knows.
*   **Reason for Rejection**: Rejected by author: Last Updated is a plain manual date, and keeping rates current is the user's job.

## Detailed Implementation Plan

Eleven files are created and three are modified. The numeric-field rule is shared by a small `NumberField` component (`src/components/networth/NumberField.tsx`, also exporting the shared input class), added during the build. Types live in the file that owns them. `networth.ts` owns the section, currency and record types, and the adapter and components import them. The adapter test is the only new importer of `registry.ts`.

### Build order

Each phase ends with passing tests, because `toolMeta("networth-summary")` throws until the `tools.ts` entry exists, and that entry fails the route-folder test until the route exists.

1.  **Phase 1:** `networth.ts` and its test. Run `npm test`; tests pass.
2.  **Phase 2:** the `tools.ts` entry, a minimal `page.tsx` that has `"use client"` and exports `NetworthSummaryPage` (and the default export) returning `null`, the adapter and its test, and the `registry.ts` entry. Run `npm test`; tests pass.
3.  **Phase 3:** the six components (the five above plus `NumberField`), the full page, and the `tools.test.ts` case. Run `npm run build`, `npm run lint` and `npm test`; all pass.

### Target Files to Create/Modify

#### 1. `src/lib/networth.ts` (Create)

*   **Type / Scope**: TypeScript module, pure functions and constants only. No React, no storage.
*   **Proposed Changes**:
    *   `SECTIONS`: ordered list of `{ key, label, helper, kind }` for `cpf`, `srs`, `cashSavings`, `cashInvestments` (kind `asset`) and `debt` (kind `debt`). Labels are CPF, SRS, Cash Savings, Cash Investments and Debt. Helper text: "Central Provident Fund balances (OA, SA, MA, RA).", "Supplementary Retirement Scheme account, cash and investments.", "Bank and savings accounts you can withdraw from.", "Money held with a broker or in funds, at current estimated value.", "Loans and balances you owe. Enter amounts as positive numbers." `Section` is the union of the keys, and `AssetSection` is the four asset keys.
    *   `CURRENCIES = ["SGD", "USD", "AUD"]` and the `Currency` type.
    *   `NetworthRecord = { id, section, name, platform, amount, currency, lastUpdated }` and `NetworthData = { usdSgd: number | null, audSgd: number | null, targets: Record<AssetSection, number>, records: NetworthRecord[] }`.
    *   `localDateISO(d = new Date())`: returns `YYYY-MM-DD` from the local year, month and day.
    *   Draft helpers, each returning a new `NetworthData`: `addRecord(data, section, today)` (new record with currency `SGD`, amount 0, empty name and platform, `lastUpdated` set to `today`, id from `genId("nw")`), `updateRecord(data, id, changes)` (`changes` is a partial record without `id` and `section`), `removeRecord(data, id)`, `setRate(data, currency, value)` (`currency` is `"USD"` or `"AUD"`, `value` is `number | null`), `setTarget(data, section, value)`, and `platformSuggestions(data)`, which returns the platform names entered so far, trimmed, de-duplicated without regard to case, sorted with `localeCompare`, with empty names removed. The first spelling seen is kept. `updateRecord` with an unknown id returns the data unchanged.
    *   `toSgdCents(amount, currency, data)`: returns whole cents, or `null` when the currency is USD or AUD and its rate is `null`. It returns `Math.round(amount * rate * 100)`, with a rate of 1 for SGD. A result above 10,000,000,000,000 cents, or one that is not finite, also returns `null`.
    *   `summarise(data)`: returns a `Summary = { sections: Record<Section, SectionSummary>, assetsCents, debtCents, netCents, incomplete }`, where `SectionSummary = { cents, excluded: NetworthRecord[] }`. `Summary`, `SectionSummary` and `ChartRow` are exported, and the components import them. All sums are integer cents. `incomplete` is true when any record is excluded.
    *   `chartRows(summary, data)`: returns `{ rows, axisMaxDollars }`. Each row is `{ section, label, cents, targetCents, percent, incomplete }`. `targetCents` is `Math.round(target * 100)`. `percent` is `Math.round(cents / targetCents * 100)`, or `null` when `targetCents` is 0. `incomplete` is true when the section has a left-out record. `axisMaxDollars` is `niceMax(1.15 * largest)` from `src/lib/utils.ts`, where `largest` is the largest of the four asset subtotals and four targets in dollars. Debt is excluded.
    *   `formatSgd(cents)`: one money formatter for this tool, `Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" })` with 2 decimals and a minus sign for negatives. `formatAmount(amount, currency)` uses the same options with the record's currency, so USD shows as `US$` and AUD as `A$`.

#### 2. `src/lib/networth.test.ts` (Create)

*   **Type / Scope**: Vitest unit test.
*   **Proposed Changes**: Cases for SGD pass-through; USD and AUD conversion; a blank rate returning `null` and excluding the record; rounding agreement (three records of 0.005 USD at a rate of 1 give 1 cent each, so the subtotal is 3 cents where rounding the exact total 0.015 would give 2, and the headline equals the sum of the subtotals); a non-finite result returning `null`; `platformSuggestions`; debt subtracted once; a negative net worth; `incomplete` set and cleared; target 0 giving `percent: null`; an overshoot at 120% and 250%; axis maximum is at least 15% above the largest value; all-zero data; `localDateISO` using local fields; and the draft helpers returning new objects without changing their input.

#### 3. `src/lib/persistence/adapters/networth-summary.ts` (Create)

*   **Type / Scope**: Persistence adapter, `ToolAdapter<NetworthData>`.
*   **Proposed Changes**:
    *   `const KEY = "tool:networth-summary"`. `networthAdapter = { ...toolMeta("networth-summary"), keys: [KEY], dateKey: KEY, defaults, read, toEntries }`. No `legacyKeys` and no `readLegacy`.
    *   `defaults()`: both rates `null`, all four targets 0, no records.
    *   `read(storage)`: returns `{ record, savedAt, exists }` and never writes. It applies every rule under "Reading and checking saved data", including the maxima, and regenerates an empty-string `id` like a missing one. `savedAt` is read only when it is a string.
    *   `toEntries(record, savedAt)`: returns one entry `{ key: KEY, value: JSON.stringify(savedAt ? { ...record, savedAt } : record) }`, as `srs-calculator.ts` does, so `savedAt` is left out when it is `null`.

#### 4. `src/lib/persistence/adapters/networth-summary.test.ts` (Create)

*   **Type / Scope**: Vitest unit test using `createMemoryStorage`.
*   **Proposed Changes**: Empty storage reads as not existing with zero writes; default round trip through `saveTool` and `read` (`sameData` equal, no `savedAt` in the record, `savedAt` readable); one test per repair rule; dropped rows removed from the record; a record with a missing currency becoming `SGD`; `importBackup` of a backup with damaged records repairing them and importing one tool; registration (`TOOL_ADAPTERS` contains the adapter and `REGISTERED_KEYS` contains `tool:networth-summary`); and the key is written as one entry.

#### 5. `src/app/tools/networth-summary/page.tsx` (Create)

*   **Type / Scope**: Client page in the new route folder `src/app/tools/networth-summary/`, which `tools.test.ts` requires for every tool. It has `"use client"`, `export function NetworthSummaryPage()` and `export default NetworthSummaryPage`, as the SRS page does.
*   **Proposed Changes**: Calls `useToolDraft(networthAdapter)`. Calls every hook before any early return, then returns `null` until `status` is `"ready"`, as the SRS page does. Computes `summarise(draft)` and `chartRows(...)` with `useMemo`. Renders in this order: `SiteHeader`, `ManualSaveNotice`, a `GuardedLink` to `/` labelled "Back to Home", the page header (a 48-unit rounded tile in `--primary-fill` holding a white `Wallet` icon, an `<h1>` "Networth Summary", the tagline from the `tools.ts` entry, and `LastSaved` beneath it), `NetworthHeadline`, `RatesPanel`, `TargetChart`, the five `SectionCard`s (four assets, then Debt), the one-line overlap note, and `SaveBar`. The shared datalist `<datalist id="networth-platforms">` is rendered once here from `platformSuggestions`. Container classes follow `src/app/tools/srs-calculator/page.tsx`. All edits go through `setDraft` with the helpers from `networth.ts`.

#### 6. `src/components/networth/NetworthHeadline.tsx` (Create)

*   **Type / Scope**: Presentational component.
*   **Proposed Changes**: Props: `{ summary: Summary }`. Shows Net worth in large type, with total assets and total debt beneath. A negative value uses the danger colour and a minus sign. When `incomplete`, shows "Incomplete: no rate for [records]" in the warning colour. Each left-out record is shown as its name, or "Unnamed" when blank, followed by its currency in brackets, for example "Unnamed (USD)". Entries are separated by ", ".

#### 7. `src/components/networth/RatesPanel.tsx` (Create)

*   **Type / Scope**: Controlled form component.
*   **Proposed Changes**: Props: `{ usdSgd, audSgd, onRate(currency, value) }`. Two text inputs with `inputMode="decimal"` (so partial text such as "0." can be typed) labelled "1 USD = [ ] SGD" and "1 AUD = [ ] SGD". Every numeric field in the tool uses this rule: the field keeps its text in local state and commits to the draft only when the text parses to a valid value. When the committed draft value stops matching the parsed local text (for example after Discard), the text is replaced by the draft value and any error is cleared. For a rate, valid is a finite number above 0 and at most 1,000. Blank text commits `null` and keeps showing blank. While the text is invalid the draft keeps its last valid value and the field shows "Enter a rate above 0." `setRate` stores what it is given. Only `RatesPanel` enforces the rule. Text under the panel: rates are entered by you, SGD is the base, and the values here are used for every figure on the page.

#### 8. `src/components/networth/TargetChart.tsx` (Create)

*   **Type / Scope**: Presentational inline SVG, theme colours from the existing CSS variables.
*   **Proposed Changes**: Props: `{ rows: ChartRow[], axisMaxDollars: number }`. Text uses `fontFamily="Manrope, sans-serif"`, as the SRS chart does. The card spans both columns. Each asset section is its own small SVG with `viewBox="0 0 300 50"`, laid out in a grid of 1, 2 and 4 columns by width, so the text stays small however wide the card is. In each SVG: a text line at y = 12 (section label left-aligned at x = 0, percent right-aligned at x = 300, font size 11), a second text line at y = 26 reading "{subtotal} of {target}" with `formatSgd` (font size 10), a track at y = 33 with width 300 and height 8 in `--surface-container-high`, and a bar of height 8 whose width is the value divided by the axis maximum times 300. The percent text reads "{percent}% of target", with an asterisk right after "target" for an incomplete row. The target marker is a line at the target's x from y = 30 to y = 44, stroke width 2, in `--on-surface`. A bar over target is drawn as two rects: `--primary-fill` up to the target's x, then from the target's x to the bar's end in `--amber` over a `<pattern id="nw-over-{section}">`, defined in each SVG, which is 4 by 4 units with a 45-degree line in `--on-surface` at 0.35 opacity. A row with a target of 0 draws the track only, shows "Set a target" in place of the percent, and has no marker. Each SVG has `role="img"` and an `aria-label` of one sentence, for example "CPF: $X of $Y target, Z%." A short line beside the card title says the line marks each target and the striped part is above it.

#### 9. `src/components/networth/SectionCard.tsx` (Create)

*   **Type / Scope**: Controlled component, one per section.
*   **Proposed Changes**: Props: `{ section: Section, records, subtotalCents, target?: number, onAdd(), onUpdate(id, changes), onRemove(id), onTarget?(value) }`. The label and helper text come from `SECTIONS`. `target` and `onTarget` are given only for the four asset sections, and the target field is hidden when they are absent (Debt). The header shows the label, the helper text and the SGD subtotal. The target field is labelled "Target (SGD)" and follows the numeric-field rule from `RatesPanel`: valid is a finite number from 0 to 10,000,000,000, blank commits 0 and keeps showing blank, and an invalid entry keeps the last valid value and shows "Enter an amount from 0 to 10,000,000,000." The add button reads "Add record". With no records the card shows "No records yet. Add one." Each record is a `RecordRow`. The card is always expanded and has no collapse control.

#### 10. `src/components/networth/RecordRow.tsx` (Create)

*   **Type / Scope**: Controlled component for one record.
*   **Proposed Changes**: Fields: Name (text), Platform (text with a `<datalist>` of platforms already entered across all records), Est. Amount (number, 0 or more, with a hint "approximate current value in this record's currency"), Currency (native `<select>` of `CURRENCIES`), Last Updated (`type="date"`). A remove button. Props: `{ record, onUpdate(changes), onRemove() }`; the shared datalist id `networth-platforms` is used directly. Shown as a card: Name and Platform, Est. Amount and Currency, then Last Updated and Remove, with each field on its own line below the `sm` breakpoint. The amount field follows the local-state rule: blank commits 0 and keeps showing blank, a negative or non-numeric entry keeps the last valid value, and values above 10,000,000,000 are not accepted.

#### 11. `src/lib/tools.ts` (Modify)

*   **Type / Scope**: Tool registry.
*   **Proposed Changes**: Insert a new entry before `cpf-sa-calculator`: slug `networth-summary`, name "Networth Summary", tagline "A one-page view of your CPF, SRS, cash and debt against your targets.", category `Planning`, icon `Wallet`, group `tracking`. This is what makes the tool first in the Tracking tab.

#### 12. `src/lib/tools.test.ts` (Modify)

*   **Type / Scope**: Existing test.
*   **Proposed Changes**: Add a case that the first tool with group `tracking` is `networth-summary`, and that its name is "Networth Summary".

#### 13. `src/lib/persistence/registry.ts` (Modify)

*   **Type / Scope**: Adapter registry.
*   **Proposed Changes**: Import `networthAdapter` and add it to `TOOL_ADAPTERS`. Without this, export and import ignore the tool.

Files confirmed unchanged: `src/components/ToolCard.tsx` (`Wallet` already exists in its icon map), `src/lib/utils.ts` (the local date helper lives in `networth.ts` instead), `src/app/globals.css` (no new variables), `src/lib/persistence/adapters/toolAdapters.test.ts` (its table covers legacy data, which this tool has none of), `README.md` (it has no tool list).

### Verification Plan

*   **Compilation/Build**: `npm run build`.
*   **Unit Tests**: `npm test` (Vitest). All tests pass, including the new `tools.test.ts` case.
*   **Static Analysis & Linting**: `npm run lint`.
*   **Test Coverage**: Every repair rule, every branch of `toSgdCents` and `summarise`, and the chart row and scale logic have a test.
*   **E2E/Integration**: Run `npm run dev`, then check on a phone-width viewport and a desktop width, in light and dark:
    1.  Add records in each section and in each currency.
    2.  Leave a rate blank and see the "incomplete" notice.
    3.  Set a target, overshoot it, and check the bar passes the marker.
    4.  Save, reload and see the data return.
    5.  On the home page, export, damage a record in the JSON, and import.
    6.  Open this tool and check the record is repaired or dropped with no notice and the page still totals correctly.

--------------------------------------------------------------------------------

*Drafted with EGM*
