# Stage 9: Implementation Readiness Report

**Target:** `docs/designs/cpf-oa-annuity-calculator.md`, DetailedRange lines 234-363
**Reviewers:** `egm-implementation-readiness` (IR), `egm-codebase-details` (CD), `egm-style` (ST). ST did not check the codebase.

**Verdict: not ready to implement.** File paths, function names and cited line references checked out against the code. They include the `profileAdapters.test.ts` import (line 3), the adapter table entry (lines 21-24), the legacy block (lines 70-75), the `tools.test.ts` assertion (line 36), `ManualSaveNotice.decide()` and the `saveTool` and `importBackup` behaviour. The gaps are in phasing and in decisions the plan leaves to the implementer.

Severity: 2 Blocker, 13 Major, 10 Nit. Findings graded differently by different lenses are listed at the highest grade given.

## Blockers

### 1. No phasing or ordering; the build breaks mid-plan
- **Lenses:** IR (Blocker), CD (Major). **Scope:** items 1-16.
- The plan is a flat list of 16 items with no per-phase build or test checkpoint.
  - Item 2 removes `CpfOaProfile`, `readAll`, `newProfile` and `listPath`, which the list page, `[profileId]/page.tsx`, `registry.ts` (`PROFILE_ADAPTERS`) and `profileAdapters.test.ts` still use. The build is broken until items 4, 8, 9 and 12 land.
  - Item 8 rewrites the page from the content of `[profileId]/page.tsx`, which item 9 deletes. The plan never says to copy before deleting.
  - Item 5 depends on item 1. Item 7 depends on item 4's `LEGACY_KEYS`.
- **Recommendation:** phases that each leave the build and tests stable: (1) types, `tool.ts` and the new adapter, registered with the old profile paths intact; (2) atomic switch: `cpf-oa.ts` removals, `registry.ts`, page rewrite (copy first), route deletion and test updates; (3) import, `DataPortability`, `ManualSaveNotice`; (4) `tools.ts` and its test. Give each phase `npm test`, `npm run lint` and `npm run build` checkpoints.

### 2. Import of a legacy key with no usable winner is undefined and can overwrite real data
- **Lenses:** IR (Blocker), CD (Major), ST (Major). **Scope:** item 5, the test at line 337, design line 135.
- "Used" is never defined for the legacy key. For a backup whose only OA key is `cpf-oa:profiles` holding `[]`, garbage or all non-objects, `pickLatestLegacyProfile` returns null and `read` falls back to defaults. By the plan's wording the adapter still "takes part": `toEntries(defaults)` is pushed and `toolsImported` is incremented, so the device's real OA record is overwritten with defaults. The line 337 test only asserts "does not crash".
- **Recommendation:** if there is no winner, the legacy key counts as unused: the adapter is skipped, the key goes to `keysSkipped` and is not added to `owned`, nothing is written, and `toolsImported` is unchanged. The test must assert exactly that. Define "took part", "used", `legacyInFile`, `newInFile`, "second view", "overlay" and "carried" with the real code identifiers.

## Major

### 3. `legacyDiscarded` and the notice count are computed differently
- **Lenses:** IR, CD, ST. **Scope:** item 5 (line 274), item 2 (lines 251-252), item 6 (line 283).
- Import uses `Math.max(length - 1, 0)` on the raw array length. The notice uses `count`, the number of usable (object) items. For `[obj, null, 5]` import reports 2 discarded while the usable count is 1. A string-valued key gives 0. `import.ts` is adapter-generic and has no access to `count`. Line 283 derives N as `legacyDiscarded + 1`, inheriting the mismatch. "Object item" is ambiguous (arrays, null).
- **Recommendation:** decide how `import.ts` gets the count: import `pickLatestLegacyProfile` and `LEGACY_KEY` from `adapters/cpf-oa` (accepting the OA-specific coupling) or add an optional adapter hook. Set `legacyDiscarded = count - 1`. Define "usable" as a non-null, non-array object. State that the call runs on the stringified legacy value from the overlay.

### 4. `ImportResult.legacyDiscarded` is required, optional and "unchanged in shape" in different places
- **Lenses:** IR, ST, CD (Nit). **Scope:** line 138, item 5 (line 272), item 6 (line 283).
- The design says "optional" and "unchanged in shape"; item 5 types it as required. If required, every `ImportResult` construction site in `importBackup` must set it: the catch, `entries.length === 0`, success and save-failure paths (about lines 58, 62, 64-66). In `DataPortability.tsx` three edits are missing from the plan: the `importData` return type (about line 66), the `resolve(...)` call (about line 91) and the destructuring in `handleImport` (about line 113).
- **Recommendation:** pick one and use it everywhere. List each edit. State that the appended summary text cannot appear when `toolsImported === 0`.

### 5. The test harness cannot throw from `removeItem`
- **Lenses:** IR, CD, ST. **Scope:** items 13-15 (lines 327, 332).
- Items 13 and 14 need "a throwing `removeItem`". `createMemoryStorage` in `src/lib/persistence/testing/memoryStorage.ts` supports only `failOnSet`, and its `removeItem` never throws. Spreading it also snapshots the `writes` getter. The helper is not in the file allowlist. Item 15 has no throwing-`removeItem` case, although line 277 specifies the `console.warn` branch.
- **Recommendation:** add `failOnRemove` to `memoryStorage.ts` and list it as a Modify item, or specify an inline wrapper that delegates and throws in `removeItem`. Assert `console.warn` with `vi.spyOn`. Add the throwing case to item 15.

### 6. `tool.test.ts` has no adapter with `legacyKeys`
- **Lens:** CD. **Scope:** item 14 (lines 329-332).
- `demoAdapter` has no `legacyKeys`. **Recommendation:** create a spread copy with `legacyKeys: ["demo:legacy"]` and pre-seed that key in storage.

### 7. Item 16 is conditional and rests on a false premise
- **Lenses:** IR, CD, ST (Nit). **Scope:** lines 339-342.
- "Modify, if needed ... check whether a completeness check requires..." leaves a decision to the implementer. `toolAdapters.test.ts` has no completeness check. Its `describe.each(legacy)` table (lines 20-28) is hand-written, so omitting OA fails nothing.
- **Recommendation:** decide. Add the OA entry, for example `{ adapter: cpfOaAdapter as ToolAdapter<unknown>, data: { "tool:cpf-oa-annuity-calculator": '{"birthYear":1980,"startDrawdownAge":55,"balanceAtStart":1,"endDrawdownAge":70}' } }` with the import, or mark the item "no change". Fix the "items 11 to 15" reference at line 347 to include item 16.

### 8. The page rewrite (item 8) leaves choices open and misstates the edit
- **Lenses:** IR, CD. **Scope:** lines 294-302.
- "Adjust only the `CpfOaParams` import" is wrong. The old body also needs: replace `profile ?? ...` null handling and the `profile === null` check with `draft.draft.inputs` (the draft is never null); remove `const { name } = profile`; remove the `ProfileNameEditor` definition, not only its use; drop `useEffect` from the import if unused; keep `toolMeta`; replace the local `set` and `handleSave`; change the header link from "All Scenarios" to the Back to Home `href="/"` using the `compound-interest` markup.
- The keep list omits `YearRow`, `OA_RATE`, `MIN_START_AGE`, `fmt`, the Parameters card, the stat cards, the error text, and "How It Works" with the disclaimer (old lines about 746-823). The render order ends "then inputs, results and `SaveBar`", so those could be dropped by mistake.
- The `legacy` `useState` and the mount `useEffect` must be declared before the `status !== "ready"` early return (rules of hooks). The plan does not say so.
- "Page copy: spell out Ordinary Account on first use. State that the balance is as of the start age" gives no text or location. The `h1` already contains "Ordinary Account", and the hint at old line 697 already says "taken as at Jan".
- The default-export pattern is unspecified. `compound-interest/page.tsx` uses `export function X()` plus `export default X;`. CLAUDE.md bans default component exports, so state the pattern.
- **Recommendation:** keep the old JSX unchanged for the grid, chart, table and "How It Works". List the exact removals and edits. Give exact copy strings or delete the "Page copy" line. State hook placement and the export pattern.

### 9. Render order contradicts the "Compound Interest page shape"
- **Lens:** CD. **Scope:** item 8 (line 300), design line 153.
- In `compound-interest/page.tsx` (lines 564-630), `ManualSaveNotice` is the first child, above the Back link, and `LastSaved` sits in the heading block after the tagline. The plan puts `ManualSaveNotice` after `LastSaved`, and does not specify the migration notice position.
- **Recommendation:** state the order: `ManualSaveNotice`, the migration notice, then the header block with `LastSaved` after the tagline.

### 10. An invalid `savedAt` on the winner is returned as is
- **Lenses:** IR, CD. **Scope:** item 2 (line 251).
- The pseudocode keeps `savedAt` "only if it is a string" and uses `Date.parse` only for ranking. If the winner's date is `"garbage"`, `read()` returns it. The date state becomes "saved", `canSave` is false, and `LastSaved` shows nothing because `formatSavedDate` returns null. The design intends the "legacy" state.
- **Recommendation:** return `savedAt: null` when `Date.parse` is NaN, and add a test.

### 11. `canSave` expression and migration helper naming differ between design and plan
- **Lenses:** ST (Major), IR and CD (Nit). **Scope:** line 122 versus item 8 (line 299); lines 126, 252.
- The design has `draft.canSave || otherCount > 0 || legacyPending`; the plan has `draft.canSave || legacy.pending`. They are logically equivalent, since `others > 0` implies `pending`. The design names the helper only as "a helper"; the plan calls it `readLegacyOaState`.
- **Recommendation:** keep only `legacy.pending`, fix line 122, and name `readLegacyOaState` in the design sections.

### 12. The mount-effect guarantee is over-claimed
- **Lens:** ST. **Scope:** line 298 versus line 118.
- "It never changes what the notice or Save button show" holds only because the state is read once in the initialiser. Line 213 names StrictMode, which double-runs effects in development, but the plan does not say the second run is harmless.
- **Recommendation:** say the effect is idempotent and that `legacy` was captured by the initialiser. Drop or restate the "never changes" sentence.

### 13. The test coverage claims do not match the test list
- **Lens:** ST. **Scope:** lines 347, 349.
- "Every branch ... has a test" has no measurement, and "items 11 to 15" omits item 16.
- **Recommendation:** reword line 349 as a checklist of the listed cases, correct the item range, and add the missing throwing-`removeItem` case (finding 5).

### 14. The `[profileId]` folder check does not state how it runs
- **Lenses:** ST (Major), IR and CD (Nit). **Scope:** item 11 (line 317).
- **Recommendation:** specify `expect(existsSync(path.join(process.cwd(), "src/app/tools/cpf-oa-annuity-calculator/[profileId]"))).toBe(false)` using the imports already in the file. Note why it lives in `tools.test.ts`, or drop it in favour of the manual 404 check.

### 15. Unactionable and speculative statement about `.next`
- **Lenses:** ST (Major), IR and CD (Nit). **Scope:** lines 236, 346.
- "The main check is how stale `.next` type output behaves" is unsupported. No `.next` directory exists in the repo. "Read the relevant guides in `node_modules/next/dist/docs/`" names no guide, although that directory exists and CLAUDE.md requires the read.
- **Recommendation:** make the clean-up conditional ("if `.next/types` exists, delete it"). Name the guides, or drop the sentence.

## Nit

16. **Legacy normalisation does not type-check values (IR; item 2, line 249).** It copies the existing `??` logic, so a string `birthYear` passes through. `createInputsAdapter.read` filters by `typeof`. State whether to check `typeof === "number"` (recommended, with a test).
17. **`cpfOaAdapter` type annotation unspecified (IR; line 254).** The spread `{ ...base, legacyKeys, read }` needs `ToolAdapter<InputsRecord<CpfOaParams, {}>>` so `useToolDraft` infers `draft.draft.inputs`. `compoundInterestAdapter` is the precedent for `lists: {}`.
18. **An empty-array legacy key triggers the manual-save notice (IR; item 7).** Accept explicitly or exclude `[]`.
19. **Hard-coded new key (CD, ST; lines 252-254).** `tool:cpf-oa-annuity-calculator` appears several times. Use `cpfOaAdapter.dateKey` or a shared constant.
20. **Registry test for `LEGACY_KEYS` (IR; item 4).** Add a test that `LEGACY_KEYS` equals `["cpf-oa:profiles"]` and no `REGISTERED_KEYS` entry equals it.
21. **`saveTool` doc comment out of date (CD; item 3).** It says it "puts the date-carrying entry last" and does not mention legacy-key removal.
22. **Manual comparison check lacks fixed inputs (IR, ST; lines 350-357).** Give inputs (for example birth year 1982, start age 55, balance 150000, end age 75), record the baseline from the current build before deleting `[profileId]`, state the tolerance, and split line 352 into three bullets.
23. **Terminology inconsistency (ST).** "Old key", "legacy key" and "stale legacy key" name the same thing; "profile" and "scenario" alternate; "winner" and "latest profile" are interchangeable; items are headed "Proposed Changes" although they are firm instructions. Use "legacy key" throughout, "profile" in code and "scenario" in user-facing copy, and rename to "Changes".
24. **Duplicated pseudocode and notice strings have drifted (ST; lines 251, 253, 126, 300, 138, 283).** Define each string and algorithm once. Decide whether "scenario(s)" is literal.
25. **Smaller wording and format points (ST; lines 238-239, 249, 253-255, 266, 307, 312, 322, 324-327, 361-363).** Use "Rewrite" instead of "Modify, rewrite". Reword "`StoredCpfOaProfile`'s use as a profile type" as "remove it as a public type; keep a private type for the stored legacy shape". Split the `cpfOaAdapter` bullet into sub-bullets. Drop the filler on line 255 and the order parenthetical on line 266. Confirm `src/app/not-found.tsx` or use the design's wording at line 307. Make line 312 ("first in the array") agree with line 149 ("above `compound-interest`"). Replace "around line N" references with symbols. Split item 13's roughly 20 cases per function and remove overlaps. Keep one provenance line.

## Reuse check

CD found no missed reuse. Reusing `createInputsAdapter`, `useToolDraft`, `saveEntries`, `LastSaved`, `SaveBar`, `ManualSaveNotice`, `GuardedLink` and `toolMeta` is correct. One possible simplification: let `ManualSaveNotice` ask the adapter whether data exists, instead of keeping a second `LEGACY_KEYS` list. This design alternative was already raised in `zoom_out_report.md`.
