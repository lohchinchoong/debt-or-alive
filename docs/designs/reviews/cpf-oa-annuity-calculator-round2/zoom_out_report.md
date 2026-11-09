# Round 2, Stage 5: Initial Zoom Out Report

**Target:** `docs/designs/cpf-oa-annuity-calculator.md` (lines 1-411)
**Reviewers:** `egm-zoom-out`, `egm-inventive-catalyst` (both completed)

Severity: 0 Blocker, 5 Major, 4 Nit. Context sufficiency passed. Neither reviewer found a factual contradiction with the codebase. They checked `import.ts`, `saveTool`, the `useToolDraft` `canSave` rule, the `cpf-sa.ts` `migrateLegacy` precedent and `cpfOaAdapter` still sitting in `PROFILE_ADAPTERS`. Zoom Out treated finding 1 as a Blocker-grade concern but raised it as Major because the author accepted it explicitly.

## Blockers

None.

## Major

### 1. The migration is out of proportion to the data it protects
- **Lenses:** egm-zoom-out (primary), egm-inventive-catalyst (same point, framed as a false compromise)
- **Scope:** lines 20-26, 102-160, 232-236, 244-248, 280-387
- **Issue:** About 10 users would each re-enter four numbers. To avoid that, the design adds `legacyKeys` and `readLegacy` on the shared `ToolAdapter`, a `LEGACY_KEYS` export, a removal step in `saveTool`, an import branch with `legacyDiscarded`, a `ManualSaveNotice` change, `readLegacyOaState` and `clearStaleLegacyKey`, a page-level `canSave` override, a migration notice and a `failOnRemove` test helper. That is roughly 9 to 12 files. Alternatives D and F were rejected on "author prefers", not on a technical reason, and the document calls D the cheapest option.
- **Recommendation:** re-confirm with the author that the carry-over is worth this surface. If something must survive, adopt Alternative F (precedent in `cpf-sa.ts`; removes `clearStaleLegacyKey`, `readLegacyOaState`, the `canSave` override and the stale-key rules). Otherwise take Alternative D. If "no writes until Save" stays, a smaller structural fix is a `pendingMigration` field returned by the adapter's `read`, with `canSave` computed in the hook, which removes the second read and the page override.

### 2. The "read-only until Save" rule produces a workaround stack and a pattern exception
- **Lenses:** egm-zoom-out (primary), egm-inventive-catalyst
- **Scope:** lines 129-142
- **Issue:** The `canSave` override, the second legacy read for the notice and the mount-effect deletion all compensate for one rule. The document admits the two reads can diverge across tabs. A page effect that deletes storage contradicts Goal 2 ("written only on Save"); it is declared an exception but breaks consistency with the Compound Interest page. Stale-key cleanup only happens if the user revisits the page.
- **Recommendation:** treat the override as a sign the abstraction is wrong. Move the logic into the adapter and hook (finding 1), or use F or D.

### 3. Import grows a branchy "participating adapter" concept
- **Lenses:** egm-zoom-out (Major), egm-inventive-catalyst (Nit)
- **Scope:** lines 144-154, 356-364 (item 10)
- **Issue:** `importBackup` gets separate rules for the both-keys, legacy-only and unusable-legacy cases, post-save legacy removal, and `legacyDiscarded` on four return paths. The overlay view falls through to device storage, so an adapter's `read(view)` could pick up a device legacy key; the document avoids that only through case analysis, which is fragile. The coupling moves into a generic legacy concept that only one adapter uses.
- **Recommendation:** if legacy-backup import stays, keep it minimal: convert the legacy value before the loop (Alternative G), or let the adapter own the upgrade, for example `adapter.upgradeBackup?.(data)` returning entries plus an optional note. Consider dropping the `legacyDiscarded` summary sentence. Trade-off for the note approach: UI strings leak into the persistence layer.

### 4. Export gap silently loses OA data in backups
- **Lens:** egm-inventive-catalyst
- **Scope:** line 202 (Risks), lines 256-260 (Alternative H)
- **Issue:** A user who exports before the first Save gets a backup with no OA data while the device still holds the legacy key. That is a silent data-loss path in a backup tool, and backup is also the document's only recovery route for rollback (line 199). Rejecting H as "widening export" is a false dichotomy.
- **Recommendation:** use Alternative F (one-time write at load), or add a narrow export rule: emit a legacy key only when its adapter's new key is absent. Import already reads legacy keys. Trade-off: backups can then hold a key the new build never writes.

### 5. Save irreversibly deletes the other scenarios, with only a notice as mitigation
- **Lens:** egm-inventive-catalyst
- **Scope:** lines 125-127, 135-138, 201, 274-278
- **Issue:** The loss is treated as a given rather than a cost. Alternative C was rejected as "nobody can see it", but the legacy key could stay until the user chooses to discard it.
- **Recommendation:** keep the legacy key after Save and remove it only through an explicit "Discard old scenarios" action or after N days, or register a small archive key so the scenarios travel in exports. Either conflicts with the "no backup copy" Non-Goal, so it needs an author decision, and it lengthens the stale-key handling. This conflicts with the direction of findings 1 and 3, which shrink the migration; resolve it together with finding 1.

## Nit

### 6. The Detailed Implementation Plan drops into code-level detail (Zoom Out rated it Major)
- **Lens:** egm-zoom-out. **Scope:** lines 280-387 (items 4, 6, 9, 15).
- Exact `useEffect` and `useParams` import removals, state initialisers, the `setDraft` merge expression, the StrictMode note, a per-case unit-test list and `read`/`readLegacy` wiring written as code. State interfaces, behaviours and test intent in a few lines each. Mapped to Nit because the detail is accurate and helps implementers; the objection is altitude, not correctness.

### 7. `readLegacy` steps 1-5 are pseudocode-level
- **Lens:** egm-zoom-out. **Scope:** lines 111-119.
- The tie-break and date-parse rules are over-specified for about 10 users. Reduce to "pick the latest `savedAt`; ties and undated resolve to the last item; run the winner through the base `read`". Keep the reuse of the base `read` for validation.

### 8. Optional members on the shared `ToolAdapter` are speculative generality
- **Lens:** egm-zoom-out. **Scope:** lines 295-298, 316-317.
- Only one adapter uses `legacyKeys` and `readLegacy`. If the migration stays, keep the logic local to `cpf-oa.ts` and `import.ts`. This is the reduced-surface fallback if finding 1 is not accepted.

### 9. Maths-equivalence check is manual, and some risk rows exist only because of the machinery
- **Lenses:** egm-inventive-catalyst (maths check), egm-zoom-out (risk rows). **Scope:** line 395 and lines 284-291 (maths check), lines 195-210 (risks).
- Goal 7 ("identical results") is verified by eye on one input set. Before deleting `[profileId]`, add a vitest golden test of `simulate` and `solveMonthlyDrawdown`, including 1982/55/150000/75, exporting from the page module or copying the functions (moving to `src/lib` is a Non-Goal). Several risk rows (`removeItem` failure, two-tab migration, an old tab recreating the key) exist only because of the extra machinery; revisit the table once finding 1 is resolved.

## What passes

- Dropping the profile concept.
- Reusing `createInputsAdapter` and `useToolDraft`.
- Using a 404 instead of redirects.
- Leaving the maths unchanged.
- Rejecting a stored dismissal flag and a scenario picker.
- Reusing the base adapter's `read` for legacy validation.
