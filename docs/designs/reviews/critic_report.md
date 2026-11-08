# Goldfish Review Report (Stage 7: Critic Review)

**Target:** `/Users/desmondloh/Projects/debt-or-alive/docs/designs/explicit-save-last-saved-dates.md` (lines 1-749; the Detailed Implementation Plan at lines 750-1267 is used only as reference)

**Mode:** REVIEW. **Standard:** `resources/document_standards/feature-spec-standard.md` for egm-design and egm-structural. egm-style used its persona's own audit vectors.

## Reviewer Status

| Reviewer | Status | Raw verdict |
| --- | --- | --- |
| `egm-design` | completed | 0 Blocker, 4 Major, 9 Nit. "Revise before implementation." |
| `egm-structural` | completed | 1 Blocker, 5 Major, 6 Nit. "Does not pass yet." |
| `egm-style` | completed | 0 Blocker, 8 Major, 26 Nit. "Dry, direct, well structured, with overclaims." |

After deduplication: **1 Blocker, 13 Major, 22 Nit.**

Code claims the reviewers checked and confirmed:
- There are 12 tool routes plus `[slug]`.
- The mount write is at `useToolState.ts:102`, and SRS writes on mount at `srs-calculator/page.tsx:530-541`.
- `STORAGE_KEYS` is missing `hysa-tracker:scenarios` and lists the unused `tool:srs-calculator`.
- There is no `src/components/ui`, so shadcn/ui is not installed.
- Every `router.push` is on a list page.
- The `Date.now()` id fallback exists in `useSavingsGoal.ts:50`.
- Next 16.3.6 is installed, and `onNavigate` is available.

---

## Prioritized Findings (Blockers -> Major -> Nits)

### 🔴 1. Most rejection reasons give an owner, not a trade-off - Severity: Blocker
* **Reviewer Lens:** `egm-structural` (Blocker), `egm-design` (Major), `egm-style` (Major)
* **Affected Scope:** Alternatives Considered, lines 498-699: B 509, C 520, E 539, F 548, G 558-559, H 565 (no reason at all), J 581, K 589, M 607, N 616, P 633, Q 641, R 653, S 660, T 669, W 698, and others. Also the §7 table at line 414 ("Author decision.").
* **Discrepancy Description:** About 20 of 25 alternatives say only "Rejected by author" and then restate the chosen design. For example: "in favour of storing the date inside each tool's own data", "all 12 tools get Save", "shared links are removed". The standard requires concrete technical or scope trade-offs. It also forbids pinning a rejection on a maintainer without a link to a record.
  - The only record is `concepts_brief.md`. Line 146 mentions it as a bare code span, not a link, and the file is untracked in git.
  - In some entries the Cons are minor and the Pros look stronger than the chosen option. N (one date key per tool, no data-shape change, no cross-tab race) avoids the dividend format change and its rollback cost. B keeps zero data loss on mobile.
  - The spec never gives a reason for removing shared links, except as a side effect (line 55).
  - Attribution switches between "Rejected by author" and "Rejected during brainstorming" (O, U, V, Y).
* **Rationale & Recommendation:** The standard treats this as an outright fail. A future reader can't tell why the mobile-first app gives up zero-loss autosave, or why sharing was dropped.
  - Give each entry one sentence stating the deciding trade-off. Example for N: "extra export keys and partial-import date drift; storing the date inside the record keeps data and date in one atomic write". Example for R/S/T: "removing URL sync removes the shared-link overwrite and the half-restored reload; moving data between devices via export is accepted".
  - Where the choice really was preference, write "Author preference". Then commit the brief under `docs/` and link its anchors (D9-C6, D9-C7, open decisions 3-10).
  - Move cost statements that sit in the reason line into Cons (for example B).
  - Line 414 can reuse line 97's reason: "the confirm dialog counts as the explicit save action."
  - Use one attribution convention throughout.

---

### 🟡 2. The rollback claim is wrong for several tools - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-style`
* **Affected Scope:** Lines 459-462 and 733-737
* **Discrepancy Description:** "The old build ignores or drops `savedAt`" holds only where the old loader rebuilds records field by field: `useToolState`, CPF OA and savings goal. It does not hold for these tools:
  - CPF SA: `useCpfProfiles.ts:44` spreads `...p`, and `:96` spreads again.
  - HYSA: `loadArray` is used as-is, then spread.
  - SRS: `page.tsx:521` uses `JSON.parse` output as-is.
  - CPF MA: probably the same pattern as CPF SA (not opened).

  On these tools an old build keeps `savedAt` while autosaving newer edits. After a roll-forward, the page shows a stale "Last saved" date next to newer data, which is exactly the failure this feature exists to prevent.
  - During a deploy (line 736), a tab still on the old build writes back its whole mount-time array. This can wipe a profile just created in a new-build tab.
  - The text also contradicts itself: "does not lose tool data" is followed by "dividend projection years fall back to 20".
* **Rationale & Recommendation:** Rollback is the safety net, and the spec understates the damage.
  - Correct the claim and list the affected tools.
  - Either accept and document the stale-date and old-tab overwrite risks, or add a guard. One option is a data fingerprint beside `savedAt`, with a mismatch treated as legacy.
  - Reword to "keeps all tool data except the dividend projection-years setting, which resets to 20."

### 🟡 3. Existing (legacy) users can't get a date without making a fake edit - Severity: Major
* **Reviewer Lens:** `egm-design` (related wording: `egm-style` N4)
* **Affected Scope:** Lines 75-79, 86-87, 199 (CUJ 6), 310
* **Discrepancy Description:**
  - `canSave = isDirty || nothing stored`. Legacy data is stored, so Save stays disabled until the user changes a value.
  - Every existing user starts out legacy. That includes users who only *viewed* a tool, because the mount write stored defaults (concepts_brief C10).
  - CUJ 6 ("After their next Save the date appears") assumes a Save the UI won't allow.
  - The motivating case at lines 31-34 is rechecking numbers, which often involves no change at all.
  - The label "Saved before this feature" is also inaccurate. The no-date state also comes from viewed-only users, the CPF SA migration and imports of older backups.
* **Rationale & Recommendation:** The feature's main audience gets no honest way to get a date.
  - Use `canSave = isDirty || dateState !== "saved"`.
  - Update CUJ 6 to match.
  - State in Goals that viewed-only users count as legacy.
  - Rename the state by its condition, for example "Data without a date", and list its sources once.

### 🟡 4. "Save bar stays above the keyboard" has no mechanism - Severity: Major
* **Reviewer Lens:** `egm-design`, `egm-style` (Nit N25), `egm-structural` (part of M1)
* **Affected Scope:** Lines 370-374 and 729-730
* **Discrepancy Description:**
  - On iOS Safari, a `position: fixed; bottom: 0` bar sits behind the on-screen keyboard. The spec names no `visualViewport` handling or other approach, and the plan has only a QA check (line 1262).
  - The spec also doesn't say that pages need bottom padding so the bar doesn't cover the last controls.
* **Rationale & Recommendation:** The bar is "the main safeguard" (line 100) on a mobile-first app, and the requirement as written can't be met.
  - Either specify the mechanism (a `visualViewport` offset, or hiding the bar while an input has focus), or relax the requirement to "visible whenever the keyboard is closed".
  - Specify the content padding.

### 🟡 5. No Risks & Mitigations section - Severity: Major
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Whole document. Risks are scattered across lines 57-63, 101-105, 299-300, 362-363, 459-467 and 721-737.
* **Discrepancy Description:** The standard makes "Risks & Limits" mandatory. Several risks have no mitigation stated:
  - localStorage quota growth (the HYSA scenario array grows monthly)
  - rollback failing under quota pressure (what the user sees, and whether storage is left inconsistent)
  - the keyboard covering the Save bar
  - last-write-wins across tabs
  - the `cacheComponents` watch item
  - the `useRouter` guard bypass (finding 13)
  - the rollback and old-tab issues in finding 2
* **Rationale & Recommendation:** Add an H2 "Risks & Mitigations" table with columns risk / impact / mitigation / remaining risk, and move the scattered items into it.

### 🟡 6. Goals state absolute rules that §7 breaks - Severity: Major
* **Reviewer Lens:** `egm-style`, `egm-design` (Nit 5)
* **Affected Scope:** Lines 67-70 and 95-97, against §7 (lines 410-418) and line 438
* **Discrepancy Description:**
  - "Save is the only way tool data is written ... Opening a page writes nothing" has no exceptions. But §7 lists the CPF SA migration (which writes on page load), import, list-page delete, theme and the notice flag.
  - Line 95 calls list-page delete "the one declared exception", while §7 declares five.
  - If the migration lives in `adapter.readAll`, it also breaks the "pure, no writes" adapter contract (line 249) and the zero-write test.
* **Rationale & Recommendation:** A QA tester checking "opening a page writes nothing" will fail CPF SA on a legacy browser.
  - Add "except the writes declared in §7" to Goals.
  - Narrow line 95 to "the one exception to 'every user action waits for Save'".
  - Say where the migration lives: a separate `migrate()` step outside `read`.

### 🟡 7. "Each save is all or nothing" overstates the guarantee - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 71-74 and 189-192 (CUJ 5), against lines 299-300
* **Discrepancy Description:** Line 299 concedes that if the rollback itself fails, the original error is still returned. So under quota pressure, the very condition CUJ 5 sets up, the save is not all-or-nothing.
* **Rationale & Recommendation:** State the property that actually holds: "If any write fails, it tries to restore the keys already written and always reports the error. The date key is written last, so a failed save never shows a new date."

### 🟡 8. The opening overstates the problem - Severity: Major
* **Reviewer Lens:** `egm-style`, `egm-design`
* **Affected Scope:** Lines 13-14, 36-37 and 52-55
* **Discrepancy Description:**
  - "Every tool ... even opening a page, writes to storage" is too broad. Only the 5 `useToolState` tools, SRS and the CPF SA migration write on load. Profile hooks write only on add, update or remove (`useHysaScenarios.ts:53`). Lines 39-42 already state the narrower, correct version.
  - "Makes an accurate one impossible" is contradicted by Alternative B (lines 503-506), which shows a single place to set the date once mount writes are removed.
  - "Explicit Save was needed to remove all three problems": B fixes problems 1 and 3, and dropping URL sync fixes problem 2 under either model.
* **Rationale & Recommendation:** Readers form their model of the problem here.
  - Say "seven tools also write when a page opens".
  - Replace "impossible" with "unreliable without changing how and when the app writes".
  - Present explicit Save as a product choice (the date means "confirmed by me"), not a technical necessity.

### 🟡 9. The zero-write test can't verify the Goal it backs - Severity: Major
* **Reviewer Lens:** `egm-style`, `egm-design` (Nit 6)
* **Affected Scope:** Line 438, backing lines 69-70. See also lines 426-428 and 212-217.
* **Discrepancy Description:** Tests run in `node` with no DOM or React, so "loading a tool performs zero writes" can only cover `adapter.read`. Today's writes happen in hook and page effects (`useToolState.ts:102`, SRS `:530-541`). Nothing in the spec structurally enforces "Save is the only writer"; the plan relies on a one-off grep (line 1236).
* **Rationale & Recommendation:**
  - Reword to "`adapter.read` / `readAll` perform zero writes against the Storage fake".
  - Add a page-load no-write check to manual QA.
  - Consider an ESLint `no-restricted-properties` rule on `localStorage.setItem` and `removeItem` outside `save.ts`, `useTheme.ts`, `DataPortability.tsx` and the migration.

### 🟡 10. The rollout sentence gets the logic backwards - Severity: Major
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** Lines 444-445
* **Discrepancy Description:** "Ships in stages, so production does not run a mix ... for long." Shipping in stages is what *creates* the mixed period (stages 4-6), and "for long" isn't measurable.
* **Rationale & Recommendation:** State whether stages 4-6 release together. If they release separately, state a target window, for example "within one release cycle".

### 🟡 11. Architecture diagram shows the guards writing to storage - Severity: Major
* **Reviewer Lens:** `egm-structural` (Major M2, Nit N4), `egm-style` (Nit N8)
* **Affected Scope:** Lines 219-245
* **Discrepancy Description:**
  - Line 242 joins the GuardedLink/useGuardedRouter/beforeunload column and the Save bar column into the write line back to localStorage. Read literally, the guards write to storage, which contradicts the core rule that Save is the only write.
  - The caption lists "list-page delete, and declared exceptions", but delete is itself a declared exception.
  - Box borders are one column off: the draft-hook box at lines 224-228 and the save-module box at lines 236-240.
* **Rationale & Recommendation:**
  - Start the write arrow only from the save module, and draw the guards as readers of the unsaved store.
  - Add separate labelled edges for the §7 exceptions.
  - Change the caption to "writes (only on Save and the §7 exceptions)".
  - Realign the boxes.

### 🟡 12. CUJs don't cover several Goals and edge cases - Severity: Major
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** Lines 150-206
* **Discrepancy Description:** These have no Given/When/Then journey:
  - list-page delete after confirm (95-97)
  - Discard (98-100)
  - an old bookmark with URL params being stripped (123-125)
  - the first Save of a never-saved single-state tool with defaults (77-79)
  - a stored profile id deleted in another tab (329-330)
  - a partial import (404-407)
* **Rationale & Recommendation:** Each of these is a behaviour change, and QA (§8, line 439) has no source for them. Add CUJs at least for delete, Discard, old bookmarks and first Save with defaults.

### 🟡 13. The navigation-guard lint rule has gaps - Severity: Major
* **Reviewer Lens:** `egm-design` (Nit 9), `egm-style` (Nit N14), `egm-structural` (part of M1). Raised by all three, so rated Major here.
* **Affected Scope:** Lines 364-366
* **Discrepancy Description:**
  - The rule restricts only `next/link`. A bare `useRouter().push` from a detail page would skip `useGuardedRouter` silently. The brief (concepts_brief.md:157, C8) proposed restricting `useRouter` too.
  - The rule would flag `ToolCard.tsx:102` and `tools/[slug]/page.tsx:32`, yet the spec says those need no guard.
  - "By accident" is filler.
* **Rationale & Recommendation:**
  - Add `useRouter` to the restriction, with explicit allowed files (`useGuardedRouter`, redirect sites).
  - Name the files allowed to import `next/link`.
  - Alternatively, state that programmatic pushes are covered only by code review.

### 🟡 14. Accessibility, design system and CLAUDE.md gaps in the UI components - Severity: Major
* **Reviewer Lens:** `egm-structural` (M4, M5), `egm-design` (Nit 14), `egm-style` (Nit N15)
* **Affected Scope:** Lines 368-392 and NFRs at 719-737
* **Discrepancy Description:**
  - **Accessibility:** there is no Accessibility NFR. The brief requires the bar to be readable by screen readers (concepts_brief.md:159). The spec doesn't specify live-region announcements for "Saved" / "Couldn't save", focus after Save, or disabled-button semantics.
  - **Design system:** SaveBar, LastSaved and ManualSaveNotice say only "built with Tailwind". They ignore the relevant `docs/design.md` rules:
    - floating glass: 80% surface, 12px blur, botanical shadow
    - gradient primary and `surface-container-highest` secondary buttons
    - tertiary wine-red for errors
    - no 1px borders
    - label typography for the date
  - **CLAUDE.md:** it lists shadcn/ui in the stack. The spec correctly says shadcn/ui isn't installed, but doesn't call out the conflict.
* **Rationale & Recommendation:**
  - Add an Accessibility NFR: a polite live region for state changes, assertive for errors, and an accessible name for the disabled Save.
  - Add one styling line per component citing design.md tokens.
  - Note that the CLAUDE.md stack line is out of date.

---

### 🟢 Nits

| # | Lines | Problem | Direction | Lens |
| --- | --- | --- | --- | --- |
| 15 | 324-333 | A double tap on Save in "new" mode may append the profile twice before `router.replace` completes. | Make the new-mode save an upsert by id, or switch the mode to "existing" right after the first success. | design |
| 16 | 404-407 | The partial-import rule only covers one direction. A file holding the date-carrying key but not the other keys gets a date next to data that wasn't imported. | Clear `savedAt` unless every key the tool owns is in the file. | design |
| 17 | 280, 408 | The "old plain string" for dividend years is really a JSON number (`DataPortability.tsx:47`). It is also stated twice. | Say the reader accepts a number, a numeric string, or the new object. Keep line 280 and point line 408 to it. | design, style |
| 18 | 318-325, 316-317 | `useProfileDraft` has no `status`/loading state, and the redirect timing depends on load. The spec doesn't say whether it strips URL params (the Non-Goal at 123-125 implies it does). | Give it the same `status` field, keep the redirect and `isDirty` inactive while loading, and state the param handling. | design, style |
| 19 | 302-315, 391-392 | `ProfileNameEditor` commits on blur, so tapping Save from the name field may save a stale draft. The brief noted this; the spec drops it. | Have `save()` read the draft from a ref, or apply the blur update first. | design |
| 20 | 106-108, 198, 381-385 | The one-time notice has no defined trigger, placement or scope, and its text is wrong for first-time users with no data. | Trigger it when any registry key exists and the dismiss flag is absent, and state where it renders. | design, style |
| 21 | 321-323 | "An empty list is handled" is vague. | State the behaviour, for example "an unknown id redirects to the list even when the list is empty". | style |
| 22 | 18-27 | The Overview says "does two things", then lists a third: removing shared links, a user-visible regression. | Make it item 3. | style |
| 23 | 20-21, 67-68 | "Save on all 12 tools and the 5 detail pages" conflicts with lines 337-338, which say list pages have no Save bar. | Say "the 7 single-state tool pages and the 5 multi-profile detail pages". | structural |
| 24 | 112-116 | Goals contains plan details ("ships first", "Add vitest"). "It covers..." has vitest as its antecedent. | Move the sequencing to §8/§9 and write "Tests cover ...". | structural, style |
| 25 | 47-50, 493-494, 537 | "About 15 setters" doesn't match the 12 sources listed. "Would go wrong without any error wherever one is missed" is awkward. | Give the actual count and unit, and reword to "a missed setter would show a wrong date and raise no error". | style |
| 26 | 60, 101-105, 136-137, 184-185, 362-363 | The leave-warning caveat appears five times with mixed certainty ("may not show" vs "are not guarded"; iOS "often ignores"). | State coverage once, definitively, in §4, and refer to it elsewhere. | style |
| 27 | 270-272 | "A new tool cannot be left out of export" is only true if the tool registers an adapter. | Say "any tool with a registered adapter is exported automatically". | style |
| 28 | 349-351 | Cause and effect are compressed: the layout stays a server component because no Context provider is needed. | Say that directly. | style |
| 29 | 507-508 | Alternative B: "every write path would still swallow errors" isn't inherent to B. | Recast it as "would need separate error-reporting work", or drop it. | style |
| 30 | 563, 624, 631, 680, 686-689 | Subjective wording in Alternatives: "Simple.", "too many moving parts", "after all", "fragile", "can trap users". | Replace each with the concrete mechanism from that entry's Cons. | style |
| 31 | 649-652 | Alternative R's Cons says "only plain inputs travel, list items are lost" twice. | Keep one. | structural, style |
| 32 | 712-713 | Alternative Y gives a process step ("the rule asks for a trade-off discussion") as its cost. | State the real cost (dependency count, setup). | style |
| 33 | 724-728 | "A few kilobytes" is an unmeasured estimate, and there is no performance target. | Compute it, or drop it. | style |
| 34 | 739-746 | "Future Improvements" is an H3 under NFRs, and its triggers ("proves confusing", "often enough") can't be measured. | Make it an H2 and name the signals. | structural, style |
| 35 | 469, 146-148 | "Decisions made during drafting" is an unnumbered H3 among §1-§9. | Make it its own H2 next to Open Questions, or number it §10. | structural |
| 36 | 7, 717, 748; 57, 212, 452 | Horizontal rules are used inconsistently. Filler: "on purpose", "small adapter", "a new `new` route". | Use rules everywhere or nowhere, and trim the filler. | structural, style |

---

## Reviewer Disagreements

- **Finding 1 severity:** structural rated it Blocker, design and style rated it Major. It is kept as Blocker because the feature-spec standard's Alternatives Rule treats it as an outright fail.
- **Finding 13 severity:** design and style rated it Nit, structural listed it under a Major. It is raised to Major because all three reviewers flagged it independently and it creates a silent bypass of the core guard.
