# Goldfish Annotated Review Report

**Status:** resolved (24 items: 22 fixes applied, A10 sub-claim contested and accepted, A23(a) and the CLAUDE.md shadcn line declined)

**Target:** `docs/designs/explicit-save-last-saved-dates.md` (full file, lines 1-1267)
**Source:** `consolidated_review_report.md` (action items A1-A24, merged from Stages 5-9)
**Author decisions already given:** A7: send import through the save module.

Tally: 22 PROPOSE FIX, 1 CONTEST (in part), 0 ESCALATE, 2 DECLINE. A23 counts once as PROPOSE FIX and once as DECLINE, because it has both parts. A10 counts as PROPOSE FIX, with one sub-claim contested.

## Prioritized Findings & AI Suggestions

### [Issue A1] [`egm-codebase-details`, `egm-implementation-readiness`] - Severity: Blocker
*   **Affected Scope:** [Lines 391](docs/designs/explicit-save-last-saved-dates.md#L391), [1091](docs/designs/explicit-save-last-saved-dates.md#L1091), [1129](docs/designs/explicit-save-last-saved-dates.md#L1129) (§5 Wording changes; items 27, 30)
*   **Discrepancy Description:** The plan renames the name editor's "Save" button to "Done", but no such button exists.
*   **Rationale:** The editors are click-to-edit buttons that commit on blur or Enter (`cpf-sa-calculator/[profileId]/page.tsx:98-167`). An implementer can't carry out the step.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** I confirmed this against the code. The error came from the brief and I carried it into the draft.
*   ***Proposed Edit:***
    *   Location: §5 "Wording changes", the third bullet; item 27, the "Rename the inline name editor's button" bullet; item 30, the "(button becomes 'Done')" clause.
    *   Change: Delete all three. Add to item 27: "The name editor keeps its commit-on-blur behaviour. Its commit now calls `setDraft({ name })` instead of writing storage. Rename its `onSave` prop to `onCommit`."

### [Issue A2] [`egm-structural`, `egm-design`, `egm-style`, `egm-zoom-out`] - Severity: Blocker
*   **Affected Scope:** [Lines 486-715](docs/designs/explicit-save-last-saved-dates.md#L486-L715) (Alternatives Considered), [414](docs/designs/explicit-save-last-saved-dates.md#L414) (§7 table)
*   **Discrepancy Description:** About 20 of the 25 alternatives give an owner ("Rejected by author") instead of a trade-off. The reasons exist only in `concepts_brief.md`, which is untracked and not linked.
*   **Rationale:** The feature-spec standard treats this as a fail. Readers can't see why zero-loss autosave (B) or a stable data shape (N) lost.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The trade-offs are known from the brainstorm and drafting; they were simply not written down.
*   ***Proposed Edit:***
    *   Location: the whole Alternatives section, and the §7 delete row.
    *   Change:
        *   Rewrite the section as 8 top-level alternatives, each ending "Rejected: <deciding trade-off>":
            1.  B: autosave without the mount writes.
            2.  C: Save only for record-keeping tools.
            3.  E/F: the other draft models.
            4.  G: one draft shared by the list and detail pages.
            5.  N: one date key per tool.
            6.  P/Q: the SRS and dividend placements.
            7.  R/S/T: the shared-link variants.
            8.  U/V: other leave-warning approaches.
        *   Write "Author preference" where that is the honest reason. For example, for B: "Author preference for a confirmed save moment and a Discard sandbox, over B's zero data loss on mobile."
        *   Move the remaining entries into one table with the columns "Option" and "Why not": A, D, H, I, J, K, L, M, O, W, X and Y.
        *   Move `concepts_brief.md` to `docs/designs/explicit-save-last-saved-dates.brief.md`, and link it once at the top of the section.
        *   In §7, change the delete row's reason to "The confirm dialog counts as the explicit save action."

### [Issue A3] [`egm-zoom-out`, `egm-inventive-catalyst`, `egm-style`, `egm-design`] - Severity: Major
*   **Affected Scope:** [Lines 13-14](docs/designs/explicit-save-last-saved-dates.md#L13-L14), [36-55](docs/designs/explicit-save-last-saved-dates.md#L36-L55) (Overview, The Problem)
*   **Discrepancy Description:** The doc presents explicit Save as technically required and says "every tool ... even opening a page" writes. Neither is true.
*   **Rationale:** Each problem is solved by a separate change. Readers would think an accurate date requires giving up autosave.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid, and it matches what you decided: you chose Save over B, which was offered as the lower-risk option.
*   ***Proposed Edit:***
    *   Location: Overview, the sentence "each keystroke, and even opening a page"; The Problem, the paragraph that starts "The author chose explicit Save".
    *   Change:
        *   Overview: "each keystroke writes to storage, and seven tools also write when a page opens."
        *   Replace the paragraph with: "Removing the page-load writes and the URL sync, and sending every write through one save module, would make the date reliable even with autosave (Alternative B). The author chose explicit Save as a product decision. The date then means the user confirmed the data, and Discard lets users try numbers without keeping them." Keep the costs paragraph.
        *   Replace "makes an accurate one impossible" with "makes an accurate one unreliable".

### [Issue A4] [`egm-inventive-catalyst`, `egm-design`] - Severity: Major
*   **Affected Scope:** [Lines 75-87](docs/designs/explicit-save-last-saved-dates.md#L75-L87), [199](docs/designs/explicit-save-last-saved-dates.md#L199), [310](docs/designs/explicit-save-last-saved-dates.md#L310), items 10, 17, 18
*   **Discrepancy Description:** Data without a date counts as "legacy", and Save stays disabled until a value changes. Almost every current user is legacy, so they can't get a date without a fake edit.
*   **Rationale:** This defeats the feature for its main audience. CUJ 6 also assumes a Save the UI won't allow.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The old mount write stored defaults for viewed-only users too, so this covers almost everyone.
*   ***Proposed Edit:***
    *   Location: Goals, the "date changes only when data changes" bullet and the three-state bullet; §3 `canSave`; CUJ 6; items 10, 17 and 18.
    *   Change:
        *   Set `canSave = isDirty || dateState !== "saved"`.
        *   In Goals, say: "Save is also enabled for data that has never been saved and for data without a date, so returning users can confirm their existing numbers."
        *   Rename the state "No date yet (data saved before this feature)". List its sources: users who only viewed a tool under autosave, the CPF SA migration, and older backups.
        *   Add a Non-Goal: "Refreshing a date on already-dated data without an edit."
        *   Add a test that a legacy record can be saved.

### [Issue A5] [`egm-comprehension`, `egm-zoom-out`, `egm-implementation-readiness`, `egm-style`] - Severity: Major
*   **Affected Scope:** [Lines 368-392](docs/designs/explicit-save-last-saved-dates.md#L368-L392), items 22-23
*   **Discrepancy Description:** No rule maps the states to the Save bar text and buttons. `SaveBar` and `LastSaved` also show the same state twice.
*   **Rationale:** The implementer would have to make up the cases for legacy data, loading, and an error combined with unsaved changes.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: §5 `SaveBar` and `LastSaved` bullets; items 22-23.
    *   Change:
        *   `LastSaved` alone owns the date line: "Last saved: 8 Nov 2026", "Not saved yet", or nothing.
        *   `SaveBar` shows only the action state, in this order of priority:

            | Condition | Bar text | Save | Discard |
            | --- | --- | --- | --- |
            | loading | (bar hidden) | hidden | hidden |
            | `saveError` | "Couldn't save" | enabled (retry) | shown |
            | `isDirty` | "Unsaved changes" | enabled | shown |
            | clean and `dateState !== "saved"` | (none) | enabled | hidden |
            | clean and saved | (none) | disabled | hidden |

        *   `saveError` clears on a successful save and on Discard.
        *   `save()` returns `SaveResult`.
        *   Use the single wording "Couldn't save" everywhere.

### [Issue A6] [`egm-comprehension`, `egm-style`, `egm-design`, `egm-structural`, `egm-zoom-out`, `egm-implementation-readiness`, `egm-codebase-details`] - Severity: Major
*   **Affected Scope:** [Lines 67-70, 95](docs/designs/explicit-save-last-saved-dates.md#L67-L95), [219-245](docs/designs/explicit-save-last-saved-dates.md#L219-L245), [288-300](docs/designs/explicit-save-last-saved-dates.md#L288-L300), [410-418](docs/designs/explicit-save-last-saved-dates.md#L410-L418), items 8, 11, [1235-1241](docs/designs/explicit-save-last-saved-dates.md#L1235-L1241)
*   **Discrepancy Description:** The rule "Save is the only writer" has three different exception lists and no build check. The grep can't detect injected-storage writes. The CPF SA migration conflicts with "adapters are pure". "All or nothing" overstates the guarantee. "Well-formed" is undefined, and a `toEntries` throw escapes.
*   **Rationale:** This is the core rule of the design. Right now nothing enforces it.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Sending import through the save module (A7) and the migration through `saveEntries` shrinks the allowlist to four files.
*   ***Proposed Edit:***
    *   Location: Goals; the diagram; §2; §7; items 8, 11 and 36; Verification.
    *   Change:
        *   **Goals:** "Save is the only way tool data is written, apart from the exceptions listed in §7." Line 95 becomes "the one exception to 'every user action waits for Save'".
        *   **§7 becomes the single list:**
            *   list-page delete;
            *   the CPF SA migration, which writes through `saveEntries` and ignores the result;
            *   `useTheme`;
            *   the notice flag.
            *   Import is no longer an exception (A7).
        *   **Build check (item 36):** add an ESLint `no-restricted-properties` rule that bans the properties `setItem` and `removeItem` on any object. It is turned off only for `src/lib/persistence/save.ts`, `src/lib/persistence/testing/memoryStorage.ts`, `src/hooks/useTheme.ts` and `src/components/ManualSaveNotice.tsx`. This replaces the grep.
        *   **Migration (item 11):** the migration runs in `cpf-sa` `readAll` only when `cpf-sa:profiles` is absent. Running it again does no harm. It is exempt from the zero-write test.
        *   **§2 wording:** "If a write fails, it tries to restore the keys already written and always reports the error. The date key is written last, so a failed save never shows a new date."
        *   **Item 8:** "Well-formed" means every key is a non-empty string and every value is a string. `saveTool` and `saveProfile` wrap `toEntries` and `JSON.stringify` in try/catch, and turn a throw into `ok: false`.
        *   **Diagram:** only the save module (and the labelled §7 exceptions) draws a write arrow. The guards read the unsaved store.

### [Issue A7] [`egm-inventive-catalyst`, `egm-zoom-out`, `egm-design`, `egm-implementation-readiness`] - Severity: Major
*   **Affected Scope:** [Lines 394-408](docs/designs/explicit-save-last-saved-dates.md#L394-L408) (§6), [902-906](docs/designs/explicit-save-last-saved-dates.md#L902-L906) (item 12), [1197-1212](docs/designs/explicit-save-last-saved-dates.md#L1197-L1212) (item 37)
*   **Discrepancy Description:** Import writes key by key, with no rollback or normalisation, then patches `savedAt` afterwards. The rule covers only one direction, sits in an untested component, and `adaptersForKey` has no caller.
*   **Rationale:** Import is the largest writer, and it gets none of the save guarantees.
*   ***AI Suggestion:*** PROPOSE FIX (author decision: send it through the save module)
*   ***Justification:*** You chose this approach.
*   ***Proposed Edit:***
    *   Location: §6; item 12; item 37; a new item `src/lib/persistence/import.ts` with its test.
    *   Change:
        *   **New pure function** `importBackup(storage, data): SaveResult & { toolsImported: number; keysSkipped: string[] }`:
            1.  For each adapter that owns at least one key in `data`, build a read-only view. The view returns the file's value for the keys in the file and the stored value for the rest.
            2.  Call `adapter.read` (or `readAll`) on that view, so the data is normalised.
            3.  Take `savedAt` only from the file: use the date read from the view when the file contains the adapter's date-carrying key, and `null` otherwise. Profiles keep each record's own `savedAt` from the file.
            4.  Collect `toEntries(record, savedAt)` for every adapter it touched.
            5.  Write everything with one `saveEntries` call, so the import succeeds or fails as a whole.
        *   **Keys:** keys no adapter owns, such as `tool:srs-calculator` from older files, go into `keysSkipped`.
        *   **`toEntries`** accepts `savedAt: string | null`. A null date writes the record without `savedAt`.
        *   **`DataPortability.tsx`** calls `importBackup(localStorage, payload.data)`. It shows "Couldn't import" on `ok: false`, reports `toolsImported`, and reloads as now.
        *   **Delete** the partial-file rule and `adaptersForKey`.
        *   **Tests:**
            *   a full file restores data and dates;
            *   a file missing a tool's date-carrying key gives `null`;
            *   a quota failure part-way leaves storage unchanged;
            *   unknown keys are skipped;
            *   an older string value for dividend imports.

### [Issue A8] [`egm-design`, `egm-style`, `egm-zoom-out`, `egm-inventive-catalyst`] - Severity: Major
*   **Affected Scope:** [Lines 459-462](docs/designs/explicit-save-last-saved-dates.md#L459-L462), [733-737](docs/designs/explicit-save-last-saved-dates.md#L733-L737), §1 dividend row ([280](docs/designs/explicit-save-last-saved-dates.md#L280))
*   **Discrepancy Description:** The claim that the old build drops `savedAt` is wrong for CPF SA, HYSA, SRS and probably CPF MA. Their old loaders pass the whole record through, so an old build keeps a stale date while it autosaves. An old tab open during a deploy can also overwrite profiles created in the new build.
*   **Rationale:** The rollback section is the safety net, and it understates the risk.
*   ***AI Suggestion:*** PROPOSE FIX (one author decision needed: the dividend format)
*   ***Justification:*** I confirmed it for CPF SA (`useCpfProfiles.ts:44`, `{ ...p }`). Since A7 sends import through adapters, Alternative P's only objection (a partial import drifting the date) no longer applies.
*   ***Proposed Edit:***
    *   Location: §9 rollback paragraph; NFR rollout bullet; §1 dividend row (depending on your decision).
    *   Change:
        *   Correct the claim: "Rolling back keeps all tool data. CPF OA, savings goal and the five `useToolState` tools drop `savedAt`. CPF SA, CPF MA, HYSA and SRS keep it while autosaving newer edits, so after a roll-forward they can show a stale date. This is accepted."
        *   Add the risk that an old tab open during a deploy overwrites data, also accepted.
        *   State the rule: "Data written by the new build must load in the old build."
        *   **Dividend, your choice:**
            *   (a) Keep the object format and accept that projection years reset to 20 on rollback.
            *   (b) Use Alternative P. `tool:dividend-calculator = { savedAt }` becomes the date-carrying key and `dividend:projection-years` stays unchanged. This removes the rollback data loss and the reader that accepts two formats, at the cost of one more exported key.
        *   No data fingerprint is added.

### [Issue A9] [`egm-structural`, `egm-zoom-out`, `egm-style`] - Severity: Major
*   **Affected Scope:** caveats at lines 57-63, 101-105, 136-137, 184-185, 362-363, 459-467 and 721-737
*   **Discrepancy Description:** There is no Risks & Mitigations section. The caveats are scattered (the leave warning appears five times) and some risks have no mitigation.
*   **Rationale:** The standard requires this section. Scattered copies also drift apart.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Adding the table while deleting the copies keeps the doc's length the same.
*   ***Proposed Edit:***
    *   Location: a new H2, "Risks & Mitigations", after Non-Functional Requirements; each caveat listed above.
    *   Change:
        *   Add a table with the columns risk / impact / mitigation or "accepted". Rows:
            1.  Unguarded browser back, swipe-back and iOS tab close.
            2.  A mobile tab is evicted and edits are lost.
            3.  Last write wins across tabs.
            4.  Quota full, or the rollback itself fails.
            5.  The keyboard covers the Save bar.
            6.  An old tab stays open during a deploy.
            7.  Rollback to the old build (A8).
            8.  `cacheComponents` is turned on later.
            9.  localStorage grows, as the HYSA rows build up monthly.
        *   Replace each scattered caveat with a one-line pointer to the table.
        *   Fold the §9 rollback paragraph and the NFR rollout bullet into rows 6-7.

### [Issue A10] [`egm-zoom-out`, `egm-comprehension`, `egm-design`, `egm-style`, `egm-codebase-details`, `egm-implementation-readiness`] - Severity: Major
*   **Affected Scope:** [Lines 341-366](docs/designs/explicit-save-last-saved-dates.md#L341-L366) (§4), items 18-21, 27, 35, 36
*   **Discrepancy Description:** The guard API is defined twice and the two versions disagree:
    *   plain router vs `useGuardedRouter`;
    *   the lint scope;
    *   a hook called inside `save()`;
    *   a redirect in the render body;
    *   flat config has no "overrides";
    *   `GuardedLink`'s order of operations;
    *   naming (`deleteProfile` vs `remove`, and the store API).
*   **Rationale:** The implementer gets two answers. Two of the forms break the Rules of Hooks.
*   ***AI Suggestion:*** PROPOSE FIX. CONTEST the sub-claim from Stage 9 M19 and Stage 8 that `HeroSection` imports `next/link`.
*   ***Justification:*** The rest is valid. Contest evidence: `grep -rln 'from "next/link"' src` returns the 17 tool pages, `SiteHeader.tsx`, `ToolCard.tsx` and `tools/[slug]/page.tsx`. It does not return `HeroSection.tsx` or `src/app/page.tsx`. Items 26-32 and 35 together cover every importer. Even so, the doc should say so explicitly.
*   ***Proposed Edit:***
    *   Location: §4 becomes the only definition; items 18, 20, 21 and 36 point to it.
    *   Change:
        *   `useGuardedRouter()` is called at the top level and returns stable functions (`useCallback`): `{ push, replaceWithoutPrompt }`. It is the only importer of `useRouter`.
        *   `GuardedLink`: "If `confirmLeave()` returns false, call `e.preventDefault()` and return. Otherwise call `props.onNavigate?.(e)`." It is the only importer of `next/link`.
        *   The detail page owns the redirects. It gets `replaceWithoutPrompt` at the top level and calls it:
            *   inside `useEffect(() => { if (notFound) replaceWithoutPrompt(listPath) }, [notFound, replaceWithoutPrompt])`;
            *   in its Save handler after `ok: true` in `"new"` mode.

            `useProfileDraft` does no routing.
        *   Item 36 gives the exact flat-config rule. One object sets `no-restricted-imports` with:
            *   `{ name: "next/link", message: "Use GuardedLink" }`;
            *   `{ name: "next/navigation", importNames: ["useRouter"], message: "Use useGuardedRouter" }`.

            A second object, `{ files: [GuardedLink.tsx, useGuardedRouter.ts], rules: { "no-restricted-imports": "off" } }`, turns it off for the two wrapper files. Item 36 also names the 20 current importers.
        *   **Names:** the list hook exposes `remove(id)`, and the pure function is `deleteProfile`. The store API is `setUnsaved(ownerId, toolName | null)`. §3 and §4 use these names.

### [Issue A11] [`egm-implementation-readiness`, `egm-codebase-details`] - Severity: Major
*   **Affected Scope:** item 35 ([lines 1174-1183](docs/designs/explicit-save-last-saved-dates.md#L1174-L1183)), §9 stages 3-6
*   **Discrepancy Description:** `SiteHeader` switches to `GuardedLink` only in stage 6. That leaves the wordmark unguarded on CPF pages that are already in production by stage 4.
*   **Rationale:** This is the CUJ 4 failure, live in production.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. `GuardedLink` does nothing while no page is dirty, so swapping early is safe.
*   ***Proposed Edit:***
    *   Location: item 35 and §9.
    *   Change: Move the swap of `SiteHeader.tsx`, `ToolCard.tsx` and `tools/[slug]/page.tsx` into stage 3. Each tool page swaps its own back links when it moves to Save. The lint rule still lands at the end of stage 6.

### [Issue A12] [`egm-implementation-readiness`, `egm-codebase-details`, `egm-style`, `egm-design`] - Severity: Major
*   **Affected Scope:** items 17-18 ([lines 967-995](docs/designs/explicit-save-last-saved-dates.md#L967-L995)), §3
*   **Discrepancy Description:** Several hook mechanics are unspecified, and the obvious way to write them fails the react-hooks v7 lint rules:
    *   the server-render guard;
    *   how the ref is updated;
    *   the memo dependencies;
    *   `canSave`;
    *   the loading type;
    *   the profile `dateState` rule.
*   **Rationale:** The implementer would have to make these decisions, and could fail lint or hit a hydration mismatch.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The repo already follows this pattern: `useIsClient` plus lazy initialisers guarded by `typeof window`.
*   ***Proposed Edit:***
    *   Location: items 17 and 18; §3 bullets.
    *   Change:
        *   **Initial read:** a `useState` lazy initialiser. On the server (`typeof window === "undefined"`) it returns `{ record: defaults(), savedAt: null, exists: false }`. On the client it returns `adapter.read(localStorage)`. `status` is `useIsClient() ? "ready" : "loading"`.
        *   **Placeholder:** converted pages render a fixed-height placeholder until `status === "ready"`, so the server and client renders match.
        *   **Ref:** `latestDraft` is updated only inside the `setDraft` wrapper, never during render.
        *   `isDirty = useMemo(() => status === "ready" && !sameData(draft, snapshot), [status, draft, snapshot])`.
        *   `canSave = status === "ready" && (isDirty || dateState !== "saved")`.
        *   **Profiles:** `useProfileDraft` returns `draft: P | null`, which is null while loading or not found. Its `dateState` is `"never"` in `"new"` mode, `"saved"` when `savedAt` is set, and `"legacy"` otherwise.
        *   `save()` always reads `latestDraft.current`, which covers name editors that commit on blur.

### [Issue A13] [`egm-implementation-readiness`, `egm-codebase-details`, `egm-style`, `egm-zoom-out`, `egm-design`] - Severity: Major
*   **Affected Scope:** items 6, 7, 11 ([lines 810-898](docs/designs/explicit-save-last-saved-dates.md#L810-L898)), items 29, 31, 32
*   **Discrepancy Description:** Several type details are left open:
    *   only FIRE has a record type;
    *   handling of a nested `savedAt` is unclear;
    *   the type-move table is incomplete;
    *   type ownership between stages is undecided;
    *   the source of `slug`/`name`/`listPath` is unstated;
    *   the `readFromStorage` filter may drop `savedAt`.
*   **Rationale:** Adapters, tests and page rewrites all depend on these types.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. The facts come from the code, so I can fill them in without asking you.
*   ***Proposed Edit:***
    *   Location: item 6 (types), item 7, the item 11 table, and stage 2's file list.
    *   Change:
        *   Add a "Record type" column for all 7 single-state adapters. Each takes the shape `{ inputs: <useToolState fields>, <list keys> }`. SRS is `{ deposits, withdrawal }` and dividend is `{ sources, projectionYears }`.
        *   `read` always removes `savedAt` from the record and returns it separately. `stableStringify` leaves out the listed keys at every depth. Add a nested-`savedAt` test.
        *   Complete the type moves:
            *   `BudgetCategory` (plus `CATEGORIES` if needed);
            *   dividend's own `YieldSource`;
            *   the SRS constants `DEFAULT_DEPOSITS` and `DEFAULT_WITHDRAWAL`;
            *   every profile and stored type gains `savedAt?: string`, including `StoredCpfOaProfile`.
        *   **Stage 2 rule:** the adapters define the types, and the old hook or page re-exports them in the same commit. Add those files to stage 2's Modify list.
        *   **Adapter fields:** `slug: string; name: string; listPath: string`. `slug` and `name` come from `src/lib/tools.ts`, and ``listPath = `/tools/${slug}` ``.
        *   The `useToolState`-style type filter applies to `inputs` only, after `savedAt` has been removed.

### [Issue A14] [`egm-design`, `egm-style`, `egm-codebase-details`] - Severity: Major
*   **Affected Scope:** items 6, 9 ([lines 822-859](docs/designs/explicit-save-last-saved-dates.md#L822-L859))
*   **Discrepancy Description:** Profile save, delete and create are incomplete:
    *   the replace/append mode is not defined;
    *   a double tap in `"new"` mode is not handled;
    *   the error shape is not given;
    *   deleting a missing id is not covered;
    *   the values `newProfile()` returns are not given.
*   **Rationale:** These are edge cases the implementer would otherwise have to decide.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: item 9 and item 6's `newProfile`.
    *   Change:
        *   `"existing"` replaces the record at the same index. `"new"` appends, or replaces if the id is already present (upsert).
        *   Missing in `"existing"` returns `{ ok: false, error: new Error("This profile was deleted in another tab") }`.
        *   The entries are `[{ key: adapter.key, value: JSON.stringify(profiles) }]`.
        *   `deleteProfile` on a missing id returns `{ ok: true }` and writes nothing.
        *   `newProfile()` keeps today's values: CPF uses `p_${Date.now()}` and "New Scenario"; HYSA uses today's id and name; savings goal uses `sg_${Date.now()}`, "New Goal" and a target of 10,000.
        *   Disable Save while a save is in progress.

### [Issue A15] [`egm-implementation-readiness`, `egm-style`, `egm-codebase-details`, `egm-design`] - Severity: Major
*   **Affected Scope:** items 5 and 14 ([lines 808-943](docs/designs/explicit-save-last-saved-dates.md#L808-L943)), §8, Verification
*   **Discrepancy Description:** The test plan has gaps:
    *   the adapter cases don't fit the profile adapters;
    *   there is no `tool.test.ts`;
    *   two save cases are missing;
    *   "zero writes" is tested only on empty storage;
    *   `unsaved-store` has no tests.
*   **Rationale:** The Verification Plan promises tests that item 14 never lists.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: item 14; §8; Verification; plus `import.test.ts` from A7.
    *   Change:
        *   Split the adapter tests into three groups:
            *   **Tool adapters (7):** the existing cases.
            *   **Profile adapters (5):**
                *   `readAll` on empty storage gives `[]` with zero writes;
                *   a legacy record survives a round trip;
                *   `savedAt` survives `readAll`;
                *   `newProfile()` gives a fresh id each call.
            *   **Tool-specific cases:** dividend formats, CPF SA migration, savings-goal ids.
        *   Add `tool.test.ts`: the three `dateStateOf` states, the date written last, and storage unchanged on failure.
        *   Add two save cases: a malformed entry rejected before any write, and a rollback that also fails still returning the original error.
        *   Add "reading legacy data performs zero writes" for every adapter except CPF SA.
        *   Add `unsaved-store.test.ts`, with `globalThis.confirm` stubbed.
        *   §8 says "`read` performs zero writes". Manual QA covers page-load writes.

### [Issue A16] [`egm-comprehension`, `egm-structural`, `egm-implementation-readiness`, `egm-style`, `egm-codebase-details`] - Severity: Major
*   **Affected Scope:** [Lines 20-21](docs/designs/explicit-save-last-saved-dates.md#L20-L21), [67-68](docs/designs/explicit-save-last-saved-dates.md#L67-L68), QA [1245-1261](docs/designs/explicit-save-last-saved-dates.md#L1245-L1261)
*   **Discrepancy Description:** The text implies 17 places with a Save bar, but list pages have none. QA step 1 can't be run as written. Step 3 tests a `push` that can never be dirty. Step 6 uses a parameter that doesn't exist.
*   **Rationale:** QA would fail, or prove nothing.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. I checked the mortgage tool's fields at `mortgage-calculator/page.tsx:613-618`.
*   ***Proposed Edit:***
    *   Location: Overview point 1; Goals bullet 1; QA steps 1, 3 and 6.
    *   Change:
        *   Define "Save pages" once, in the Overview: "the 7 single-state tool pages and the 5 multi-profile detail pages, including their `new` mode". Refer to that term elsewhere.
        *   **QA step 1:**
            *   the 7 tool pages and the 5 `/new` pages show "Not saved yet", with Save enabled and Discard hidden;
            *   the 5 list pages show no Save bar;
            *   a made-up detail id redirects to its list page;
            *   no page writes on load.
        *   **QA step 3:** limit it to the `GuardedLink` sites on Save pages.
        *   **QA step 6:** use `?propertyPrice=1`.

### [Issue A17] [`egm-design`, `egm-style`, `egm-structural`, `egm-zoom-out`] - Severity: Major
*   **Affected Scope:** [Lines 370-374](docs/designs/explicit-save-last-saved-dates.md#L370-L374), [729-730](docs/designs/explicit-save-last-saved-dates.md#L729-L730), item 23
*   **Discrepancy Description:** The requirement "stays above the on-screen keyboard" has no mechanism, and the page padding has no value.
*   **Rationale:** A fixed bar sits behind the keyboard on iOS Safari, so the requirement can't be met as written.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Relaxing the requirement avoids adding `visualViewport` code.
*   ***Proposed Edit:***
    *   Location: NFR Mobile bullet; §5 `SaveBar`; item 23.
    *   Change:
        *   The requirement becomes: "The bar may be covered while the on-screen keyboard is open. It must be visible whenever the keyboard is closed."
        *   `SaveBar` renders its own spacer element with the same height as the bar, so pages need no padding value.

### [Issue A18] [`egm-zoom-out`, `egm-style`] - Severity: Major
*   **Affected Scope:** §9 ([lines 440-456](docs/designs/explicit-save-last-saved-dates.md#L440-L456)), items 11-24
*   **Discrepancy Description:** Stages 2-3 build all 12 adapters and all hooks before any page uses them. The rollout sentence also reverses cause and effect, since staging is what creates the mixed period.
*   **Rationale:** Open interface changes (A7, A10, A13) could force 11 adapters to be rewritten.
*   ***AI Suggestion:*** PROPOSE FIX (one author decision needed: whether stages 4-6 ship together)
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: §9; stage headings in the Detailed Plan.
    *   Change:
        *   Stage 2 builds only the pure core: the types, equality, `save.ts`, `tool.ts`, `profiles.ts`, `formatSavedDate` and the memory storage.
        *   Stage 3 builds the CPF SA adapter and its hooks, the guards and the UI, and moves CPF SA.
        *   Each later stage adds its own tools' adapters.
        *   The registry, `EXPORT_KEYS` and `importBackup` stay in the last stage.
        *   **Ship timing, your choice:**
            *   (a) stages 3-5 ship together;
            *   (b) they ship separately, and a mix of autosave and Save tools is accepted until the last one moves.

### [Issue A19] [`egm-structural`, `egm-design`, `egm-style`, `egm-codebase-details`, `egm-zoom-out`] - Severity: Major
*   **Affected Scope:** §5, NFR ([lines 719-737](docs/designs/explicit-save-last-saved-dates.md#L719-L737)), CUJs ([150-206](docs/designs/explicit-save-last-saved-dates.md#L150-L206))
*   **Discrepancy Description:** Three things are missing:
    *   an accessibility requirement;
    *   styling from `docs/design.md`;
    *   journeys for delete, Discard and the first Save with default values.
*   **Rationale:** The brief asked for the bar to work with screen readers. The project also has a design system that the new components should follow.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. Keep each addition short, as Stage 8 advised.
*   ***Proposed Edit:***
    *   Location: NFRs; §5; CUJs.
    *   Change:
        *   **Accessibility NFR:** "Bar state changes are announced in a polite live region and errors in an assertive one. The disabled Save button has an accessible name."
        *   **§5 styling:** "The Save bar uses the floating-glass treatment (`--header-glass`, as in `SiteHeader.tsx`). Save is the gradient primary button and Discard uses `surface-container-highest`. Errors use the tertiary colour. No 1px borders (`docs/design.md`)."
        *   **CUJs:** add three, for list-page delete, Discard, and the first Save of a tool still on its defaults.

### [Issue A20] [`egm-style`, `egm-codebase-details`] - Severity: Major
*   **Affected Scope:** item 30 ([lines 1110-1144](docs/designs/explicit-save-last-saved-dates.md#L1110-L1144))
*   **Discrepancy Description:** Item 30 mixes path bases and places the "(Create)" label in a misleading spot. It also uses `profileId` for HYSA and savings goal, which actually use `scenarioId`. The savings-goal blank-page fix is missing.
*   **Rationale:** The file list is ambiguous as written.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid (`hysa-tracker/[scenarioId]/page.tsx:635`, `savings-goal/[scenarioId]/page.tsx:587-606`).
*   ***Proposed Edit:***
    *   Location: item 30.
    *   Change:
        *   Use a table with the full `src/...` path, the action and the route parameter for each file.
        *   Type the params as `useParams<{ profileId: string }>()` or `useParams<{ scenarioId: string }>()`.
        *   State that CPF MA and CPF OA have no differences from CPF SA.
        *   List the empty-list blank-page fix under both HYSA and savings goal.

### [Issue A21] [`egm-comprehension`, `egm-design`, `egm-style`, `egm-zoom-out`, `egm-implementation-readiness`, `egm-codebase-details`] - Severity: Major
*   **Affected Scope:** [Lines 106-108](docs/designs/explicit-save-last-saved-dates.md#L106-L108), [381-385](docs/designs/explicit-save-last-saved-dates.md#L381-L385), items 23-24
*   **Discrepancy Description:** The notice has several gaps:
    *   it shows to brand-new users, for whom it makes no sense;
    *   it is built permanently into `SaveBar`;
    *   behaviour when storage can't be read is undefined;
    *   it reads storage during the server render.
*   **Rationale:** Wrong text for new users, and a fixed cost on mobile screen space.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid.
*   ***Proposed Edit:***
    *   Location: Goals bullet; §5; item 24; Future Improvements.
    *   Change:
        *   Show the notice only when any key in `EXPORT_KEYS` exists and the dismissed flag is absent.
        *   The page renders it above its content. It is not part of `SaveBar`.
        *   Gate the read on `useIsClient`. If the read throws, show nothing.
        *   Add to Future Improvements: "Remove the notice three months after release."

### [Issue A22] [`egm-zoom-out`] - Severity: Major
*   **Affected Scope:** item 19 ([lines 1003-1004](docs/designs/explicit-save-last-saved-dates.md#L1003-L1004)), Non-Goals ([134-135](docs/designs/explicit-save-last-saved-dates.md#L134-L135))
*   **Discrepancy Description:** `useProfileList` listens for the `storage` event, which contradicts the cross-tab Non-Goal.
*   **Rationale:** This is scope creep. The fresh read at save time already keeps the data safe.
*   ***AI Suggestion:*** PROPOSE FIX
*   ***Justification:*** Valid. I added this listener while drafting, without a decision.
*   ***Proposed Edit:***
    *   Location: item 19.
    *   Change: Delete the listener sentence. Add "Live refresh of the list from other tabs" to Future Improvements.

### [Issue A23] [`egm-zoom-out`, `egm-inventive-catalyst`] - Severity: Nit
*   **Affected Scope:** items 6, 9-10, 12, 17-18, 27-28, 30
*   **Discrepancy Description:** The reviewers suggest four simplifications:
    *   (a) one draft hook instead of two;
    *   (b) drop the static `new` route;
    *   (c) remove unused interface features: `adaptersForKey`, the standalone-keys slot, `value: null`, and the per-adapter ordering;
    *   (d) the `string | "new"` type collapses to `string`.
*   **Rationale:** Less code, and fewer copies that can drift apart.
*   ***AI Suggestion:*** PROPOSE FIX for (b), (c) and (d). DECLINE (a).
*   ***Justification:***
    *   **(b):** `[profileId]` already receives `"new"`. The static route was my choice while drafting, not yours. Dropping it removes 5 files.
    *   **(c):** these features are unused.
    *   **(d):** follows once (b) is done.
    *   **(a), declined:** the two hooks differ in loading, `notFound`, `"new"` mode and merge-on-save. They share the pure core (`sameData`, `saveEntries`, `useUnsavedGuard`), so copies have little room to drift. Merging them would push routing and merge logic into adapters. You can overrule this.
*   ***Proposed Edit:***
    *   (b) Delete item 28 and the `new/page.tsx` entries in item 30. The detail page treats `profileId === "new"` (or `scenarioId === "new"`) as new mode. Add one sentence: "No id generator produces `new`."
    *   (c) Remove `adaptersForKey` and the standalone-keys slot. Make `StorageEntry.value` a `string`. `saveTool` moves the `dateKey` entry to the end itself, and one test covers it.
    *   (d) Document `"new"` as a reserved id in prose.

### [Issue A24] [various] - Severity: Nit
*   **Affected Scope:** the whole document
*   **Discrepancy Description:** Facts are repeated across levels of the doc. The rest are wording, count, line-reference, structure, tooling and terminology nits, listed in `consolidated_review_report.md` A24.
*   **Rationale:** Copies drift apart, and imprecise wording.
*   ***AI Suggestion:*** PROPOSE FIX, except for the `CLAUDE.md` shadcn line, which is DECLINE (it belongs outside this design).
*   ***Justification:*** Each fix is mechanical, and together they offset the length added by A9, A5 and A19.
*   ***Proposed Edit:***
    *   **Remove repeated mechanics:** delete the algorithms in §2-§5 that items 4, 8, 11, 17 and 21 repeat, leaving the contracts.
    *   **Overview:** list removing shared links as point 3.
    *   **Counts:** "about 15 setters" becomes "setters in 12 places".
    *   **Wording:**
        *   "A few kilobytes" becomes "small: under 50 KB in the largest case observed".
        *   Remove the subjective words in the alternatives.
        *   Remove the repetition in Alternative R.
    *   **Structure:**
        *   Make Future Improvements an H2 with measurable triggers.
        *   Number "Decisions made during drafting" as §10.
        *   Use horizontal rules consistently.
    *   **The Problem:** add one sentence on today's URL sync.
    *   **Define** `useIsClient`.
    *   **Line references:**
        *   Re-check `useToolState.ts` and cite the correct range.
        *   `dividend-calculator/page.tsx:469`.
        *   Cite the two FIRE setter ranges separately.
    *   **Test tooling:**
        *   vitest `globals` stays off.
        *   Install with `--save-exact` and record the version.
        *   Set `process.env.TZ` in `vitest.config.ts` instead of the npm script.
    *   **Client components and store:**
        *   Items 22-23 are `"use client"`.
        *   `LastSaved` uses `min-h-5`.
        *   Store order is insertion order.
        *   Clear the store on unmount.
        *   Add a `returnValue` fallback for `beforeunload`.
    *   **Small item fixes:**
        *   `replaceState` keeps `location.hash`.
        *   Registry uses method syntax, and list how `EXPORT_KEYS` differs from today's 19 keys.
        *   Fix the malformed `formatSavedDate` snippet.
        *   Delete item 25 and the dividend import no-op.
    *   **Terminology and staging:**
        *   Normalise terms.
        *   Stage 1 needs only build and lint.
        *   Put docs items 38-39 in the final stage.
        *   Fill in the details for QA steps 5 and 7.
