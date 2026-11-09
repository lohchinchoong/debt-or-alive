# Round 2, Stage 9: Implementation Readiness Report

**Target:** `docs/designs/cpf-oa-annuity-calculator.md`, DetailedRange lines 280-411
**Reviewers:** `egm-implementation-readiness` (IR), `egm-codebase-details` (CD), `egm-style` (ST)

Severity: 0 Blocker, 5 Major, 15 Nit. Both code-checking reviewers verified the plan against the actual code. Every cited file, function, line reference and behaviour claim they checked held up, apart from the findings below. The Phase 2 grouping is sound: every importer of the profile members of `cpfOaAdapter` is covered by items 4 to 8.

**Verdict:** the plan is accurate against the code and can be executed after small edits. The five Majors are decisions the implementer should not have to make. Most Nits are wording fixes.

## Blockers

None.

## Major

1. **Page tagline source is unspecified** (IR, CD; item 6 line 334, Overview line 16, item 13 line 374). Item 6 says "the tagline" without saying which text. `toolMeta()` returns only `{slug, name}`, so it cannot supply one. The old `[profileId]` page hard-codes "See the constant monthly payout your OA balance can fund from your chosen start age until your chosen end age." The Compound Interest page also hard-codes a page tagline that differs from its `tools.ts` card tagline. State the exact page string and that it is hard-coded in JSX.
2. **Registry test has no file path** (IR, CD; ST as a Nit; item 15 line 386). The plan says "in the existing registry or adapter test", but no registry test file exists. The only `REGISTERED_KEYS` duplicate check is in `profileAdapters.test.ts`. Name one file, marked Modify or Create. `toolAdapters.test.ts` already imports `REGISTERED_KEYS` and `TOOL_ADAPTERS`. State that this addition belongs in Phase 2, with item 5.
3. **The "one-key in-memory view" for `readLegacy` has no construction** (IR, CD; item 4 lines 310-319, algorithm at lines 117-118). Step 4 calls `base.read` on a one-key in-memory view, but `testing/memoryStorage.ts` is documented as never imported by app code, so the implementer must invent an inline `StorageLike`. Specify it: `getItem(base.dateKey)` returns `JSON.stringify(flat)` and null for any other key, and `setItem` and `removeItem` throw. `flat` is the normalised params plus `savedAt` only if `Date.parse` accepts it.
4. **Phase-to-item and test mapping is inconsistent** (ST major, CD Nit; lines 288-291, 381-387). Tests live in item 15, but the phases say "items ... and their tests". Item 15 covers items 1-3, 5 and 10-12, which span three phases. The `toolAdapters.test.ts` and registry-test additions depend on item 5 (Phase 2). Items 7 and 8 sit inside "items 4 to 9", although item 7 must wait for the baseline. Label each item 15 bullet with its phase, or split item 15 per phase.
5. **Verification Plan and coverage lists contradict each other, and `ManualSaveNotice` has no automated test** (ST; lines 387, 392, 394, 405). Line 392 says "items 8, 9, 14 and 15" and line 394 says "items 9, 14 and 15"; item 8 only removes or moves tests. Item 12 changes new-user logic and is covered by one manual case, and is missing from the coverage checklist. `decide()` is not exported and vitest runs in a node environment, so skipping an automated test is consistent with the code. Say so, or add a test.

## Nit

6. **`useEffect` instruction contradicts itself** (IR, CD, ST; item 6 line 331). The plan says to remove `useEffect` from the React import "if the mount effect below is its only use", but the mount effect is a use, so the import stays. Write "keep `useEffect` for the mount effect; keep `useState` and `useMemo`". Drop `useParams`, `useGuardedRouter`, `NEW_PROFILE_ID`, `useProfileDraft`. Add `useToolDraft`, `readLegacyOaState`, `clearStaleLegacyKey`.
7. **`failOnRemove` semantics are underspecified** (IR, CD; item 3 line 308). `failOnSet` uses its own 1-based counter and throws before `writes += 1`. Say `failOnRemove` does the same with its own `removeCalls` counter. Rollback `removeItem` calls inside `saveEntries` (`save.ts`, around line 37) count toward it. Add the option to `MemoryStorageOptions` and its doc comment.
8. **`legacyDiscarded` values and summary wording not fully pinned** (IR, CD; items 10-11, lines 359, 364). State that `legacyDiscarded` is 0 on the catch, nothing-imported and save-failure paths, where the appended sentence goes relative to the skipped-key sentence, and that adapters without `legacyKeys` or `readLegacy` need `?? []` and optional-call guards.
9. **`clearStaleLegacyKey` test gaps** (IR; item 9 line 354). Add: the new key present and the legacy key invalid JSON or a non-array (kept); no new key and the legacy value `[1, null]` (kept).
10. **Server guard behaviour not specified** (IR, ST; item 6 line 332). Say `typeof window === "undefined"` yields `{ pending: false, others: 0 }`.
11. **Header icon badge not mentioned** (IR; item 6 lines 330-334). The old page has an SVG icon badge in its header. Add "keep the old page's icon badge".
12. **Item 5 placement and a confusable name** (IR; lines 315, 324). Say "append last" for `cpfOaAdapter` in `TOOL_ADAPTERS`. `LEGACY_KEY` in `cpf-oa.ts` and `LEGACY_KEYS` in `registry.ts` differ by one letter; rename the first to `OA_LEGACY_KEY`.
13. **Imprecise parenthetical about the route-folder check** (CD, ST; item 14 line 379). The existing check only asserts that `src/app/tools/<slug>` exists. Reword to "uses the `existsSync` and `path` imports already in this file".
14. **CUJ 3 skipped-key reporting is invisible in some cases** (CD; lines 72, 384; `DataPortability.tsx` lines 115-116). When `toolsImported === 0` the UI shows only "No recognised data found in file." and not `keysSkipped`, so a backup whose only key is an unusable legacy key does not show the skipped count. Narrow the CUJ wording or note the limitation.
15. **Pre-delete baseline is buried in a phase summary** (ST; line 289, item 7 line 340). Make it an explicit "Phase 2, step 0" and reference it from item 7.
16. **Line 282 names a rule without its source, and line 385 makes a defensive claim** (ST). Name `CLAUDE.md` on line 282 and tighten to "Local step only; do not commit." Shorten line 385 to "Adds coverage; no existing check requires it".
17. **Vague or dense wording in items 4 and 6** (ST; lines 316-318, 334, 335). "Use it wherever the key is needed" is vague; write "Use `base.dateKey` instead of the string literal". Split line 317. "The latter" in line 318 is ambiguous and reads as if nothing unparseable is removed, whereas `[]` is removed. "Same card style as `ManualSaveNotice`" should name the classes or component to copy. Shorten the default-export note to "(required by Next)".
18. **Manual verification steps are inconsistently phrased** (ST; lines 395-405). Use one step form, name where to check that the legacy key is removed, and name how the yearly table is recorded (screenshot or copied text).
19. **Redundant verification text** (ST; lines 286, 391-394). The build, test and lint commands appear per phase and again in the Verification Plan. Keep the per-phase rule once and drop "No percentage target."
