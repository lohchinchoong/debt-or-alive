# Goldfish Review Report: Implementation Readiness Test (Stage 9), Re-audit

**Target:** `docs/designs/explicit-save-last-saved-dates.md` (lines 652-1292, Detailed Implementation Plan; lines 1-651 used as reference for intent)

**Mode:** REVIEW (re-audit of `implementation_readiness_report.md`, using the resolution record `goldfish_review_report.md`)

## Reviewer Status

| Reviewer | Status | Own verdict |
| --- | --- | --- |
| `egm-implementation-readiness` | completed | Not ready yet, but close (0 Blocker, 5 new Major, 12 Nit) |
| `egm-codebase-details` | completed | Not ready yet, but close (0 Blocker, 3 new Major, 13 Nit) |
| `egm-style` | completed | Close; one more revision needed (0 Blocker, 5 new Major, 23 Nit) |

**After deduplication:** 0 Blocker, 7 new Major, 22 Nit.

**Overall:** Not ready yet, but close. The revision resolves B1 and 20 of the 22 prior Majors. Two are only partly resolved: M3 (the draft-hook mechanics) and M4 (the stored record shape). Most of the new Majors are in the same place: the internals of `useToolDraft` and `useProfileDraft`. Every file path, line reference and type name the plan cites was re-checked against `src`, and all of them are accurate.

Not re-raised, as the resolution record asks: A23(a) (keeping two draft hooks) and the CLAUDE.md shadcn line. No reviewer found that the revision made either of them worse.

---

## Prior findings status

| ID | Prior finding | Status | Current lines | Notes |
| --- | --- | --- | --- | --- |
| B1 | The "Save" to "Done" rename targets a button that does not exist | Resolved | 1009-1011; §5 407-411 | Commit-on-blur is kept, and `onSave` becomes `onCommit`. No "Done" remains in the document. Codebase-details rated it "partly" because of a small residue: item 22 (line 992) does not say which file's copy of the name editor is removed. That residue is tracked as Nit N20. |
| M1 | The "only writer" grep check could not detect what it claimed to | Resolved | 1203-1212, 1245-1246 | Replaced by `no-restricted-properties`. All three reviewers checked the allowlist against the current `setItem` sites. Wording residues are in N16. |
| M2 | Site wordmark unguarded in stages 4-5 | Resolved | 1031-1037 (item 25) | `SiteHeader`, `ToolCard` and `[slug]/page.tsx` are now swapped in stage 3. |
| M3 | Draft-hook loading, SSR and ref mechanics | **Partly resolved** | 916-941, 1080-1087 | Now specified: the server guard, `useIsClient`, the `isDirty` memo and its deps, `canSave`, `draft: P \| null`, the `dateState` rule, and the placeholders. Still open: how the ref is initialised and kept in step with Discard (NM1), and the state shape, the `setDraft` type and the post-save state (NM2). |
| M4 | Record types and nested `savedAt` | **Partly resolved** | 1103-1111, 1094-1095, 742-748 | The record-type column, the rule that `read` strips `savedAt`, and every-depth omission plus a test are all in place. Still open: the on-disk shape of `tool:<slug>` (NM3). |
| M5 | Type ownership between stages | Resolved | 830-832, 1025-1029, 1046-1053, 1070-1073 | Each stage moves its types and deletes the old hook together. Small import residue in N20. |
| M6 | Incomplete type-move table | Resolved | 1049, 1051, 1053, 1109-1111 | Naming residues are in N6. |
| M7 | Save bar state rules, `save()` result and layout | Resolved | §5 384-401; 911; 961-973 | Safe-area residue in N13. |
| M8 | Redirect called during render | Resolved | 1014, 887-888 | The redirect is in `useEffect` with stable `useCallback` deps. |
| M9 | Hook called in a callback; redirect owner unclear | Resolved | 340, 368-373, 1012-1017 | A spec/plan mismatch on the post-save redirect remains (N1). |
| M10 | Adapter test cases do not fit the profile adapters | Resolved | 1249-1262 | The cases are in three groups. Their test files are not listed (NM4). |
| M11 | Promised tests missing | Resolved | 784-789, 768-769, 867-870, 1251 | The `unsavedStore` test cannot run as written (NM5). |
| M12 | CPF SA migration vs "read performs zero writes" | Resolved | 835-838, 436, 1260-1261 | — |
| M13 | `saveProfile` / `deleteProfile` / `newProfile` semantics | Resolved | 795-815, 839-840, 1048-1051 | The `newProfile` values match `useCpfProfiles.ts:77-79`, `useHysaScenarios.ts:56-58` and `useSavingsGoal.ts:78-88`. |
| M14 | "Well-formed" undefined; a `toEntries` throw escapes | Resolved | 757-758, 776-777, 802 | A §2 mismatch remains (N2). |
| M15 | Import rule untested; `adaptersForKey` has no caller | Resolved | 1153-1180 | Replaced by `importBackup`, which has tests. View residue in N9. |
| M16 | QA step 1 cannot be run | Resolved | 1265-1270 | Wording residue in N19. |
| M17 | QA step 3 tests an unobservable `push` | Resolved | 1272-1274 | — |
| M18 | Plan contradicts spec §3/§4 | Resolved | 341-378 | Two smaller contradictions remain (N1, N14). |
| M19 | Not every `next/link` importer listed | Resolved | 1214-1220 | Two reviewers independently grepped `src` and found exactly the 20 listed files. `HeroSection.tsx` does not import `next/link`. Wording residue in N15. |
| M20 | Item 30 paths and route params | Resolved | 1059-1068 | The params match `hysa-tracker/[scenarioId]/page.tsx:635` and `savings-goal/[scenarioId]/page.tsx:587-589`. |
| M21 | Source of `slug`, `name` and `listPath` | Resolved | 280, 287, 841-849 | The way `toolMeta` is placed creates a circular import (NM7). |
| M22 | `GuardedLink` order of operations | Resolved | 362-364, 895-898 | — |

**Totals:** 21 resolved, 2 partly resolved (M3, M4), 0 still open.

---

## New findings (Blockers -> Majors -> Nits)

### 🔴 Blockers

None.

### 🟡 Majors

#### NM1. `latestDraft` is never initialised, and `discard()` leaves it stale - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 926-927, 933-941 (item 17); line 1080-1085 (item 29, which inherits the rule)
* **Problem:**
  * The plan says only the `setDraft` wrapper updates the `latestDraft` ref, and that `save()` always reads `latestDraft.current`. This causes two bugs.
  * **Save without an edit has no draft.** The ref has no initial value, so the following cases pass an unset draft to `saveTool` or `saveProfile`:
    * saving on defaults (CUJ 10, line 235);
    * confirming legacy data without editing it (CUJ 6, line 206);
    * the enabled Save on the `/new` pages (QA step 1).
  * **Discard does not reach the ref.** Suppose the page is in the legacy, never-saved or `new` state, so Save stays enabled after Discard (§5 table). The user edits, taps Discard, then taps Save. The edits they just threw away are written, which breaks CUJ 9.
  * The successful-save snapshot update has the same gap.
* **Evidence:** Lines 926 ("a ref that only the `setDraft` wrapper updates"), 934 and 940; §5 table at 384-396.
* **Suggested fix:**
  * Initialise the ref from the lazy initial state: `useRef(initial.draft)`. This passes `react-hooks/refs`, because it does not read `.current` during render.
  * Route every draft change (`setDraft`, `discard()`, and a successful `save()`) through one internal `commit(next)` helper that sets both the ref and the state.
  * Have the `setDraft` wrapper compute `next = updater(latestDraft.current)`, then call `commit(next)`.
  * Add a test or QA step: "`save()` after `discard()` writes the snapshot."

#### NM2. The draft hooks' state shape, `setDraft` type and post-save state are unspecified - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`; `egm-style` (part of M3, N6 and N8); `egm-codebase-details` (inside M-A)
* **Affected Scope:** Lines 910-921, 935-936, 1083-1085; item 23 line 1010; spec line 334
* **Problem:**
  * **State shape.** Item 17's server branch returns `{ snapshot: null }`, while item 29's returns `{ record, savedAt, exists }`. Neither gives the client-branch shape, or says which state "update the snapshot" changes.
  * **`setDraft` type.** `setDraft(updater)` has no type. With `draft: P | null`, item 23's `setDraft((p) => ({ ...p, name }))` either fails strict TypeScript or spreads `null`.
  * **`exists` after the first save.** The plan does not say that `exists` becomes `true`. If it does not, `dateStateOf` keeps returning `"never"` (line 781), and the first Save of a fresh tool keeps showing "Not saved yet", which breaks CUJ 10.
  * **`new` mode between save and redirect.** The rule "`never` in `new` mode" keeps "Not saved yet" on screen, with Save enabled, until the redirect lands.
  * **Undefined `now`.** Item 29 (line 1085) passes `now` without defining it. Item 17 (line 934) uses `new Date().toISOString()`.
* **Evidence:** Lines 781, 911-921, 934-936, 1010, 1085.
* **Suggested fix:**
  * State the types:
    * profiles: `{ snapshot: P | null; draft: P | null; savedAt: string | null }`;
    * tools: `{ snapshot: T; draft: T; savedAt: string | null; exists: boolean }`.
  * Type the setter as `setDraft(updater: (d: P) => P)`, and make it do nothing while `draft` is `null`.
  * On a successful save, set `snapshot = draft`, `savedAt = now` and `exists = true`, with `now = new Date().toISOString()`.
  * Order the `dateState` rule: `"saved"` if `savedAt` is set, otherwise `"never"` in `new` mode, otherwise `"legacy"`.

#### NM3. The stored format of `tool:<slug>` is unstated, and rollback safety depends on it - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** Lines 1093-1108 (item 30); spec lines 300, 623, 635
* **Problem:**
  * The record types nest the values as `{ inputs, … }`, but today `useToolState` stores a flat object.
  * The plan does not say whether `toEntries` writes `{ ...inputs, savedAt }` or `{ inputs, savedAt }`.
  * The nested form would lose every input on rollback, because the old loader keeps only its default keys. That breaks the NFR "data written by the new build must load in the old build" (line 623), and contradicts the risk row that says these tools simply "drop `savedAt`" (line 635).
* **Evidence:** `src/hooks/useToolState.ts:73` (flat write); `src/hooks/useToolState.ts:59-64` (type filter on load).
* **Suggested fix:**
  * Add to the Shared rules: `tool:<slug>` is `JSON.stringify(savedAt ? { ...record.inputs, savedAt } : record.inputs)`.
  * List keys stay plain arrays.
  * `srs:withdrawal` is `{ ...withdrawal, savedAt }`.
  * Profile records are `{ ...p, savedAt }`.
  * Add one test per tool: "a flat legacy `tool:<slug>` value reads into `inputs`, and `toEntries` writes it back flat."

#### NM4. The adapter test files are not in any item's file list - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** Items 11, 26 and 30 (lines 826, 1041, 1089); Verification lines 1247-1262
* **Problem:** The Verification Plan requires per-adapter and tool-specific tests, but no item creates the test files or says which stage writes them. The readiness standard requires exact Target File paths. A write allowlist built from the items would therefore block these files.
* **Evidence:** Lines 1249-1262 (the test groups) compared with the "(Create)" lists in items 11, 26 and 30.
* **Suggested fix:** Name the test files and mark them (Create), with the matching Verification group attached:
  * item 11: `src/lib/persistence/adapters/cpf-sa.test.ts`;
  * item 26: the four profile-adapter test files;
  * item 30: the seven tool-adapter test files.

  One shared `adapters.test.ts` that grows each stage would also work.

#### NM5. `confirmLeave` calls `window.confirm`, but its tests run in vitest's `node` environment - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 865-870 (item 13); vitest config line 685; §8 lines 446-447
* **Problem:** The test stubs `globalThis.confirm`, but Node has no `window` global. As specified, `window.confirm(...)` throws a `ReferenceError` in the dirty-case test.
* **Evidence:** Line 685 (`environment: "node"`); the existing code uses bare `confirm(...)`, for example `src/app/tools/cpf-sa-calculator/page.tsx:96`.
* **Suggested fix:** Have `confirmLeave` call `globalThis.confirm(...)` (or bare `confirm`) and keep the stub. Alternatively, keep `window.confirm` and have the test use `vi.stubGlobal("window", { confirm })`. Pick one and state it.

#### NM6. `ManualSaveNotice` appears for brand-new users after their first Save - Severity: Major
* **Reviewer Lens:** `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 979-981 (item 21); spec lines 118-119, 402-404
* **Problem:**
  * The notice shows when any `REGISTERED_KEYS` key exists and the dismissed flag is absent.
  * A brand-new user creates a registered key with their first Save. On the next render or page they see "Changes are no longer saved automatically", although they never had autosave.
  * This contradicts the Goal "users who already have saved data are told once".
* **Evidence:** Goals line 118 compared with the condition at 979-981.
* **Suggested fix:** Decide once, at the first client read, whether this browser has data from before the release. Two options:
  * **Persist the decision.** On mount, if the flag is absent and no registered key exists, write the dismissed flag at once. The flag is already a §7 exception, so this needs no new row.
  * **Use a legacy check.** Show the notice only while at least one adapter reads as `"legacy"`.

  Update §5 to match.

#### NM7. `toolMeta` in `registry.ts` creates a circular import - Severity: Major
* **Reviewer Lens:** `egm-style` (the synthesizer confirmed the import structure in the target)
* **Affected Scope:** Lines 841-842 (item 11), 848-852 (item 12)
* **Problem:**
  * Every adapter imports `toolMeta` from `registry.ts`, and `registry.ts` imports every adapter to build `TOOL_ADAPTERS` and `PROFILE_ADAPTERS`.
  * A page that imports `cpfSaAdapter` first (item 23 does) evaluates `registry.ts` before `cpf-sa.ts` has finished. `registry.ts` then reads `cpfSaAdapter` while the binding is still uninitialised. Depending on the bundler, that throws a `ReferenceError` or leaves `undefined` in the list.
  * The same applies to all 12 adapters.
* **Evidence:** Target lines 841-842 ("Read from `tools.ts` through a small `toolMeta(slug)` helper (item 12)") and 848-852 (the `toolMeta` and adapter lists are in the same module).
* **Suggested fix:** Move `toolMeta` to a module that imports no adapters, for example `src/lib/persistence/toolMeta.ts`, or export it from `src/lib/tools.ts`. Add the rule: "Adapters never import `registry.ts`."

### 🟢 Nits

#### N1. The spec and the plan disagree on where the post-save redirect happens
* **Reviewer Lens:** all three
* **Lines:** Spec §4 line 371 vs item 23 lines 1015-1017 (and `savedId` at line 913)
* **Problem:** The spec says the redirect is "in its Save handler". The plan uses "an effect on `savedId`", gives no dependency array, and relies on Next remounting `[profileId]` when the param changes from `new` to an id.
* **Fix:** `save()` is synchronous, so call `replaceWithoutPrompt` in the handler when the result is `ok: true`, and drop `savedId`. If the effect stays instead, give `[savedId, replaceWithoutPrompt]` and the `profileId === "new"` condition, and update §4. In either case, state the remount assumption.

#### N2. Spec §2 says `saveEntries` writes the date entry last
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Lines:** 311 vs 760 and 778; 1168-1171
* **Problem:** In the plan, `saveEntries` writes entries in the order given, and `saveTool` puts the date entry last. `importBackup` calls `saveEntries` directly, without reordering. This is harmless, because the import is all-or-nothing.
* **Fix:** Change §2 to "callers put the date-carrying entry last; `saveTool` does this for tools". State the import order.

#### N3. The `saving` flag does nothing
* **Reviewer Lens:** all three
* **Lines:** 930, 939; §3 `canSave` 325-326
* **Problem:** `save()` is synchronous, so the flag is set and cleared in the same handler and is never seen as true in a render. The upsert already makes a double tap safe.
* **Fix:** Drop the flag, or define it as a ref used only as a guard.

#### N4. Registry types are placeholders
* **Reviewer Lens:** all three
* **Lines:** 851, 853
* **Problem:** The type argument of `ProfileAdapter<…>` is a literal ellipsis. "Every adapter's keys" overlooks that profile adapters have `key`, not `keys` (line 733).
* **Fix:** Write `readonly ProfileAdapter<{ id: string; name: string; savedAt?: string }>[]`. Say "`keys` of tool adapters plus `key` of profile adapters".

#### N5. `registry.ts` is not listed in stages 4 and 5
* **Reviewer Lens:** `egm-implementation-readiness`
* **Lines:** 1043, 1091
* **Problem:** Stages 4 and 5 add adapters to `registry.ts`, but it is listed only in stage 3, as Create.
* **Fix:** Add a Modify entry for `registry.ts` to stages 4 and 5.

#### N6. Logic and names from the deleted hooks have no stated destination
* **Reviewer Lens:** all three
* **Lines:** 1049, 1051, 1066, 1068, 1106, 1109
* **Problem:** The plan does not say where the following go:
  * the HYSA `addMonth`, `removeLastMonth` and `updateEntry` (`useHysaScenarios.ts:84-141`);
  * the savings-goal item add, remove and update functions, including the `item_${Date.now()}` id (`useSavingsGoal.ts:115-166`);
  * the private `defaultTargetDate()` (`useSavingsGoal.ts:24-28`), which the `newProfile()` column relies on.

  There are also naming gaps:
  * "its item type" should name `SavingsItem`;
  * the "defaults" at lines 1049 and 1106 should be named, for example `CPF_OA_DEFAULT_PARAMS`;
  * "(and `CATEGORIES` if needed)" leaves the decision to the implementer.
* **Fix:** Say whether each piece becomes a pure adapter helper or a page-local `setDraft` updater, and name each type and constant.

#### N7. There is no mapping for `useToolState`'s `set(partial)`
* **Reviewer Lens:** `egm-implementation-readiness`
* **Lines:** 1125-1132 (item 31)
* **Problem:** The item does not say how the many `set({...})` call sites change.
* **Fix:** Specify a local helper, for example `setInputs = (c) => setDraft(d => ({ ...d, inputs: { ...d.inputs, ...c } }))`.

#### N8. `LastSaved` can render "Last saved: null"
* **Reviewer Lens:** all three
* **Lines:** 696, 957
* **Problem:** `formatSavedDate` returns `string | null`, and item 19 renders its result without checking for `null`.
* **Fix:** Render nothing (treat the date as legacy) when the result is `null`.

#### N9. Import details are missing
* **Reviewer Lens:** all three
* **Lines:** 1160-1162 (item 33), 1191-1193 (item 34)
* **Problem:**
  * The "read-only view" must satisfy `StorageLike` (line 717), but the plan doesn't say what its `setItem` and `removeItem` do. This matters because the CPF SA `readAll` can write during migration.
  * The zero-tools case is not specified. Today it shows "No recognised data found in file." and does not reload (`DataPortability.tsx:140-141`).
  * The plan does not say whether the `app` and `version` checks (`DataPortability.tsx:94-102`) stay.
* **Fix:** Say that the view's write methods throw, give the zero-tools message, and say that both checks stay.

#### N10. The placeholder has no markup
* **Reviewer Lens:** `egm-implementation-readiness`
* **Lines:** 1000, 1019, 1137
* **Problem:** "A placeholder" is not specified.
* **Fix:** Render `<SiteHeader />` and an empty `min-h-screen` `<main>`, as `savings-goal/[scenarioId]/page.tsx:600-606` does today.

#### N11. `WithdrawalSettings` "gains `savedAt?`" conflicts with "read strips `savedAt`"
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Lines:** 1110 vs 1094
* **Fix:** Say that only the stored type gains `savedAt?`.

#### N12. The order of the ESLint config objects is implicit
* **Reviewer Lens:** `egm-implementation-readiness`
* **Lines:** 1199-1212
* **Problem:** The plan does not say where the two "off" objects go, and does not give their exact `files` globs.
* **Fix:** State that both "off" objects come after the `src/**` object, and give their globs.

#### N13. The safe-area padding does nothing without `viewport-fit=cover`
* **Reviewer Lens:** `egm-codebase-details`, `egm-style`
* **Lines:** 968-970, NFR 616-617
* **Problem:** `pb-[env(safe-area-inset-bottom)]` resolves to 0. `src/app/layout.tsx:6-9` exports only `metadata` and has no `viewport` export. The plan also doesn't say whether the spacer renders while the bar is hidden during loading.
* **Fix:** Either add `src/app/layout.tsx` (Modify) with `export const viewport: Viewport = { viewportFit: "cover" }`, or drop the safe-area class and the NFR clause. Before relying on `viewportFit`, check it against `next`'s `Viewport` type; the bundled `generate-viewport.md` does not cover it. State whether the spacer renders during loading.

#### N14. The spec names a store consumer that the plan never builds
* **Reviewer Lens:** `egm-codebase-details`, `egm-style`
* **Lines:** Spec 268-269, 357-358; item 13 lines 862-864
* **Problem:** The spec says components read the store with `useSyncExternalStore`. Nothing in the plan does: `SaveBar` takes props, and `GuardedLink` calls `confirmLeave()` directly.
* **Fix:** Name the consumer, or drop `subscribe`, `getUnsaved` and the spec sentence.

#### N15. Inaccurate counts and claims about the lint rule
* **Reviewer Lens:** `egm-codebase-details`, `egm-style`
* **Lines:** 1216, 1036-1037, 842
* **Problem:**
  * "The 12 tool pages" clashes with "12 tools" on line 12.
  * "So that the lint rule has no exceptions" is wrong, because the rule exempts the two wrapper files.
  * "Small" (line 842) is filler.
* **Fix:**
  * Write "the 7 single-state pages and the 5 list pages".
  * Write "so that no importer outside the two wrapper files remains".
  * Drop "small".
  * Optionally, list the 10 `useRouter` importers.

#### N16. The "lint allowlist" wording overstates the rule
* **Reviewer Lens:** `egm-style`
* **Lines:** §4 377-378, §7 430; 1207-1212, 1245-1246
* **Problem:**
  * §7 is not the exemption list. Its rows include writes that go through `saveEntries`, and it leaves out `save.ts`, `memoryStorage.ts` and the test files.
  * "Enforce the only-writer rule" overclaims, because `no-restricted-properties` misses computed access such as `storage["setItem"]`.
* **Fix:** Write "the lint rule exempts `save.ts`, the test helpers and the two non-tool writers from §7". Write "flag direct `setItem`/`removeItem` and `next/link`/`useRouter` use outside the exempt files".

#### N17. "Round-trips unchanged" needs a definition
* **Reviewer Lens:** `egm-codebase-details`, `egm-style`
* **Lines:** 1251
* **Problem:** The type filter (`useToolState.ts:59-64`) drops unknown fields, and a legacy dividend number cannot round-trip as the same raw string.
* **Fix:** Define it as "`read(toEntries(read(x).record, null)).record` is `sameData` with `read(x).record`".

#### N18. The `memoryStorage` helper's API is unclear
* **Reviewer Lens:** `egm-style`
* **Lines:** 820-822 (item 10)
* **Problem:** The plan does not say whether `failOnSet(n)` is a constructor option or a method. It also does not say whether `writes` counts `removeItem`, which the zero-write tests need.
* **Fix:** State both.

#### N19. QA step 1's write check is not directly observable
* **Reviewer Lens:** `egm-style`
* **Lines:** 1270
* **Problem:** "DevTools shows no storage write" is not something DevTools shows directly.
* **Fix:** Write "Application > Local Storage shows no new or changed key after loading each page".

#### N20. Some list-page edits do not name their file
* **Reviewer Lens:** `egm-codebase-details` (B1 residue), `egm-style` (M5 residue)
* **Lines:** 992 (item 22), 1067 (item 27)
* **Problem:**
  * "Remove the list-card name editor and the `onRename` prop" does not say which file each change goes in. Every list page has its own copy of the name editor, for example `cpf-sa-calculator/page.tsx:10-80`.
  * Row 1067 notes the editor's removal only for savings goal, but the HYSA, CPF MA and CPF OA list pages also have one (`hysa-tracker/page.tsx:89`, `cpf-ma-calculator/page.tsx:115`, `cpf-oa-annuity-calculator/page.tsx:115`).
  * Item 22 does not say that the list page now imports `CpfProfile` from the adapter (`cpf-sa-calculator/page.tsx:7`).
* **Fix:** Name the file for each removal, treat the four rows the same way, and state the import change.

#### N21. Item 18's server guard does not fit a list hook
* **Reviewer Lens:** `egm-style`
* **Lines:** 949
* **Problem:** "The same server guard as item 17" would return `{ snapshot: null }`, which is not a list.
* **Fix:** Say that the list initialiser returns `[]` on the server.

#### N22. The Overview's count of tools that write on page open
* **Reviewer Lens:** `egm-codebase-details`
* **Lines:** Spec line 14 (reference range)
* **Problem:** "Seven tools also write when a page opens", but only six do: the five `useToolState` tools (`useToolState.ts:102`) and SRS (`srs-calculator/page.tsx:530-541`). It is seven only if the CPF SA migration (`useCpfProfiles.ts:57`) is counted.
* **Fix:** Correct the count, or say that the CPF SA migration is included.

---

## Claims the reviewers checked and found correct

- These line references are accurate: `useToolState.ts:53-69` and `:102`, `compound-interest/page.tsx:512`, `fire-calculator/page.tsx:938-944` and `:946-952`, `dividend-calculator/page.tsx:469`, `srs-calculator/page.tsx:530-541`.
- `STORAGE_KEYS` has 19 entries (`DataPortability.tsx:6-26`), and the planned diff is correct.
- Export stores parsed JSON (`DataPortability.tsx:47`), so the import view's `JSON.stringify(data[k])` is correct.
- There are exactly 20 `next/link` importers, and exactly 10 `useRouter` importers (the 5 list pages and the 5 detail pages).
- `useIsClient` (`src/hooks/useIsClient.ts:12-18`) is false during the server render and hydration, and true afterwards.
- `tools.ts` slugs and names match the route folders and CUJ 4.
- `--header-glass` and `surface-container-highest` exist in `globals.css`.
- `eslint.config.mjs` is a flat config built with `defineConfig`. `tsconfig.json` includes `**/*.ts`, so the rationale for keeping vitest `globals` off holds.
- `next.config.ts` is empty, so `cacheComponents` is off.
- `[slug]/page.tsx` and `ToolCard.tsx` are server components, and both can render the client `GuardedLink`.
