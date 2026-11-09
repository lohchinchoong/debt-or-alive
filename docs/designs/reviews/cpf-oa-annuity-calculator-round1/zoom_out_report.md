# Stage 5: Initial Zoom Out Report

**Target:** `docs/designs/cpf-oa-annuity-calculator.md` (lines 1-363)
**Reviewers:** `egm-zoom-out`, `egm-inventive-catalyst` (both completed)

Context sufficiency passes. There are no Blockers. Both reviewers checked these claims against the codebase and found them accurate: `createInputsAdapter` writes the flat record; `useToolDraft.canSave` is `isDirty || dateState !== "saved"`; `saveTool` has no cleanup step today; the import overlay throws on writes; `ManualSaveNotice` and export use `REGISTERED_KEYS` only; `compound-interest/page.tsx` is the right template. Not every file was read in full: the inventive-catalyst reviewer did not read `useToolDraft`, `ManualSaveNotice`, `DataPortability`, `cpf-oa.ts` or `toolAdapters.test.ts` in full.

## Blockers

None.

## Major

### 1. The migration is over-built for one record from one tool
- **Lenses:** zoom-out, inventive-catalyst
- **Scope:** Technical Plan (lines 84-138) and Detailed Plan items 1-8.
- **Issue:** The design touches five shared modules to convert one profile: `legacyKeys` on `ToolAdapter`, a `saveTool` cleanup loop, a second import overlay view, `LEGACY_KEYS` in the registry, a `ManualSaveNotice` change, `legacyDiscarded` on `ImportResult`, `DataPortability` summary text, a mount-effect cleanup helper and a notice-state helper.
- **Recommendation:** Keep the pure pick function, the read fallback and cleanup on Save. Then pick one simplification:
  - **Migrate once on mount.** One explicit `saveEntries` writes the migrated record, keeps the winner's `savedAt` and deletes the old key. The design already grants a mount-time write exception in `clearStaleLegacyKey`. This removes `legacy.pending`, the `canSave` override, the "Enabling Save" section, `readLegacyOaState`, `LEGACY_KEYS`, the `ManualSaveNotice` change and the export gap. Trade-off: it breaks the "page views do not write" rule, and a second tab could interleave. The "no new key present" guard keeps it idempotent.
  - **Normalise the backup file before the import loop.** A small `upgradeLegacyBackup(data)` replaces the old key with the flat new record and returns a count. This removes the second overlay view, the `owned` special case and the import-side legacy removal. The stale-device-key removal rule is still needed.

### 2. `clearStaleLegacyKey` is a second write path with little value
- **Lens:** zoom-out (inventive-catalyst touches the same exception in finding 1)
- **Scope:** lines 116-118, 253, 298, 327, 352.
- **Issue:** A stale old key is harmless. `read()` ignores it once the new key exists, and the next Save removes it. The helper adds a mount effect, a declared exception to "Save is the only write", five test cases and three manual steps. It also depends on an ordering argument (the effect runs after the state initialiser) to avoid corrupting the notice.
- **Recommendation:** Delete it, unless the mount-migration option in finding 1 is adopted. In that case it is replaced by that write.

### 3. The page overrides a shared hook, and the rejection reasoning is inconsistent
- **Lenses:** zoom-out, inventive-catalyst
- **Scope:** lines 120-126, 216-226, 297-299.
- **Issue:** Save-enable and the notice use a page-side `canSave` override plus a second parse of the old key. The old key is parsed three times: in `read()`, in `readLegacyOaState` and in `clearStaleLegacyKey`. Alternatives F and G reject widening `ToolRead` or the hook "for one tool", yet the design widens `ToolAdapter`, `saveTool`, `importBackup`, the registry and `ImportResult` for that same tool.
- **Recommendation:** Pick one: have `read()` return the extra information once; accept a null `savedAt` in the fallback (gives the `"legacy"` state and `canSave` true with no override, and loses only the "Last saved" date of a profile about to be replaced); add a small `forceDirty` or `needsSave` option to `useToolDraft`; or use mount migration (finding 1). Revisit the rejection of Alternative G, or state the inconsistency.

### 4. The accepted export gap is a silent data-loss path
- **Lenses:** inventive-catalyst, zoom-out
- **Scope:** "Registry", line 144.
- **Issue:** A user who exports after release but before pressing Save gets a backup with no OA data. The notice and Save button are the only mitigation.
- **Recommendation:** Close the gap:
  - **Export through the adapter.** Export gets the OA record from `cpfOaAdapter.read()`, which already falls back to the winner. This also makes `LEGACY_KEYS` and the `ManualSaveNotice` change (item 7) unnecessary, because the OA record already `exists`.
  - **Export also reads `LEGACY_KEYS`.** Import already handles that shape.
  - If the gap is kept, `LEGACY_KEYS` and the `ManualSaveNotice` change exist only for the new-user check; consider dropping both.

### 5. The notice does not say that Save deletes the other scenarios
- **Lens:** inventive-catalyst
- **Scope:** line 126 and Goals line 31.
- **Issue:** The notice appears before Save, while the other scenarios still exist, and says only "were not carried over". The user cannot tell that pressing Save deletes them, and cannot see or retrieve them.
- **Recommendation:** A one-line copy change, for example "Saving will remove them". Alternative C's reason (a hidden key) misses cheaper mitigations.

### 6. Internal contradictions
- **Lenses:** inventive-catalyst, zoom-out
- **Scope:** lines 122, 138, 253, 273, 299.
- **Issue:**
  - Save-enable: line 122 says `canSave={draft.canSave || otherCount > 0 || legacyPending}`; line 299 says `draft.canSave || legacy.pending`. `otherCount > 0` is redundant, since `others > 0` implies `pending`.
  - Names: line 122 uses `otherCount` and `legacyPending`; the page uses `legacy.others` and `legacy.pending`.
  - Helper: the Technical Plan attributes `pending` and `others` to "the helper" without naming `readLegacyOaState`. The helper at line 253, `clearStaleLegacyKey`, returns void.
  - `ImportResult`: line 138 says "unchanged in shape" with an "optional" `legacyDiscarded`; line 273 makes it a required `number` on every return path. `importData`'s return type in `DataPortability.tsx` also changes.
- **Recommendation:** Pick one definition for each and use it throughout.

### 7. The Detailed Plan drops to code altitude and duplicates the Technical Plan
- **Lenses:** zoom-out (a Nit for inventive-catalyst)
- **Scope:** lines 93-100 versus 251, 296-299, 327.
- **Issue:** The migration algorithm, with tie-breaks, appears in both sections. The page item lists `useState` initialisers, `setDraft` spreads and `handleSave`. The test item enumerates about 25 cases.
- **Recommendation:** Keep behaviour and interfaces in the Technical Plan. Reduce the Detailed Plan to file, responsibility and interface. Replace the case list with "covered branches".

## Nit

1. **`legacyKeys` generalisation** (lines 130, 243, 266): a generic list for one key. `cpf-sa` migrates inside `read()`, so the abstraction may not fit later cases. Confirm SA, MA and HYSA will not need a different mechanism.
2. **Reuse** (line 300, item 2): the notice copies "same card style as `ManualSaveNotice`"; consider a shared card. State that the normalisation rules (`balanceAt55` and so on) are moved from `readAll`, not rewritten, to avoid drift.
3. **Process notes in the design body** (lines 236, 346): "Read the Next docs" and "remove `.next/types`" are process notes. State that clearing `.next/types` is a local step, not repo content or CI.
4. **Filesystem test** (line 317): item 11 asserts a folder does not exist on disk. That tests the filesystem, not behaviour. Drop it.
5. **Item 16 is hedged** (line 339): "if needed" should be resolved before approval. Check `toolAdapters.test.ts` and state the outcome.
6. **Open Questions entry already answered** (lines 44-46): the "Calculator suffix" bullet says "the brief treats this as intended". Move it to a decision or to Non-Goals.
7. **Registry sync** (line 144): anyone adding a legacy key later must keep `REGISTERED_KEYS` and `LEGACY_KEYS` in sync. A registry-owned `hasAnyData()` helper would avoid that.

## Found sound

- Deleting `[profileId]` so old URLs hit the default 404 needs no code.
- The Non-Goals and the 404 choice are well bounded.
- Using `createInputsAdapter` is the right reuse.
- Keeping reads free of writes, and the one-direction import, match the codebase.

## Overall

The goal and the page shape are sound. Both lenses independently conclude that the migration and persistence plumbing is heavier than the problem needs, and agree on one revision pass before implementation. The decisions that cut the most: whether migration happens on mount or on Save; whether export goes through the adapter; whether `clearStaleLegacyKey` is deleted.

Severity counts: 0 Blocker, 7 Major, 7 Nit.
