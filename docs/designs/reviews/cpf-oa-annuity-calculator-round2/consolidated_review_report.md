# Consolidated Review Report, Round 2

**Target:** `docs/designs/cpf-oa-annuity-calculator.md` (411 lines at review time)
**Mode:** Consolidated report, all rubrics. No remediation was applied.
**Stage reports (this folder):** `zoom_out_report.md` (5), `comprehension_report.md` (6), `critic_report.md` (7), `intermediate_zoom_out_report.md` (8), `implementation_readiness_report.md` (9). Round 1 reports are in `../cpf-oa-annuity-calculator-round1/`.

## Verdict

Round 1 had 3 Blockers. Round 2 has none. Stage counts: Stage 5 (0 Blocker, 5 Major, 4 Nit), Stage 6 (0, 7, 7), Stage 7 (0, 5, 11), Stage 8 (0, 2, 3), Stage 9 (0, 5, 15). Both code-checking reviewers found the plan accurate against the code. Stage 9 says it can be executed after small edits.

What is left falls into two groups:

1. **One decision for the author.** Four of the five Stage 5 Majors, Stage 7 Majors 1 and 2, and both Stage 8 Majors argue about the same question: whether the migration is worth its size, and whether to follow the `cpf-sa.ts` precedent. Stage 8 corrected Stage 5 on a point of fact: `cpf-sa.ts` migrates inside `readAll` (Alternative E), so Alternative F has no codebase precedent. The design's own Alternative F text repeats that error.
2. **Document fixes that need no decision**, mostly definitions, wording, consistency, and a handful of specification gaps in the implementation plan.

## Decision for the author

**D1. The size of the migration.** The chosen design adds `legacyKeys`, `readLegacy`, a wrapper `read`, `readLegacyOaState`, `clearStaleLegacyKey`, a `canSave` override, a `saveTool` removal step, an import rule with `legacyDiscarded`, `LEGACY_KEYS` and a `ManualSaveNotice` change, for about 10 users who would otherwise re-enter four numbers. The reviewers see these options:

| Option | What it removes | What it costs |
| --- | --- | --- |
| Keep the design, with the cuts below (D1a, D1b) | Nothing structural, but trims two pieces | Keeps the page-level override and the second read |
| Alternative E, migrate inside `read()` like `cpf-sa.ts` | `readLegacyOaState`, the `canSave` override, `clearStaleLegacyKey`, the notice's second read | Reads write (cpf-sa already does); notice count must be captured at migration time; import needs its own path since its view is read-only |
| Alternative D, no migration | The whole migration, import rule, notice and most shared-module changes | About 10 users re-enter four numbers; old backups import with the OA data dropped |

Two smaller cuts apply whichever option is chosen:
- **D1a. Delete `clearStaleLegacyKey`** (Stage 8 Major 2). A leftover legacy key is inert once the new key exists, and Save and import already remove it. The helper adds a mount effect, an exception to "written only on Save", three risk rows and a test block, and Stage 7 Major 3 shows it can delete the only good data when the new key is corrupt. If it stays, it must remove the legacy key only when the new key parses as an object.
- **D1b. Drop the `ManualSaveNotice` change** (Stage 8 Nit 4). It protects only a one-time notice for users who hold only the legacy key.

## Action items (no decision needed)

### Major

**M1. Restate the rejection rationales as trade-offs** (S7-1, S5-1). Alternatives D, F, G, H and J rest on "the author prefers". Give a concrete cost for each. Fix Alternative F's claims: it does not remove the stale-key window (a write then a removal is not atomic) and it has no codebase precedent. Cite `cpf-sa.ts` under Alternative E instead (S7-2, S8-1). The count of added surfaces and files belongs in the Problem once (S8-3).

**M2. Define the terms a fresh reader needs** (S6-1 to S6-6). Define `ToolRead<T>` where it first appears, say `dateStateOf` maps `exists` and `savedAt` to a state, define the "base adapter" and the "one-key in-memory view", define the import `owned` set and "participating" with a short pseudocode sketch, give the old profile shape in the Overview, and replace "from the brief" in the stale-key rules with a case-to-action table.

**M3. Fix terminology** (S7-4, S6-1, S6-7). Use "profile" for data and code and "scenario" for UI text. Name `cpf-oa:profiles` where "legacy key" first appears. Separate the problem statement from the decision and rationale in The Problem.

**M4. Remove the unsourced or subjective claims** (S7-5). State the user count once as the author's assumption and reuse it by reference. Replace "keeps the cost in proportion" with the cost. Reword "a one-off what-if" and "the calculation does not need".

**M5. Pin the unspecified details in the implementation plan** (S9-1 to S9-5). Specify the exact page tagline (hard-coded JSX; `toolMeta()` gives only `slug` and `name`), name one file for the `LEGACY_KEYS` test (`toolAdapters.test.ts`, Phase 2), specify the inline `StorageLike` for the validation view, label item 15's bullets with their phases, and make the verification lists consistent, including how `ManualSaveNotice` is covered.

### Nit

**N1. Plan wording and small gaps** (S9-6 to S9-19). Keep `useEffect` in the import for the mount effect. Spell out `failOnRemove` semantics. State `legacyDiscarded` per return path and the summary sentence order. Add two `clearStaleLegacyKey` tests if it stays. State the server-guard result. Keep the old page's icon badge. Append `cpfOaAdapter` last in `TOOL_ADAPTERS` and rename `LEGACY_KEY` to `OA_LEGACY_KEY`. Reword the route-folder check parenthetical. Make the baseline "Phase 2, step 0". Name `CLAUDE.md` as the source of the project rule. Tighten dense or vague wording in items 4 and 6. Use one form for manual steps. Remove duplicated verification text. Note that CUJ 3's skipped-key count does not show when nothing else imports.

**N2. Structure and wording in the feature sections** (S7-6 to S7-16, S6-8 to S6-14). Name the modules in the Summary of changes. State that the notice and `canSave` override render only when `status === "ready"`. Gate the import summary on the OA adapter taking part. Derive `read()` and `readLegacyOaState` from one function or test that they agree. Add concrete costs to thin Alternatives (A, B, C, K), drop the "Not chosen:" prefix, split bundled Alternatives (I, J, K). Replace "This exists today." Add a likelihood column to the risk table and an explicit statement of no further security implications. Replace defensive wording ("harmless", "best effort", "at worst"). Explain `ManualSaveNotice`, the home-page grouping and the profile members being retired. Split dense sentences.

**N3. Altitude of the Detailed Plan and `readLegacy`** (S5-6, S5-7, S8-5). Reviewers rate this a Nit because the detail is accurate. After the decision in D1, the plan shrinks by about a third, so edit it after the decision.

**N4. A golden test for the maths** (S5-9). Before deleting `[profileId]`, add a vitest test of `simulate` and `solveMonthlyDrawdown` with inputs 1982/55/150000/75, instead of comparing by eye. Moving the maths to `src/lib` stays a Non-Goal.

### Specification hazard (fix whichever option is chosen)

**H1. Load deletes the legacy key when the new key is unreadable** (S7-3). If `clearStaleLegacyKey` stays, "the new key exists" must mean "parses as an object". Add the case to the risks table and the tests. This disappears if D1a is taken.

### Open author question

**Q1. Save irreversibly removes the other scenarios** (S5-5). The inventive-catalyst reviewer suggests keeping the legacy key until the user discards it, or archiving it. Both conflict with the "no backup copy" Non-Goal, so this needs an author decision, and it works against the shrinking options in D1. You already decided against a copy and a download; this is recorded here only because the reviewer raised it again.

**Q2. The export gap** (S5-4). Raised again as a silent data-loss path. You accepted it; the document records that. No change unless you reverse it.

## Traceability

| Item | Stage 5 | Stage 6 | Stage 7 | Stage 8 | Stage 9 |
| --- | --- | --- | --- | --- | --- |
| D1 migration size | 1, 2, 3 | | 1, 2 | 1 | |
| D1a delete `clearStaleLegacyKey` | 2 | | 3 | 2 | 9 (tests) |
| D1b drop `ManualSaveNotice` change | | | | 4 | |
| M1 rationales | 1 | | 1, 2 | 1, 3 | |
| M2 definitions | | 1 to 6 | | | 3 |
| M3 terminology | | 1, 7 | 4 | | |
| M4 unsourced claims | | | 5 | | |
| M5 plan details | | | | | 1 to 5 |
| N1 plan wording | | | | | 6 to 19 |
| N2 feature-section wording | | 8 to 14 | 6 to 16 | | |
| N3 altitude | 6, 7 | | | 5 | |
| N4 golden maths test | 9 | | | | |
| H1 unreadable new key | | | 3 | 2 | |
| Q1 irreversible removal | 5 | | | | |
| Q2 export gap | 4 | | | | |

S5 to S9 refer to findings in the stage report of that number.

## Notes

- Stage 5 and Stage 8 disagree about F. Stage 8 checked `cpf-sa.ts` directly, so its reading (E, not F, matches the precedent) is used here.
- The design document and the brief are unchanged by this review.
