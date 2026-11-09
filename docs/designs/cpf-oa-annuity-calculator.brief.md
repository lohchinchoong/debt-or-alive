# CPF Ordinary Account (OA) Annuity Calculator

* **Author:** Des with Agents
* **Date:** 2026-11-09

## Overview

The CPF OA Annuity tool is currently a list of saved scenarios. Each scenario opens its own page, and the page takes four inputs: birth year, start drawdown age, balance at the start age, and end drawdown age. The tool works out the constant monthly payout the OA balance can fund.

This change turns it into a single calculator page named "CPF Ordinary Account (OA) Annuity Calculator", at `/tools/cpf-oa-annuity-calculator`. There are no profiles, no profile names and no scenario list. The page works like the Compound Interest calculator: one set of inputs, loaded on visit, written to the device only when the user presses Save. The calculation maths does not change.

On the home page the tool moves from the Tracking Tools tab to the Calculators tab, and it becomes the first card there. The new tagline is: "Find the steady monthly payout your OA balance can fund between two ages."

## Analysis

All seven review lenses agreed the idea is sound and mostly removes code. The existing `createInputsAdapter` fits the four flat number inputs, and the Compound Interest page is a ready template. Deleting the `[profileId]` folder also removes `/new`, so the 404 needs no extra code.

The risk is in saved data, not in the page.

1. **The migration cannot just run inside `adapter.read()`.**
   - `useToolDraft` reads inside a React state initialiser and documents "Save is the only write". A test asserts that reads write nothing.
   - The backup import reads through a read-only wrapper whose `setItem` and `removeItem` throw. An uncaught throw cancels the whole import.
   - React StrictMode runs the initialiser twice, so migration must be safe to repeat.
   - Two ways forward:
     - **A. Pure fallback.** `read()` stays pure. If the new key is missing and `cpf-oa:profiles` exists, it builds the migrated record in memory and reports it as existing. The write to the new key and the delete of the old key happen on the first Save.
     - **B. Migrate inside read**, as `cpf-sa.ts` does. It writes the new key, deletes the old key only if the write succeeded, and swallows errors. This matches "runs once, then deletes" literally, but it adds another exception to "Save is the only write".
   - Whichever is chosen, the order is: write the new key, check it worked, then delete the old key. If the write fails (storage full, private mode), the old key stays.

2. **Old backup files would lose their OA data without warning.** If `cpf-oa:profiles` stops being a registered key, importing an old backup lists it as skipped. The import looks successful but the OA data is dropped. The import code needs to recognise the old key and convert it, using the same function as the first-load migration, so "which profile wins" is defined in one place.
   - A backup that has only the old key beats a record already on the device.
   - A backup with both keys uses the new key.
   - A new-format backup restored onto a device with a leftover old key deletes that old key without migrating it.

3. **The other scenarios and all scenario names are lost for good.** You chose this: keep only the most recent profile. Reviewers split on whether to soften it. One lens says to accept it and state it in the PR. Others suggest a one-time notice ("N other scenarios were not carried over"), optionally with a download of the old data. Rollback after migration is not supported; a backup export made before release is the only way back.

**Rules to write down so the migration is unambiguous**
- "Runs once" means a state check: old key present and new record absent. No separate flag is stored.
- "Most recent" compares `savedAt` as dates. A missing or unparseable date counts as oldest. Ties, and the case where no profile has a date, go to the last item in the array, because profiles are appended.
- Bad JSON, a non-array value, or a non-object item must not crash, and must not delete the old key. An empty array means nothing to migrate.
- Reuse the existing legacy handling (`balanceAt55` becomes `balanceAtStart`, start age 56 for those profiles, defaults for missing fields). Drop `id`, `name` and `savedAt` from the stored inputs.
- The winning profile's `savedAt` carries over, so "Last saved" stays correct. A profile with no `savedAt` gives a null date, which enables Save.

**Other findings**
- Home page order comes from array order in `src/lib/tools.ts`, so the entry must move above `compound-interest`, not just change group. `tools.test.ts` line 36 checks the old name and must change.
- The page title comes from `toolMeta(slug).name`, so the rename flows through. Do not hard-code it.
- The new tagline drops "constant" and "from your chosen start age". It is vaguer than the old one.
- "Calculator" is added only to this tool's name. CPF SA and CPF MA do not have the suffix.
- The Calculators tab subtitle ("Quick, one-off what-ifs.") already does not fit saved calculators like Compound Interest. This exists today and is out of scope.
- Leave `useProfileList`, `useProfileDraft`, `NEW_PROFILE_ID` and `listPath` alone. SA, MA, HYSA and Savings Goal still use them.
- `DataPortability.tsx` needs no change.

**Ideal final result:** one page, no profile code for this tool, and no user data lost without notice.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  - Replace the profile list and `[profileId]` pages with one calculator page that follows the Compound Interest pattern (`useToolDraft`, `SaveBar`, `LastSaved`, `ManualSaveNotice`).
  - Switch the persistence to the single-record adapter and move it from `PROFILE_ADAPTERS` to `TOOL_ADAPTERS` in `registry.ts`.
  - Migrate the most recent old profile into the new record, then delete `cpf-oa:profiles`.
  - Make old backups import correctly.
  - Delete the `[profileId]` routes so `/new` and `/<id>` return the default 404.
  - Rename the tool, change its tagline, move it to the Calculators group, and make it first there.
  - Update and add tests: tools, adapters, migration, import.
* **Out-of-Scope Non-Goals:**
  - Any change to the maths (`simulate`, `solveMonthlyDrawdown`, `validate`).
  - Redirects from old URLs.
  - A scenario picker or multi-profile support.
  - Changes to the other profile-based tools, or to the shared profile hooks.
  - Reworking the Calculators tab subtitle.
  - Editing the historical docs under `docs/designs/`.

## Alternatives Weighed

- **Redirect old profile URLs to the calculator.** Rejected by author: 404 keeps routing consistent and needs no code.
- **Keep profiles but hide them behind the calculator.** Rejected by author: the goal is a generic calculator with no profiles.
- **Keep the old profile array under a backup key instead of deleting it.** Not chosen: it conflicts with "delete the rest", and no export would include it.
- **Tool-specific "not found" page with a link to the calculator.** Not chosen so far: it is a new file and softens the plain 404. The default `src/app/not-found.tsx` already exists.
- **Skip migration and start every user from defaults.** Rejected by author: the most recent profile should pre-fill the calculator.

## Key Decisions & Staging for Next Steps

Decided:
- Pre-fill from the most recent profile and delete the rest.
- Persistence matches Compound Interest: one saved record and a manual Save.
- Old URLs return 404.
- No change to the maths.
- The tool moves to the Calculators tab as the first card, with the new name and tagline.

Open, with reviewer recommendations:
1. **Migration mechanism:** DECIDED, option A (pure fallback). `read()` stays pure: when the new key is missing and `cpf-oa:profiles` exists, it builds the migrated record in memory and reports it as existing. The new key is written, and the old key deleted, at the first Save. A user who never saves keeps the old key. The write is verified before the old key is deleted. The same pure function is shared with backup import.
2. **Data-loss mitigation:** DECIDED. A notice ("We kept your most recent scenario; N others were not carried over."), derived from the old key. It shows on each visit until the first Save removes that key. No dismiss button, no stored flag, no download button and no backup key.
3. **Legacy key in imports:** DECIDED. A separate `legacyKeys` list on the adapter, read only by import. Export never emits the old key, and only the new key is written.
4. **Tie-break and savedAt:** DECIDED. The last array item wins ties. The winner's `savedAt` carries over.
5. **Delete the old key:** DECIDED, at the next Save or import only. It is not removed on page load: a leftover legacy key beside the new key, or one holding `[]`, is inert and stays until then (changed during review, round 2).
5a. **`ManualSaveNotice`:** DECIDED, unchanged. A user whose only data is the old key is treated as new and does not see its one-time notice. No `LEGACY_KEYS` export.
5b. **Review round 2:** DECIDED, keep the migration design with these two cuts, on Save and extending `importBackup`. The export gap stays accepted. Import reads the old key through an adapter method `readLegacy`.
5c. **Review round 3:** DECIDED. No count of dropped profiles in the import summary (no `legacyDiscarded`, no `DataPortability.tsx` change), and one private helper `legacyToMigrate` in `cpf-oa.ts` decides whether a migration is pending for both `read()` and the page.
5d. **Review round 4:** DECIDED. A `savedAt` later than the current time counts as invalid when picking the latest profile. Three behaviours were left open here and settled in the next item.
5e. **Open items settled:** DECIDED, accept all three as they are: import overwrites without a confirmation, a single legacy profile shows no notice, and a corrupt new key beside a valid legacy key shows defaults.
6. **404:** DECIDED. Default Next.js 404, no tool-specific not-found page.
7. **Maths extraction:** DECIDED, skipped. The maths stays in the page file, untouched.
8. **Tagline:** DECIDED. "Find the steady monthly payout your OA balance can fund between two ages."

All open questions are now resolved.

Next step: `/egm:egm-draft`.
