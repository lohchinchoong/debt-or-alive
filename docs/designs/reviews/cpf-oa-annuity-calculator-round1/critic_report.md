# Stage 7: Critic Review Report

**Target:** `docs/designs/cpf-oa-annuity-calculator.md`, FeatureRange lines 1-233
**Reviewers:** `egm-design`, `egm-structural`, `egm-style` (all completed)

Severity breakdown: 1 Blocker, 7 Major, 8 Nit.

Note on the Blocker: `egm-structural` raised it as a Blocker and `egm-design` rated the same gap Major. The higher rating is kept because the feature-spec standard requires the section. The reviewers checked claims against the code and confirmed several: `useToolDraft.canSave`, the import overlay throwing on writes, the `createInputsAdapter` shape and the existing legacy `balanceAt55` rules. `egm-style` did not check the codebase.

## Blocker

### 1. No Risks & Mitigations section
- **Lenses:** egm-structural (Blocker), egm-design (Major)
- **Scope:** whole document. Risk content is scattered at lines 21, 114, 118 and 144.
- **Gap:** the standard requires failure modes, security and privacy, limits and mitigations to be explicit. The spec does not cover:
  - Rollback to the previous build loses the data, because Save deletes `cpf-oa:profiles`.
  - Multi-tab and stale-tab races.
  - `localStorage` unavailable, or quota exceeded during `removeItem`.
  - A user who never presses Save silently loses the other scenarios.
  - A legacy-only backup replaces the device's OA record (line 66).
  - Hostile or unvalidated backup contents reaching the maths.
- **Fix:** add `## Risks & Mitigations` as a table of risk, impact and mitigation. Move or cross-reference the scattered items. State the limits, for example single device and no sync.

## Major

### 2. The accepted export gap is silent data loss
- **Lens:** egm-design. egm-style also flagged that the mitigation is overstated.
- **Scope:** line 144, Registry.
- **Gap:** a user who exports after the release but before pressing Save gets a backup with no OA data and no warning. The notice and Save button only help users who open the calculator page. "Accepted by author" is not a risk analysis.
- **Fix:** adopt a fix or document the probability and impact. Two fixes: make export use each adapter's `read()`, which already falls back to the legacy winner without writing; or have `DataPortability` warn when a legacy key is present and the new key is absent. State that the mitigation only applies to users who visit the page first. Add the export alternative to the Alternatives section.

### 3. Import design is under-specified
- **Lens:** egm-design
- **Scope:** lines 128-138.
- **Gaps:**
  - Hiding the device's new key requires changing `overlay()` in `import.ts`, which today falls through to storage. The spec does not say it is a change or how the overlay learns which keys to hide.
  - `import.ts` (about line 46) passes `savedAt` only when `adapter.dateKey in data`. A legacy-only file has no date key, so the winner's `savedAt` would be dropped, contrary to line 133. The conditional must change, and the spec does not say so.
  - "Counts as owned only when it was used" (line 135) is undefined for an empty, invalid or non-array legacy value. CUJ 3 says a legacy-only backup replaces the device record, so an unusable array could overwrite it with defaults.
  - Import deletes the legacy keys of every participating adapter, even when the new key won. State that this is intended.
  - `legacyDiscarded` has no semantics. Say whether it is N-1 and what happens when N is 1.
- **Fix:** specify each. An unusable legacy array should leave the device record untouched and be reported in `keysSkipped`.

### 4. Migrated parameters skip type validation
- **Lens:** egm-design (Major, borderline Nit)
- **Scope:** lines 95-96 and the fallback read at lines 106-107.
- **Gap:** the migration normalises with `??` only. A string or NaN `birthYear` from an old key or an imported file reaches `simulate`. `createInputsAdapter.read` drops mistyped values, but the fallback returns `winner.params` directly.
- **Fix:** run the winner through the same typeof check, or through `validate`, and say so in the spec.

### 5. Alternatives rationales are assertions
- **Lenses:** egm-structural, egm-design, egm-style
- **Scope:** lines 190, 196, 202, 208, 214, 220, 226, 232.
- **Gap:** every entry ends "Rejected by author:". Several restate a goal rather than a trade-off: B ("the goal is a generic calculator"), C ("the other profiles are to be deleted"), D ("the most recent profile should pre-fill"), H ("the notice states how many... and nothing more"). Alternative A omits the cost that old bookmarks become 404s. The standard forbids attributing a rejection to a maintainer without a link.
- **Fix:** drop the "Rejected by author" prefix and state the concrete cost or complexity trade-off in each. Link the brief where it is the source.
- **Missing alternatives (egm-design):** export emits the migrated legacy record; a one-shot migration on first app load with no page-level `pending` and `others` state; handling legacy keys as a separate backup-normaliser step instead of inside `importBackup`.

### 6. The brief and decision labels are unresolved
- **Lenses:** egm-style, egm-structural
- **Scope:** lines 46, 107, 118, 120, 124, 144, 210, 218, and the "(option A)" heading at line 102.
- **Gap:** "the brief", "as decided" and "Accepted by author" are never sourced. "Option A", "option 1", "option 2", "option 3" and "migration option B" are never defined. "Option 2" means a Save override at line 120 but a `ToolRead` field at line 218.
- **Fix:** link `docs/designs/cpf-oa-annuity-calculator.brief.md` once near the top and replace "as decided" with a section reference. Replace the option labels with descriptive headings.

### 7. Two helpers are described inconsistently
- **Lenses:** egm-style (Major), egm-structural (Nit)
- **Scope:** lines 118, 122, 126.
- **Gap:** line 118 names `clearStaleLegacyKey`, called from a mount effect. Line 126 describes an unnamed helper returning `{ pending, others }`, called from a `useState` initialiser. Line 122 says `legacyPending` is "the helper's `pending`", so the reader cannot tell which helper. "Both to false" (line 122) and "empty values" (line 126) differ.
- **Fix:** name the second helper, for example `readLegacyNotice`. Merge or cross-link the Enabling Save and Notice sections and use one wording.

### 8. Open Questions holds a resolved decision
- **Lenses:** egm-structural, egm-design, egm-style
- **Scope:** lines 44-46.
- **Gap:** the "Calculator suffix" item says "the brief treats this as intended", so it is not open.
- **Fix:** move it to Overview or Non-Goals as a decision, or name an owner and a deadline.

## Nit

9. **Unsupported or unevidenced claims (egm-style).** Lines 21 and 207 say an old backup import would "report success while skipping the OA data". Cite the mechanism: the key is skipped as unknown (line 135). Line 114 says the new key is "written and checked", but `saveEntries` only returned ok; say that. Line 19 says "the user wants a quick calculation" and line 40 says the tab subtitle "does not fit". Both are opinions presented as facts.
10. **Alternative E's StrictMode argument (egm-style).** Line 213 cites the StrictMode double call against migrate-in-read. The page's own read-only initialiser (line 126) has the same double call. Say the objection is the writes.
11. **Page-level notice duplicates the hook's read (egm-design).** The second read in the `useState` initialiser can disagree with the hook's read if another tab writes between them. The `canSave` expression at line 122 is redundant, because `others > 0` implies `pending`. Add an honest cost note to Alternative F.
12. **Stale-key deletion on mount (egm-design).** It is a second exception to "Save is the only write", alongside the manual-save-notice dismissed flag. Confirm the zero-writes tests still hold when the page mounts. State that the effect is idempotent under StrictMode.
13. **Repeated rules and inaccurate summary (egm-design, egm-style).** The winner rule is repeated in Goals, CUJ 2, CUJ 3 and the migration function section; the Save-enabled rule is split across two sections. Point to one canonical section. Line 84 says "Three small additions" and "No hook or shared-record type changes", but lines 118 and 126 add two more helpers and `ToolAdapter` and `ImportResult` change. Drop "small" and say "no change to `useToolDraft` or `ToolRead`". "Compound Interest pattern" is stated three times (lines 13, 26, 84).
14. **Existing code to retire is not acknowledged (egm-design).** `cpfOaAdapter` is currently a `ProfileAdapter` with `readAll` and `newProfile`. `profileAdapters.test.ts` and `tools.test.ts` (about line 36) depend on it, and the legacy-shape test must be re-pointed at the migration function. Mention this in the Architecture summary.
15. **Terminology and structure (egm-style, egm-structural).** "Scenario" and "profile" are used interchangeably; pick scenario for user-facing text and profile for data, and say so once. The Problem section ends with a solution statement at line 21. "Overlay", "read view" and "winning profile" (line 133) are undefined. Paths are inconsistent: `adapters/cpf-oa.ts` is relative, `lib/persistence/tool.ts` is partial, `src/lib/tools.ts` is full. Use full repo-relative paths.
16. **Wording (egm-style).** Use "moved unchanged" instead of "moved as they are" at line 158. Split the three-clause sentence at line 133.

## Kept as strong (no action)

The Non-Goals list, the CUJ Given/When/Then format, the data-flow diagram, the explicit "declared exception" wording at line 118, and the heading hierarchy.
