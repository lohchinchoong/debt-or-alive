# Goldfish Review Report: Implementation Readiness Test (Stage 9)

**Target:** `docs/designs/explicit-save-last-saved-dates.md` (lines 750-1267, Detailed Implementation Plan; lines 1-749 used only as reference for intent)

**Mode:** REVIEW

## Reviewer Status

| Reviewer | Status | Own verdict |
| --- | --- | --- |
| `egm-implementation-readiness` | completed | Not ready (0 Blocker, 10 Major, 11 Nit) |
| `egm-codebase-details` | completed | Not ready (1 Blocker, 9 Major, 15 Nit) |
| `egm-style` | completed | Revise before handoff (0 Blocker, 17 Major, 14 Nit) |

**After deduplication:** 1 Blocker, 22 Major, 18 Nit.

**Overall:** Not ready. The plan's structure, staging and most of its codebase references hold up. But many items leave the implementer to make impactful decisions: hook mechanics, record types, Save bar state rules, where types live between stages, and test coverage. A few items also contradict the current code or the spec section.

### Claims the reviewers checked and found correct

- These line references are accurate: `compound-interest/page.tsx:512`, `fire-calculator/page.tsx:938-952` and `srs-calculator/page.tsx:530-541`.
- The CPF SA migration (`useCpfProfiles.ts:47-58`), the CPF OA field-by-field rebuild and the savings-goal `Date.now()` id are all as described.
- `STORAGE_KEYS` (`DataPortability.tsx:6-26`) has 19 entries. It is missing `hysa-tracker:scenarios` and lists `tool:srs-calculator`, which nothing writes.
- The five `useToolState` tools are exactly compound interest, FIRE, mortgage, emergency fund and budget.
- Every named moved type exists.
- The delete-confirm text and `handleAdd` exist on all five list pages.
- `utils.ts` exports `fmtAxis`, `niceMax`, `genId` and `todayISO`.
- `docs/architecture.md` has "Data Flow" and "Key Decisions" sections, and `README.md` has "Getting Started".
- These Next.js 16.3.6 behaviours are documented: `Link` `onNavigate` with `preventDefault()` (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md:453-503`), and `window.history.replaceState(null, "", path)` with the App Router (`01-app/01-getting-started/04-linking-and-navigating.md:343-437`).
- `useIsClient` exists (`src/hooks/useIsClient.ts`).

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 🔴 B1. The "Save" to "Done" button rename targets a button that does not exist - Severity: Blocker
* **Reviewer Lens:** `egm-codebase-details` (Blocker); `egm-implementation-readiness` (Nit)
* **Affected Scope:** Lines 1091 (item 27) and 1129 (item 30); also spec §5 line 391
* **Discrepancy Description**:
  * The plan says to rename the inline name editor's button from "Save" to "Done".
  * No such button exists. Every `ProfileNameEditor` and `ScenarioNameEditor` is a click-to-edit `<button>` that shows the name and a pencil icon. It turns into an `<input>` that commits on blur or Enter. "Save" appears only as the internal prop name `onSave`.
  * Evidence:
    * `src/app/tools/cpf-sa-calculator/[profileId]/page.tsx:98-167` and `:644-647`;
    * the same pattern in cpf-ma `[profileId]` (around line 132), cpf-oa `[profileId]` (around line 97), `hysa-tracker/[scenarioId]/page.tsx:34-38` and `savings-goal/[scenarioId]/page.tsx:41-54`.
  * The only visible "Save" text in `src` is unrelated: `mortgage-calculator/page.tsx:842`.
  * The error comes from `concepts_brief.md:110`.
* **Rationale & Recommendation**: An implementer cannot carry out this step as written. They would have to invent new UI or skip the step. Delete the step from items 27 and 30 and from spec §5. If an explicit commit control is wanted, specify it as new UI with exact markup. Optionally rename the `onSave` prop to `onCommit`, so the code does not suggest a storage write.

---

### 🟡 M1. The "only writer" grep check cannot detect what it claims to - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 1235-1241
* **Discrepancy Description**:
  * `saveEntries` (item 8) and the CPF SA migration (items 6 and 11) receive an injected `StorageLike` and call `storage.setItem(...)`. Neither file will contain the text `localStorage.setItem`, so the expected match list is wrong.
  * The check also misses any stray `storage.setItem` in an adapter or hook, which is exactly the regression it exists to catch.
  * The current migration writes through `writeProfiles` (`useCpfProfiles.ts:31-37`, `:57`).
* **Rationale & Recommendation**: Split the check into two greps:
  * `grep -rn "localStorage.setItem" src` should match only `useTheme.ts`, `ManualSaveNotice.tsx` and `DataPortability.tsx`.
  * `grep -rnE "\.(setItem|removeItem)\(" src` should match only those three files plus `save.ts`, the `cpf-sa.ts` migration and `testing/memoryStorage.ts`.

  Run the check again at the end of stage 7, because `DataPortability.tsx` changes there.

### 🟡 M2. The site wordmark is unguarded during stages 4 and 5 - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 1174-1194 (item 35), compared with items 26-27 (stage 4)
* **Discrepancy Description**:
  * CPF SA ships explicit Save in stage 4, and §9 says each stage ships to production.
  * `SiteHeader` switches to `GuardedLink` only in stage 6. Until then, tapping the wordmark on a dirty detail page drops the edits with no prompt. This is the failure in CUJ 4 and the concept's S3 acceptance test (`concepts_brief.md:348`).
  * Evidence: `src/components/SiteHeader.tsx:3` and `:110`. Every detail page renders `<SiteHeader />`, for example `cpf-sa-calculator/[profileId]/page.tsx:609`.
* **Rationale & Recommendation**: Move the `SiteHeader` swap (and optionally `ToolCard` and `[slug]/page.tsx`) into stage 3. `GuardedLink` does nothing while the store is clean, so the early swap is safe. Keep the ESLint rule at the end of stage 6.

### 🟡 M3. `useToolDraft` / `useProfileDraft` loading, SSR and ref mechanics are unspecified, and the obvious approach fails lint - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 974-982 (item 17) and 987-995 (item 18)
* **Discrepancy Description**:
  * "Read once on the client" does not name a mechanism.
    * A `useState` initialiser also runs during SSR, and `localStorage` is undefined in Node 24. Current loaders guard with `typeof window === "undefined"` (`useCpfProfiles.ts:40`, `utils.ts:20`, `srs-calculator/page.tsx:517`, `dividend-calculator/page.tsx:455`).
    * Reading in an effect and calling setState breaks `react-hooks/set-state-in-effect`. The installed plugin is 7.1.1, its recommended preset is enabled through `eslint-config-next`, and commit b864bc3 fixed exactly this kind of error.
  * "Latest draft held in a ref": the obvious `draftRef.current = draft` in the render body breaks `react-hooks/refs`.
  * `useMemo(() => !sameData(draft, snapshot))` has no dependency array. It also drops spec §3's "nothing is dirty while loading".
  * `canSave` is never defined.
  * Hydration risk: compound interest and all 10 profile pages have no `useIsClient` gate today. A client-only initial value would therefore cause a hydration mismatch unless the pages render a placeholder.
  * Item 18 says "same shape as `useToolDraft`", which leaves the type of `draft` undefined while loading or not found. It cannot be `P` at that point.
  * Item 18 does not state the profile `dateState` rule: "saved" when `savedAt` is set, "legacy" when it is absent, "never" only in `"new"` mode.
* **Rationale & Recommendation**: Specify all of the following:
  * The read: a `useState` lazy initialiser that returns `{ record: defaults(), savedAt: null, exists: false }` when `typeof window === "undefined"`.
  * The ref is updated only inside the `setDraft` wrapper, never during render.
  * `isDirty = status === "ready" && !sameData(draft, snapshot)`, memoised on `[draft, snapshot, status]`.
  * `canSave = status === "ready" && (isDirty || dateState === "never")`.
  * `draft` is `defaults()` while loading for single-state tools, and `P | null` for profiles.
  * Every converted page renders a placeholder until `status === "ready"`.
  * `useProfileDraft` gets an explicit return type and the profile `dateState` rule above.
  * The same SSR guard applies to `useProfileDraft` and `useProfileList`.

### 🟡 M4. Record types are defined only for FIRE, and nested `savedAt` handling is ambiguous - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** Item 11 table (lines 878-891), item 7 (lines 834-837), item 32 (lines 1147-1150)
* **Discrepancy Description**:
  * Adapters, `toEntries`, round-trip tests and page rewrites all depend on each tool's record type `T`. Only FIRE's `{ inputs, yieldSources, drawdownSources }` is given. Mortgage, emergency fund, budget, SRS, dividend and compound interest (flat, or wrapped in `inputs`?) are left to the implementer.
  * For SRS and dividend, `savedAt` sits inside a stored object. The plan does not say whether `read` removes it from the record.
  * Item 7 does not say whether `omitKeys` applies at every depth. If it applies only at the top level and `savedAt` stays nested, every saved SRS page loads dirty.
* **Rationale & Recommendation**: Add a "Record type" column giving the exact TypeScript type for each of the 7 single-state adapters. State that `read` always removes `savedAt` from the record and returns it only in `savedAt`. State that `stableStringify` omits the listed keys at every depth, and add a nested-`savedAt` case to the `equality` tests.

### 🟡 M5. Type ownership between stage 2 and stages 4-6 is undecided - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 874-891 (item 11), with items 29, 31 and 32
* **Discrepancy Description**:
  * Stage 2 adapters "take over" types such as `CpfParams`, `CpfProfile`, `CPF_DEFAULT_PARAMS` and `HysaScenario`.
  * The old hooks and pages that declare these types change only in stages 4-6. Evidence: `useCpfProfiles.ts:7-25`, `useHysaScenarios.ts:8-26`, `useSavingsGoal.ts:7-20`, `fire-calculator/page.tsx:12-27`.
  * The implementer must choose between two copies that can drift apart, and re-pointing the old files in stage 2, which is not in stage 2's file list.
* **Rationale & Recommendation**: State the rule. Suggested: in stage 2 the adapters define the types, and the old hook or page re-exports them (`export type { ... } from "@/lib/persistence/adapters/..."`) in the same commit. Add those files to stage 2's Modify list.

### 🟡 M6. The type moves in the adapter table are incomplete - Severity: Major
* **Reviewer Lens:** `egm-codebase-details`; `egm-implementation-readiness` (dividend `YieldSource`); `egm-style` ("default types")
* **Affected Scope:** Lines 884-891
* **Discrepancy Description**:
  * Budget: `BudgetItem.category` is a `BudgetCategory`, which is declared in the page and also used by `CATEGORIES` (`budget-planner/page.tsx:13-34`, `:48`). The adapter cannot compile without it.
  * Dividend: the row moves no types, but the page has its own `YieldSource`, with different fields from FIRE's (`dividend-calculator/page.tsx:11`). Its default sources call `genId("div")` (`:449-452`).
  * SRS: the "default types" are actually the constants `DEFAULT_DEPOSITS` and `DEFAULT_WITHDRAWAL` (`srs-calculator/page.tsx:18-21`, `:501-508`).
  * `savedAt?: string`: no type is told to gain it. It is needed by `CpfOaProfile` and `StoredCpfOaProfile` (`useCpfOaProfiles.ts:14-20`), by `WithdrawalSettings`, and by the other profile types.
* **Rationale & Recommendation**: Correct the three table rows as above. Add a sentence saying that every profile and stored record type gains `savedAt?: string`, and list `StoredCpfOaProfile` by name.

### 🟡 M7. The Save bar's state rules, `save()` result and layout are underspecified - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`, `egm-codebase-details` (visual tokens)
* **Affected Scope:** Lines 1033-1047 (item 23), with item 17 (`saveError`, `save`)
* **Discrepancy Description**:
  * No rule maps props to the four status strings. The unclear cases are: legacy and clean ("Saved" or nothing?), never saved and dirty, `saveError` together with `isDirty`, and loading.
  * Nothing says when `saveError` clears.
  * The return type of `save()` is not given. `useProfileDraft` needs it before it can call `replace`.
  * "Couldn't save. Try again" conflicts with spec §5 ("Couldn't save" with a retry), CUJ 5 and QA step 7. It is unclear whether "Try again" is text or a button.
  * "Bottom padding equal to the bar's height" gives no value. The height varies with `ManualSaveNotice` and the safe area.
  * The visual treatment is not specified. `docs/design.md:16` and `:33` require glassmorphism and gradient primary buttons, which `SiteHeader.tsx:101-106` already uses through `--header-glass`.
  * Spec §5's "rendered after hydration" is not repeated in the item.
* **Rationale & Recommendation**:
  * Add a precedence rule: loading shows nothing, then `saveError`, then `isDirty`, then `dateState === "never"`, then "Saved", with the legacy case stated.
  * `saveError` clears on a successful save and on Discard.
  * Type `save(): SaveResult`.
  * Use one error wording everywhere.
  * Give fixed classes, for example a bar height of `h-16` with page padding of `pb-24`, or have `SaveBar` render its own spacer.
  * Reference the design tokens.

### 🟡 M8. The redirect is written as a call during render - Severity: Major
* **Reviewer Lens:** `egm-codebase-details` (Major); `egm-style` (Major); `egm-implementation-readiness` (Nit)
* **Affected Scope:** Line 1090 (item 27), carried over by item 30 (line 1121)
* **Discrepancy Description**:
  * "Replace the redirect effect with `if (notFound) replace(listPath)`" reads as moving `router.replace` into the render body. That is a side effect in render and breaks react-hooks v7 purity.
  * The current code keeps the call in `useEffect`: `cpf-sa-calculator/[profileId]/page.tsx:569-575`, cpf-ma `:638-642`, cpf-oa `:519-523`, hysa `:641-643`, savings-goal `:594-598`.
  * `listPath` is unqualified.
* **Rationale & Recommendation**: Write `useEffect(() => { if (notFound) replace(adapter.listPath); }, [notFound, replace]);` and render `null` or the loading shell while `status !== "ready" || notFound`. Require `useGuardedRouter` to return stable functions (`useCallback`), so the effect does not loop.

### 🟡 M9. A hook is called inside a callback, and the redirect owner is unclear - Severity: Major
* **Reviewer Lens:** `egm-codebase-details` (Major); `egm-implementation-readiness` (Nit)
* **Affected Scope:** Lines 993-995 (item 18); spec §3 line 331
* **Discrepancy Description**:
  * Read literally, "it calls `useGuardedRouter().replace(...)`" after a save calls a hook inside `save()`, which breaks the Rules of Hooks.
  * The spec says the page calls `router.replace`, but the plan says the hook does it.
  * Line 994 also nests backticks inside inline code, which breaks the Markdown.
* **Rationale & Recommendation**: `useProfileDraft` calls `const { replace } = useGuardedRouter()` at the top level, and calls `replace(...)` inside `save()` after `ok: true`. Pick one owner and update the spec to match. Use a code block for the snippet.

### 🟡 M10. The adapter test cases do not fit the 5 profile adapters - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** Lines 933-941 (item 14), compared with item 6 (lines 822-828)
* **Discrepancy Description**:
  * "For each of the 12 adapters" requires `exists`, a round trip through `toEntries`/`read`, and `dateKey`. `ProfileAdapter` has none of these.
  * Cases that apply to a single tool (dividend, CPF SA, savings goal) are mixed into the same list.
* **Rationale & Recommendation**: Split the list into three groups:
  * **The 7 tool adapters:** the existing cases.
  * **The 5 profile adapters:**
    * `readAll` on empty storage returns `[]` with zero writes;
    * a legacy record, saved and read again, is `sameData` with the original;
    * `savedAt` survives `readAll` (this covers the CPF OA and savings-goal rebuilds);
    * `newProfile()` returns a fresh id each call and the documented default name.
  * **Tool-specific cases:** dividend, CPF SA and savings goal.

### 🟡 M11. Promised tests are missing (`tool.ts` and others) - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 1242-1244 compared with item 14 (lines 915-943)
* **Discrepancy Description**: The Verification Plan requires tests for `tool.ts`, but item 14 lists no `tool.test.ts` and no cases for `dateStateOf` or `saveTool`. These behaviours also have no test:
  * spec §2 step 1, which rejects a malformed entry before any write;
  * spec §2, where a rollback that also fails still returns the original error;
  * spec §8, "loading performs zero writes", which item 14 checks only on empty storage, not on legacy data.

  `unsaved-store.ts` is pure and has no tests either.
* **Rationale & Recommendation**:
  * Add `tool.test.ts`, covering `never`, `saved` and `legacy`, `saveTool` writing `dateKey` last, and storage left unchanged on failure.
  * Add the two missing save cases.
  * Add "read on legacy data gives zero writes" for every adapter except the CPF SA migration.
  * Optionally add `unsaved-store.test.ts` with `globalThis.confirm` stubbed.

### 🟡 M12. The CPF SA migration conflicts with "read performs zero writes" - Severity: Major
* **Reviewer Lens:** `egm-style` (Major); `egm-implementation-readiness` (Nit); `egm-codebase-details` (inside M1)
* **Affected Scope:** Lines 887, 934 and 1238
* **Discrepancy Description**:
  * Item 14 asserts zero writes on read, and spec §8 requires it. The CPF SA `readAll` writes during migration.
  * The plan does not say whether the migration calls `storage.setItem` directly or goes through `saveEntries`, or how errors are handled.
  * `readAll` also runs fresh inside `saveProfile`, `deleteProfile` and `useProfileList`.
* **Rationale & Recommendation**: State that the migration runs in `readAll` only while `cpf-sa:profiles` is absent. Choose one write path: either `saveEntries(s, [{ key: "cpf-sa:profiles", value }])` with the result ignored, or a direct `s.setItem` with errors swallowed, as today in `useCpfProfiles.ts:31-37`. Note that it is safe to run again. Exempt this case explicitly from the zero-write test.

### 🟡 M13. The `saveProfile` / `deleteProfile` / `newProfile` semantics are incomplete - Severity: Major
* **Reviewer Lens:** `egm-style`; `egm-codebase-details` (inside N13)
* **Affected Scope:** Lines 851-859 (item 9), 827-828 (item 6)
* **Discrepancy Description**: The plan leaves several cases open:
  * "Replaces or appends" is not tied to a mode.
  * `"new"` mode with an id that already exists (a double-pressed Save) is undefined.
  * The error shape is not given.
  * "The one array key" is not written out.
  * `deleteProfile` for an id that is missing is not covered.
  * The id and name that `newProfile()` produces for each tool are not given.
* **Rationale & Recommendation**:
  * `"existing"` replaces at the same index. `"new"` appends, or replaces if the id is already present.
  * The error is `{ ok: false, error: new Error("This profile was deleted in another tab") }`.
  * The entries are `[{ key: adapter.key, value: JSON.stringify(profiles) }]`.
  * A missing id in `deleteProfile` returns `{ ok: true }` with no write.
  * `newProfile()` keeps today's values: `p_${Date.now()}` with "New Scenario" for CPF, `genId("hysa")` for HYSA, and `sg_${Date.now()}` with "New Goal" and a target of 10_000 for savings goal.

### 🟡 M14. The `saveEntries` "well-formed" check is undefined, and a `toEntries` throw escapes - Severity: Major
* **Reviewer Lens:** `egm-style` (Major); `egm-implementation-readiness` (Nit)
* **Affected Scope:** Lines 842-845 (item 8), 865-866 (item 10)
* **Discrepancy Description**:
  * "Well-formed" is never defined.
  * The item quietly redefines spec §2 step 1 ("serialises every value first").
  * Serialising now happens in `toEntries`, so a `JSON.stringify` throw escapes `saveTool` and never becomes a `SaveResult`.
* **Rationale & Recommendation**: Define the check as "every key is a non-empty string and every value is a string or `null`; otherwise return `ok: false` before any write". Wrap `adapter.toEntries` in try/catch inside `saveTool`. Update spec §2 step 1 to match.

### 🟡 M15. The import partial-file rule is untested, and `adaptersForKey` has no caller - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** Lines 902-906 (item 12), 1205-1210 (item 37)
* **Discrepancy Description**:
  * The rule lives in a React component, and vitest runs in `node`, so nothing tests it.
  * `adaptersForKey` is exported "for the import rule", but item 37 loops over adapters instead.
  * The behaviour is not specified for a stored `dateKey` value that is invalid JSON or the legacy dividend string.
* **Rationale & Recommendation**:
  * Move the rule into `src/lib/persistence/import.ts` as `clearStaleDates(storage, importedKeys)`. It parses the stored `dateKey` value; if that is an object with `savedAt`, it deletes the field and writes the value back; otherwise it leaves it unchanged.
  * Test three cases: the file has the `dateKey`, the file has only some of the tool's keys, and the file has none of them.
  * Drop `adaptersForKey`, or name its caller.

### 🟡 M16. Manual QA step 1 cannot be run as written - Severity: Major
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`, `egm-codebase-details`
* **Affected Scope:** Lines 1247-1249
* **Discrepancy Description**:
  * "Each of the 17 pages" includes the 5 list pages, which have no Save bar, and the 5 detail pages, which redirect when there is no valid id.
  * The count leaves out the 5 new `/new` routes.
* **Rationale & Recommendation**: Rewrite the step:
  * The 7 single-state pages and the 5 `/new` pages show "Not saved yet", Save enabled and Discard hidden.
  * The 5 list pages show the empty state and no Save bar.
  * A made-up detail id redirects to its list page.
  * None of these pages writes to storage on load.

### 🟡 M17. Manual QA step 3 tests a guarded `push` that cannot be observed - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 1251-1253
* **Discrepancy Description**: Guarded `push` is used only on list pages (cards and Add; items 26 and 30), and list pages have no draft. So "each guarded push prompts" can never be seen.
* **Rationale & Recommendation**: Limit the step to the `GuardedLink` call sites on single-state and detail pages, or name the detail-page `push` sites if any exist.

### 🟡 M18. The plan contradicts spec §3 and §4 (router, lint scope, naming) - Severity: Major
* **Reviewer Lens:** `egm-style`; `egm-codebase-details` (N8)
* **Affected Scope:** Lines 994-995, 1000-1002, 1009-1013 and 1186-1192, compared with spec lines 331, 335, 356-358 and 364-366
* **Discrepancy Description**:
  * **Router:** spec §4 says redirects use the plain router. The plan routes them through `useGuardedRouter().replace` and bans `useRouter` elsewhere.
  * **Lint scope:** spec §4 blocks only `next/link`, in tool pages and shared components, with one exception. Item 36 blocks `next/link` and `useRouter` across all of `src/**`, with two exceptions.
  * **Naming:** spec §3 names the list hook method `deleteProfile(id)`, but the plan calls it `remove(id)` and uses `deleteProfile` for the pure function.
  * **Unsaved store:** spec §4 describes a map from page to `{ toolName, isDirty }`, while the plan uses `setUnsaved(ownerId, toolName | null)`.
* **Rationale & Recommendation**: Bring spec §3 and §4 into line with items 15, 19, 20 and 36, so that only one rule exists.

### 🟡 M19. Not every `next/link` importer is listed before a `src/**` lint ban - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 1174-1194 (items 35 and 36)
* **Discrepancy Description**: `concepts_brief.md:99` names `HeroSection` as a `Link` user, and the brief counts about 20 call sites. Item 35 lists only three files. Any importer left off the list fails `npm run lint`.
* **Rationale & Recommendation**: List every current `next/link` importer by path, or add an explicit step: "enable the rule and convert every file it reports".

### 🟡 M20. The item 30 file list has mixed path bases and the wrong route parameter - Severity: Major
* **Reviewer Lens:** `egm-style`; `egm-codebase-details` (N3, N7)
* **Affected Scope:** Lines 1112-1122; also 1131 and 1141-1144
* **Discrepancy Description**:
  * Paths switch between `src/app/tools/...`, paths relative to `tools/` and paths relative to each tool folder.
  * The "(Create)" label applies only to the `new` pages, but its placement suggests it covers the whole group.
  * HYSA and savings goal use `[scenarioId]`, not `profileId`: `hysa-tracker/[scenarioId]/page.tsx:635`, and `savings-goal/[scenarioId]/page.tsx:587-589`, which uses `useParams() as string` with no type.
  * The list does not say whether CPF MA and CPF OA have any differences.
* **Rationale & Recommendation**: Use a table with full `src/...` path, action and route parameter for each file. Use `useParams<{ scenarioId?: string }>()` (or `profileId?`) so strict TypeScript shows the `/new` case. State that CPF MA and CPF OA have no differences.

### 🟡 M21. The source of adapter `slug`, `name` and `listPath` is unstated - Severity: Major
* **Reviewer Lens:** `egm-codebase-details` (Major); `egm-implementation-readiness` (Nit); `egm-style` (Nit)
* **Affected Scope:** Lines 822-828 (item 6), 902
* **Discrepancy Description**:
  * The fields have no types.
  * `src/lib/tools.ts:5-96` already holds each tool's canonical slug and name, for example "CPF Special Account (SA) Calculator". Hand-typed values would drift from it, and the leave-prompt text uses `name`.
  * The format of `listPath` is undefined, but line 994 joins it with "/".
* **Rationale & Recommendation**: Type the fields as `slug: string; name: string; listPath: string`. Take `slug` and `name` from `tools.ts`, for example through a `toolMeta(slug)` helper. Set ``listPath = `/tools/${slug}` `` with no trailing slash.

### 🟡 M22. The `GuardedLink` order of operations is ambiguous - Severity: Major
* **Reviewer Lens:** `egm-style` (Major); `egm-implementation-readiness` (Nit); `egm-codebase-details` (Nit)
* **Affected Scope:** Lines 1018-1022 (item 21)
* **Discrepancy Description**: The text can be read as running the caller's `onNavigate` even after a cancelled navigation. The reviewers suggested different orders.
* **Rationale & Recommendation**: Pick one order and state it. Suggested: "If `confirmLeave()` returns false, call `e.preventDefault()` and return. Otherwise call `props.onNavigate?.(e)`."

---

### 🟢 N1. ESLint flat config has no "overrides" - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 1186-1192 (item 36)
* **Discrepancy Description**: The item gives no rule shape, and flat config has no "overrides". Pages still import `useParams` from `next/navigation`, so the rule must block only `useRouter`.
* **Rationale & Recommendation**: Give the rule as `paths: [{ name: "next/link", message: "Use GuardedLink" }, { name: "next/navigation", importNames: ["useRouter"], message: "Use useGuardedRouter" }]`. Add a second config object `{ files: ["src/components/GuardedLink.tsx", "src/hooks/useGuardedRouter.ts"], rules: { "no-restricted-imports": "off" } }`.

### 🟢 N2. Several line references are slightly off - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`, `egm-implementation-readiness`
* **Affected Scope:** Lines 897, 1153 and 1156
* **Discrepancy Description**:
  * The reviewers disagree about `useToolState.ts:52-67`. Implementation-readiness confirmed it. Codebase-details places `readFromStorage` at 53-69 and the type filter at 59-64.
  * `handleYearsChange` starts at `dividend-calculator/page.tsx:469`, not 470.
  * `fire-calculator/page.tsx:938-952` covers both `setYieldSources` (938-944) and `setDrawdownSources` (946-952).
* **Rationale & Recommendation**: Re-check `useToolState.ts` and correct the other two references.

### 🟢 N3. Test tooling details are missing - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 776-791 (items 2 and 3)
* **Discrepancy Description**:
  * `next build` type-checks the test files, so turning on vitest `globals` would break the build.
  * "Exact current stable version" leaves the version unrecorded.
  * `TZ=...` in an npm script does not work in Windows shells.
* **Rationale & Recommendation**: State that `globals` stays off and tests import `describe`, `it` and `expect` from `vitest`. Install with `--save-exact` and record the version. Optionally set `process.env.TZ` in `vitest.config.ts` instead.

### 🟢 N4. Client-component boundaries are not explicit - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Items 22-24 and 28 (lines 1024-1059, 1098-1100)
* **Discrepancy Description**:
  * Items 22-24 don't say `"use client"`.
  * `ManualSaveNotice` must read its flag after hydration, or the server and client renders differ.
  * Item 28 does not give the `new/page.tsx` contents.
* **Rationale & Recommendation**: Add `"use client"` to items 22-24, and have `ManualSaveNotice` gate its read on `useIsClient`. Specify that `new/page.tsx` has no `"use client"` and contains only `export { default } from "../[profileId]/page";`. A default export is allowed here because Next requires it for pages.

### 🟢 N5. `LastSaved` output mapping and height are vague - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 1027-1031
* **Discrepancy Description**: "Fixed minimum height" differs from spec §5's "fixed-height slot", and no value is given. The item does not map outputs to `dateState`.
* **Rationale & Recommendation**: Give a height class. Map the states: saved shows the date, never shows "Not saved yet", legacy shows nothing.

### 🟢 N6. `ManualSaveNotice` audience and storage failure are unclear - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** Lines 1053-1059
* **Discrepancy Description**: The spec says existing users are told, but the plan shows the notice to everyone. "Still works where storage is unavailable" does not say what is shown.
* **Rationale & Recommendation**: Either accept "everyone" in writing, or show the notice only when an `EXPORT_KEYS` key exists. State that the notice shows if the read throws.

### 🟢 N7. Unsaved store and guard details are missing - Severity: Nit
* **Reviewer Lens:** `egm-style`, `egm-implementation-readiness`, `egm-codebase-details`
* **Affected Scope:** Lines 947-966 (items 15 and 16)
* **Discrepancy Description**:
  * "First dirty tool name" is undefined.
  * The item does not say what the hook writes to the store when the page is clean or on unmount.
  * `beforeunload` has no `e.returnValue = ""` fallback.
  * The file is named `unsaved-store.ts`, while other `src/lib` files are camelCase.
* **Rationale & Recommendation**:
  * Define "first" as insertion order.
  * Specify `setUnsaved(id, isDirty ? toolName : null)` on change and `setUnsaved(id, null)` on unmount.
  * Add the `returnValue` fallback.
  * Consider renaming the file to `unsavedStore.ts`.

### 🟢 N8. `history.replaceState(null, ...)` drops the state and the hash - Severity: Nit
* **Reviewer Lens:** `egm-style` (flagged for technical confirmation)
* **Affected Scope:** Line 981
* **Discrepancy Description**:
  * Style says passing `null` discards `history.state` and the hash.
  * The other two reviewers confirmed that `replaceState(null, "", path)` is the documented App Router pattern.
  * Dropping the hash is a real change in behaviour.
* **Rationale & Recommendation**: Keep `null` as documented, but append `location.hash` to the URL.

### 🟢 N9. Registry typing and `EXPORT_KEYS` contents are not stated - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`, `egm-style`
* **Affected Scope:** Lines 899-906
* **Discrepancy Description**:
  * A mixed adapter array type-checks without `any` only if the adapter members use method syntax.
  * "Standalone keys ... (none today)" describes a mechanism with nothing in it.
  * The item does not say whether `EXPORT_KEYS` includes `tool:cpf-sa-calculator`, the theme key or `meta:manual-save-notice-dismissed`.
* **Rationale & Recommendation**: Use method syntax and `readonly ToolAdapter<unknown>[]`. Say that `EXPORT_KEYS` is the de-duplicated union of all adapter keys. List how it differs from the current 19 keys.

### 🟢 N10. The `id: string | "new"` type collapses to `string` - Severity: Nit
* **Reviewer Lens:** `egm-style`, `egm-codebase-details`
* **Affected Scope:** Line 987
* **Discrepancy Description**: In TypeScript, the union `string | "new"` is just `string`, so the type does not mark `"new"` as special.
* **Rationale & Recommendation**: Use a tagged parameter, or document `"new"` as a reserved sentinel in prose.

### 🟢 N11. The `formatSavedDate` snippet is malformed - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 796-800
* **Discrepancy Description**: The template literal spans a line break, and the getters have no receiver.
* **Rationale & Recommendation**: Write ``const d = new Date(iso); `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` `` on one line.

### 🟢 N12. Savings goal also has the empty-list blank-page bug - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Lines 1125-1129
* **Discrepancy Description**: The fix is listed only under HYSA. `savings-goal/[scenarioId]/page.tsx:594-606` renders an empty `<main>` in the same case, and spec §3 line 322 names both tools.
* **Rationale & Recommendation**: List the fix under savings goal too.

### 🟢 N13. QA step 6 uses a parameter the mortgage tool doesn't have - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Line 1258
* **Discrepancy Description**: The mortgage tool has no `principal` field. Its fields are `propertyPrice`, `downPaymentPct`, `annualRate` and `tenureYears` (`mortgage-calculator/page.tsx:613-618`).
* **Rationale & Recommendation**: Use `?propertyPrice=1`.

### 🟢 N14. Item 37's dividend import note is a no-op - Severity: Nit
* **Reviewer Lens:** `egm-implementation-readiness`, `egm-style`
* **Affected Scope:** Lines 1208-1210
* **Discrepancy Description**: The reader stores values as they are, so no dividend-specific code is needed.
* **Rationale & Recommendation**: Say "No dividend-specific import code is needed."

### 🟢 N15. Item 25 is noise - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 1061-1065
* **Discrepancy Description**: It is a numbered target file with no change.
* **Rationale & Recommendation**: Drop it, or fold it into item 33.

### 🟢 N16. SaveBar visual tokens are missing - Severity: Nit
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** Lines 1038-1040
* **Discrepancy Description**: The item does not name the design tokens the bar should use. This is merged into M7, and listed here so it can be tracked.
* **Rationale & Recommendation**: Reference `docs/design.md:16` and `:33`, and the `--header-glass` treatment in `SiteHeader.tsx:101-106`.

### 🟢 N17. Terminology and capitalisation are inconsistent - Severity: Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Various lines
* **Discrepancy Description**:
  * "stage 6" (lines 1065, 1194, 1233 and 1236) vs the "Stage 6" headings.
  * "budget" (line 1165) vs "budget planner" (line 755).
  * "the five former `useToolState` tools" (line 896) does not name the tools, and they still use the hook at stage 2.
  * "date key" vs `dateKey` (line 878); `dateKey` and `listPath` are not in spec §1.
  * "used by more than three files" (line 814) vs CLAUDE.md's "3+ files".
  * Line 1091 says "rename" where "change the label of" is meant.
  * The SRS effects are listed under setters, but they are removed (lines 1153-1156).
* **Rationale & Recommendation**: Normalise these terms, and add `dateKey` and `listPath` to spec §1.

### 🟢 N18. Minor precision gaps - Severity: Nit
* **Reviewer Lens:** `egm-style`, `egm-implementation-readiness`
* **Affected Scope:** Lines 752, 1075-1076, 1214-1228 and 1245-1261
* **Discrepancy Description**:
  * Line 752 says every stage passes tests, but stage 1 has no test runner.
  * Documentation items 38-39 have no stage.
  * The confirm and alert text are not given as code.
  * The list pages' loading state is unspecified.
  * The QA header leaves out Firefox, which step 5 uses.
  * Step 5 does not say where to record the iOS result.
  * Step 7 does not say how to fill the quota or how to clean up.
* **Rationale & Recommendation**: Fill in each of these.
