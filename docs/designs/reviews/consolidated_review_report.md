# Consolidated Review Report

*   **Target:** `docs/designs/explicit-save-last-saved-dates.md` (1267 lines; FeatureRange 1..749, DetailedRange 750..1267)
*   **Mode:** Consolidated (uninterrupted), all five stages
*   **Reading list given to reviewers:** `concepts_brief.md`, `CLAUDE.md`, `docs/design.md` (Stage 6 read the document alone)
*   **Date:** 2026-11-08

## Verdict

**Not ready to implement.** The core design holds up. Reviewers confirmed:
*   the code claims (mount write, SRS effects, missing HYSA export key, `onNavigate` in Next 16.3.6, `useIsClient`, shadcn/ui not installed);
*   the two real platform limits (browser back can't be blocked, and localStorage has no transactions);
*   the overall staging.

What blocks a handoff:
*   **One step can't be carried out.** It edits a button that doesn't exist.
*   **The rejection reasons are missing.** Most alternatives record who rejected them, not why.
*   **The plan leaves implementers to make real decisions.** The biggest open ones are:
    *   the draft-hook mechanics;
    *   the type of each tool's saved data;
    *   the Save bar's state rules;
    *   the guard API and the lint rule;
    *   test coverage.

Two Major findings hit the feature's own purpose:
*   **Existing users can't get a date** without making a fake edit (A4).
*   **The rollback section is wrong** about which tools keep a stale date (A8).

The Stage 8 altitude warning applies to every fix below. The doc is already 1267 lines, so each addition should come with a matching deletion (A9, A24).

## Stage Reports

| Stage | Report | Reviewers | Raw count |
| --- | --- | --- | --- |
| 5. Initial Zoom Out | `zoom_out_report.md` | zoom-out, inventive-catalyst | 0 🔴, 5 🟡, 8 🟢 |
| 6. Comprehension | `comprehension_report.md` | comprehension | 0 🔴, 3 🟡, 8 🟢 |
| 7. Critic | `critic_report.md` | design, structural, style | 1 🔴, 13 🟡, 22 🟢 |
| 8. Intermediate Zoom Out | `intermediate_zoom_out_report.md` | zoom-out | 0 🔴, 10 🟡, 11 🟢 |
| 9. Implementation Readiness | `implementation_readiness_report.md` | implementation-readiness, codebase-details, style | 1 🔴, 22 🟡, 18 🟢 |

After merging across stages there are **24 action items: 2 🔴, 20 🟡 and 2 🟢 groups.**

I checked two findings against the code myself:
*   **A1 is confirmed.** The name editors are a `<button>` that turns into an input and saves on blur or Enter (`cpf-sa-calculator/[profileId]/page.tsx:98-167`). They have no "Save" button.
*   **A8 is confirmed for CPF SA.** `useCpfProfiles.ts:44` spreads the whole stored record, so an old build keeps `savedAt`.

---

## 🔴 Blockers

### A1. Remove the "Save" to "Done" rename: the button doesn't exist
*   **Where:** spec §5 (line 391), item 27 (line 1091), item 30 (line 1129)
*   **Problem:** Every name editor is a click-to-edit button that saves on blur or Enter. "Save" is only the prop name `onSave`. This mistake came from the brainstorm brief (`concepts_brief.md:110`).
*   **Fix:** Delete the step in all three places. Optionally rename the prop `onSave` to `onCommit`, so it doesn't read as a storage write.

### A2. Alternatives record who rejected them, not why
*   **Where:** Alternatives Considered (lines 486-715); the §7 table (line 414)
*   **Problem:** About 20 of the 25 entries say "Rejected by author" and then restate the chosen design. The feature-spec standard treats this as a fail.
    *   The reasons exist only in `concepts_brief.md`, which is untracked and not linked.
    *   Some rejected options look stronger on paper than what was chosen: B keeps zero data loss on mobile, and N needs no data-shape change. Without a stated trade-off, a reader can't tell why they lost.
    *   The list mixes two labels: "author" and "during brainstorming".
*   **Fix:**
    *   Cut the list to about 8 top-level decisions, each with one sentence stating the trade-off that decided it. The 8 are explicit Save vs B, drafts per route vs G, date inside the record vs N, removing links vs S, and the draft model, list rename, `window.confirm` and test environment choices.
    *   Put the sub-decisions in one compact "option / why not" table.
    *   Where a choice was preference, write "Author preference".
    *   Commit the brief under `docs/` and link to it.

---

## 🟡 Major

### A3. Explicit Save is presented as a technical necessity
*   **Where:** Overview (lines 13-14), The Problem (lines 36-55), Alternative B (lines 501-511)
*   **Problem:** Each of the three problems is solved by a separate change: deleting the mount writes, deleting URL sync, and the single save module. None needs explicit Save, and Alternative B shows this. The sentence "Every tool... even opening a page, writes" also overstates it: about seven tools write on load.
*   **Fix:** Say explicit Save is a product choice: the date means "the user confirmed this", and Discard gives a place to try out numbers. Present B as the cheaper path with zero data loss. Replace "impossible" with "unreliable unless the app changes when it writes".

### A4. Existing users can't save their data, so they never get a date
*   **Where:** Goals (lines 75-87), CUJ 6 (line 199), §3 (line 310), items 10, 17 and 18
*   **Problem:** Every current user's data counts as "legacy", because the old mount write stored defaults on every visit. The rule `canSave = isDirty || never saved` keeps Save disabled for them, so CUJ 6 can't happen. A user checking numbers that are still correct also has no way to refresh the date.
*   **Fix:**
    *   Change the rule to `canSave = isDirty || dateState !== "saved"`, and add a test that legacy data can be saved.
    *   Rename the state after its condition, for example "data without a date", and list where it comes from: viewed-only users, the CPF SA migration and older backups.
    *   Record "refresh the date without an edit" as a non-goal, or allow it.

### A5. No single rule for what the Save bar and the date label show
*   **Where:** §5 (lines 368-392), items 22 and 23
*   **Problem:** No rule maps (loading, dateState, isDirty, saveError) to the bar text or the button states. The unclear cases are legacy-and-clean, error-plus-dirty, and loading. Nothing says when an error clears. "Couldn't save. Try again" differs from the spec's wording. Separately, `SaveBar` and `LastSaved` show the same state twice: "Saved" next to "Last saved: 8 Nov".
*   **Fix:**
    *   Add one table of about five rows in §5 that maps each state to the bar text, whether Save is enabled and whether Discard shows, and delete the prose it replaces.
    *   Make one component own the date: the bar's clean-state text, or the label.
    *   Give `save()` the return type `SaveResult`, and clear the error on success or Discard.

### A6. "Save is the only writer" has no single owner and no build check
*   **Where:** Goals (lines 67-70, 95), §2 (lines 288-300), §7 (lines 410-418), the diagram (lines 219-245), items 8 and 11, the grep (lines 1235-1241)
*   **Problems:**
    *   Goals list no exceptions, line 95 lists one and §7 lists five.
    *   The diagram shows the guards writing to storage.
    *   The grep can't work. `save.ts` and the CPF SA migration write through an injected `storage.setItem`, so `localStorage.setItem` misses them and also misses stray writes.
    *   The CPF SA migration writes while loading, which conflicts with "adapters are pure" and with the zero-write test.
    *   "All or nothing" overstates what happens: the rollback can itself fail.
    *   "Well-formed" is undefined, and a `JSON.stringify` throw in `toEntries` escapes `saveTool`.
*   **Fix:**
    *   Make §7 the only list of exceptions, and have Goals, the diagram caption and verification point to it.
    *   Replace the grep with an ESLint `no-restricted-properties` / `no-restricted-globals` rule that allows only the files in §7. If you keep a grep, use two patterns: `localStorage.setItem`, and `\.(setItem|removeItem)\(`.
    *   Say where the migration runs and how it writes, and exempt it from the zero-write test.
    *   Reword the guarantee: "tries to restore, always reports the error, writes the date last".
    *   Define "well-formed", and wrap `toEntries` in try/catch.
    *   Redraw the diagram so only the save module and the §7 exceptions write.

### A7. Import bypasses the save module, and its patch-up rule is untested
*   **Where:** §6 (lines 404-407), item 37 (lines 1205-1210), registry `adaptersForKey` (lines 902-906)
*   **Problem:** Import writes keys one by one, with no rollback and no normalisation, then patches `savedAt` afterwards. The patch only covers one direction. It lives in a React component, so the node-only tests can't reach it. `adaptersForKey` has no caller.
*   **Fix:** Choose one approach:
    *   **Preferred (Stage 5):** send import through `adapter.read` and then `saveEntries`. Laying the file's values over current storage makes the partial-file rule follow automatically, and the date stays in step with the data. The costs: `toEntries` must accept a null date, unknown fields are dropped, and restore depends on the adapters being correct.
    *   **Lighter:** move the rule into `src/lib/persistence/import.ts`, make it cover both directions (clear `savedAt` unless the file holds every key the tool owns), and test it.

    Either way, drop `adaptersForKey`.

### A8. The rollback section is wrong, and old and new builds have no compatibility rule
*   **Where:** §9 (lines 459-462), NFR (lines 733-737)
*   **Problem:** The old build does not drop `savedAt` for CPF SA (confirmed), HYSA, SRS and probably CPF MA. Their old loaders copy whole records through while still autosaving. After a roll-forward, the page shows a stale "Last saved" next to newer data. During a deploy, an old tab can also write back its whole array and wipe a profile created in the new build. The text contradicts itself: "keeps all tool data", then "dividend years fall back to 20".
*   **Fix:**
    *   Correct the claim and list the affected tools.
    *   State one rule: new data must load in the old build, and a stale `savedAt` carried through the old build is accepted.
    *   Stage 8 advises against adding a data fingerprint. Stage 7 suggested one.
    *   Consider Alternative P or N for dividend so no stored shape changes. That removes the only data-loss case on rollback and the reader that accepts two formats.

### A9. No Risks & Mitigations section
*   **Where:** caveats spread across lines 57-63, 101-105, 136-137, 184-185, 362-363, 459-467 and 721-737
*   **Problem:** The standard requires this section. The leave-warning caveat alone appears five times, with different wording each time. Several risks have no stated mitigation:
    *   localStorage quota growth;
    *   a failed rollback;
    *   the keyboard covering the bar;
    *   last write wins across tabs;
    *   the `cacheComponents` watch item;
    *   an old tab open during a deploy.
*   **Fix:** Add one table of about eight rows: risk, impact, and mitigation or "accepted". Replace each scattered caveat with a pointer to it, and fold the rollback paragraphs into it. Don't invent mitigations; "accepted" is a valid entry.

### A10. The navigation-guard API is defined twice, and the two versions disagree
*   **Where:** §4 (lines 356-366), items 18, 20, 21 and 35-36
*   **Problems:**
    *   §4 says redirects use the plain router, while items 20 and 36 forbid importing `useRouter` anywhere else.
    *   Item 18 calls a hook inside the async `save()`.
    *   Item 27 puts the redirect in the render body.
    *   §4 lints only `next/link` in tool pages; item 36 lints `next/link` and `useRouter` across all of `src/**`.
    *   Flat config has no "overrides".
    *   Not every `next/link` importer is listed, for example `HeroSection` per the brief.
    *   `GuardedLink` doesn't say in what order it runs.
    *   A hook called "guarded router" exposes an unguarded `replace`.
    *   The two docs name the delete function and the unsaved-store API differently.
*   **Fix:** Define the API once, in §4:
    *   `useGuardedRouter()` is called at the top level and returns stable `{ push, replaceWithoutPrompt }`. The page does the post-create redirect inside a `useEffect`.
    *   `GuardedLink`: on cancel, call `preventDefault` and return; otherwise call the caller's `onNavigate`.
    *   Give the exact flat-config rule shape (`next/link`, and `importNames: ["useRouter"]` from `next/navigation`), with a second config object that turns it off for the two wrapper files.
    *   List every current `next/link` importer by path, or add a step: "enable the rule and fix everything it reports".

    Items 18, 20, 21 and 36 then refer back to §4.

### A11. The site wordmark is unguarded while stages 4 and 5 are in production
*   **Where:** item 35 (stage 6) vs items 26-27 (stage 4)
*   **Problem:** CPF SA ships explicit Save in stage 4, but `SiteHeader` only switches to `GuardedLink` in stage 6. Tapping the logo on a dirty page loses edits without a prompt, which is the failure CUJ 4 describes.
*   **Fix:** Swap `SiteHeader` (and optionally `ToolCard` and `[slug]`) in stage 3. It is harmless while nothing is dirty.

### A12. The draft-hook mechanics are unspecified, and the obvious code fails lint
*   **Where:** items 17 and 18 (lines 974-995)
*   **Problems:**
    *   "Read once on the client" has no mechanism. A `useState` initialiser also runs on the server, where `localStorage` is undefined.
    *   Reading in an effect and then calling setState fails `react-hooks/set-state-in-effect` (plugin v7.1.1; commit b864bc3 fixed exactly this).
    *   Setting `draftRef.current = draft` during render fails `react-hooks/refs`.
    *   The `useMemo` has no dependency array.
    *   `canSave` is undefined.
    *   Pages with no `useIsClient` gate today would hit a hydration mismatch.
    *   The type of `draft` while loading or not found is unclear, and the profile `dateState` rule is missing.
*   **Fix:**
    *   Use a lazy initialiser with a `typeof window` guard that returns defaults and `exists: false`.
    *   Update the ref only inside the `setDraft` wrapper.
    *   Define `isDirty = status === "ready" && !sameData(draft, snapshot)`, with explicit dependencies, and define `canSave` per A4.
    *   Converted pages render a placeholder until `status === "ready"`.
    *   Type `draft` as `P | null` for profiles.
    *   State the profile rule: saved means `savedAt` is set, legacy means it is absent, never means `"new"` mode.
    *   Note that `save()` reads the latest draft, which covers the name editors that commit on blur.

### A13. Most tools' record types, and the type moves, are left to the implementer
*   **Where:** items 6, 7 and 11 (lines 822-906), items 29, 31 and 32
*   **Problems:**
    *   Only FIRE has a record type. The other six single-state tools have none.
    *   It is unclear whether `read` strips a nested `savedAt` for SRS and dividend, and whether `stableStringify` omits it at every depth. If not, every saved SRS page loads as dirty.
    *   The type-move table is incomplete: `BudgetCategory`, dividend's own `YieldSource`, the SRS default constants, and which types gain `savedAt?` (including `StoredCpfOaProfile`).
    *   It doesn't say where types live between stage 2 and stages 4-6.
    *   The adapter fields `slug`, `name` and `listPath` have no type and no source, even though `src/lib/tools.ts` already holds the canonical slugs and names.
    *   The `readFromStorage` type filter silently drops `savedAt` unless it is extracted separately.
*   **Fix:**
    *   Add a "Record type" column.
    *   State that `read` always strips `savedAt`, that omission applies at every depth, and add a test for it.
    *   Complete the type-move rows.
    *   In stage 2, the old files re-export the moved types; add them to stage 2's Modify list.
    *   Take `slug` and `name` from `tools.ts`, and set ``listPath = `/tools/${slug}` ``.

### A14. Profile save, delete and create behaviour is incomplete
*   **Where:** items 6 and 9 (lines 822-859)
*   **Problem:** "Replace or append" isn't tied to a mode. A double tap on Save in `"new"` mode can append the profile twice. The error shape, the entry written, a delete of a missing id, and the values `newProfile()` returns are all unspecified.
*   **Fix:**
    *   `"existing"` replaces the profile in place. `"new"` appends it, or replaces it if the id is already present (upsert).
    *   Give the exact error object and entries.
    *   Deleting a missing id returns `ok: true` and writes nothing.
    *   `newProfile()` keeps today's ids and names: `p_${Date.now()}` / "New Scenario", `genId("hysa")`, and `sg_${Date.now()}` / "New Goal" / 10_000.

### A15. Test coverage has gaps and doesn't fit the profile adapters
*   **Where:** items 5 and 14 (lines 915-943); spec §8 (lines 426-438); Verification (lines 1242-1244)
*   **Problems:**
    *   The "for each of the 12 adapters" cases don't fit the 5 profile adapters, which have no `exists`, `toEntries` or `dateKey`.
    *   There is no `tool.test.ts`.
    *   Two save cases are missing: rejecting a malformed entry, and a rollback that itself fails.
    *   "Zero writes" is tested only on empty storage, and a node test can't check what a page writes when it loads.
    *   `unsaved-store` has no tests.
*   **Fix:**
    *   Split the cases into tool adapters, profile adapters and tool-specific cases.
    *   Add `tool.test.ts` and the two missing save cases.
    *   Test zero writes when reading legacy data, for every adapter except the migration.
    *   Reword the spec to say "`read` performs zero writes", and add a page-load check to manual QA.

### A16. The count of Save pages and the manual QA steps are wrong
*   **Where:** Overview and Goals (lines 20-21, 67-68), QA (lines 1245-1261)
*   **Problem:** "All 12 tools and the 5 detail pages" suggests 17 places with a Save button. In fact list pages have none, and the real set is 7 tool pages plus 5 detail pages, including their `/new` mode.
    *   **QA step 1** checks "17 pages" that can't all be opened or that have no Save bar.
    *   **QA step 3** tests a guarded `push` that only exists on list pages, which never have a draft.
    *   **QA step 6** uses a `principal` parameter the mortgage tool doesn't have; its fields are `propertyPrice` and so on.
*   **Fix:**
    *   State the set of Save pages once and refer to it everywhere.
    *   Rewrite step 1:
        *   the 7 tool pages and the 5 `/new` pages show "Not saved yet";
        *   list pages show no bar;
        *   a made-up id redirects;
        *   no page writes on load.
    *   Limit step 3 to the `GuardedLink` call sites.
    *   Use `?propertyPrice=1` in step 6.

### A17. The keyboard requirement for the Save bar has no mechanism
*   **Where:** §5 (lines 370-374), NFR (lines 729-730), item 23
*   **Problem:** On iOS Safari, a fixed bottom bar sits behind the on-screen keyboard. Page bottom padding is set only in item 23, with no value.
*   **Fix:** Relax the requirement to "visible whenever the keyboard is closed", or hide the bar while an input has focus. Don't add `visualViewport` code. Give a fixed bar height and matching page padding (for example `h-16` / `pb-24`), or have `SaveBar` render its own spacer.

### A18. Staging builds every piece before any page uses it, and says nothing about the mixed period
*   **Where:** §9 (lines 442-456), items 11-24
*   **Problem:**
    *   Stage 2 writes all 12 adapters, and stage 3 builds every hook and component, before CPF SA tests the design in stage 4. Open findings (A7, A10, A13, A23) still change the adapter interface, so 11 adapters and their tests could need rewriting.
    *   "Ships in stages, so production does not run a mix" reverses cause and effect: shipping in stages is what creates the mix.
*   **Fix:**
    *   Merge stages 3 and 4, building only CPF SA's adapter and hooks.
    *   Write each remaining adapter in the stage that moves its tool, and keep the registry switch in stage 7.
    *   Say whether stages 4-6 ship together, or set a target window.

### A19. Accessibility, design-system styling and some user journeys are missing
*   **Where:** §5, NFR (lines 719-737), CUJs (lines 150-206)
*   **Problem:**
    *   There is no accessibility requirement, even though the brief asked for the bar to be readable by screen readers.
    *   The components say only "built with Tailwind" and ignore `docs/design.md`: floating glass, gradient primary buttons, tertiary wine-red for errors, no 1px borders.
    *   There are no journeys for list-page delete, Discard, or the first Save of a tool still on its defaults.
*   **Fix:**
    *   Add two accessibility NFR lines: a polite live region for state changes and an assertive one for errors, and an accessible name for the disabled Save.
    *   Add one line in §5 citing the design tokens and the `--header-glass` treatment in `SiteHeader.tsx`.
    *   Add three CUJs, but leave out the edge cases, which belong in QA.

### A20. The item 30 file list is ambiguous
*   **Where:** item 30 (lines 1112-1144)
*   **Problem:**
    *   Path bases are mixed.
    *   The "(Create)" label is misplaced.
    *   HYSA and savings goal use `[scenarioId]`, not `profileId`, and savings goal's `useParams()` is untyped.
    *   It doesn't say whether CPF MA and CPF OA differ.
    *   The savings-goal empty-list blank page fix is listed only under HYSA.
*   **Fix:** Use a table with the full `src/...` path, action and route parameter for each file. Type `useParams<{ scenarioId?: string }>()`. List the blank-page fix under both tools.

### A21. The one-time notice's audience and placement are undefined
*   **Where:** Goals (lines 106-108), §5 (lines 381-385), items 23-24
*   **Problem:**
    *   The notice shows to everyone, including brand-new users, for whom "no longer saved automatically" makes no sense.
    *   It is built permanently into `SaveBar` on every page, which takes space from the main safeguard on mobile.
    *   It doesn't say what happens when storage can't be read.
*   **Fix:**
    *   Show it only when any key in `EXPORT_KEYS` exists and the dismissed flag is absent.
    *   Render it from the page or layout, not `SaveBar`.
    *   Gate the read on `useIsClient`, and show the notice if the read throws.
    *   Add a removal note to Future Improvements.

### A22. A cross-tab listener contradicts the cross-tab Non-Goal
*   **Where:** item 19 (lines 1003-1004), Non-Goals (lines 134-135)
*   **Problem:** `useProfileList` listens for the `storage` event, but conflicts across tabs are declared out of scope. The fresh read at save time already keeps data safe.
*   **Fix:** Drop the listener, or move it to Future Improvements.

---

## 🟢 Nits (grouped)

### A23. Simplify the interfaces (each saves code; none is required)
*   **One draft hook instead of two**, using a load-and-save strategy with a thin wrapper for profiles (Stage 5 #6, Stage 8 Group G). The design rejected Alternative E because copies drift, and the two stacks repeat that pattern.
*   **Drop the static `new` route and its 5 re-export files.** `[profileId]` already receives `"new"` from `useParams`, and no id generator can produce `"new"` (Stage 8 N2). The static route was a drafting choice, not a decision of yours.
*   **Remove capabilities nobody uses:** `adaptersForKey`, the standalone-keys slot in the registry, `StorageEntry.value: null`, and the per-adapter "date entry last" ordering. Instead, `saveEntries` moves `dateKey` to the end itself (Stage 5 #8-10, Stage 8 Group H).
*   **`id: string | "new"` collapses to `string`.** Use a tagged parameter instead (Stage 9 N10).

### A24. Document hygiene
*   **State each fact once.** Goals hold outcomes, the Technical Plan holds contracts and the Detailed Plan holds mechanics. Remove the algorithms in §2-§5 that items 4, 8, 11, 17 and 21 repeat (Stage 5 #11, Stage 8 Group E). This is how the A9, A5 and A19 additions fit without growing the doc.
*   **Overview:** it says "does two things" but lists three. Make removing shared links item 3 (Stage 7 #22).
*   **Counts and estimates:**
    *   "About 15 setters" doesn't match the 12 sources listed (Stage 6, Stage 7 #25).
    *   "A few kilobytes" is unmeasured (Stage 7 #33).
*   **Wording:**
    *   Subjective words in Alternatives: "Simple", "fragile", "too many moving parts" (Stage 7 #30).
    *   Alternative R repeats itself (Stage 6, Stage 7 #31).
    *   Alternative Y names a process step as its cost (Stage 7 #32).
*   **Structure:**
    *   Make Future Improvements an H2 and give it measurable triggers (Stage 7 #34).
    *   "Decisions made during drafting" needs its own place (Stage 7 #35).
    *   Horizontal rules are inconsistent (Stage 7 #36).
*   **Unanswered reader questions:**
    *   Describe today's URL sync in one sentence (Stage 6).
    *   Old backups that contain `tool:srs-calculator` (Stage 6).
    *   `useIsClient` is never defined (Stage 6).
*   **Line references:**
    *   `useToolState.ts:52-67`: the reviewers disagree, so re-check it.
    *   `dividend-calculator/page.tsx:469`, not 470.
    *   The FIRE range covers two setters (Stage 9 N2).
*   **Test tooling:**
    *   Keep vitest `globals` off, because `next build` type-checks test files.
    *   Install with `--save-exact`.
    *   `TZ=` in an npm script doesn't work on Windows; consider setting `process.env.TZ` in the config instead (Stage 9 N3).
*   **Client-component and store details:**
    *   Add `"use client"` to items 22-24 and give the exact contents of `new/page.tsx` (Stage 9 N4).
    *   Give a `LastSaved` height and its state mapping (Stage 9 N5).
    *   Unsaved store: the meaning of "first", writes on unmount, a `returnValue` fallback, and file-name casing (Stage 9 N7).
*   **Small fixes in items:**
    *   `history.replaceState` should keep `location.hash` (Stage 9 N8).
    *   Registry typing and how `EXPORT_KEYS` differs from today's 19 keys (Stage 9 N9).
    *   The `formatSavedDate` snippet is malformed (Stage 9 N11).
    *   The dividend import note is a no-op (Stage 9 N14).
    *   Drop item 25, which changes nothing (Stage 9 N15).
*   **Terminology and precision:**
    *   Terminology and capitalisation are inconsistent (Stage 9 N17).
    *   Stage 1 has no test runner, docs items 38-39 have no stage, and QA steps 5 and 7 lack detail (Stage 9 N18).
*   **`CLAUDE.md` lists shadcn/ui, which isn't installed.** Fix this as a separate chore outside this design (Stage 7 #14, Stage 8 1.5).

---

## Reviewer Disagreements

| Topic | Positions | Consolidated call |
| --- | --- | --- |
| Severity of A2 (alternatives) | Structural: Blocker. Design and style: Major. | Blocker, because the standard treats it as an outright fail. Stage 8 adds that the list should be cut before it is expanded. |
| Rollback guard (A8) | Stage 7: consider a data fingerprint. Stage 8: YAGNI; correct the claim and accept the risk. | Correct the claim and record the stale date as accepted. No fingerprint. |
| Import path (A7) | Inventive-catalyst: send it through the save module. Zoom-out: keep the patch only if cheap, or drop it. | Your decision. Both are listed under A7. |
| Explicit Save (A3) | Inventive-catalyst also offered debounced autosave, which would remove the whole guard layer. | Out of scope for fixes: you chose explicit Save. A3 only asks the doc to call it a product choice. |
| `useToolState.ts:52-67` | Implementation-readiness: accurate. Codebase-details: 53-69. | Re-check (A24). |
| `history.replaceState(null, …)` | Style: drops the state and the hash. Others: documented App Router pattern. | Keep `null`, append `location.hash`. |
| Lint glob scope (A10) | Stage 5: narrow it to tool pages and `SiteHeader`. Stage 7: keep it repo-wide, add `useRouter`. | Repo-wide with an explicit allowlist, so a new page can't skip the guard. |

---

## Traceability Matrix

| Action | Stage 5 | Stage 6 | Stage 7 | Stage 8 | Stage 9 |
| --- | --- | --- | --- | --- | --- |
| A1 | | | | | B1 |
| A2 | | | 1 | 1.3, A | |
| A3 | 1 | | 8, 29 | A | |
| A4 | 2, 13 | Nit (bar text) | 3 | B | M3 (part) |
| A5 | | Nit (bar text) | | 1.4, N3 | M7, N5, N16 |
| A6 | | Major (grep) | 6, 7, 9, 11 | C | M1, M11 (part), M12, M14 |
| A7 | 3 | | 16 | C | M15 |
| A8 | 7 | | 2 | 1.2, F | |
| A9 | | | 5, 26 | 1.1 | |
| A10 | 4 | Nits (router, lint, naming) | 13 | D | M8, M9, M18, M19, M22, N1 |
| A11 | | | | | M2 |
| A12 | | | 18, 19 | 1.8 | M3 |
| A13 | 12 | | 17 | | M4, M5, M6, M21 |
| A14 | | | 15 | Standalone | M13 |
| A15 | | | 9 | | M10, M11 |
| A16 | | Major (surfaces) | 23 | E | M16, M17, N13 |
| A17 | | | 4 | 1.6 | M7 (padding) |
| A18 | | | 10 | N1, F | |
| A19 | | | 12, 14 | 1.5, 1.7 | N16 |
| A20 | | | | | M20, N12 |
| A21 | | Major (notice) | 20 | N4, Standalone | N4, N6 |
| A22 | 5 | | | H | |
| A23 | 6, 8, 9, 10 | | | G, H, N2 | N10 |
| A24 | 11 | Nits (count, URL sync, `useIsClient`, srs key) | 22, 24, 25, 27, 28, 30-36 | E | N2, N3, N7, N8, N9, N11, N14, N15, N17, N18 |
