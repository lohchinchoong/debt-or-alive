# Round 2, Stage 8: Intermediate Zoom Out Report

**Target:** `docs/designs/cpf-oa-annuity-calculator.md` (lines 1-411)
**Reviewer:** `egm-zoom-out` (completed; read `cpf-sa.ts` directly)

Verdict: 0 Blocker, 2 Major, 3 Nit. Altitude and scope verdicts are unchanged (the migration is still out of proportion), but Stages 6 and 7 change how to shrink it. The reviewer checked `cpf-sa.ts` directly, and it contradicts a Stage 5 premise (Major 1).

## Blocker

None.

## Major

### 1. Stage 5 recommended Alternative F on a precedent that does not exist; the shrink path needs re-deriving
- **Scope:** lines 244-248, plus Stage 5 finding 1.
- **Evidence:** `src/lib/persistence/adapters/cpf-sa.ts` lines 34-62 show `migrateLegacy` is called from the adapter's `readAll` (line 62) and calls `saveEntries` (line 48). That is migrate-inside-read, which is Alternative E, not a "migrate once on mount" precedent. Stage 7 Major 2 is correct and Stage 5 was wrong on this point.
- **Effect:** F has no codebase precedent, and F still needs stale-key handling, because a failed `removeItem` or an old tab can recreate the legacy key. The design rejects E on the grounds that "reads never write", yet `cpf-sa` already declares that exception. So the real precedent favours E, which is smaller than the chosen design. It would drop `readLegacyOaState`, the `canSave` override, `clearStaleLegacyKey` and the notice's second read.
- **Cost of E:** the notice count has to be captured at migration time. The read-only import view throws on writes, so import needs a separate path regardless.
- **Recommendation:** the author should decide between D (drop the migration) and E (follow the `cpf-sa` precedent). If "no writes until Save" is kept, say plainly that it is a new invariant that `cpf-sa` already breaks, and that it costs the five extra pieces of machinery listed above.

### 2. `clearStaleLegacyKey` is the cheapest cut and also the riskiest piece
- **Scope:** lines 140-142, 203, 206; plan item 4 and the item 9 tests.
- **Issue:** The read path (line 123) already ignores the legacy key once the new key exists, and Save and import already remove it. A leftover legacy key is inert. It affects only `ManualSaveNotice` (which already counts legacy keys) and a few stored bytes.
- **Cost:** a page mount effect, an exception to Goal 2, a StrictMode note, three risk rows, a `failOnRemove` test helper and a test block. Stage 7 Major 3 shows it can delete the only good data when the new key is corrupt, which makes it a hazard and not just overhead.
- **Recommendation:** delete it. Leave a stale legacy key alone on load, remove it at the next Save or import, and keep the zero-writes-on-visit rule without an exception. This is separate from, and smaller than, the F/D debate, and works with either choice. It also removes the exception that Stage 5 finding 2 flagged as breaking pattern consistency.

## Nit

3. **Cost accounting is stated three ways and none is complete (lines 26, 234, 236; Stage 7 finding 6).** The design says "one adapter method", "several modules" and "extra code". The plan touches about 12 source and test files. State the count once in the Problem, so the D versus chosen-design trade-off is checkable without reading the plan.
4. **The `ManualSaveNotice` change protects a one-time notice (item 12, line 160).** The cost is a shared-component change, a `LEGACY_KEYS` export and a manual test. The benefit is that a user holding only the legacy key does not see the existing manual-save notice once. If the author keeps the migration, this item is the first to drop. Prefer dropping it to keeping it with a caveat.
5. **Altitude: leave the code-level plan, with one change.** The reviewer agrees with Stage 5 that the altitude problem in items 4, 6 and 9 is a Nit, because the detail is accurate. After the cuts in Major 1 and Major 2 the plan shrinks by about a third on its own. Edit the plan after the author's decision, not before.

## Passes (unchanged)

Dropping profiles, reusing `createInputsAdapter` and `useToolDraft`, using a 404 instead of redirects, keeping the maths unchanged, rejecting a dismissal flag and a picker, and validating the legacy winner through the base `read`.
