# Round 2, Stage 7: Critic Review Report

**Target:** `docs/designs/cpf-oa-annuity-calculator.md`, FeatureRange lines 1-279
**Reviewers:** `egm-design`, `egm-structural`, `egm-style` (all completed; feature-spec standard applied to design and structural)

Severity: 0 Blocker, 5 Major, 11 Nit. The checks the reviewers ran against the codebase held, with one exception (Major 2). They covered the date-state table, the import overlay throwing on writes, the `ManualSaveNotice` and `DataPortability` use of `REGISTERED_KEYS`, the tab subtitles and the zero-writes-on-read test. All required feature-spec sections are present and well-formed.

## Blockers

None.

## Major

### 1. Rejection rationales rest on author preference
- **Lenses:** egm-design, egm-structural
- **Scope:** Alternatives D, F, G, H, J (lines 232-236, 244-248, 250-254, 256-260, 268-272); line 46; the risk row at line 202.
- **Issue:** The feature-spec Alternatives rule requires concrete technical or scope trade-offs and bars attributing a rejection to a maintainer without a linked source. D, F, G, H and J say "the author prefers/accepts/wants". D and F are the simpler options, and D is admitted to be the cheapest. G has a concrete reason in its Cons but not in its Reason for Rejection.
- **Recommendation:** restate each as a trade-off, such as the "reads never write" invariant, code size, or a shared-hook change. For F, argue why a write on visit is unacceptable. For D, state why saving four numbers per user justifies about six touched persistence modules. If it is only preference, say so and link the decision record. Count the chosen design's added surfaces (`legacyKeys`, `readLegacy`, a wrapper `read`, `readLegacyOaState`, `clearStaleLegacyKey`, a `canSave` override, a `saveTool` change, an import rule, `legacyDiscarded`, `LEGACY_KEYS`). That is the cost F avoids.

### 2. Alternative F's pros and cons do not match the design or the precedent
- **Lens:** egm-design. **Scope:** lines 244-248.
- **Issue:** F claims "no window where both keys exist" and that it removes `clearStaleLegacyKey`. A write followed by `removeItem` is not atomic: a failed removal, or an old tab recreating the key, still leaves both keys, the same risk as risk rows 203 and 206. The `cpf-sa.ts` precedent (lines 37-50) migrates inside `readAll`, which is Alternative E, not "once on mount".
- **Recommendation:** state that F saves the `canSave` override and the notice state but not the stale-key cleanup. Cite the precedent under E, and note that E's "must swallow the error" cost already has precedent.

### 3. Load deletes the legacy key when the new key is unreadable
- **Lens:** egm-design. **Scope:** lines 140-142, 200, 206.
- **Issue:** `clearStaleLegacyKey` removes the legacy key when the new key "exists". The spec never says "exists" means "parses". If the new key is corrupt or mistyped, the base read falls back to defaults, and load would delete the only valid legacy data with no user action. That contradicts "Nothing is lost until Save" (line 200) and is the hazard the import path guards against.
- **Recommendation:** remove the legacy key only when the new key parses as an object; otherwise leave it. Add the case to the risk table and the tests.

### 4. Terminology rule is stated but not followed
- **Lens:** egm-style (also a Nit from egm-structural). **Scope:** lines 12, 18, 24, 32, 36, 66, 109.
- **Issue:** Line 18 sets "profile" for data and "scenario" for user-facing text. Line 32 uses "saved profile" in a goal. Lines 12, 36 and the CUJs say "scenarios" for stored data. The legacy key `cpf-oa:profiles` is not named where "legacy key" first appears (line 24).
- **Recommendation:** use "profile" for data and code, and "scenario" only in UI text and CUJ wording about the UI, or drop the Terms paragraph. Name the key where it is first used.

### 5. Uncalibrated and subjective claims in The Problem
- **Lens:** egm-style (the user-count point also raised by egm-design as a Nit). **Scope:** lines 22, 26, 202, 234, 247.
- **Issue:** "At most about 10 users" has no source and hedges itself, and is reused at lines 202 and 234 to justify accepting the export gap and rejecting alternatives. "Keeps the cost in proportion" is a judgment. "Old backups are an expected path only for those same users" has no evidence. Line 22 states "a one-off what-if" and "the calculation does not need" as fact.
- **Recommendation:** give the user count once as the author's assumption with its source and reuse it by reference. Replace the proportion claim with the concrete cost. Reword line 22 to say the list, create, delete and name-editor flows exist only to manage profiles.

## Nit

6. **Understated migration cost (line 26)** (egm-design, egm-structural). "One adapter method" and "several shared modules" understate the work; the module list sits in the Detailed Implementation Plan. Name the modules in the Summary of changes or add a section anchor.
7. **Possible hydration mismatch (lines 131, 135, 169)** (egm-design). The notice state is read in a `useState` initialiser guarded for the server render, so it differs between server and client. State that the notice and `canSave || legacy.pending` render only when `status === "ready"`.
8. **Import summary gating (line 154)** (egm-design). The "latest of N" text depends only on `toolsImported > 0` and `legacyDiscarded > 0`. In a mixed backup this is not tied to the OA adapter taking part. Gate it on a flag from the OA adapter.
9. **Two reads can drift (line 135)** (egm-design). `readLegacyOaState` duplicates the "new key absent and winner exists" decision in `read()`. Derive both from one function, or list a test that asserts they agree.
10. **Alternatives B, C, A and K are thin (lines 218, 224, 230, 278)** (egm-structural, egm-style). B's reason restates the goal; every "Reason for Rejection" repeats "Not chosen:"; A's claim that a 404 "matches how the rest of the app treats unknown routes" has no evidence. Add one concrete cost each and drop the prefix.
11. **Alternatives I, J and K bundle several options (lines 262, 268, 274)** (egm-structural). Pros, Cons and Reason mix the options. Split them, or label each option as H does.
12. **Line 45, "This exists today."** (egm-structural, egm-style). A dangling fragment. Replace with "The subtitle is unchanged by this design."
13. **Risks table (line 202)** (egm-structural, egm-style). "Probability: low" sits inside the Impact cell and the table has no Probability column. Add a Likelihood column to every row, or fold the wording into Mitigation, and give a basis for "low". Line 72, "as for every other tool", needs a cite to the import tests.
14. **Risks coverage and the Limits line (lines 195-210)** (egm-structural, egm-style). The standalone "Limits:" line duplicates line 26. Move it into the table or drop it. Add an explicit statement of no further security implications (no network, no PII beyond the user's own numbers).
15. **Defensive caveats and jargon (lines 127, 135, 142, 153, 246)** (egm-style). Drop or move "affects the notice text at worst" (line 135). Replace "harmless" (line 142) with "idempotent: removing an absent key does nothing". Replace "best effort" with "a failed removal is logged with `console.warn` and ignored". Replace "The new key is on the device only because `saveEntries` returned ok" with "Nothing is removed unless `saveEntries` returned ok". Name the source of the quoted "runs once, then deletes" (line 246).
16. **Dense sentences (lines 104, 113, 146-154)** (egm-style). Several carry multiple rules in one sentence or bullet. Split into one rule per sentence.
