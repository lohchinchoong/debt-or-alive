# Stage 8: Intermediate Zoom Out Report

**Target:** `docs/designs/cpf-oa-annuity-calculator.md` (lines 1-363)
**Reviewer:** `egm-zoom-out` (completed)

Context sufficiency passes. The document is unchanged since Stage 5, so the Stage 5 verdict stands: the goal and page shape are sound, and the persistence plumbing is over-built. What Stages 6 and 7 add is a sequencing problem, plus a few points earlier reports missed.

Counts: 0 Blocker, 4 Major, 3 Nit.

## Blocker

None.

## Major

### 1. Fixing Stage 6 and 7 findings in place would harden machinery that Stage 5 says to cut
- **Scope:** Technical Plan (lines 84-144); Detailed Plan items 1-7 and 14-15.
- **Description:**
  - Stage 7 finding 3 asks for more import specification: the overlay change, the `savedAt` conditional at `import.ts:46`, "owned" semantics for unusable arrays, and `legacyDiscarded` semantics. Stage 7 finding 2 asks for an export fix, finding 4 for a validation step, and Stage 6 findings 1, 5 and 6 for a glossary and an import-flow description.
  - Most of this work exists only because the legacy key is handled in three places: the read path, the save path and `importBackup`.
  - The Stage 5 options remove the largest part of it. Normalising the backup before the import loop, or migrating once on mount, would make Stage 7 finding 3 and Stage 6 finding 6 mostly disappear. Adapter-based export would remove the export gap, `LEGACY_KEYS` and the `ManualSaveNotice` change.
  - If the author resolves the Stage 6 and 7 findings first, the document grows and the cut becomes harder to make.
- **Recommendation:**
  1. Make the three Stage 5 simplification decisions first: mount or save-time migration; backup normaliser or an extended `importBackup`; export through the adapter or not.
  2. Revise the Technical Plan to the simplified shape.
  3. Then apply only the Stage 6 and 7 findings that still apply.
  - Findings that would not survive the cut: Stage 7 findings 3 (overlay and `savedAt`) and 7 (two helpers), and parts of 2 and 6.

### 2. The design's own precedent supports the simpler option, and Alternative E misstates it
- **Scope:** Alternative E (lines 210-214); Stale old key on load (line 118).
- **Description:**
  - `cpf-sa.ts` (lines 32-50) already runs a one-time legacy migration inside `readAll`. It writes through `saveEntries`, is documented as a declared exception to "Save is the only write", and sets no date. The project has already accepted a one-time migration write for this class of change.
  - Alternative E cites `useToolDraft` and `toolAdapters.test.ts`. That rules out a write inside a `ToolAdapter` read. It does not rule out one explicit migrate-once step on mount.
  - The design already permits one mount-time write for deleting a key (`clearStaleLegacyKey`) and forbids one for writing the migrated record. The line is arbitrary.
  - A single mount step that writes the new key and then deletes the old one avoids the window where both keys exist. That window is why the design needs `clearStaleLegacyKey`, the `canSave` override, the page-side `pending` and `others` state, and the export gap.
- **Recommendation:** Add the `cpf-sa` precedent to Alternative E and re-evaluate mount migration as one `saveEntries` call that keeps the winner's `savedAt`. If it is still rejected, state the real costs: a page view writes, and a second tab could interleave.

### 3. Type validation of migrated params has a free reuse path
- **Scope:** Pure migration function (lines 93-98); Read path (line 107); Stage 7 finding 4.
- **Description:**
  - The fallback returns `winner.params` unvalidated, while `createInputsAdapter.read` drops mistyped values.
  - The simplest fix is not a new typeof check. Serialise the winner as the flat record and run it through the wrapped adapter's own `read`, for example through a one-key in-memory view. That reuses the existing validation and the `{ inputs }` shape, removes the hand-built `{ record, savedAt, exists }` return, and lets the migration function return a plain object.
- **Recommendation:** Add "feed the winner through the base adapter's read" to the plan and state that no separate validation code is written.
- **Caveat:** the reviewer did not re-read `inputsAdapter.ts` and relies on the Stage 7 verification that `read` drops mistyped values. Confirm before adopting.

### 4. Proportionality is never argued
- **Scope:** The Problem (lines 19-21); Goals (lines 27-31); Alternative D.
- **Description:** This is a client-only, localStorage-only app. The document does not state or estimate how many users hold several saved OA profiles. Alternative D (no migration) is rejected only with "the most recent profile should pre-fill". Without a population estimate, a reader cannot tell whether about 10 new shared-code branches are proportionate. Stages 5 and 7 both took the migration as given.
- **Recommendation:** Add two sentences on who is affected. If the number is small, use the cheapest migration that preserves the latest profile. Keep full import and export handling only if old backups are a real, expected path.

## Nit

### 5. The Stage 7 Risks and Mitigations Blocker is a symptom of mechanism count
- **Scope:** Stage 7 finding 1; lines 21, 114, 118, 144.
- **Description:** Most listed risks come from one deletion happening in three places at different times: rollback loses data, stale tab, `removeItem` failure, export gap. A simpler migration shrinks the risk table.
- **Recommendation:** Write the table after the simplification pass, not before.

### 6. The Detailed Plan altitude problem (Stage 5 finding 7) is worse than reported
- **Scope:** item 2 (line 251), item 5 (lines 273-277), item 8 (lines 296-299), item 13 (line 327).
- **Description:** Item 2 repeats the migration algorithm, including tie-breaks and `Date.parse`, which already appears at lines 93-100. Item 8 includes `useState` initialiser code and `setDraft` spreads. Item 13 lists about 25 test cases. The duplicates will drift; the line 122 versus line 299 mismatch (Stage 6 finding 3) is an example.
- **Recommendation:** Keep the algorithm once, in the Technical Plan. In the Detailed Plan, give file, responsibility and exported signatures only, and replace the case lists with a coverage statement.

### 7. Positive: reuse choices remain correct
- The Compound Interest page template, `createInputsAdapter` and the 404-by-deletion route choice need no change. The Stage 5 "found sound" list still holds.
- The `import.ts` read (lines 34-67) confirms that the `owned` and overlay mechanisms are narrow, and a pre-normalised `data` object would pass through the existing loop unchanged.

## Verdict deltas versus Stage 5

- **Altitude:** still too low in the Detailed Plan, and the document will grow if Stage 6 and 7 findings are fixed first.
- **Scope:** still wider than the problem needs. The shared persistence layer, import, export and `ManualSaveNotice` are all touched for one tool's one-time migration.
- **Simplicity:** unchanged, with one new point. The `cpf-sa` precedent and the base adapter's own validation both support the simpler path (findings 2 and 3).

## Recommended order

1. Decide the three simplifications.
2. Revise the Technical Plan.
3. Then apply the remaining Stage 6 and 7 findings: glossary, brief and option labels, Risks and Mitigations table, Open Questions entry, Alternatives rationales.
