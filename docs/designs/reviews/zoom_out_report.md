# Goldfish Review Report: Stage 5, Initial Zoom Out Review

**Target:** `/Users/desmondloh/Projects/debt-or-alive/docs/designs/explicit-save-last-saved-dates.md` (lines 1-1267; FeatureRange 1-749, DetailedRange 750-1267)
**Standard applied:** `/Users/desmondloh/.claude/plugins/cache/egm/egm/0.1.1/resources/document_standards/zoom-out-standard.md`
**Baseline reading:** `concepts_brief.md`, `CLAUDE.md`, `docs/design.md`. Reviewers also checked claims against `src/hooks/useToolState.ts`, `src/hooks/useTheme.ts`, `src/hooks/useIsClient.ts`, `src/components/DataPortability.tsx` and `package.json`.

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-zoom-out` | completed |
| `egm-inventive-catalyst` | completed |

**Severity breakdown:** 0 Blockers, 5 Major, 8 Nits (after deduplication).

Neither reviewer found a Blocker. The objective is clear, and the author's product decisions (explicit Save, removing shared links, covering all 12 tools) are recorded with their trade-offs. Both reviewers said two constraints are real platform limits, not trade-offs the design could remove: browser back and iOS swipe-back can't be blocked, and localStorage has no transactions. The design handles both honestly.

Where two reviewers raised the same point, the finding below is merged and both are credited. Where they gave it different severities, the higher one is used.

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 1. The doc presents explicit Save as technically required, but it is a product preference - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (both raised this independently)
* **Affected Scope:** Lines 36-63 (The Problem, especially 52-55), and Alternative B at lines 501-511
* **Discrepancy Description:** The Problem section says the current storage code "makes an accurate one impossible", and that explicit Save removes all three problems. But each problem is actually solved by a different part of the design:
  * Page-load writes go away because the `useToolState` mount write (`useToolState.ts:102`) and the SRS effects are deleted.
  * Link overwrites go away because URL sync is deleted.
  * The roughly 15 scattered setters are replaced by the single save module (§2), the adapters (§1) and `sameData` (§3).

  Alternative B's two cons (lines 507-508) are both already solved by this design: adapters know which keys each tool owns, and `saveEntries` reports errors. B's rejection (line 509) gives no technical reason.
* **Rationale & Recommendation:** This is the largest scope decision in the document. Manual Save alone accounts for about half the plan: the unsaved store, `GuardedLink`, `useGuardedRouter`, the repo-wide lint ban, `beforeunload`, `ManualSaveNotice` and the leave-prompt QA. It also gives up autosave's zero data loss on mobile (lines 57-63). A reader who takes the Problem section at face value would think an accurate date can't exist without that cost.
  * **Minimum fix:** reword lines 52-55 and B's rejection to say Save was chosen for the draft and Discard behaviour and for a clear moment of user intent. That is the author's preference, not the only way to get a correct date. Keep B recorded as the lower-scope path.
  * **Alternative (inventive-catalyst, Inversion):** let the draft hook call `saveTool` itself, debounced, whenever the draft is dirty. This keeps "the date changes only when data changes" and zero data loss, and removes the whole guard layer. The costs are no Discard or try-out sandbox, half-typed values getting saved, the need for a persistent save-error indicator, and more writes.

### 2. Legacy records can't be saved, so returning users can't get a date - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** Goals, lines 75-79 and 86-87; §3 `canSave`, line 310; CUJ 6, lines 198-199; item 10 `dateStateOf`, lines 867-870; items 17 and 18
* **Discrepancy Description:** A legacy record has stored data but no date. That makes it not "never saved", so `canSave` is just `isDirty`, and Save stays disabled until a value really changes. Under autosave, every past visit wrote defaults (`useToolState.ts:102`), and `concepts_brief.md` line 189 accepts this. The CPF SA migration also makes its profiles legacy on purpose (line 415). So almost every existing user is legacy on every tool they have opened.
* **Rationale & Recommendation:** These are exactly the returning users from The Problem (lines 31-34). If their numbers are still correct, they would have to make a fake edit to get a date, which defeats the feature's main goal.
  * Change the rule to `canSave = isDirty || dateState !== "saved"`.
  * Update the Goal text and items 10, 17 and 18 to match, and add a test that a legacy record can be saved.
  * Say explicitly that this is a second exception to "the date changes only when data changes".
  * Separately, either support "I checked and the numbers are still correct" for records that already have a date, or record it as a deliberate non-goal.

### 3. Import bypasses the save module, so a special patch-up rule is needed for stale dates - Severity: Major
* **Reviewer Lens:** `egm-inventive-catalyst` (Major), `egm-zoom-out` (Nit: the edge case lacks evidence)
* **Affected Scope:** §6 partial-file rule, lines 404-407; §7 import exception, line 416; item 37, lines 1205-1210; grep exception list, line 1241
* **Discrepancy Description:** The design keeps the date inside tool data (Alternatives M, N and P were rejected) so that the date travels with the data. But import still writes key by key with plain `localStorage.setItem` and no rollback (`DataPortability.tsx:107-114`). It then patches the date-carrying record afterwards, which makes import a second, ad hoc writer of `savedAt`.
  * A quota error part-way through an import leaves a multi-key tool half-imported.
  * Imported values are stored as-is, without normalisation.
  * Zoom-out notes the rule mainly protects against hand-edited files. This app's own export always includes the main `tool:<slug>` key, which almost every user already has.
* **Rationale & Recommendation:** Import is the only bulk writer, yet it gets none of the all-or-nothing guarantee promised at Goals line 71. Two directions:
  * **Preferred (inventive-catalyst):** send import through the registry and save module. Lay the file's values over current storage, call `adapter.read`, then call `saveEntries(adapter.toEntries(record, fileSavedAt ?? null))`. Ideally do this as one call for the whole file so the import succeeds or fails as a unit.
    * Benefits: the partial-file rule follows automatically, `DataPortability.tsx` leaves the exception list, and "Imported N tools" becomes a true count.
    * Costs: `toEntries` must accept a null date, fields this build doesn't know about are dropped, and restore now depends on adapters being correct.
  * **Lighter (zoom-out):** keep the patch rule only if it is cheap, and write down the real case it covers. Otherwise drop it as a minor risk.

### 4. Guarded-router wiring contradicts itself, and one item calls a hook inside a callback - Severity: Major
* **Reviewer Lens:** `egm-zoom-out` (Major), `egm-inventive-catalyst` (Nit)
* **Affected Scope:** Lines 356-358 and 364-366; item 18, lines 993-995; item 20, lines 1009-1013; item 35, lines 1180-1181; item 36, lines 1186-1192
* **Discrepancy Description:**
  * Lines 356-358 say redirects and the post-create replace use the plain router.
  * Items 20 and 36 make `useGuardedRouter` the only file allowed to import `useRouter`, and give it a deliberately unguarded `replace`, so the lint rule forbids the approach the Technical Plan describes.
  * Item 18 calls `useGuardedRouter().replace(...)` inside an async post-save callback, which is not a valid hook call.
  * The lint rule also covers pages that never need a guard (`ToolCard`, the coming-soon page) just so it has no exceptions. And a module called "guarded router" that exposes an unguarded method is misleadingly named.
* **Rationale & Recommendation:** An implementer currently gets two answers to "how do I navigate without a prompt". State one model once, at Technical Plan level:
  * `useGuardedRouter` returns `{ push, replace }`, with only `push` guarded, or with the escape hatch clearly named, for example `replaceWithoutPrompt`.
  * Call it at the top of the hook or page, never inside a callback.
  * Have the page perform the post-create redirect.
  * Fix line 357 to match.
  * Optionally, limit the lint rule to `src/app/tools/**` and `SiteHeader.tsx`. Renaming the escape hatch is safer, because a narrower glob could miss a future tool page.

### 5. Cross-tab sync is added even though cross-tab handling is a Non-Goal - Severity: Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 1003-1004 (`useProfileList` re-reads on the window `storage` event); Non-Goals, lines 134-135; Future Improvements, lines 743-744
* **Discrepancy Description:** Nothing in `src` listens to the `storage` event today, and the design declares cross-tab conflicts out of scope ("last save wins"). This listener and its re-render path exist only for that out-of-scope case. The fresh read on save (lines 326-330) already covers data safety.
* **Rationale & Recommendation:** This is scope creep that contradicts the doc's own Non-Goals. Drop the listener, or move it to Future Improvements next to the conflict check.

### 6. The tool and profile persistence paths are duplicated - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`, `egm-inventive-catalyst` (both raised this)
* **Affected Scope:** Lines 251-269 and 302-339; items 6, 9, 10, 17 and 18 (lines 968-995; "return the same shape" at line 988)
* **Discrepancy Description:** There are two adapter interfaces, two save modules and two draft hooks that return almost the same thing. The real difference is only how a draft is loaded and saved: one record, versus read-and-merge by id. The design itself rejected Alternative E because copies drift (lines 537-538).
* **Rationale & Recommendation:** Two ways to unify them:
  * One draft hook that takes `{ load, save }`, with a thin profile factory (zoom-out).
  * A `profileScopedAdapter(profileAdapter, id)` that turns a profile into a `ToolAdapter`, so one hook serves all 17 pages and only "new" mode and `notFound` stay special (inventive-catalyst). The cost is that the save step needs storage access and the merge logic moves into adapters.

  If you keep two hooks, add one sentence saying why.

### 7. The dividend format change causes the only rollback regression - Severity: Nit
* **Reviewer Lens:** `egm-inventive-catalyst`
* **Affected Scope:** §1 dividend row, line 280; §9 rollback, lines 459-462; Alternative P, lines 627-634; dual-format reader, lines 408 and 886
* **Discrepancy Description:** Changing `dividend:projection-years` from a string to an object is what makes projection years reset to 20 on rollback. Alternative P avoided this and was rejected only because a partial import could restore data without its date. If Finding 3 is adopted, that objection goes away.
* **Rationale & Recommendation:** Reconsider P for the dividend tool: keep the string as it is, and put the date in a `tool:dividend-calculator` record. This removes the regression and the dual-format reader. The cost is one more key in exports.

### 8. The registry exports more than any caller needs - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 902-906; item 37, lines 1205-1207
* **Discrepancy Description:** `EXPORT_KEYS` leaves room for standalone keys that no adapter owns ("none today"). `adaptersForKey` is described as "for the import rule", but item 37 loops over adapters and never looks anything up by key.
* **Rationale & Recommendation:** Build `EXPORT_KEYS` from the adapters only and remove `adaptersForKey`. Add either one when a real caller exists.

### 9. `StorageEntry.value: null` has no producer - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 818-819; test at line 926
* **Discrepancy Description:** No adapter's `toEntries`, `saveProfile` or `deleteProfile` sends `null`, and deleting a profile rewrites the array (lines 858-859). Rollback does need to remove keys, but that happens inside `saveEntries`, not through its input type.
* **Rationale & Recommendation:** Make the type `value: string` until a caller needs removal.

### 10. The "date entry last" rule is enforced in three places - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 263-264, 294 and 825; test at line 938
* **Discrepancy Description:** Every adapter must order its entries so the date comes last, and a test checks this per adapter. But each adapter already declares its `dateKey`.
* **Rationale & Recommendation:** Have `saveTool` or `saveEntries` move the `dateKey` entry to the end itself. Then one test covers it and adapters can return entries in any order.

### 11. Implementation detail in the Technical Plan repeats the Detailed Plan - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** Lines 288-297 (`saveEntries` algorithm), 316-317 (`history.replaceState`), 352-355 (`e.preventDefault()`, Next version note), 378-380 (`getDate`/`getMonth`/`getFullYear`), 420-422 (`sg_legacy_<index>`)
* **Discrepancy Description:** These lines duplicate items 4, 8, 11, 17 and 21 in the Detailed Plan, so the same detail has to be kept in step in two places.
* **Rationale & Recommendation:** In §2 to §5, state only the contracts: local-time "D Mon YYYY" without `Intl`, all-or-nothing writes, URL params stripped on load, and stable legacy ids. Leave the mechanics to the Detailed Plan.

### 12. `savedAt` may be dropped on read by the existing key filter - Severity: Nit
* **Reviewer Lens:** `egm-zoom-out` (from its reuse check)
* **Affected Scope:** Line 897; item 11; line 1185
* **Discrepancy Description:** `useToolState.readFromStorage` (`useToolState.ts:53-67`) keeps only keys present in `defaults`. Line 897 keeps that rule, so the five affected adapters must pull out `savedAt` separately or it will be silently dropped. Line 1185 implies this but nothing states it.
* **Rationale & Recommendation:** Add one explicit sentence to item 11.

### 13. "Still correct" confirmation for dated records is not addressed - Severity: Nit
* **Reviewer Lens:** `egm-inventive-catalyst` (a follow-on from Finding 2)
* **Affected Scope:** Non-Goals, lines 134-135 area
* **Discrepancy Description:** A user who checks a record that already has a date and finds the numbers still correct has no way to refresh the date without editing something.
* **Rationale & Recommendation:** Record this as a deliberate non-goal so the question doesn't come back later.

---

## Verified as fine (no action)
* `useIsClient` exists and is reused correctly for hydration gating (lines 121 and 975).
* The module-level `useSyncExternalStore` pattern for the unsaved store matches `src/hooks/useTheme.ts`.
* No equality helper or lodash exists in the project, so a small `equality.ts` is justified.
* shadcn/ui is listed in `CLAUDE.md` but not installed. Using Tailwind for `SaveBar` and `window.confirm` (lines 373-374 and 673-681) matches the existing delete confirmations.
