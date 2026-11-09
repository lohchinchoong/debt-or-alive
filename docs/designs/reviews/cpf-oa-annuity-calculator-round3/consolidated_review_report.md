# Consolidated Review Report, Round 3 (quick run)

**Target:** `docs/designs/cpf-oa-annuity-calculator.md` (410 lines). FeatureRange 1-298, DetailedRange 299-410.
**Mode:** Quick run, no remediation applied. Stages 5, 6, 7 and 9 ran in parallel. Stage 8 (Intermediate Zoom Out) was skipped, because it checks the effect of edits made between stages and there were none. The Stage 5 synthesizer ended before its reviewers reported, so `egm-zoom-out` and `egm-inventive-catalyst` were dispatched directly. Individual stage reports were not written to files; their findings are consolidated below. Earlier rounds are in `../cpf-oa-annuity-calculator-round1/` and `../cpf-oa-annuity-calculator-round2/`.

## Verdict

**0 Blockers across all stages.** Round 2 also had none; round 1 had 3. Counts: Stage 5 zoom-out (0 Blocker, 2 Major, 4 Nit), Stage 5 inventive-catalyst (0, 0, 3), Stage 6 (0, 7, 6), Stage 7 (0, 3, 20), Stage 9 (0, 4, about 12).

The code-checking reviewers verified the persistence claims, file paths, identifiers and phase ordering against the code and found no wrong ones. Stage 9 found no code-accuracy errors in the plan. Remaining findings are about how the document reads, a few gaps in the plan and tests, and two points of scope.

## Two points that need an author decision

**D1. Keep or drop the import summary count (Stage 5 zoom-out Major 1).** `legacyDiscarded` on `ImportResult`, the extra sentence in `DataPortability.tsx` and its tests are three more touchpoints in shared code. A simpler import would take the latest profile silently. If the sentence stays, record it as a deliberate product decision. This changes the file count (16 becomes 15) and item 13.

**D2. One helper for "migration pending" (Stage 5 zoom-out Major 2).** Today `read()` and `readLegacyOaState` evaluate the same condition separately, and an agreement test guards against drift. A single private helper in `cpf-oa.ts` that both call removes the drift risk and the agreement test, with no shared-hook change. This is a design improvement that needs no new decision from you beyond a yes.

## Fixes without a decision

### Major

1. **Rejections are attributed to "the author" without a link** (Stage 7 Major 1). Link the brief's Key Decisions section in Alternative D, say once in a lead-in that the alternatives were decided by the author, and keep each entry's trade-off.
2. **The Problem should lead with the user problem** (Stage 7 Major 2, Stage 6 Major 6). Move the migration risk (and "dropping the key on deploy") into Risks & Mitigations. Make clear that nothing deploy-related drops the key.
3. **Proportionality and counts** (Stage 7 Major 3, Stage 6 Major 7). State the user estimate once and refer back to it, list the 8 source files and 7 test files before the plan, and make the counts match the plan's 16 numbered items (item 3 is a test helper; item 8 is the route folder). Replace "about 10 of the 16 files" in Alternative D with the actual items.
4. **Define terms for a fresh reader** (Stage 6 Majors 1 to 5, Nits 8 to 13). Describe the Compound Interest page and the unsaved-changes guard in product terms. Explain why validation uses an inline `StorageLike` (it reuses the base adapter's type check without a second validator). Say that a file with the new key onto a device that has only the legacy key removes the device legacy key (and that the device's other profiles are deleted, with `legacyDiscarded` 0). Define `status` (returned by `useToolDraft`) and why the server and first client render must match. Apply "profile" for data and "scenario" for UI text consistently in Goals, CUJ 2 and Non-Goals. Expand CPF and explain "start age" and "drawdown age" and the legacy `balanceAt55` rule.
5. **Phase grouping contradicts the phase gate** (Stage 9 Major 1). Phase 2 spans items 5 to 11 but only 5 to 9 are said to land together. State exactly which items form the atomic change. Also state that Phases 2 and 3 ship together (one release), because between them the registry no longer owns the legacy key and import does not yet read it (Stage 5 zoom-out Nit 1).
6. **Maths baseline and the "any inputs" claim** (Stage 9 Major 2). Use more than one input set (including one that triggers the validation error), say where the baseline is stored, or narrow the goal.
7. **Unevidenced or imprecise plan statements** (Stage 9 Majors 3 and 4). Drop or cite "adds coverage; no existing check requires it", say what the new `legacy` table entry tests, name the `REGISTERED_KEYS` duplicates check, and add item 9 to the coverage checklist or say it only removes cases.

### Nit

8. **Page implementation details** (Stage 9). "required by Next" is wrong: Next requires only the default export; say "as `compound-interest/page.tsx` does". Pin the notice styling (`text-sm`, `--on-surface`, line-height 1.6, and whether to use `role="status"`). List imports to add and keep, and make the `useEffect` removal definitive. Note that the hard-coded tagline duplicates `tools.ts`; say why, or add a test that they match.
9. **Date handling** (Stage 9, Stage 7). Add an explicit `typeof savedAt === "string"` guard in winner selection (`Date.parse(123)` coerces to a valid date), with a test. State that the tie-break accepts any date `Date.parse` accepts, including far-future dates.
10. **Test plan gaps** (Stage 9). Add: an import test for a failed legacy-key removal that warns and still returns ok; a legacy-only winner with a missing or invalid `savedAt` writing the new key with no date; fixtures for tie, no-valid-dates, undated-winner and backup objects; `readLegacy` cases as sub-bullets. State that the `DataPortability` sentence and page logic (`canSave || legacy.pending`, reset after Save, the server guard) are covered only by manual steps. Say what `failOnRemove`'s predicate is and that `console.warn` is asserted with `toHaveBeenCalled`. Correct the guard wording to `legacyKeys ?? []` and `readLegacy?.()`.
11. **Item 12 wording** (Stage 5 inventive-catalyst Nit 3). Say that a legacy-only import takes the winner's `savedAt` and does not follow the "date only if the date key is in the file" rule.
12. **Risks table accuracy** (Stage 5 inventive-catalyst Nit 1, Stage 7). Reword "Same result either way" for two tabs: the later Save wins, as for every tool. Add a row for a corrupt new key beside a valid legacy key (defaults and no notice, `inputsAdapter` treats any non-null value as existing). Fix Alternative H's "can reappear in a backup", which conflicts with the single-device claim. State the trigger of the rollback row precisely instead of "needs a rollback of a personal app".
13. **Structure and wording** (Stage 7). Rename "Technical Plan (Architecture)" to "Proposed Architecture". Move the date-states table out of the bullet list and format `<date>` as code. Name the rule in Goals ("latest `savedAt` wins"). Cite or remove "roughly an 800-line profile page". Keep the export-gap explanation in Risks and use one-line references elsewhere. Move "single-device" to the Overview or Non-Goals. Split the dense Notice paragraph. Replace "retired" with "removed". In Storage, say the legacy key is removed "at the next Save or import" in both places. Say that item 7 replaces the existing list page content. Drop filler lines ("No separate validation code is written", "Helper for tests only", "No redirect.").
14. **`readLegacy` altitude** (Stage 5 zoom-out Nit 2). Optionally keep the contract and move the mechanics to implementation. The Stage 6 reviewer found the fake-storage step hard to follow, so keep an explanation of why it is there.
15. **Status** (Stage 7). Confirm that "Draft" is the intended status.

## Notes

- The reviewers were told not to re-argue Alternatives D, E, F, L, M and the export gap. None did.
- The design document and the brief are unchanged by this review.
