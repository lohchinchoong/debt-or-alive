# Goldfish Review Report: Stage 8 (Intermediate Zoom Out)

**Target:** `/Users/desmondloh/Projects/debt-or-alive/docs/designs/explicit-save-last-saved-dates.md` (lines 1-1267)
**Mode:** REVIEW. The document has not been edited since Stage 5.
**Inputs:** Stage 5 `zoom_out_report.md`, Stage 6 `comprehension_report.md`, Stage 7 `critic_report.md`. Baseline reading: `concepts_brief.md`, `CLAUDE.md`, `docs/design.md`.

## Reviewer Status

| Reviewer | Status |
| --- | --- |
| `egm-zoom-out` | completed |

**Severity breakdown:** 0 Blocker, 10 Major, 11 Nit

## Verdict

There is no new Blocker. The design solves the root problem and reuses existing pieces where it can. Its main risk now is altitude. The doc is 1267 lines, and applying every Stage 6 and 7 fix as written would push it past about 1500 lines, with the same rules stated in even more places. Pair each addition below with a deletion so the doc does not grow overall.

The report has three parts:

1. Whether each requested addition belongs in this doc.
2. Findings from earlier stages that share a root cause.
3. Scope and simplicity issues that no earlier stage raised.

Prior findings not mentioned here (wording, consistency, small structure fixes) still stand as the earlier stages wrote them.

---

## Part 1: Should the requested additions go into this doc?

### 🟡 1.1 Risks & Mitigations section (Critic 5): include it, but compressed
* **Lines:** 57-63, 101-105, 136-137, 184-185, 362-363, 459-467, 721-737
* **Problem:** Adding a new section while the caveats stay scattered would state every risk twice. The leave-warning caveat already appears five times (Critic 26).
* **Why it matters:** More copies means more drift (see Group E).
* **Direction:**
  * Add one table of about 8 rows with the columns risk, impact, and mitigation or "accepted".
  * Move these risks into it:
    * the leave-guard gaps
    * mobile tab eviction
    * last-write-wins across tabs
    * quota and rollback failure
    * an old tab left open during a deploy
    * rollback to the old build
    * the `cacheComponents` watch item
  * Replace each scattered caveat with a pointer to the table.
  * Fold the Rollout & Rollback NFR (lines 733-737) and the §9 rollback paragraph into the table.
  * Do not invent mitigations to fill the column. "Accepted" is a valid entry.

### 🟡 1.2 Rollback fixes (Critic 2): correct the claim, do not add a guard
* **Problem:** Critic 2 found the rollback claim wrong. This stage did not re-check the loaders. Critic 2 also proposes a data fingerprint stored next to `savedAt`.
* **Why it matters:** A fingerprint is new machinery for a contingency path that the staged rollout already limits. That is YAGNI.
* **Direction:**
  * Correct the sentence and list which tools' old loaders keep `savedAt`.
  * In the Risks table, mark the stale date and the old-tab overwrite as accepted.
  * The only rollback regression that loses data is the dividend format change. Removing it at the source is cheaper than documenting it (see Group F).

### 🟡 1.3 Fuller alternative trade-offs (Critic 1, a Blocker in Stage 7): cut the list first
* **Lines:** 486-715
* **Problem:** Adding a trade-off sentence to each of the 25 alternatives makes the longest section even longer. Many entries are sub-decisions, not design alternatives: H, J, K, P, Q, T, W, X and Y.
* **Why it matters:** The reader cannot find the three or four decisions that shape the design:
  * explicit Save versus B
  * route-scoped drafts versus G
  * the date stored in the record versus N
  * removing links versus S
* **Direction:**
  * Keep about 8 top-level alternatives, each with one deciding trade-off.
  * Put the sub-decisions in one compact table (option, why not), or link to `concepts_brief.md` once it is committed under `docs/`.
  * The Group A paragraph meets Critic 1's standard without making the section longer.

### 🟢 1.4 Save-bar state table (Stage 6 Nit): add it to §5 in place of prose
* **Lines:** 370-372, 1041-1044
* **Direction:**
  * Add a table of about 5 rows. Each row maps `dateState`, `isDirty` and `saveError` to:
    * the bar text
    * whether Save is enabled
    * whether Discard is shown
  * Delete the four-state prose at the lines above.
  * The table also settles Group B. N3 describes a simpler version.

### 🟢 1.5 Accessibility, design tokens and the CLAUDE.md shadcn line (Critic 14): compress each
* **Accessibility:** Add two NFR lines:
  * Bar state changes are announced in a polite live region, which line 1042 already has. Errors are announced assertively.
  * The disabled Save button has an accessible name.
* **Design tokens:** Add one line in §5 that points to `docs/design.md`:
  * floating glass for the bar
  * a gradient primary button and a `surface-container-highest` secondary button
  * tertiary wine-red for errors
  * no 1px borders

  Do not write styling specs for each component. That is implementation detail.
* **CLAUDE.md shadcn line:** Fix it in CLAUDE.md as a separate chore. Line 373 of the doc already says shadcn/ui is not installed, which is enough.

### 🟢 1.6 Keyboard covering the Save bar (Critic 4): relax the requirement
* **Line:** 730
* **Direction:**
  * Change the requirement to "visible whenever the on-screen keyboard is closed" or "hidden while an input has focus". Do not add `visualViewport` code.
  * The bottom-padding rule is already in item 23 (lines 1046-1047). Lift it to §5 as one clause.

### 🟢 1.7 More CUJs (Critic 12): add three at most
* **Add:**
  * list-page delete
  * Discard
  * the first Save of a tool still on its defaults
* **Leave out:**
  * The old-bookmark case. It is already manual QA step 6 (line 1258).
  * The profile deleted in another tab, and the partial import. These are QA or unit-test edge cases, not user journeys, and both already have tests (lines 930-931 and item 37).

### 🟢 1.8 Stage 7 fixes the doc already contains: do not add them again
* **Critic 19 (stale closure on blur):** Item 17 already keeps the draft in a ref (lines 976-977). At most, add the words "latest draft" to §3.
* **Critic 18 (no `status` on `useProfileDraft`):** Item 18 already says the hook "returns the same shape as `useToolDraft`" (line 988), and that shape includes `status`.

### 🟢 1.9 Data fingerprint and conflict check: defer
* **Lines:** 743-744
* **Direction:** Leave both out of the doc. The existing Future Improvements entry is enough.

---

## Part 2: Findings across stages that share a root cause

### 🟡 Group A: Explicit Save reads as a technical necessity, and decisions record who chose instead of why
* **Findings grouped:** Stage 5 #1, Critic 1 (Blocker), Critic 8, Critic 29, and part of Stage 5 #13
* **Lines:** 52-55, plus the Alternatives section
* **Root cause:** The reasons behind the decisions are only in the untracked `concepts_brief.md`. The spec says "Rejected by author", and its Problem section is written as if Save were forced.
* **Direction:**
  * Add one paragraph at lines 52-55 that says explicit Save is a product choice:
    * The date then means the user confirmed the data.
    * Discard gives users a place to try out numbers.
    * Alternative B is the cheaper path that keeps zero data loss on mobile.
  * Give each kept alternative one trade-off sentence (see 1.3).

### 🟡 Group B: The three date states are not carried through everywhere
* **Findings grouped:** Stage 5 #2, Stage 5 #13, Critic 3, and the Stage 6 Nit on bar text for legacy data
* **Root cause:** `canSave`, the bar text and the labels were defined for two cases: dirty, and never saved. The third case, legacy data, was added to the display only.
* **Direction:**
  * Define `canSave` from `dateState`: `isDirty || dateState !== "saved"`.
  * Drive both the bar and the date label from the single state table in 1.4.

### 🟡 Group C: "Save is the only writer" is stated in prose, and its exceptions pile up in different sections
* **Findings grouped:** Critic 6, 7, 9, 11, 13 and 16; the Stage 6 grep Major; Stage 5 #3
* **Lines:** Goals, line 95, §7, the diagram, lines 1236-1241
* **Root cause:** The rule has no single owner, and nothing in the build checks it. Each section lists different exceptions:
  * Goals: none
  * line 95: one
  * §7: five
  * the diagram: unclear

  The grep and the zero-write test try to check the rule from outside the build, and they miss cases.
* **Direction:**
  * Make §7 the only list of exceptions. Goals, the diagram caption and the verification step should all refer to it.
  * Replace the grep at lines 1236-1241 with an ESLint rule (`no-restricted-globals` or `no-restricted-properties`). It bans the `localStorage` global outside an allowlist taken from §7.
  * Route import through the save module (the option Stage 5 #3 preferred). That removes one exception and also removes the partial-file patch rule (Critic 16).
  * Reword "all or nothing" to the guarantee that actually holds (Critic 7).

### 🟡 Group D: The navigation-guard API is defined twice, and the definitions differ
* **Findings grouped:** Stage 5 #4, the Stage 6 Nits on "plain router" and lint scope, Critic 13
* **Lines:** 356-366, items 18, 20 and 36
* **Root cause:** §4 and items 18, 20 and 36 each define the guard API. They disagree on its shape and on what the lint rule covers.
* **Direction:**
  * Define the API once, in §4: `useGuardedRouter()`, called at the top level, returns `{ push, replaceWithoutPrompt }`.
  * The lint rule covers `next/link` and `useRouter`, and allows the two wrapper files.
  * Items 18, 20 and 36 refer back to §4.

### 🟡 Group E: Facts are repeated across the doc's levels, and the copies drift
* **Findings grouped:** Stage 5 #11; Critic 17, 23, 24, 26 and 31; the Stage 6 Save-surfaces Major; the Stage 6 `remove`/`deleteProfile` Nit; the Stage 6 lint-scope Nit
* **Root cause:** The doc's levels are not kept separate. Goals contain plan details, the Technical Plan contains algorithms, and the Detailed Plan restates both.
* **Direction:**
  * Goals hold outcomes, the Technical Plan holds contracts, and the Detailed Plan holds mechanics. State each fact once.
  * Define the Save-surface count once ("7 tool pages + 5 detail pages including `/new`") and refer to it elsewhere.
  * This is also how the Part 1 additions can go in without making the doc longer.

### 🟡 Group F: No rule for how old and new builds read each other's data
* **Findings grouped:** Critic 2, Critic 10, Stage 5 #7, NFR line 736
* **Root cause:** The design changes one stored shape (dividend) and adds `savedAt` to records that some old loaders keep. It never says what must hold while old and new builds run side by side.
* **Direction:**
  * State one rule in the Risks table: "Data written by the new build must still load in the old build. A stale `savedAt` carried through the old build is accepted."
  * Use Alternative P or N for dividend, so that no stored shape changes.
  * Say whether stages 4-6 ship together (Critic 10).

### 🟢 Group G: Two parallel persistence stacks
* **Findings grouped:** Stage 5 #6, the Stage 6 naming Nit
* **Root cause:** Tools and profiles each get their own adapter, save module and draft hook, and each pair returns almost the same thing.
* **Direction:** Use one draft hook with a load-and-save strategy, plus a thin wrapper for profiles.

### 🟢 Group H: Interfaces carry capabilities nobody uses
* **Findings grouped:** Stage 5 #5, #8, #9 and #10
* **Root cause:** YAGNI at the interface level.
* **Direction:**
  * Delete the `storage` event listener, `adaptersForKey`, the standalone-keys slot and `value: null`.
  * Have the save module put `dateKey` last on its own.

### Standalone findings with no shared root
* **Notice trigger (Stage 6 Major, Critic 20):** needs one line stating the condition.
* **Double-tap upsert (Critic 15):** needs one line in item 18.

---

## Part 3: Scope and simplicity issues no prior stage raised

### 🟡 N1: All 12 adapters and every hook are built before the first page uses them
* **Lines:** 442-456 (§9 stages 2-3), items 11-24 (lines 872-1060)
* **Problem:** Stage 2 writes all 12 adapters. Stage 3 builds all hooks, guards and UI "without wiring any page to them yet". The design is first tested on CPF SA only in stage 4.
* **Why it matters:** Open findings are still changing the adapter interface:
  * one draft hook or two (Group G)
  * `toEntries` with a null date for import (Stage 5 #3)
  * the ordering of `dateKey` (Stage 5 #10)
  * the shape of the guard API (Group D)

  If CPF SA forces a change, 11 adapters and their tests have to be rewritten. Building infrastructure before anything uses it is speculative work.
* **Direction:**
  * Merge stages 3 and 4. Build the pure modules, then only the CPF SA adapter, `useProfileDraft`/`useProfileList`, the guards and the UI, and wire them into CPF SA.
  * Write each remaining adapter in the stage that moves its tool.
  * The registry and the `EXPORT_KEYS` switch can stay in stage 7, once every adapter exists.

### 🟢 N2: The static `new` route and its 5 re-export files are not needed
* **Lines:** 172, 331-333, 479-480; items 27-28 (lines 1086-1100); item 30
* **Problem:** The dynamic `[profileId]` and `[scenarioId]` segments already receive `"new"` from `useParams`:
  * The CPF SA detail page reads `useParams<{ profileId: string }>()` at `src/app/tools/cpf-sa-calculator/[profileId]/page.tsx:563`.
  * No id generator can produce `"new"`. They produce `p_${Date.now()}`, `sg_…` and `${prefix}_${Date.now()}_n` (`src/lib/utils.ts:40-41`).
  * `useProfileDraft` already accepts `"new"` as an id (line 318).
* **Why it matters:** The static segment adds 5 route files, a default-export re-export workaround, and a translation step ("param absent means new"), only to get a value the dynamic segment already provides.
* **Direction:**
  * Handle `id === "new"` inside the existing dynamic page.
  * Drop item 28 and the `new/page.tsx` entries in item 30.
  * If a static segment is still preferred, give the reason in one line.

### 🟢 N3: `SaveBar` and `LastSaved` show the same state twice
* **Lines:** 370-377, items 22-23
* **Problem:** The same state shows in two places:
  * On a page that has never been saved, the bar and the `LastSaved` label under the title both say "Not saved yet".
  * On a clean saved page, the bar says "Saved" and the label says "Last saved: 8 Nov 2026".
* **Why it matters:** One state gets two components and two hydration-gated slots. The legacy-text gap in Group B exists only because the two were specified separately.
* **Direction:** Choose one of these:
  * The bar's clean-state text becomes the date ("Last saved: 8 Nov 2026", "Not saved yet", or empty for legacy data), and `LastSaved` is dropped.
  * The label keeps the date, and the bar only shows "Unsaved changes" and "Couldn't save".

  Either way, the state table in 1.4 shrinks to a single owner. The author never decided to put the date under the title; the brief says only "on the tool page" (`concepts_brief.md:18`).

### 🟢 N4: A one-time release notice is built permanently into the Save bar
* **Lines:** 1045, item 24
* **Problem:** `SaveBar` renders `ManualSaveNotice` above itself. That ties a one-time notice to the main component on all 12 pages, inside a fixed bottom bar where mobile space is tight.
* **Why it matters:** Temporary code ends up permanent, and on small screens the notice takes space from the main safeguard.
* **Direction:**
  * Render the notice separately, from the layout or the page.
  * Add a removal note to Future Improvements, for example "remove after N releases".
