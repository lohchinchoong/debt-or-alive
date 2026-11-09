# Consolidated Review Report, Round 4 (quick run)

**Target:** `docs/designs/cpf-oa-annuity-calculator.md` (442 lines). FeatureRange 1-316, DetailedRange 317-442.
**Mode:** Quick run, no remediation applied. Stages 5, 6, 7 and 9 ran in parallel. Stage 8 was skipped. The Stage 9 synthesizer returned before its reviewers finished, so its three reviewers were dispatched directly. Stage reports were not written as separate files. Earlier rounds are in the sibling `round1`, `round2` and `round3` folders.

## Verdict

**0 Blockers across all stages**, the third round in a row. Counts: Stage 5 zoom-out (0 Blocker, 3 Major, 4 Nit), Stage 5 inventive-catalyst (0, 0, 4), Stage 6 (0, 5, 5), Stage 7 (0, 7, 9), Stage 9 implementation-readiness (0, 2, 6), codebase-details (0, 1, 10), style (0, 7, 15).

The code-checking reviewers found every path, symbol and behaviour claim in the plan accurate, including the 838-line profile page and the existing test tables. Round 3's quick re-run produced about 15 Majors; this one produced a similar number, but the items are now about fixture values, wording and a few specification gaps, not design structure.

## Author decisions needed

**D1. "Latest" can pick the wrong profile (Stage 7 Major 4, new).** `Date.parse` accepts far-future dates, so a bad or far-future `savedAt` can beat the genuinely newest profile, and Save then deletes the others. Options: cap dates at the current time (a far-future date counts as invalid), or keep the rule and add a risk row and test (the Stage 9 reviewers also asked for a far-future test).

**D2. Import overwrites device data without a warning (Stage 7 Major 5, new).** Importing replaces the device OA record and removes the device legacy key. The summary says only "Imported N tools". Check whether the import UI already asks for confirmation before overwriting; if not, accept and state it in Risks, or add a warning.

**D3. A single legacy profile shows no notice (Stage 5 inventive-catalyst Nit 3).** With one legacy profile, `others` is 0, so nothing explains why "Last saved" shows a date and Save is enabled before anything was written. Option: show a short notice whenever a migration is pending ("Carried over from your previous version; press Save to keep it"), with the "other scenarios" text added when `others` is above 0.

**D4. Corrupt new key beside a valid legacy key (Stage 5 inventive-catalyst Nit 4).** Currently accepted as a risk row. Option: let `legacyToMigrate` treat an unparseable new key as absent. Leaving it is defensible given the very low likelihood.

## Fixes without a decision

### Major

1. **Define the test fixtures** (Stage 9, three reviewers). Give a literal table for A, B, C and for the no-dates case (replace `C1` and `C2`): `id`, `name`, `birthYear`, `startDrawdownAge`, `balanceAtStart`, `endDrawdownAge`, `savedAt`, with distinct values per profile. Item 13 and the manual steps reuse it. State that backups carry parsed JSON arrays.
2. **Item 7 gaps** (Stage 9). Say the four inputs come from `draft.draft.inputs` (as the Compound Interest page's `const s = draft.draft.inputs`) and that `set` takes `Partial<CpfOaParams>`. Complete the import lists: keep `fmtAxis`, `niceMax`, `cpfOaAdapter` and `type CpfOaParams`; add `useToolDraft` from `@/hooks/useToolDraft` and `readLegacyOaState` from `@/lib/persistence/adapters/cpf-oa`. The notice's `text-sm` is on the container, not the paragraph; the container is `flex items-start justify-between gap-3`.
3. **Alternative D and attributions** (Stage 7 Majors 1 and 2). State the concrete trade-off for D (what is saved and what is paid), consider the middle option (read-only fallback with no notice and no `canSave` override, first Save overwrites), and link the round 2 and round 3 review folders where an entry cites "after review".
4. **File counts and the user estimate** (Stage 7 Majors 3 and 7, Stage 6 Nits 6 and 8). Reconcile the Problem, Summary of changes and Alternative D counts (name the 7 test files or helpers, including `memoryStorage.ts`). State "about 10 users (unmeasured)" once and drop the back-references.
5. **Term and definition gaps** (Stage 6 Majors 1 to 5). "Legacy" means both a date state and the old key; rename the date state to avoid collision (for example, "no date") or say so in Terms. State that Save is disabled with no edits because the Compound Interest norm is that Save appears only when there is something to save, and define `canSave` once. Explain why `read` needs a store (it takes a storage argument and looks up the key itself). Explain `owned` and why a key not in it is reported skipped, and make the two-file import rules explicit: the device key is removed while the file key is reported skipped. State that the OA interest rate and the 55/56 rules are deliberately unchanged.
6. **Heading hierarchy** (Stage 7 Major 6). "How saving works today" is background, not architecture: promote "Date states" to H3 or move it next to the Save-enable section.
7. **`readLegacy` step 4 workaround** (Stage 5 zoom-out Major 1). The reviewer suggests coercing against `CPF_OA_DEFAULT_PARAMS` directly, as the old `readAll` did, or exporting a validator from `inputsAdapter.ts`. The Stage 6 reviewer also found the fake store hard to follow. If the fake store stays, explain why.
8. **Implementation-plan wording** (Stage 9 style). Split dense bullets (Phase 2, items 7 and 12). Use one label for "Phase 2 baseline step". Write "must pass" for phase gates. Narrow the coverage statement to the manual steps that exist, or add steps for the server guard. Define "match" for the maths comparison (currency formatting and whitespace count as displayed). Drop the registry-order parenthetical.
9. **Altitude of the plan** (Stage 5 zoom-out Major 2). Item 7 lists Tailwind classes, unchanged identifiers and spy details. Reviewers see this as drift risk; Stage 9 reviewers consider the detail correct and helpful. Keep it as is unless you want a shorter plan.
10. **Page state tripled** (Stage 5 zoom-out Major 3, inventive-catalyst Nits 1 and 2). The shared helper stays (Alternative O). Optionally derive `legacy` from the draft hook's own initial read, and extract a small pure function for the notice text and `canSave` expression so unit tests can cover them. Advisory.

### Nit

11. **Plan details** (Stage 9). Item 12 removes legacy keys from the real storage, not the read-only view. Item 13 gives `failOnSet` and `failOnRemove` predicates and uses exact fixtures for "garbage" (`[]`, the string `"not json"`, `[1, null]`). Silence `console.warn` with `mockImplementation(() => {})` and restore it. Item 5's `read` delegates to `base.read`, not `cpfOaAdapter.read`. The page heading shows the old name until Phase 4. Expand the yearly table before copying it for the maths comparison. Add tests for a corrupt new key and a far-future `savedAt`. Reduce `failOnRemove` rollback caveats to one line.
12. **Documentation polish** (Stage 7). "Terms" and the pseudo-headings should be real headings, and Terms should come before the terms are used. Add a "Security: none, local-only. Scalability: single record" line. Say "Rollback after a Save is out of scope. Recovery: import a backup exported before the release." Say where the success criteria and verification live. Use full paths on first mention. Note that the brief link breaks if only the spec is committed. Add CUJs for Discard during a pending migration and for Save failure, or drop the matching risk rows.
13. **Import `savedAt` special case** (Stage 5 zoom-out Nit 5). Add a one-line comment in `import.ts`. Drop the registry-order remark in item 6. The tagline hard-coding is accepted unless `toolMeta` can expose `tagline` cheaply.
14. **Scale framing** (Stage 5 zoom-out Nit 4). Say the 15-file cost is accepted to preserve data, not justified by user count.

## Notes

- The reviewers were told not to re-argue Alternatives D, E, F, L, M and O; the Stage 7 reviewers still raised D, noting that its stated reason is preference.
- The design document and the brief are unchanged by this review.
