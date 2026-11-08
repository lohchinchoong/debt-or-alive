# Explicit Save and Per-Tool / Per-Profile "Last saved" Date

* **Author:** Des with Claude
* **Date:** 2026-11-08

## Overview

**Changes from the previous iteration.** The first brief kept autosave and tried to set a date from about 15 setters. The author has replaced that with an explicit Save model. Save is now the only write and the only point where the date is set. That removes the earlier problem of telling a storage write apart from a user edit. It also brings in new problems: where a draft lives, which navigations can be blocked, and whether a save across several keys succeeds or fails as a whole. The decisions that were dropped are listed under Alternatives Weighed and under "Superseded decisions" in Key Decisions.

**The feature as confirmed by the author**

- **Explicit Save replaces autosave** on all 12 tools and on their profile or scenario detail pages.
- **Every change stays an in-memory draft until Save.** This covers field edits and adding, deleting and reordering list items. A new profile or scenario opens its detail page in a "new" mode and is created on its first Save. One declared exception: deleting a whole profile or scenario from a list page writes immediately after a confirm dialog.
- **Unsaved work can be lost.** For example, a mobile browser may evict a background tab. There is no draft recovery.
- **A visible "Unsaved changes" bar is the main safeguard.** The app also warns on in-app navigation and on tab close or reload where the browser allows it; this is best-effort and not guaranteed for browser back, iOS swipe-back or iOS Safari tab close. A Discard button resets the draft, and a one-time notice tells existing users that saving is now manual.
- **Save writes all of a tool's localStorage keys together.** It reports storage errors, rolls back on a partial failure, and writes the "Last saved" date last, only if the draft differs from the saved data.
- **Display.** "Last saved: 8 Nov 2026": date only, in the viewer's local time zone, in the form "D Mon YYYY" with fixed three-letter month names (Sep, not Sept).
  - Single-state tools show it on the tool page.
  - CPF SA, CPF MA, CPF OA annuity, HYSA tracker and savings goal show it only on their `[profileId]` or `[scenarioId]` pages, with one date per profile.
- **Empty states.** Data that has never been saved shows "Not saved yet". Data saved before this feature (data present, no date) shows nothing until its next save.
- **Shared links are removed.** The app no longer reads or writes URL search params; params on old bookmarks are ignored and stripped on load.
- **Export and import.** Export includes the dates and import restores them. Importing an older backup without dates clears the affected dates. Multi-tab edits: last save wins. No telemetry is added. This work also fixes the missing `hysa-tracker:scenarios` export key.
- **Tests.** vitest is added as a dev dependency.

All data lives only in the browser's localStorage. There is no backend.

**How this brief was produced (iteration 2).** Seven reviewers looked at the concept in brainstorm mode, and all seven completed.

| Reviewer | Status |
| --- | --- |
| `egm-design` | completed |
| `egm-codebase-details` | completed |
| `egm-zoom-out` | completed |
| `egm-comprehension` | completed |
| `egm-implementation-readiness` | completed |
| `egm-structural` | completed |
| `egm-inventive-catalyst` | completed |

The synthesizer checked the Next.js navigation claims against `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md` and confirmed that `next.config.ts` is empty. The other line references below come from the reviewers.

## Analysis

### What the code does today (verified in iteration 1, still accurate)

The code has not changed since iteration 1. The behaviours below are now things this feature removes, not things to work around.

- **Writes on mount.** `useToolState` writes storage and the URL on mount (`useToolState.ts:96-103`). The SRS save effects (`srs-calculator/page.tsx:530-541`) write on every load.
- **Writes on every change.** `useToolState.update` writes storage and debounces a URL write (`useToolState.ts:113-124`). Page-level array setters write inside `setState` updaters:
  - fire (`:938-952`, two keys)
  - mortgage (`:630-636`)
  - emergency-fund (`:584-590`)
  - budget (`:758-764`)
  - dividend (`:461-472`). Note that `projection-years` is stored as a plain string.
- **Profile hooks write immediately** from every add, update and remove function. HYSA also writes from `addMonth` and `removeLastMonth`, and savings goal from `addItem`, `removeItem`, `updateItem` and `updateItems` (reorder).
- **Shared links.** If any URL param is present, `useToolState` skips storage entirely (`useToolState.ts:96-98`). Missing keys fall back to defaults, not to stored values (`:100`). Because the URL is written on mount, almost every existing bookmark of the 5 `useToolState` tools already carries a full set of params.
- **The CPF SA migration** writes during its first read (`useCpfProfiles.ts:47-58`).
- **Loaders normalise what they read:**
  - CPF SA and MA fill in `startMonth ?? 1` (`useCpfProfiles.ts:44`, `useCpfMaProfiles.ts:46`).
  - CPF OA rebuilds each record field by field (`useCpfOaProfiles.ts:47-56`).
  - Savings goal gives records without an id a new `Date.now()` id on every load (`useSavingsGoal.ts:49-55`).
- **Export and import.** `STORAGE_KEYS` (`DataPortability.tsx:6-26`) is a hand-written list of 19 keys, with `FORMAT_VERSION = 1`. It is missing `hysa-tracker:scenarios`, and `tool:srs-calculator` is listed but unused. Import is only on the home page (`src/app/page.tsx:41`) and ends with `window.location.reload()` (`DataPortability.tsx:149`).
- **Every write path swallows errors**, for example `useToolState.ts:71-77`, `utils.ts:29-35` and `useCpfProfiles.ts:31-37`.
- **Tools that store data under more than one key:**
  - fire (3 keys)
  - mortgage, emergency-fund, srs, dividend and budget (2 keys each)

### New facts established in this iteration

**Routing and page state**

- **Each route has its own hook instance.** Each one reads localStorage in a `useState` initialiser, for example `useCpfProfiles.ts:74`. There is no shared store or provider. The only layout file is `src/app/layout.tsx`. `cacheComponents` is off, so pages unmount on navigation and page-local drafts are discarded.
- **Add navigates straight away.** Every list page's `handleAdd` calls `add*()` and then immediately calls `router.push` to the new detail route:
  - `cpf-sa/page.tsx:226-229`
  - `cpf-ma:228`
  - `cpf-oa:229`
  - `hysa-tracker:196`
  - `savings-goal:262`
- **A missing id sends the user back or shows a blank page.**
  - The CPF detail pages redirect to the list when the id is missing (`cpf-sa/[profileId]:569-575`, `cpf-ma:638-642`, `cpf-oa:519-523`).
  - HYSA and savings goal redirect only when the list is non-empty. For a first-ever scenario they render a blank page (`hysa/[scenarioId]:641-647`, `savings-goal/[scenarioId]:594-606`).
- **Profile cards are clickable `div`s that call `router.push`**, not Links (`cpf-sa:103` and the equivalents).

**Navigation APIs** (Next 16; codebase-details reports 16.3.6 installed)

- **`<Link onNavigate>`** passes an event with `preventDefault()` (`link.md:453-503`). It has existed since v15.3.0, and the docs include a "Blocking navigation" recipe that uses React Context and `window.confirm` (`link.md:1092-1366`).
- **It fires only for client-side, same-origin Link navigation.** It does not fire for modifier-clicks, `download` links or external URLs.
- **Nothing can block `router.push`, `router.replace` or browser back/forward**, including the iOS swipe-back gesture. `onRouterTransitionStart` can observe navigation but not cancel it.
- **`beforeunload` is best effort.** It does not fire on client-side back/forward. iOS Safari does not show its prompt reliably. Tab eviction fires nothing.

**Places that leave a page and need a guard** (codebase-details inventory)

- **About 20 `<Link>` call sites:**
  - the `SiteHeader.tsx:110` wordmark
  - 7 back links on single-state pages
  - 5 back links on list pages
  - 5 back links on detail pages
- **About 10 `router.push` call sites:** the profile cards and `handleAdd`.
- **Calls that must not be guarded:** the `router.replace` redirects for a missing id.
- **No guard needed:** `ToolCard`, `HeroSection` and the coming-soon page, because they appear only where no draft exists.

**Other findings**

- **Default values that are not stable:**
  - fire and dividend defaults call `genId`.
  - SRS `DEFAULT_DEPOSITS.startDate` uses `todayISO()`, a UTC date that changes daily.
  - CPF defaults use the current year and month.
- **shadcn/ui is not actually installed.** There is no `src/components/ui` and no Radix dependency. A custom async dialog would need a new library, or would have to cancel the navigation and push again afterwards.
- **Wording that no longer fits:**
  - The delete confirms say "This cannot be undone" (`cpf-sa:96`, `cpf-ma:96`, `cpf-oa:96`, `hysa:69`, `savings-goal:127`, and the HYSA remove-month confirm at `[scenarioId]:752`). Under drafts that becomes false.
  - The inline rename editor already has its own "Save" button (`[profileId]/page.tsx:646`), which would clash with the page-level Save.
- **Tests.** vitest and vite are not installed. `tsconfig.json` includes `**/*.ts`, so `next build` type-checks test files and `eslint .` lints them. The `@/*` alias is defined in `tsconfig.json:25-29`.

### Contradictions from iteration 1: status

| ID | Contradiction | Status now |
| --- | --- | --- |
| C1 | A storage write is not a user edit | Gone. Save is the only write, provided both mount-write paths are removed. |
| C2 | One date per tool, but data spread across keys | Resolved by a single combined draft per tool (C9). |
| C3 | A shared link overwrites data but must not change the date | Replaced. A link loads as a draft. New problems are in C7. |
| C4 | "Not saved yet" and legacy look the same | Solvable once mount writes are removed. Rewritten as the three-state model in C10. |
| C5 | Local-time date with server rendering | Unchanged. Render only after hydration (`useIsClient`) and store ISO instants. |

### New contradictions and resolutions

**C6. A profile created as a draft on a list page vs a detail route that reads only saved data.** (Blocker; raised by all seven lenses)

- Under the concept, Add creates a draft, then `router.push` unmounts the list page and its draft. The detail page cannot find the id and redirects, or shows a blank page.
- The push itself would also set off the unsaved-changes alert.
- The reviewers proposed four ways out and did not agree on one:
  - (a) **Route-scoped drafts, with list-page create and delete saved immediately.** These are a declared exception; field edits still need Save. Recommended by zoom-out and structural, and listed as an option by design and implementation-readiness.
  - (b) **Route-scoped drafts, with Add going to a "new" mode on the detail page** (`/…/new`, or a reserved id). That page's Save inserts the profile. The list-page draft holds only deletes, renames and reorders. Recommended by design.
  - (c) **One draft per tool, shared by the list and detail pages.** It would live in a provider in a new `tools/<tool>/layout.tsx` (inventive) or in a module-level store read with `useSyncExternalStore` (codebase-details). Moving list↔detail is not leaving, and every Save button on the tool saves everything. Recommended by inventive and comprehension. The cost is that "what does this Save cover?" becomes harder: the UI must list what is pending (for example "1 new, 1 deleted, 2 edited") and label the button, for example "Save CPF SA changes (3)".
  - (d) **Add stays on the list page as a draft.** The user saves the list before opening the profile. This is simple but adds friction.
- Whichever is chosen, the brief must say what the detail page does with an unknown id, including the HYSA and savings-goal empty-list case.

**C7. "The URL reflects the draft" vs "no draft recovery".** (Blocker; raised by design, implementation-readiness, structural, inventive, zoom-out and comprehension)

- On the 5 `useToolState` tools, a reload after an unsaved edit brings the scalar values back from the URL as a "shared link" draft. The array keys come back from storage instead.
- The user sees a half-restored, dirty page, and a reload they made is labelled as someone else's link.
- Old bookmarks with stale params open as dirty drafts over newer saved data. Every visit then prompts on leave.
- Options:
  - (a) **Read the URL params once on load as an incoming draft, then remove them with `router.replace(pathname)`.** Write params only from an explicit "Copy share link" action; no share UI exists today. Recommended by design; implementation-readiness and comprehension proposed close variants.
  - (b) **Tag URLs the app writes itself** in `history.state` (for example `dbaOwn: true`). Tagged params are ignored on load, and untagged ones count as a shared link (inventive). This keeps "the URL reflects the draft", but it depends on how Next treats outside keys in `history.state`, and that has to be tested.
  - (c) **Write the URL only on Save.**
  - (d) **Keep the current behaviour** and document the partial recovery.
- Separate from these options, URL syncing should become its own concern (`useUrlSync`), so the storage layer never touches `history` (structural).

**C8. "Warn on in-app navigation" vs App Router, which can block only Link clicks.** (Blocker for the concept as written; raised by all seven lenses)

- These platform limits cannot be designed away. Browser back/forward and iOS swipe-back cannot be blocked. iOS Safari does not show the `beforeunload` prompt reliably. On a mobile-first app those are the main ways to leave a page.
- Resolution:
  - Promise the warning only where the platform allows it.
  - Add a `GuardedLink` that wraps `next/link` with `onNavigate`, and a `guardedPush` (or `useGuardedRouter`) for programmatic pushes.
  - Read the unsaved state synchronously from a small module-level store with `useSyncExternalStore`, so the root layout stays a server component.
  - Attach `beforeunload` only while there are unsaved changes, and remove it on Save or unmount, so bfcache is not disabled.
  - Use synchronous `window.confirm`, as the Next recipe does and as the existing delete confirms do.
  - Add an ESLint `no-restricted-imports` rule for `next/link` and `useRouter` outside the wrappers (design).
  - The missing-id redirects bypass the guard.
- The main safeguard becomes a visible unsaved state: a sticky Save bar or indicator ("Unsaved changes" / "Saved") that is readable on mobile and by screen readers. The prompts become a bonus where they work.
- Rejected: a popstate trap (push a dummy history entry, then push again after confirm). It fights Next's own entries in `history.state`.

**C9. Detecting "differs from saved" vs loaders that reshape data and defaults that change.** (Blocker; raised by implementation-readiness, design, structural, inventive and codebase-details)

- Comparing against raw storage, or recomputing defaults, would mark legacy data and first visits as dirty straight away.
- Resolution:
  - Each tool has one combined draft record, for example `{state, yieldSources, drawdownSources}` for fire.
  - The saved snapshot is the normalised output of a single load, captured once.
  - The draft starts as a clone of that snapshot.
  - Unsaved state is one comparison: stable-key-order JSON of the draft against the snapshot, memoised, and ignoring `updatedAt`.
  - For a tool with nothing stored, the snapshot is the defaults captured at mount.
  - A per-profile page compares only its own profile.
  - Typing a value and then reverting it is no longer an unsaved change. This replaces the caveat in iteration 1's D3.
- `useToolState` loads in an effect. It therefore needs `status: "loading" | "ready"`, and the page is never dirty before `ready`; otherwise the guard fires during hydration (design).

**C10. "Set the date only if the draft differs" when nothing has been saved.** (Blocker; raised by design, implementation-readiness, comprehension and structural)

- Resolution: use two checks.
  - `isDirty = !equal(draft, snapshot)` drives the indicator and the guards.
  - `canSave = isDirty || neverSaved`.
- The first Save of a tool or profile always writes and sets the date, even with default values. Saving when nothing has changed and the data was saved before is disabled, or shows "No changes to save".
- Three states:

  | State | Single-state tool | Profile |
  | --- | --- | --- |
  | Not saved yet | none of the tool's keys exist | `updatedAt: null`, or a draft profile not yet saved |
  | Legacy (show nothing) | data present, no date | field absent |
  | Show the date | date present | `updatedAt` set |

- Accept that users who only viewed a tool under autosave count as legacy, because the mount write stored their defaults.
- Add a vitest case to check that loading a page writes nothing.

**C11. Trust in an explicit Save vs non-atomic writes that swallow errors.** (Blocker; raised by codebase-details, design, implementation-readiness, structural, inventive and zoom-out)

- A quota error would still clear the unsaved state and set a date, so the user is told "saved" when nothing was saved.
- Resolution: one save module is the only writer of tool data, for example `saveTool(entries)` in `src/lib/`. It:
  1. serialises every value first;
  2. snapshots the previous raw values;
  3. writes the data keys, then the date last;
  4. on any error, restores the previous values (removing keys that were absent before), keeps the page dirty, leaves the date unchanged and returns an error.
- The UI shows "Couldn't save" next to the Save button.
- The rollback itself may fail under quota pressure. Report the error anyway.

**C12. Per-profile Save vs hooks that write the whole array read at mount.** (Major; raised by implementation-readiness, design and structural)

- Drafts now stay open for minutes. A detail-page Save that writes the mount-time array can undo another tab's Save, or a list-page Save.
- Resolution: at Save time, re-read the array from storage, replace only this profile's record by id (setting `updatedAt` on it), and write the result.
- If the profile no longer exists in storage, show an error and do not re-create it.
- A list-page Save applies its additions, deletions and renames by id in the same way.

### Other points raised

- **First-release experience** (comprehension, zoom-out). Users have learned that leaving the page is safe. Show a one-time, dismissible notice per browser, for example "Changes are no longer saved automatically. Press Save to keep them." State the mobile loss plainly as a regression: autosave lost nothing.
- **Discard** (comprehension, design). Add "Discard changes" next to Save. It resets the draft to the saved snapshot, or to defaults, and clears URL params. Without it, the only way to drop a draft is to leave and accept the warning.
- **Shared-link presentation** (comprehension, design).
  - While a link draft that differs from saved data is active, show a banner: "You're viewing values from a link. Your saved data hasn't changed." It offers "Keep my saved data" and "Save these values as mine".
  - Do not show the recipient's own date next to someone else's values.
  - Only scalar `useToolState` keys travel in the URL. "Save adopts the link" therefore saves a mix of the sender's scalars and the recipient's own lists. Document that a link shares only the scalar inputs.
- **Wording.**
  - Consider "Last saved: 8 Nov 2026". It matches the button and pairs with "Not saved yet", and it avoids reading "Last updated" as "the app updated its rates".
  - Change the delete confirm wording to match the C6 decision.
  - Relabel the inline rename button "Done".
  - The tab-close text is the browser's own and cannot be changed. Only the in-app message can name the tool.
- **Export and import with drafts** (comprehension, implementation-readiness).
  - Export reads saved data only. Say so.
  - Import is home-page only, so no draft is mounted in that tab. A dirty draft in another tab will overwrite imported data on Save. Accept last-write-wins, or check at Save time whether the raw values have changed since load (inventive: "Data changed in another tab. Overwrite?").
  - Do not count date keys in the "Imported N tools" message (`DataPortability.tsx:143`).
- **Exceptions to "Save is the only write":**
  - **The CPF SA migration stays an eager write during load, with no date.** Without it, each page instance would create a different `p_${Date.now()}` id and the detail URLs would break.
  - **The savings-goal id regeneration needs a fix.** Use a deterministic fallback such as `sg_legacy_${i}`, or allow one migration write with no date. Otherwise the list links to an id that the detail page generates differently.
  - **`useTheme.ts` is outside the draft model.**
- **Rollback to the autosave build** (implementation-readiness). Going forward the change only adds data. Rolling back loses dates only: the CPF OA and savings-goal loaders drop `updatedAt`, and the old `readFromStorage` filters out unknown keys. The affected records show the legacy state. An old tab still open during the deploy keeps autosaving.
- **Mobile Save bar** (design). It needs safe-area padding, must not be covered by the virtual keyboard, and should render only after `useIsClient`.
- **Stale closure on Save** (design). `ProfileNameEditor` commits on blur, so Save must read the latest draft from a ref or store.
- **Scope by tool category** (zoom-out). Compound interest, FIRE and mortgage are mostly what-if calculators. Explicit Save and leave prompts there add friction, and a date tells the user little. The author may want to keep them on autosave, with no date.
- **Optional telemetry** (codebase-details). `track()` from `@vercel/analytics` is already a dependency and could record `save`, `save_failed` and `leave_discarded` without amounts. This may conflict with the "invisible to us" privacy copy (`SiteHeader.tsx:76-81`).
- **If `cacheComponents` is turned on later** (inventive, design). Hidden pages would keep their drafts in `<Activity>`, which would quietly break the assumption that leaving a page discards its draft. Record this in the spec.

## Goals vs. Non-Goals

**Goals**

- Explicit Save on the tools and pages in scope, with Save as the only write of tool data (apart from the declared migration exceptions).
- One combined draft per tool or per profile. Unsaved state is one comparison against the normalised snapshot.
- Save writes all of a tool's keys and either succeeds or fails visibly. The date is written last and only on success.
- "Last saved" per single-state tool and per profile, using the three-state model in C10.
- A visible unsaved-changes indicator, plus a Discard action.
- Warnings on guarded in-app links and pushes, and on desktop tab close or reload where the browser allows.
- URL search params are no longer read or written (shared links removed by the author).
- Export and import carry the dates with `FORMAT_VERSION = 1`. The `hysa-tracker:scenarios` gap is fixed.
- vitest unit tests for the pure logic, and work that can ship in stages.
- Project conventions: mobile-first, named exports, strict TypeScript, no new runtime libraries, server components by default.

**Non-Goals**

- Draft recovery of any kind, including a sessionStorage buffer. Inventive notes that such a buffer would quietly bring recovery back.
- Blocking browser back/forward or iOS swipe-back, or guaranteeing a prompt on mobile tab close or eviction.
- Syncing across tabs or devices, or a backend. Last-write-wins is accepted unless the optional check in "Other points raised" is adopted.
- Component or DOM tests (jsdom, happy-dom, Testing Library), unless the author approves those dependencies separately.
- Relative times, a time of day, stale-data warnings, edit history.
- Dates on the list pages. This is a possible follow-up; comprehension notes that list pages are now where drafts begin.
- Merging the five near-identical profile hooks into one beyond what the draft model needs.
- Coming-soon tools.

## Alternatives Weighed

| ID | Option | Summary | Status |
| --- | --- | --- | --- |
| A | One global timestamp | One date for "last touched anything". | Rejected (iter. 1). It cannot show that one profile is out of date while another is current. |
| B | Wrap `localStorage.setItem` / `saveArray` | Set the date on every write. | Rejected (iter. 1). It cannot tell edits from mount writes. That problem is now moot, because Save is the only write. |
| C | `updatedAt` inside `useToolState` state | Make the date a schema field. | Rejected (iter. 1). It leaks into URLs and is filtered out by `readFromStorage`. |
| D | A date per storage key, showing the latest | Mirrors key-by-key import. | Rejected (iter. 1). Too many moving parts. |
| E | `updatedAt?: string \| null` on profile and scenario records | Travels with export/import; deleting a profile deletes its date. | Recommended (carried forward). `null` now means "created, never saved". Requires the CPF OA and savings-goal loaders to keep the field. |
| F1 | One sidecar map `meta:last-updated` | One key for all single-state tools. | Option (carried forward). Simplest; tabs can race. |
| F2 | One sidecar key per tool, `meta:updated-at:<slug>` | No race between tabs. | Option (carried forward). Recommended if multi-tab use matters. |
| G | One sidecar for everything, including profiles | One mechanism. | Rejected (iter. 1) in favour of E. |
| H | Stage multi-profile tools first | Highest value. | Adopted (carried forward). Refined in the staging below. |
| I | Autosave, with the date set in about 15 setters | Iteration 1's D2. | Superseded by the author. There is no single place to set the date, and a missed setter fails silently. |
| J | Autosave with mount writes removed, date set in shared storage helpers | Offered as the lower-risk option on mobile. | Superseded by the author in favour of explicit Save. Recorded because it kept autosave's zero-loss behaviour on mobile, which explicit Save gives up. |
| K | "Not edited yet" label | Iteration 1's empty-state wording. | Superseded. With explicit Save, "Not saved yet" is accurate. |
| L | Manual setter checklist instead of tests | Iteration 1's open decision 7. | Superseded. vitest was chosen. Navigation guards stay on a manual QA list. |
| M | One shared draft core vs hand-built drafts per tool | A generic hook (`useDraft` / `useToolDraft`) with per-tool persistence adapters `{keys, read(storage), write(storage, v)}` and pure domain functions, vs adding dirty tracking to each of about 15 state holders. | Recommended: shared core (structural, design, inventive, zoom-out). Add a draft variant rather than editing `useToolState` in place, so tools can move one at a time. |
| N | Draft scope: per route vs per tool | See C6 (a)-(d). | Open. Reviewers are split (structural, zoom-out and design: per route; inventive and comprehension: per tool). |
| O | Save boundary for multi-profile tools: whole array vs one profile | Writing the mount-time array vs a fresh read-merge by id. | Recommended: one profile, merged into fresh storage by id (C12). |
| P | URL behaviour | Draft in the URL vs read once and remove vs ownership tag vs write on Save. | Open. Read once and remove is the leading option (C7). |
| Q | Async shadcn dialog vs `window.confirm` | A custom dialog for leave prompts. | `window.confirm` recommended. shadcn/Radix is not installed, and an async dialog would need cancel-then-push. |
| R | Popstate sentinel to block back | Push a dummy history entry while dirty. | Rejected. Fragile against Next's own history entries. |
| S | sessionStorage draft buffer | Survives route changes without a provider. | Rejected. It brings back draft recovery, which the author has ruled out. |
| T | Explicit Save only for record-like tools | Keep compound interest, FIRE and mortgage on autosave (zoom-out). | Open for the author. |
| U | Persistence registry of adapters to derive `STORAGE_KEYS` | `src/lib/persistence/registry.ts` (structural). | Recommended. It fixes the HYSA gap structurally and drops the unused `tool:srs-calculator` entry. |
| V | Test environment | `node` with an injected in-memory `Storage` fake vs jsdom or happy-dom. | Recommended: `node`. Use no extra libraries, configure the `@` alias by hand with `import.meta.url`, and pin `TZ` in the test script. |

## Key Decisions & Staging for Next Steps

### Superseded decisions

| ID | Previous decision | Replaced by | Reason |
| --- | --- | --- | --- |
| D2 (iter. 1) | Set the date in user-intent setters; `onChange` on `useToolState` | The date is set only inside `save()` | The author chose explicit Save. There is no single place to set the date in the setter approach. |
| (interim) | Keep autosave, remove mount writes, set the date in storage helpers | Explicit Save | Author preference. This gives up zero-loss mobile behaviour (Alternative J). |
| Open 1 (iter. 1) | Options for how a shared link affects the date | A link loads as an unsaved draft; Save adopts it | Author decision. The URL details are reopened as D9. |
| Open 2 (iter. 1) | Merge or split never-edited and legacy | Three states (C10) | Removing the mount writes makes them distinguishable. |
| Open 3 (iter. 1) | What counts as an edit | Anything that makes the draft differ from the snapshot | Save makes this a data comparison. The remaining question is D8. |
| Open 4 (iter. 1) | "Not edited yet" wording | "Not saved yet" | Matches explicit Save. "Last updated" vs "Last saved" is still open (D12). |
| Open 7 (iter. 1) | A manual checklist instead of tests | vitest | Author decision. |

### Decisions carried forward and proposed (new IDs start at D6)

- **D1 (kept).** Dates are stored with option E for profiles and F1 or F2 for single-state tools. `FORMAT_VERSION` stays 1.
- **D4 (kept).** One `"use client"` `LastUpdated` component, gated on `useIsClient`, with a fixed-height slot. Store ISO instants and format them in local time.
- **D5 (kept).** The HYSA export fix ships first as its own `fix:` commit.
- **D6.** One shared draft core with per-tool persistence adapters and pure domain functions (Alternative M). A single save module is the only writer of tool data, with rollback, and it writes the date last (C11).
- **D7.** The unsaved state compares against the normalised snapshot captured at load, using stable-key JSON. There are separate `isDirty` and `canSave` checks (C9, C10).
- **D8.** A per-profile Save does a fresh read and merges by id. On a list-page Save, renamed profiles get today's date, deleted profiles lose theirs, and new profiles follow D9-C6.
- **D10.** Guards: `GuardedLink`, `guardedPush`, `beforeunload` attached only while dirty, `window.confirm`, and an ESLint restriction. Browser back/forward is documented as not guarded.
- **D11.** Declared exceptions to "Save is the only write": the CPF SA migration, the savings-goal id fix (if done as a write) and `useTheme`.

### Decisions resolved by the author after iteration 2

- **D9-C6 resolved: option (b) for create, (a) for delete.** Add on a list page opens the detail page in a "new" mode; the profile is written to storage only when the user first presses Save there, and gets its first date at that moment. Delete on a list page writes immediately after the user confirms in a dialog; the confirm dialog counts as the explicit save action. This is a declared exception to "every action waits for Save" and is added to D11. Consequence: list pages have no Save button and no draft, so D8's list-page merge rules reduce to "delete removes the profile and its date".
- **D9-C7 resolved, then superseded: shared links are removed.** The author first accepted "read once, strip, add a Share button", then chose to drop shared links entirely. `useToolState` no longer reads or writes URL search params. Any params on an old bookmark are ignored and removed from the address bar on load. There is no Share button and no shared-link banner. Trade-off accepted: moving data between devices is possible only through export and import, and existing bookmarks with params open with the user's saved data (or defaults) instead of the link's values. This also removes the "shared link loads as a draft" rule from the hypothesis.
- **D10 amended: the unsaved-changes bar is the primary safeguard.** A visible "Unsaved changes" bar beside Save is the guaranteed signal. The leave warning (`<Link>` `onNavigate`, `guardedPush`, `beforeunload` while dirty) is best-effort only, and the brief does not promise it for browser back/forward, iOS swipe-back or iOS Safari tab close. Unlike autosave, unsaved edits can be lost on mobile; this is stated to users in the first-run notice if decision 5 adopts one.
- **D6 confirmed.** One save module is the only writer of tool data. It reports storage errors instead of swallowing them, rolls back already-written keys if a later key fails, and writes the date last, so a failed save never shows a new date.

### Open decisions for the author (in order: later ones depend on earlier ones)

1. ~~D9-C6. Draft scope and list-page create/delete.~~ Resolved: see above.
2. ~~D9-C7. URL behaviour.~~ Resolved: see above.
All open decisions are resolved:

3. **Scope.** All 12 tools get explicit Save, including compound interest, FIRE and mortgage. Alternative T (keep autosave for what-if calculators) is rejected by the author.
4. **Shared links.** Removed entirely (see D9-C7 above). No banner is needed.
5. **Discard and first-run notice.** Both are added. The first-run notice tells existing users that saving is now manual and that unsaved edits can be lost on mobile.
6. **D12. Wording.** The label is "Last saved: 8 Nov 2026" (and "Not saved yet"). The in-app leave message is "You have unsaved changes to [Tool name]. Leave anyway?"
7. **Month format.** A fixed array of three-letter month names (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec), not `Intl`/`en-SG` output.
8. **Older backups without dates.** Importing data for a tool without a date clears that tool's (or profile's) date, so it shows nothing.
9. **Multi-tab.** Last write wins. No conflict check.
10. **Telemetry.** Not added.

### Staging

Each stage can ship on its own. The reviewers prefer to move one tool family at a time and finish soon after, so production does not mix autosave and explicit-Save tools for long.

| Stage | Scope | Acceptance |
| --- | --- | --- |
| S0 | Add `hysa-tracker:scenarios` to `STORAGE_KEYS` (separate `fix:` commit). | Export, clear storage, import: the HYSA scenarios are present. |
| S1 | vitest setup (`node` environment, `@` alias, pinned `TZ`, `"test": "vitest run"`). Pure lib modules: date formatter, stable equality, save module with rollback, adapter read normalisation. `LastUpdated` component. | `8 Nov 2026` from a local date; September shows as "Sep"; a UTC-midnight instant formats to the local date; key-order variants are equal; a stub Storage that throws on the second `setItem` leaves all keys at their previous values and returns an error; legacy CPF SA without `startMonth` and legacy CPF OA records load as not dirty. |
| S2 | Draft core (`useDraft` with `status`, `isDirty`, `canSave`, `save`, `discard`), dirty store, guard infrastructure (`GuardedLink`, `guardedPush`, `beforeunload` only while dirty, ESLint rule), Save bar with unsaved and error states. Wired up but not yet used. | Lint and build pass; no page changes behaviour. |
| S3 | First vertical slice: CPF SA detail page (zoom-out's smallest slice that meets the user goal), with the chosen D9-C6 option for its list page. | Saving profile A leaves profile B's date unchanged; Save after another tab added profile C keeps C; Add followed by opening the new profile gives no blank page and no redirect loop; with a dirty draft, logo click → Cancel keeps the draft; Save then the back link gives no prompt. |
| S4 | The other four multi-profile tools, including loader changes for `updatedAt`, the savings-goal id fix and the HYSA empty-list guard. | Same as S3 for each tool; reloading savings goal keeps ids stable. |
| S5 | Single-state tools through a draft variant of `useToolState` and the multi-key adapters. Remove `useToolState.ts:102` and the SRS effects. Remove URL param reading and writing (D9-C7). Start with compound-interest. | A fresh browser shows defaults, not dirty, "Not saved yet", and nothing written after load; edit, reload and leave shows the saved values; a URL with old params loads saved data, not dirty, and the params are stripped; SRS never writes on mount. |
| S6 | Export and import of the date keys, the rule for older backups, and the tools-count fix. Derive `STORAGE_KEYS` from the adapter registry. | Dates round-trip; a v1 file without dates imports and clears the imported tools' dates; the count excludes meta keys. |
| S7 | Verification: manual QA matrix and grep check. | Every Link and `router.push` on the in-scope pages is tested dirty with Cancel and OK; browser back is tested against the documented behaviour; `beforeunload` is tested in Chrome, Firefox and iOS Safari; `localStorage.setItem` appears only in the save module, `useTheme.ts`, `DataPortability.tsx` and the CPF SA migration. |

A follow-on feature spec should include:

- the chosen draft scope and URL rule;
- the per-tool adapter and key table;
- the three-state date model;
- the guard coverage table, including what is not guarded;
- the save failure UX;
- the exceptions to "Save is the only write";
- the alternatives above;
- the test plan per stage.
