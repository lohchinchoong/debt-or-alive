# Consolidated Review Report

**Target:** `docs/designs/cpf-oa-annuity-calculator.md`
**Mode:** Consolidated report, all rubrics (no remediation applied; the document is unchanged by this review)
**Stage reports:** `zoom_out_report.md` (5), `comprehension_report.md` (6), `critic_report.md` (7), `intermediate_zoom_out_report.md` (8), `implementation_readiness_report.md` (9)

## Verdict

The goal and the page shape are sound. The design is not ready to implement. Two things drive that:

1. The persistence plumbing is wider than the problem needs. The legacy key is handled in three places (read path, save path, import), and that causes most of the Stage 6, 7 and 9 findings. Stages 5 and 8 both recommend deciding the simplifications first, because fixing the other findings in place would add text to machinery that may be cut.
2. The document lacks a Risks & Mitigations section (Stage 7 Blocker) and a phased, ordered implementation plan (Stage 9 Blocker). It also has one data-loss hole in import (Stage 9 Blocker).

Totals across stages, before deduplication: 4 Blockers, 32 Major, 24 Nit. After deduplication: 3 Blocker tasks, 11 Major tasks, 6 Nit tasks.

## Recommended order of work

1. Decide the three simplifications (action items M1 to M3 below).
2. Revise the Technical Plan to the chosen shape.
3. Then apply the remaining items. Items marked "may disappear" depend on step 1.

## Action items

### 🔴 Blocker

**B1. Add a Risks & Mitigations section.** Cover: rollback to the previous build loses the data; stale-tab and multi-tab races; storage unavailable or `removeItem` failing; a user who never presses Save loses the other scenarios; a legacy-only backup replaces the device record; hostile or mistyped backup contents reaching the maths; limits (single device, no sync). Write it after the simplification pass. Sources: S7-1, S8-5.

**B2. Define import behaviour for an unusable legacy key.** If there is no winner, the legacy key counts as unused: skip the adapter, list the key in `keysSkipped`, write nothing, leave `toolsImported` unchanged. Today a legacy-only backup holding `[]` or garbage overwrites the device's OA record with defaults. Define "took part", "used", "overlay", "carried" and the other terms with real identifiers. May shrink if the backup is normalised before the import loop. Sources: S9-2, S7-3, S6-6.

**B3. Phase the implementation plan.** The 16-item list breaks the build mid-way (item 2 removes exports that items 4, 8, 9 and 12 still need; item 8 copies from a file item 9 deletes). Suggested phases: types, `tool.ts` and new adapter registered with old paths intact; atomic switch of `cpf-oa.ts`, registry, page, route deletion and tests; import, `DataPortability`, `ManualSaveNotice`; `tools.ts` and its test. Add `npm test`, `npm run lint` and `npm run build` checkpoints per phase. Source: S9-1.

### 🟡 Major

**M1. Choose when migration writes: on Save (current) or once on mount.** A mount-time `saveEntries` that writes the new key with the winner's `savedAt` and deletes the legacy key removes the window where both keys exist. That would remove `clearStaleLegacyKey`, the `canSave` override, the page-side `pending` and `others` state, `readLegacyOaState` and the two-helper confusion. Alternative E misses the `cpf-sa.ts` precedent, and the line between a mount-time delete (allowed) and a mount-time migration write (forbidden) is arbitrary. If kept as is, state the real costs. Sources: S5-1, S5-2, S5-3, S8-1, S8-2, S7-7, S7-11, S6-3, S9-11, S9-12.

**M2. Choose how import sees the legacy key.** Either normalise the backup before the import loop (a small `upgradeLegacyBackup(data)`), or specify the overlay change, the `savedAt` conditional at `import.ts` line 46, owned-key rules and `legacyDiscarded` semantics for the extended `importBackup`. The normaliser removes the second overlay view and the import-side legacy removal. Sources: S5-1, S7-3, S6-6, S6-7, S9-3, S9-4.

**M3. Close the export gap or document it as a risk.** Options: export through `adapter.read()`, which already falls back to the winner; export also reads `LEGACY_KEYS`; or warn in `DataPortability`. If the gap stays, document probability and impact, and note the mitigation only reaches users who open the calculator first. If export goes through the adapter, `LEGACY_KEYS` and the `ManualSaveNotice` change may not be needed. Sources: S5-4, S7-2.

**M4. Validate migrated params.** Feed the winner through the base adapter's `read` (reuses the `typeof` filtering and the `{ inputs }` shape), or add a `typeof` check, and state that no separate validation code is written. Return `savedAt: null` when the winner's date does not parse. Confirm `inputsAdapter.ts` behaviour first. Sources: S7-4, S8-3, S9-10, S9-16.

**M5. Argue proportionality.** Add two sentences on who is affected and why a migration is worth about ten shared-code branches. Revisit Alternative D accordingly. Source: S8-4.

**M6. Rewrite the Alternatives with concrete trade-offs.** Drop the "Rejected by author:" prefix where it restates a goal. Alternative A should name the cost that old bookmarks become 404s. Add: export emits the migrated legacy record; one-shot migration on first load; backup normaliser. Fix Alternative E (StrictMode argument, `cpf-sa` precedent) and Alternative F and G rationales (same inconsistency as S5-3). Sources: S7-5, S7-10, S5-3, S8-2.

**M7. Resolve undefined references and labels.** Link the brief once near the top. Replace "as decided", "Accepted by author" and the labels "option A", "option 1", "option 2", "option 3" and "migration option B" with descriptive headings. Add a short glossary (adapter, record, `savedAt`, date state, overlay, legacy key). Describe the Compound Interest pattern and the unsaved-changes guard once. List the date states (`"saved"`, `"legacy"`, never) and their effect on `LastSaved` and Save. Sources: S6-1, S6-2, S6-4, S7-6, S9-23.

**M8. Remove contradictions between the Technical Plan and the Detailed Plan.** Use one `canSave` expression, one set of names (`legacy.pending`, `legacy.others`, `readLegacyOaState`, `clearStaleLegacyKey`), one `ImportResult` shape (required or optional `legacyDiscarded`, with every construction site and the three `DataPortability` edits listed), one notice string with singular and plural wording, one place for the migration algorithm. Qualify "No write happens on load" in the Goals and CUJs if the stale-key effect stays. Sources: S5-6, S5-7, S6-3, S6-5, S7-7, S7-13, S9-4, S9-11, S9-24, S8-6.

**M9. Fix the notice copy.** The notice appears before Save and says "were not carried over". It should say that Saving removes them. Make N consistent between notice and import summary (`count - 1` over usable items, defined once). Define "usable" (non-null, non-array object). Sources: S5-5, S6-8, S9-3.

**M10. Make the page rewrite (item 8) unambiguous.** List the exact removals and edits (null-handling, `name`, `ProfileNameEditor` definition, unused imports, "All Scenarios" link, `set` and `handleSave`). List what stays unchanged (`YearRow`, `OA_RATE`, `MIN_START_AGE`, `fmt`, Parameters card, stat cards, error text, "How It Works" and disclaimer). Place hooks before the `status` early return. State the default-export pattern given CLAUDE.md. State the exact render order from `compound-interest/page.tsx` (`ManualSaveNotice` first, `LastSaved` after the tagline, migration notice position). Replace "Page copy" with exact strings or remove it. Sources: S9-8, S9-9.

**M11. Make the test plan executable.** Add `failOnRemove` to `memoryStorage.ts` (or an inline wrapper) and list it as a file; assert `console.warn` via `vi.spyOn`; create a `legacyKeys` demo adapter in `tool.test.ts` with a seeded key; decide item 16 (add the OA entry or mark no change); specify the `[profileId]` folder assertion or drop it; correct "items 11 to 15" and the "every branch" claim; give fixed inputs and record a baseline before deleting `[profileId]` for the manual comparison. Sources: S9-5, S9-6, S9-7, S9-13, S9-14, S9-22.

### 🟢 Nit

**N1. Open Questions entry already answered.** Move the "Calculator suffix" decision out of Open Questions. Sources: S5-6 (Nit), S6-10, S7-8.

**N2. Process notes in the Detailed Plan.** Make the `.next/types` clean-up conditional, name the Next.js guides to read or drop the sentence. Remove "about line N" references; use symbols. Sources: S5 Nit 3, S6-11, S9-15, S9-25.

**N3. Altitude and duplication.** Keep behaviour and interfaces in the Technical Plan; give the Detailed Plan file, responsibility and signatures only, with test coverage as a checklist per function. Mention that `cpfOaAdapter` is retired as a `ProfileAdapter` and the tests that depend on it. Sources: S5-7, S7-14, S8-6, S9-25.

**N4. Small precision fixes.** Type annotation for `cpfOaAdapter`; use `cpfOaAdapter.dateKey` or a shared constant instead of the repeated literal; update the `saveTool` doc comment; add a `LEGACY_KEYS` registry test; decide whether an empty legacy array counts as data for `ManualSaveNotice`; note the registry sync cost for future legacy keys. Sources: S9-17 to S9-21, S5 Nit 7.

**N5. Wording and terminology.** "Scenario" for user-facing text and "profile" for data, stated once; "legacy key" throughout; "Changes" instead of "Proposed Changes"; unsupported opinions (lines 19 and 40) and "written and checked" (line 114) restated; "moved unchanged"; full repo-relative paths; the Problem section should not end with the solution; single provenance line. Sources: S7-9, S7-15, S7-16, S9-23, S9-25.

**N6. Smaller design remarks.** Confirm SA, MA and HYSA will not need a different migration mechanism than `legacyKeys`; consider a shared card with `ManualSaveNotice`; state that the migration normalisation rules are moved from `readAll`, not rewritten; confirm zero-write tests still hold when the page mounts. Sources: S5 Nit 1 and 2, S7-12.

## Traceability matrix

S5, S6, S7, S8 and S9 numbers refer to findings in the stage reports of the same number.

| Consolidated item | Stage 5 | Stage 6 | Stage 7 | Stage 8 | Stage 9 |
| --- | --- | --- | --- | --- | --- |
| B1 Risks & Mitigations | | | 1 | 5 | |
| B2 Unusable legacy key on import | | 6 | 3 | | 2 |
| B3 Phasing | | | | | 1 |
| M1 Migration timing | 1, 2, 3 | 3 | 7, 11 | 1, 2 | 11, 12 |
| M2 Import approach | 1 | 6, 7 | 3 | 1 | 3, 4 |
| M3 Export gap | 4 | | 2 | 1 | |
| M4 Param validation | | | 4 | 3 | 10, 16 |
| M5 Proportionality | | | | 4 | |
| M6 Alternatives | 3 | | 5, 10 | 2 | |
| M7 References, labels, glossary | | 1, 2, 4 | 6 | | 23 |
| M8 Contradictions | 6, 7 | 3, 5 | 7, 13 | 6 | 4, 11, 24 |
| M9 Notice copy | 5 | 8 | | | 3 |
| M10 Page rewrite | | | | | 8, 9 |
| M11 Test plan | | | | | 5, 6, 7, 13, 14, 22 |
| N1 Open Questions | Nit 6 | 10 | 8 | | |
| N2 Process notes | Nit 3 | 11 | | | 15, 25 |
| N3 Altitude and duplication | 7 | | 14 | 6 | 25 |
| N4 Precision fixes | Nit 7 | | | | 17 to 21 |
| N5 Wording | | | 9, 15, 16 | | 23, 25 |
| N6 Smaller design remarks | Nit 1, 2 | | 12 | | |

## Notes for the author

- Stage 5 and Stage 8 disagree with Stages 6, 7 and 9 about order of work, not about substance. Making the three simplification decisions first (M1 to M3) avoids writing text that is then deleted.
- Stage 5 and Stage 8 reviewers recorded that they did not read every file in full. Finding M4 depends on `inputsAdapter.ts` behaviour that Stage 7 verified and Stage 8 did not re-read.
- No remediation was applied. The design file, the brief and the draft are unchanged.
