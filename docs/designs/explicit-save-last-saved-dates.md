# Explicit Save and "Last saved" Dates

*   **Author:** Des with Claude
*   **Status:** Proposed
*   **Date:** 2026-11-08
*   **Brainstorm record:** [explicit-save-last-saved-dates.brief.md](./explicit-save-last-saved-dates.brief.md)

--------------------------------------------------------------------------------

## Overview

Debt or Alive has 12 personal-finance tools. All of them keep their data only
in the browser's localStorage, and there is no backend. Today every tool
autosaves. Each keystroke writes to storage, and seven tools also write when a
page opens. Five tools (CPF SA, CPF MA, CPF OA annuity, HYSA tracker and savings
goal) hold several named profiles or scenarios. Each of these has a list page
and a detail page per profile.

This design does three things:

1.  It replaces autosave with an explicit **Save** button on the **Save
    pages**. These are the 7 single-state tool pages and the 5 multi-profile
    detail pages, including each detail page's `new` mode. List pages have no
    Save button.
2.  It shows the user when they last saved, as **"Last saved: 8 Nov 2026"**.
    Single-state tools show one date for the whole tool. Multi-profile tools
    show one date per profile, on that profile's detail page.
3.  It removes shared links. Tools no longer read values from the URL or write
    values to it.

## The Problem

Users come back to these tools weeks or months later. For example, they update
the HYSA tracker each month, or recheck a CPF projection after a salary change.
Nothing in the app tells them how old their numbers are. Each person has to
remember when they last touched each tool and each profile.

A date sounds simple to add, but the current storage code makes an accurate one
unreliable:

*   **The app saves when nobody has edited anything.** `useToolState` writes the
    resolved state to storage as soon as a page loads
    (`src/hooks/useToolState.ts:102`). The SRS calculator's save effects do the
    same. A date set on every write would change on every visit.
*   **Shared links overwrite saved data.** The five `useToolState` tools
    (compound interest, FIRE, mortgage, emergency fund, budget planner) copy
    their plain input fields into the URL on every edit. Their list items are
    not copied. When a URL carries values, `useToolState` ignores storage and
    writes the link's values over the user's own data. The user's date would
    then sit next to numbers they never entered.
*   **There is no single place where a user edit happens.** Writes are spread
    across setters in 12 places: the shared hook, the five profile hooks and
    page-level list setters in six tools. If the date had to be set in each one,
    a missed setter would show a wrong date and raise no error.

Removing the page-load writes and the URL sync, and sending every write through
one save module, would make the date reliable even with autosave (Alternative
1). The author chose explicit Save as a product decision. The date then means
the user confirmed the data, and Discard lets users try out numbers without
keeping them.

The costs are accepted on purpose:

*   **Unsaved edits can be lost.** With autosave, no edit is ever lost. With
    explicit Save, an edit the user does not save is lost when they leave the
    page or when a mobile browser closes a background tab.
*   **Shared links stop working.** Existing bookmarks that carry values in the
    URL no longer load those values. Moving data between devices is possible
    only through export and import.

## Goals

*   **Save is the only way tool data is written, apart from the exceptions
    listed in Technical Plan §7.** On the Save pages, field edits and adding,
    deleting and reordering list items stay as an unsaved draft until the user
    presses Save.
*   **A failed save never shows a new date.** One save module writes all of a
    tool's storage keys. If a write fails, it tries to restore the keys it
    already wrote and always reports the error.
*   **The date changes only when the user saves a change, or confirms data that
    has no date.** Save is disabled when the data is clean and already has a
    date. It is enabled when:
    *   the draft differs from the saved data;
    *   the tool or profile has never been saved;
    *   the saved data has no date yet.

    Returning users can therefore confirm their existing numbers and get a date.
*   **Every tool and profile is in one of three date states:**
    *   **Saved:** "Last saved: 8 Nov 2026", in the viewer's local time zone with
        three-letter month names (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep,
        Oct, Nov, Dec).
    *   **Never saved:** "Not saved yet".
    *   **No date yet:** data is stored but has no date. Nothing is shown until
        the next save. This state comes from three places:
        *   users who only viewed a tool under autosave, because the old
            page-load write stored the defaults;
        *   the CPF SA migration;
        *   older backups.
*   **Dates are shown where the data belongs.** Single-state tools show the date
    on the tool page. Multi-profile tools show it only on each detail page, one
    date per profile. Saving profile A does not change profile B's date.
*   **New profiles are created on first Save.** On a list page, Add opens the
    detail page in `new` mode. The profile is written to storage, and gets its
    first date, only when the user first presses Save there.
*   **Deleting a whole profile is the one exception to "every user action waits
    for Save".** On a list page, Delete writes straight away after the user
    confirms in a dialog.
*   **Users can see and drop unsaved changes.** An "Unsaved changes" bar holds
    Save and Discard. Discard resets the draft to the saved data. This bar is
    the main safeguard.
*   **The app warns before leaving, where the browser allows it.** With unsaved
    changes:
    *   in-app links and app-driven navigation ask "You have unsaved changes to
        [Tool name]. Leave anyway?";
    *   closing or reloading the tab uses the browser's own leave prompt.

    See Risks & Mitigations for the gaps.
*   **Users who already have saved data are told once** that saving is now
    manual.
*   **Dates survive export and import.** Export includes the dates, and import
    restores them. A tool restored from a backup without a date shows "No date
    yet".
*   **Export covers every tool**, including `hysa-tracker:scenarios`, which is
    missing today.
*   **The storage rules have unit tests** for date formatting, the "data changed"
    comparison, saving with rollback, import, and reading records that have no
    date.

## Non-Goals

*   **Draft recovery.** Unsaved work is not kept anywhere: not in
    sessionStorage, not in the URL, not in localStorage.
*   **Shared links.** URL search params are no longer read or written, and there
    is no Share button. Params on old bookmarks are ignored and removed from the
    address bar on load.
*   **Times or relative dates.** The display shows a date only: no time of day
    and no "3 days ago".
*   **Refreshing the date on already-dated data without an edit.**
*   **Staleness warnings or reminders.**
*   **Dates on list pages or tool cards.**
*   **A "last updated" date for the tool's own figures** (CPF rates, caps, bank
    rates) or for code changes.
*   **Conflict handling across tabs.** The last save wins.
*   **Blocking browser back/forward or iOS gestures.**
*   **Telemetry.**
*   **A backend, or sync between devices.**
*   **Changes to `useTheme`.** The theme setting is not tool data and keeps
    saving on change.

## Open Questions

*   None. The brainstorm decisions are in the
    [brainstorm record](./explicit-save-last-saved-dates.brief.md). Drafting
    decisions are in Technical Plan §10.

## Critical User Journeys (CUJs)

### CUJ 1: Edit and save a single-state tool

*   **Given**: The user saved the FIRE calculator on 2 Oct 2026.
*   **When**: They open the page, change the expected return, then press Save.
*   **Then**:
    *   Opening the page wrote nothing.
    *   After the edit, the bar shows "Unsaved changes".
    *   After Save, all three FIRE keys are written, the bar clears, and the page
        shows "Last saved: 8 Nov 2026".

### CUJ 2: Edit, then revert without saving

*   **Given**: A saved compound-interest tool.
*   **When**: The user changes the rate from 5 to 6, then back to 5.
*   **Then**: The bar clears, Save is disabled, and the date does not change.

### CUJ 3: Create a new profile

*   **Given**: The CPF SA list page with one profile, "Mine".
*   **When**: The user presses Add.
*   **Then**:
    *   The app opens `/tools/cpf-sa-calculator/new`, which shows "Not saved
        yet". Nothing is written yet.
    *   When the user presses Save, the profile is written with today's date
        and the URL changes to the new profile's id.
    *   Going back shows two profiles. "Mine" keeps its own date.

### CUJ 4: Leave with unsaved changes

*   **Given**: The mortgage calculator with unsaved changes.
*   **When**: The user taps the site wordmark or a back link.
*   **Then**: The app asks "You have unsaved changes to Mortgage Calculator.
    Leave anyway?". Cancel keeps the draft. OK leaves, and the draft is lost.

### CUJ 5: Save fails

*   **Given**: localStorage is full.
*   **When**: The user presses Save on the budget planner.
*   **Then**: Any key already written is put back. The bar shows "Couldn't save".
    The draft stays and the date does not change.

### CUJ 6: Existing user after release

*   **Given**: A user with HYSA data saved by the autosave build, with no date.
*   **When**: They open a HYSA scenario after release.
*   **Then**:
    *   A one-time notice explains that saving is now manual.
    *   No date is shown, the page has no unsaved changes, and Save is enabled.
    *   Pressing Save, with or without an edit, shows today's date.

### CUJ 7: Export and import

*   **Given**: Saved data in several tools, with dates.
*   **When**: The user exports, clears browser data, and imports the file.
*   **Then**:
    *   All tools, including HYSA, return with the same dates.
    *   An older backup without dates restores the data and shows no dates.
    *   A failed import changes nothing.

### CUJ 8: Delete a profile

*   **Given**: The CPF SA list with profiles A and B.
*   **When**: The user taps Delete on A and confirms.
*   **Then**: A is removed from storage straight away, and B's date is
    unchanged. Cancelling the dialog changes nothing.

### CUJ 9: Discard

*   **Given**: A saved budget planner.
*   **When**: The user edits two items, then taps Discard.
*   **Then**: The values return to the saved ones. The bar clears and the date is
    unchanged.

### CUJ 10: First save on defaults

*   **Given**: A fresh browser.
*   **When**: The user opens compound interest and taps Save without editing.
*   **Then**: The defaults are written and the page shows "Last saved: <today>".

## Technical Plan (Architecture)

### Summary

Tool pages stop reading and writing localStorage directly. The design has
three parts:

*   **An adapter per tool.** It knows the tool's storage keys and how to turn
    stored data into one combined record and back.
*   **A shared draft hook.** It loads that record once, keeps an unsaved copy
    (the draft) next to the loaded copy (the snapshot), and exposes Save and
    Discard.
*   **A single save module.** It is the only code that writes tool data.

```text
                    page load (reads only)
 localStorage ─────────────────────────────► adapter.read()
     ▲                                            │ normalised record
     │                                            ▼
     │                               ┌─────────────────────────┐
     │                               │ useToolDraft /          │◄── field edits,
     │                               │ useProfileDraft         │    list item add,
     │                               │ snapshot | draft        │    delete, reorder
     │                               │ isDirty, canSave        │
     │                               └──────┬─────────────┬────┘
     │                        reports       │             │ Save pressed
     │                        isDirty       ▼             ▼
     │                         ┌───────────────┐   adapter.toEntries(draft, now)
     │                         │ unsaved store │          │
     │                         └───────┬───────┘          ▼
     │                         read by │           ┌──────────────┐
     │          GuardedLink, useGuardedRouter,     │ save module  │
     │          beforeunload, SaveBar              │ saveEntries  │
     │                                             └──────┬───────┘
     └────────────────────────────────────────────────────┘
          writes: save module only (plus the §7 exceptions)
```

### 1. Adapters

An adapter is a plain object with no React code, so it can be tested in Node.

*   **Single-state adapter** (`ToolAdapter<T>`), one per single-state tool.
    *   `slug` and `name` come from `src/lib/tools.ts` through
        `src/lib/persistence/toolMeta.ts`.
    *   `keys` lists every storage key the tool owns.
    *   `dateKey` names the key whose stored object carries `savedAt`.
    *   `read(storage)` returns the normalised record, the date and whether any
        key exists.
    *   `toEntries(record, savedAt)` returns the `{ key, value }` pairs to write.
*   **Profile adapter** (`ProfileAdapter<P>`), one per multi-profile tool.
    *   `slug`, `name` and `listPath` (`/tools/<slug>`).
    *   `key`: the array key.
    *   `readAll(storage)`: the normalised profile array.
    *   `newProfile()`: a fresh profile with today's id format and default name.
    *   Each record carries an optional `savedAt`.
*   **Registry.** `src/lib/persistence/registry.ts` lists every adapter. Export
    and import use it, so a tool with a registered adapter is always exported.
    Adapters never import `registry.ts`, so there is no import cycle.

**Stored shape.** Stored values keep today's shapes, so the old build can still
read them:

*   `tool:<slug>` stays a flat object, `{ ...inputs, savedAt }`. The adapter
    maps it to and from `{ inputs }` in code.
*   List keys stay plain arrays.
*   `srs:withdrawal` is `{ ...withdrawal, savedAt }`.
*   Profile records are `{ ...profile, savedAt }`.
*   Only `dividend:projection-years` changes shape (see the table below).

**Where each tool's date lives**

| Tool | Date location |
| --- | --- |
| Compound interest, FIRE, mortgage, emergency fund, budget planner | `savedAt` inside `tool:<slug>` |
| SRS | `savedAt` inside the `srs:withdrawal` object |
| Dividend | `dividend:projection-years` changes from a plain number to `{ "years": 20, "savedAt": "…" }`. The reader still accepts the old number or numeric string. |
| CPF SA, CPF MA, CPF OA, HYSA, savings goal | `savedAt` on each profile or scenario record |

`savedAt` is an ISO instant. It is formatted in local time only when shown.

### 2. Save module

`saveEntries(storage, entries)` guarantees four things:

*   it writes the entries in the order given. Callers put the date-carrying
    entry last; `saveTool` does this for tools;
*   if a write fails, it tries to restore every key it already wrote;
*   it always reports the error;
*   it never swallows an error.

A failed save therefore never shows a new date.

### 3. Draft hooks

*   **`useToolDraft(adapter)`**, for single-state tools.
    *   **It returns:** `status`, `draft`, `setDraft`, `isDirty`, `canSave`,
        `save`, `discard`, `savedAt`, `dateState` and `saveError`.
    *   **`isDirty`** means the draft differs from the snapshot. The comparison
        ignores `savedAt`.
    *   **`canSave`** is true when the hook is ready and either the draft is
        dirty or `dateState` is not `"saved"`.
    *   **`save()`** always uses the latest draft.
    *   **URL params** on first load are removed and their values ignored.
*   **`useProfileDraft(adapter, id)`**, for detail pages.
    *   **The id.** `id` is a profile id or the reserved id `"new"`. No id
        generator produces `new`.
    *   **The draft.** `draft` is `null` while loading or when the id is not
        found.
    *   **`dateState`.** It is `"never"` in `new` mode, `"saved"` when `savedAt`
        is set, and `"legacy"` (shown as "No date yet") otherwise.
    *   **`save()`.** It reads the array fresh from storage and replaces this
        profile by id, or upserts it in `new` mode. It then sets `savedAt` and
        writes through the save module. If an existing profile was deleted in
        another tab, it returns an error and does not re-create the profile.
    *   **Routing.** The hook does no routing. The page handles it (see §4).
*   **`useProfileList(adapter)`**, for list pages. It is read-only, apart from
    `remove(id)`. After the user confirms, `remove` deletes the profile by id
    from a fresh read, straight away. List pages have no draft and no Save bar.
    Renaming happens only on the detail page.

The snapshot is captured once at load. Defaults that change over time therefore
never make a page dirty: `genId()`, `todayISO()` in SRS, and the current year
in CPF.

### 4. Unsaved store and leave guards

This section is the only definition of the guard API.

*   **Unsaved store** (`src/lib/unsavedStore.ts`). A module-level store.
    `setUnsaved(ownerId, toolName | null)` registers or clears a page.
    `confirmLeave()` returns true when nothing is dirty. Otherwise it returns the
    result of `globalThis.confirm`. The guards read it synchronously, so no
    React Context provider is needed and the root layout stays a server
    component.
*   **`GuardedLink`** is the only file that imports `next/link`. Its
    `onNavigate` works as follows:
    *   if `confirmLeave()` returns false, it calls `e.preventDefault()` and
        stops;
    *   otherwise it calls the caller's `onNavigate`.
*   **`useGuardedRouter()`** is the only file that imports `useRouter`. It is
    called at the top level of a component. It returns stable functions,
    `{ push, replaceWithoutPrompt }`. Only `push` asks first.
*   **Redirects belong to the detail page.** It calls `replaceWithoutPrompt` in
    two places:
    *   inside an effect, when the id is not found;
    *   in its Save handler, after the first successful save in `new` mode.

    The draft is clean at that point, so Back returns to the list.
*   **`beforeunload`** is attached only while the page is dirty, so the
    browser's back-forward cache still works on clean pages.
*   **Lint.** ESLint bans `next/link` and the `useRouter` import everywhere
    except the two wrapper files. A second rule bans calling `setItem` or
    `removeItem` outside the §7 allowlist.

### 5. UI components

*   **`LastSaved`** owns the date line: "Last saved: 8 Nov 2026", "Not saved
    yet", or nothing.
*   **`SaveBar`** shows the action state. The first matching row wins:

    | Condition | Bar text | Save | Discard |
    | --- | --- | --- | --- |
    | loading | bar hidden | hidden | hidden |
    | save error | "Couldn't save" | enabled (retry) | shown |
    | unsaved changes | "Unsaved changes" | enabled | shown |
    | clean, `dateState` is not `"saved"` | no text | enabled | hidden |
    | clean and saved | no text | disabled | hidden |

    *   The error clears after a successful save and after Discard.
    *   The bar renders a spacer of its own height, so it never covers page
        content.
    *   **Styling:** the floating-glass treatment used by `SiteHeader`
        (`--header-glass`), with Save as the gradient primary button and
        Discard as `surface-container-highest`. Errors use the tertiary colour,
        and there are no 1px borders (`docs/design.md`). shadcn/ui is not
        installed, so the components use Tailwind only.
*   **`ManualSaveNotice`** is a separate component, rendered by each Save page
    above its content. It decides once per browser. On its first client read, if
    the dismissed flag is absent and no registered storage key exists, this is
    a new user: it writes the flag straight away and shows nothing. Otherwise,
    while the flag is absent, it shows the notice. Its text: "Changes are no longer
    saved automatically. Press Save to keep them. Unsaved changes can be lost,
    especially on mobile."
*   **Wording changes:**
    *   List-page delete keeps "This cannot be undone", because it still writes
        immediately.
    *   HYSA's remove-month confirm drops that sentence, because the removal is
        now a draft change.

### 6. Export and import

*   **Export** writes every key in the registry. That adds
    `hysa-tracker:scenarios` and drops `tool:srs-calculator`, which nothing
    writes. `FORMAT_VERSION` stays 1. Export reads saved data only.
*   **Import** goes through the adapters and the save module, as one save.
    1.  For each tool with keys in the file, the adapter reads a view: the
        file's values where the file has them, and stored values elsewhere.
        Imported data is therefore normalised like any other load.
    2.  The date comes only from the file. If the file lacks a tool's
        date-carrying key, that tool gets no date.
    3.  All tools are written in one `saveEntries` call, so a failure changes
        nothing.
    4.  Keys that no adapter owns are skipped.

### 7. Exceptions to "Save is the only write"

This is the only list. Goals, the diagram and the lint allowlist all refer to
it.

| Write | Why it stays |
| --- | --- |
| List-page profile delete, after the confirm dialog | The confirm dialog counts as the explicit save action. |
| CPF SA one-time migration from `tool:cpf-sa-calculator` | Without it, each page would create a different `p_${Date.now()}` id and detail URLs would break. It writes through `saveEntries`, sets no date, and only runs while `cpf-sa:profiles` is absent. |
| `useTheme` | The theme setting is not tool data. |
| `meta:manual-save-notice-dismissed` | App state, not tool data. It is not exported. |

The savings-goal loader currently gives records with no id a new
`sg_${Date.now()}_${i}` id on every load. It changes to a stable
`sg_legacy_${i}`, which needs no write.

### 8. Tests (vitest)

*   **Setup.** vitest runs in its `node` environment with an in-memory
    `Storage` fake. No DOM library is added.
*   **What the tests cover:**
    *   the pure modules;
    *   every adapter;
    *   import;
    *   the unsaved store.
*   **What the tests do not cover.** The zero-write tests cover `read` and
    `readAll` only. What a page writes when it loads, the leave guards and the
    Save bar are checked by hand (Verification Plan).

### 9. Rollout

| Stage | Scope | Ships |
| --- | --- | --- |
| 1 | HYSA export fix | On its own, straight away |
| 2 | vitest and the pure core | Any time; no user-visible change |
| 3 | CPF SA as the first full slice: its adapter, the profile hooks, guards, UI components, registry, and the shared link swaps | Held for stages 3-6 |
| 4 | The other four multi-profile tools | Held for stages 3-6 |
| 5 | The seven single-state tools; `useToolState` removed | Held for stages 3-6 |
| 6 | Export and import through the registry; both lint rules switched on | Stages 3-6 release together |
| 7 | Docs and manual QA | Before the stage 3-6 release |

Stages 3-6 are built in order and released together, so users never see a mix
of autosave and Save tools. Each later stage adds its own tools' adapters, so
interface changes found in stage 3 touch only one adapter.

### 10. Decisions made during drafting

*   **Draft model:** a shared draft hook with per-tool adapters (author).
*   **Single-state date storage:** inside each tool's own data (author).
*   **SRS and dividend:** the date goes into an existing key. Dividend changes
    to an object, and a reset to 20 years on rollback is accepted (author).
*   **List-page rename:** removed. Renaming happens only on the detail page and
    is saved with Save (author).
*   **Import:** goes through the adapters and the save module (author).
*   **Shipping:** stages 3-6 are released together (author).
*   **Legacy data:** can be saved without an edit, which sets its first date
    (author).
*   **New profile route:** the reserved id `new` on the existing dynamic route.
    There is no separate route file.
*   **Profiles have no `null` date state.** A profile exists in storage only
    after its first Save (author).
*   **One field name everywhere:** `savedAt`.
*   **Implementation notes (stages 3-6).** The five former `useToolState`
    tools share one factory, `createInputsAdapter` in
    `src/lib/persistence/inputsAdapter.ts`, with their adapters in one file,
    `adapters/singleStateTools.ts`. SRS and dividend have their own files. The
    registry exports `REGISTERED_KEYS` (the plan's `EXPORT_KEYS`), which export,
    import and the release notice all use. HYSA and savings-goal edits live as
    pure helpers in their adapter files.
*   **Two draft hooks, not one.** They differ in loading, not-found handling,
    `new` mode and merge-on-save, and they share the pure core.

## Alternatives Considered

The [brainstorm record](./explicit-save-last-saved-dates.brief.md) has the full
discussion. "Author preference" marks choices where the trade-off was weighed
and the author chose.

### Alternative 1: Autosave, with page-load writes removed and one save module

*   **Pros**: No edit is ever lost, including on mobile. There are no leave
    guards, no Save bar and no notice.
*   **Cons**: There is no Discard, so trying out numbers overwrites saved data.
    Half-typed values are saved. The date means "last keystroke", not "the user
    confirmed this".
*   **Reason for Rejection**: Author preference. The author wanted a confirmed
    save moment and a Discard sandbox, and accepted giving up zero data loss on
    mobile.

### Alternative 2: Explicit Save only for record-keeping tools

*   **Pros**: Compound interest, FIRE and mortgage are mostly used to try out
    numbers. Keeping them on autosave avoids friction where a date means
    little.
*   **Cons**: Two saving models in one app, which users would have to learn
    tool by tool. Those three tools would get no date.
*   **Reason for Rejection**: Author preference for one model across all 12
    tools.

### Alternative 3: Other places for the draft to live

*   **Options**: (a) add draft logic by hand to each of the 12 places that set
    state today; (b) a module-level store per tool.
*   **Cons**: (a) gives 12 copies of the comparison and Save logic that can
    drift, which is the "missed setter" risk again. (b) keeps state outside
    React, so an old draft comes back unless it is cleared on unmount.
*   **Reason for Rejection**: Rejected by author in favour of one shared hook
    with per-tool adapters. Only the small "is anything dirty" flag lives in a
    module store.

### Alternative 4: One draft per tool, shared by the list and detail pages

*   **Pros**: Moving between a tool's pages would not count as leaving. A new
    profile could exist as a draft on both pages.
*   **Cons**: Needs a provider in a new `tools/<tool>/layout.tsx`. Each Save
    button would cover several profiles, so the UI would have to explain what
    is pending.
*   **Reason for Rejection**: Author preference for drafts per page, with `new`
    mode for Add and an immediate, confirmed delete.

### Alternative 5: One date key per tool (`meta:last-saved:<slug>`)

*   **Pros**: Existing data shapes don't change. Tools never overwrite each
    other's dates.
*   **Cons**: Seven extra keys to export and keep in step with their data. The
    data and its date are written as separate entries.
*   **Reason for Rejection**: Author preference for the date inside the tool's
    own data. The date then travels with the data in every export and import.

### Alternative 6: Other date locations for SRS and dividend

*   **Options**: (a) a `tool:<slug>` key holding only `savedAt`; (b) moving
    their settings into a new main record.
*   **Cons**: (a) puts the date in a separate key after all. (b) needs a data
    migration, and export and import would have to accept both layouts.
*   **Reason for Rejection**: Author preference for folding the date into an
    existing key. A reset of dividend projection years to 20 on rollback is
    accepted.

### Alternative 7: Keep shared links in some form

*   **Options**:
    *   (a) the link loads as an unsaved draft;
    *   (b) read the link once, strip it, and add a Share button;
    *   (c) tag URLs the app wrote itself in `history.state`.
*   **Cons**:
    *   (a) brings back half the draft on reload, because only plain inputs
        travel in the URL. Old bookmarks open as unsaved drafts over newer data.
    *   (b) needs a Share button, a banner, and rules for mixing someone else's
        inputs with the user's own lists.
    *   (c) depends on how Next handles extra `history.state` keys, which is not
        documented.
*   **Reason for Rejection**: Author preference. Removing URL sync removes the
    overwrite and the half-restored reload. Export and import cover moving data
    between devices.

### Alternative 8: Other leave-warning approaches

*   **Options**: (a) an async styled dialog instead of `window.confirm`; (b) a
    dummy history entry to catch Back.
*   **Cons**:
    *   (a) needs a new dialog library, because shadcn/ui and Radix are not
        installed. `onNavigate` also needs an answer straight away, so the
        dialog would have to cancel the navigation and push again afterwards.
    *   (b) adds history entries alongside the ones Next manages, so Back can
        land on the wrong page.
*   **Reason for Rejection**: Rejected during brainstorming for those
    mechanisms. `window.confirm` matches the existing delete confirms.

### Smaller decisions

| Option | Why not |
| --- | --- |
| Autosave with the date set in each setter | Setters in 12 places, and a missed one shows a wrong date with no error (author). |
| sessionStorage draft buffer | Brings back partial draft recovery, which the author ruled out. |
| Save the list before opening a new profile | Adds a Save step before the user can enter anything (author chose `new` mode). |
| List-page delete waits for a list Save | Needs a Save bar and guard on list pages (author: the confirm dialog counts as saving). |
| List-page rename saves immediately | A second exception to "every action waits for Save" (author removed list rename). |
| List pages get their own Save for renames | A second Save surface per tool (author removed list rename). |
| One global "last touched" date | Can't show that one profile is out of date while another is current (author). |
| One shared map key for single-state dates | Each Save rewrites the whole map, so two tabs can wipe each other's dates (author). |
| A date per storage key, showing the latest | Several dates per tool to merge for one display, and more keys to keep in step. |
| "Last updated" / "Not edited yet" labels | With explicit Save, "saved" describes what happened. "Last updated" could be read as "the app updated its rates" (author). |
| A manual checklist instead of tests | Nothing would catch a regression in the date, comparison or rollback logic (author chose vitest). |
| DOM component tests (jsdom or happy-dom with Testing Library) | Two or three more dev dependencies and their setup. The pure logic is covered in `node`, and guards are checked by hand. |

## Non-Functional Requirements

*   **Security & Privacy**: No change. Data stays in localStorage and nothing
    new is sent anywhere, so the "invisible to us" copy in `SiteHeader.tsx`
    stays true.
*   **Performance**: The dirty check compares two key-ordered JSON strings, and
    is memoised so it runs once per edit. Tool records are small: the largest,
    a HYSA scenario, is a few kilobytes.
*   **Mobile**: The Save bar may be covered while the on-screen keyboard is
    open. It must be visible whenever the keyboard is closed, including the
    iPhone safe-area padding.
*   **Accessibility**:
    *   Save bar state changes are announced in a polite live region, and save
        errors in an assertive one.
    *   The disabled Save button keeps an accessible name.
    *   Save and Discard are reachable by keyboard.
*   **Compatibility**: Data written by the new build must load in the old build.

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Browser back, iOS swipe-back and iOS Safari tab close are not guarded; Next can block only `<Link>` clicks | Unsaved edits lost without a prompt | Accepted. The "Unsaved changes" bar is the main safeguard. |
| A mobile browser closes a background tab | Unsaved edits lost | Accepted. Stated in the one-time notice. |
| The same tool is open in two tabs | Last save wins | Accepted. Profile saves merge by id, so other profiles survive. |
| Storage is full, or the rollback itself fails | Save fails, and storage may be partly written | The error is always shown and the date is written last, so no false date appears. Remaining risk accepted. |
| The keyboard covers the Save bar | Bar hidden while typing | Accepted. The bar is visible once the keyboard closes. |
| A tab on the old build stays open during the deploy | Its autosave can overwrite profiles created in the new build | Accepted. |
| Rolling back to the autosave build | All tool data is kept. CPF OA, savings goal and the five `useToolState` tools drop `savedAt`. CPF SA, CPF MA, HYSA and SRS keep it while autosaving newer edits, so after a roll-forward they can show a stale date. Dividend projection years reset to 20. | Accepted. |
| `cacheComponents` is turned on later | Hidden pages keep their drafts alive, which breaks "leaving discards the draft" | Revisit this design before enabling it. |
| localStorage grows (HYSA adds rows each month) | Eventually hits the storage limit | Accepted. Save reports the failure. |

## Future Improvements

*   **Dates on list pages and tool cards**, if users ask which profile is out
    of date without opening it.
*   **A conflict check across tabs** ("Data changed in another tab.
    Overwrite?"), if lost cross-tab edits are reported.
*   **Live refresh of list pages when another tab saves.**
*   **Component tests with a DOM library**, if a leave-guard regression reaches
    production.
*   **Remove `ManualSaveNotice` and its flag** three months after release.

--------------------------------------------------------------------------------

## Detailed Implementation Plan

Files are grouped by rollout stage (Technical Plan §9). Each stage leaves the
app building and linting. From stage 2 onwards, tests also pass.

### Target Files to Create/Modify

#### Stage 1: HYSA export fix

##### 1. `src/components/DataPortability.tsx` (Modify)

*   **Type / Scope**: Client component.
*   **Proposed Changes**:
    *   Add `"hysa-tracker:scenarios"` to `STORAGE_KEYS`.
    *   This is its own `fix:` commit, so HYSA users can back up before the
        larger change.

#### Stage 2: Test setup and the pure core

##### 2. `package.json` and `package-lock.json` (Modify)

*   **Type / Scope**: Build configuration.
*   **Proposed Changes**:
    *   Install vitest with `npm install --save-dev --save-exact vitest`. Record
        the installed version in the commit message.
    *   Add `"test": "vitest run"`.

##### 3. `vitest.config.mts` (Create)

*   **Type / Scope**: Test configuration.
*   **Proposed Changes**:
    *   Set `process.env.TZ = "Asia/Singapore"` at the top of the file, so the
        local-date tests behave the same on every OS.
    *   Configure `test.environment: "node"` and
        `test.include: ["src/**/*.test.ts"]`.
    *   Leave `globals` off. Tests import `describe`, `it` and `expect` from
        `vitest`. This is needed because `next build` type-checks test files
        through `tsconfig.json`'s `**/*.ts`.
    *   The `.mts` extension is used because the package is CommonJS; a
        `.ts` config triggers Vite's "ESM syntax in a file loaded as CommonJS"
        warning.
    *   Map `@` to `fileURLToPath(new URL("./src", import.meta.url))`.

##### 4. `src/lib/formatSavedDate.ts` and `src/lib/formatSavedDate.test.ts` (Create)

*   **Type / Scope**: Pure utility and its test.
*   **Proposed Changes**:
    *   `export function formatSavedDate(iso: string): string | null`:

        ```text
        const d = new Date(iso)
        if isNaN(d.getTime()) return null
        return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
        ```

        `MONTHS` is a constant array of three-letter names. The function does
        not use `Intl`.
    *   Tests:
        *   `2026-11-08T04:00:00Z` → "8 Nov 2026";
        *   `2026-09-30T16:30:00Z` → "1 Oct 2026", because Singapore is UTC+8;
        *   every month's name, including "Sep";
        *   an invalid string → `null`.

##### 5. `src/lib/persistence/types.ts` (Create)

*   **Type / Scope**: Shared types, used by three or more files.
*   **Proposed Changes**: All interface members use method syntax, so adapters
    of different types fit in one `readonly` array.
    *   `StorageLike`: `getItem`, `setItem` and `removeItem`.
    *   `StorageEntry = { key: string; value: string }`.
    *   `SaveResult = { ok: true } | { ok: false; error: Error }`.
    *   `DateState = "saved" | "never" | "legacy"`.
    *   `ToolAdapter<T>`:

        ```text
        slug: string; name: string; keys: readonly string[]; dateKey: string;
        defaults(): T;
        read(s: StorageLike): { record: T; savedAt: string | null; exists: boolean };
        toEntries(record: T, savedAt: string | null): StorageEntry[];
        ```

    *   `ProfileAdapter<P extends { id: string; name: string; savedAt?: string }>`:

        ```text
        slug: string; name: string; listPath: string; key: string;
        readAll(s: StorageLike): P[];
        newProfile(): P;
        ```

##### 6. `src/lib/persistence/equality.ts` and `equality.test.ts` (Create)

*   **Type / Scope**: Pure utility and its test.
*   **Proposed Changes**:
    *   `stableStringify(value, omitKeys)` produces JSON with object keys sorted
        and the listed keys left out at every depth. Array order is kept.
    *   `sameData(a, b)` compares the two values with `savedAt` omitted.
    *   Tests:
        *   key order is ignored;
        *   a top-level `savedAt` is ignored;
        *   a nested `savedAt` is ignored;
        *   array order counts.

##### 7. `src/lib/persistence/save.ts` and `save.test.ts` (Create)

*   **Type / Scope**: Pure module. It is the only writer of tool data.
*   **Proposed Changes**:
    *   `saveEntries(storage: StorageLike, entries: StorageEntry[]): SaveResult`
        runs these steps:
        1.  Check every entry: the key must be a non-empty string and the value
            a string. Otherwise return `ok: false` before writing anything.
        2.  Record each key's current raw value, or note that it is absent.
        3.  Write the entries in order.
        4.  If a write throws, restore the keys already written and remove the
            ones that were absent before. Return `ok: false` with the original
            error, even if the restore also throws.
    *   Tests:
        *   all entries are written in order;
        *   a throw on the second write puts the first key back, leaves an
            absent key absent, and returns `ok: false`;
        *   a malformed entry is rejected with zero writes;
        *   a restore that also throws still returns the original error.

##### 8. `src/lib/persistence/tool.ts` and `tool.test.ts` (Create)

*   **Type / Scope**: Pure module and its test.
*   **Proposed Changes**:
    *   `saveTool(storage, adapter, record, now)`:
        1.  Call `adapter.toEntries(record, now)` inside try/catch. A throw
            becomes `ok: false`.
        2.  Move the `dateKey` entry to the end.
        3.  Call `saveEntries`.
    *   `dateStateOf(read)`:
        *   `"never"` when `exists` is false;
        *   `"saved"` when `savedAt` is set;
        *   `"legacy"` otherwise.
    *   Tests:
        *   the three states;
        *   `dateKey` is written last, even when `toEntries` returns it first;
        *   storage is unchanged after a failed write;
        *   a throw in `toEntries` returns `ok: false`;
        *   a legacy record can be saved and then reads as `"saved"`.

##### 9. `src/lib/persistence/profiles.ts` and `profiles.test.ts` (Create)

*   **Type / Scope**: Pure module and its test.
*   **Proposed Changes**:
    *   `saveProfile(storage, adapter, profile, now, mode: "new" | "existing"): SaveResult`:
        1.  Read `adapter.readAll(storage)` fresh.
        2.  In `"existing"` mode, if the id is missing, return
            `{ ok: false, error: new Error("This profile was deleted in another tab") }`.
            If it is present, replace the record at the same index.
        3.  In `"new"` mode, append the record, or replace it if the id is
            already present.
        4.  Set `savedAt: now`. Wrap `JSON.stringify` in try/catch, then call
            `saveEntries` with
            `[{ key: adapter.key, value: JSON.stringify(profiles) }]`.
    *   `deleteProfile(storage, adapter, id): SaveResult` removes the id from a
        fresh read and saves. If the id is missing, it returns `{ ok: true }`
        with no write.
    *   Tests:
        *   saving A leaves B's `savedAt` unchanged;
        *   a profile C added by another writer survives;
        *   saving a missing profile in `"existing"` mode returns the error and
            writes nothing;
        *   saving twice in `"new"` mode stores one record;
        *   deleting removes only that id;
        *   deleting a missing id writes nothing.

##### 10. `src/lib/persistence/testing/memoryStorage.ts` (Create)

*   **Type / Scope**: Test helper. App code never imports it.
*   **Proposed Changes**: `createMemoryStorage(initial?, options?)` returns a
    `StorageLike` backed by a `Map`, plus:
    *   `writes`, which counts `setItem` and `removeItem` calls;
    *   `dump()`, which returns the current contents.

    `options.failOnSet(call, key)` is a predicate. Returning true makes that
    `setItem` call throw. `call` is 1-based and counts every `setItem` call.

#### Stage 3: CPF SA as the first full slice

##### 11. `src/lib/persistence/adapters/cpf-sa.ts` (Create)

*   **Type / Scope**: Profile adapter.
*   **Proposed Changes**:
    *   **Types and defaults.** Move in `CpfParams`, `CpfProfile` and
        `CPF_DEFAULT_PARAMS` from `useCpfProfiles.ts`. `CpfProfile` gains
        `savedAt?: string`.
    *   **`readAll`.** Keep `startMonth ?? 1`, and spread the rest of the
        record so `savedAt` survives.
    *   **Migration.** If `cpf-sa:profiles` is absent and
        `tool:cpf-sa-calculator` exists, build the migrated profile with no
        `savedAt` and write it with `saveEntries`, ignoring the result. Running
        it again does no harm, because it only runs while the array is absent.
    *   **`newProfile()`.** Returns
        ``{ id: `p_${Date.now()}`, name: "New Scenario", ...CPF_DEFAULT_PARAMS }``.
    *   **`slug` and `name`.** Read from `toolMeta("cpf-sa-calculator")`
        (item 12). The adapter does not import `registry.ts`.
    *   **Test file:** `src/lib/persistence/adapters/cpf-sa.test.ts` (Create).
        It covers the profile-adapter cases and the CPF SA migration case from
        the Verification Plan.

##### 12. `src/lib/persistence/toolMeta.ts` and `src/lib/persistence/registry.ts` (Create)

*   **Type / Scope**: Pure modules.
*   **Proposed Changes**:
    *   **`toolMeta.ts`** exports `toolMeta(slug)`, which returns
        `{ slug, name }` from `src/lib/tools.ts` and throws if the slug is not
        found. It imports no adapter.
    *   **`registry.ts`** imports the adapters and exports two lists:
        *   `TOOL_ADAPTERS: readonly ToolAdapter<unknown>[]`;
        *   `PROFILE_ADAPTERS: readonly ProfileAdapter<{ id: string; name: string; savedAt?: string }>[]`.

        Each stage adds its own adapters; this stage adds only CPF SA. Stages
        4 and 5 modify this file.
    *   **`REGISTERED_KEYS`** is the de-duplicated union of the tool adapters'
        `keys` and the profile adapters' `key`.
    *   **Rule:** adapters import `toolMeta.ts`, never `registry.ts`.

##### 13. `src/lib/unsavedStore.ts` and `unsavedStore.test.ts` (Create)

*   **Type / Scope**: Module-level store and its test.
*   **Proposed Changes**:
    *   **API:**
        *   `setUnsaved(ownerId: string, toolName: string | null)`;
        *   `getUnsaved()`, which returns the first dirty tool name in
            insertion order, or `null`;
        *   `confirmLeave()`, which returns true when clean and otherwise
            returns ``globalThis.confirm(`You have unsaved changes to ${name}. Leave anyway?`)``.
            It uses `globalThis`, like the existing bare `confirm(...)` calls,
            so the test can run in Node.
    *   **Tests** (with `vi.stubGlobal("confirm", fn)`):
        *   registering an owner and clearing it;
        *   `confirmLeave()` returns true when clean;
        *   when dirty, it returns what `confirm` returns.

##### 14. `src/hooks/useUnsavedGuard.ts` (Create)

*   **Type / Scope**: Client hook.
*   **Proposed Changes**: `useUnsavedGuard(toolName, isDirty)`:
    *   Gets an owner id from `useId()`.
    *   In an effect, calls `setUnsaved(id, isDirty ? toolName : null)`, and
        `setUnsaved(id, null)` in the cleanup.
    *   While `isDirty` is true, adds a `beforeunload` listener that calls
        `e.preventDefault()` and sets `e.returnValue = ""`. The listener is
        removed in the cleanup.

##### 15. `src/hooks/useGuardedRouter.ts` (Create)

*   **Type / Scope**: Client hook.
*   **Proposed Changes**: It is the only importer of `useRouter`. It returns
    `{ push, replaceWithoutPrompt }`, both wrapped in `useCallback` so they are
    stable.
    *   `push(href)` calls `confirmLeave()` first.
    *   `replaceWithoutPrompt(href)` calls `router.replace` directly.

##### 16. `src/components/GuardedLink.tsx` (Create)

*   **Type / Scope**: Client component (`"use client"`).
*   **Proposed Changes**: `GuardedLink(props: ComponentProps<typeof Link>)`
    renders `next/link` with this `onNavigate`:
    *   if `!confirmLeave()`, call `e.preventDefault()` and return;
    *   otherwise call `props.onNavigate?.(e)`.

    It is the only importer of `next/link`.

##### 17. `src/hooks/useProfileDraft.ts` (Create)

*   **Type / Scope**: Client hook.
*   **Proposed Changes**: `useProfileDraft<P>(adapter, id: string)`. The id
    `"new"` is reserved.
    *   **Return value:**

        ```text
        { status: "loading" | "ready"; draft: P | null;
          setDraft(updater: (d: P) => P): void; isDirty: boolean; canSave: boolean;
          save(): SaveResult; discard(): void; savedAt: string | null;
          dateState: DateState; saveError: Error | null; notFound: boolean }
        ```

    *   **State.** One `useState` holds
        `{ snapshot: P | null; draft: P | null; savedAt: string | null; found: boolean }`.
        Its lazy initialiser works as follows:
        *   **On the server** (`typeof window === "undefined"`), it returns
            `{ snapshot: null, draft: null, savedAt: null, found: false }`.
        *   **On the client, for an id,** it reads
            `adapter.readAll(localStorage)` and picks the profile. Both
            `snapshot` and `draft` are that profile, `savedAt` is
            `profile.savedAt ?? null`, and `found` is whether the profile
            exists.
        *   **On the client, for `"new"`,** both `snapshot` and `draft` are one
            `adapter.newProfile()`, `savedAt` is `null`, and `found` is true.

        `status` is `useIsClient() ? "ready" : "loading"`. `useIsClient` is
        the existing hook in `src/hooks/useIsClient.ts`, which returns true
        after hydration. While loading, the page renders only its placeholder,
        so the server and client renders match.
    *   **Latest draft.** `latestDraft = useRef(state.draft)`, seeded from the
        initial state, so Save works before any edit. Every draft change goes
        through one internal `commit(nextDraft)` helper, which sets both the
        ref and `state.draft`:
        *   `setDraft(updater)` does nothing while `latestDraft.current` is
            `null`. Otherwise it calls
            `commit(updater(latestDraft.current))`.
        *   `discard()` calls `commit(state.snapshot)` and clears `saveError`.
        *   A successful `save()` sets `snapshot` and `draft` to the saved
            profile (with its new `savedAt`), and updates the ref.

        The render path never reads or writes `.current`.
    *   **Derived values:**
        *   `isDirty = useMemo(() => status === "ready" && !sameData(draft, snapshot), [status, draft, snapshot])`;
        *   `dateState` is `"saved"` if `savedAt` is set, otherwise `"never"`
            when the id is `"new"`, otherwise `"legacy"`;
        *   `canSave = status === "ready" && draft !== null && (isDirty || dateState !== "saved")`;
        *   `notFound` is true when `status === "ready"`, the id is not
            `"new"` and `found` is false.
    *   **`save()`:**
        1.  Let `now = new Date().toISOString()`.
        2.  Call `saveProfile(localStorage, adapter, latestDraft.current, now, id === "new" ? "new" : "existing")`.
        3.  On success, set `savedAt = now`, update the snapshot as above, and
            clear `saveError`.
        4.  On failure, set `saveError`.
        5.  Return the result.

        `save()` is synchronous. After a success the page is clean and dated,
        so `canSave` turns false and a second tap does nothing. The `"new"`
        upsert also stores a double write once.
    *   **Guard.** Calls `useUnsavedGuard(adapter.name, isDirty)`.

##### 18. `src/hooks/useProfileList.ts` (Create)

*   **Type / Scope**: Client hook.
*   **Proposed Changes**: `useProfileList<P>(adapter)` returns
    `{ status, profiles, remove(id): SaveResult }`.
    *   Its lazy initialiser returns `[]` on the server and
        `adapter.readAll(localStorage)` on the client. `status` comes from
        `useIsClient()`, as in item 17.
    *   `remove` calls `deleteProfile`, then re-reads.

##### 19. `src/components/LastSaved.tsx` (Create)

*   **Type / Scope**: Client component (`"use client"`).
*   **Proposed Changes**: `LastSaved({ status, dateState, savedAt })` renders a
    `min-h-5` element. It is empty while loading. Once loaded it shows:
    *   `"saved"`: `Last saved: ${formatSavedDate(savedAt)}`, or nothing if
        `formatSavedDate` returns `null`;
    *   `"never"`: "Not saved yet";
    *   `"legacy"`: nothing.

##### 20. `src/components/SaveBar.tsx` (Create)

*   **Type / Scope**: Client component (`"use client"`).
*   **Proposed Changes**:
    *   **Props:**
        `SaveBar({ status, isDirty, canSave, dateState, saveError, onSave, onDiscard })`.
    *   **States:** follows the Technical Plan §5 table exactly.
    *   **Layout:** a fixed bottom bar, `h-16` plus
        `pb-[env(safe-area-inset-bottom)]`, followed in the flow by a spacer of
        the same height.
    *   **Accessibility:** status text sits in `aria-live="polite"`, and the
        error in `role="alert"`.
    *   **Styling:** as in Technical Plan §5.

##### 21. `src/components/ManualSaveNotice.tsx` (Create)

*   **Type / Scope**: Client component (`"use client"`).
*   **Proposed Changes**:
    *   **When it shows.** After `useIsClient()` is true, it reads
        `meta:manual-save-notice-dismissed` once:
        *   if the flag is absent and no key in `REGISTERED_KEYS` exists, the
            user is new. It writes the flag straight away and shows nothing;
        *   if the flag is absent and some registered key exists, it shows the
            notice until the user dismisses it;
        *   if reading storage throws, it shows nothing.

        A brand-new user's first Save therefore never triggers the notice.
    *   **Dismiss.** Dismissing writes the flag `"1"`. This is a §7 exception,
        listed in the lint allowlist.
    *   **Text and style.** The text is in Technical Plan §5. It sits in the
        flow, not fixed, with a dismiss button.

##### 22. `src/app/tools/cpf-sa-calculator/page.tsx` (Modify)

*   **Type / Scope**: Client list page.
*   **Proposed Changes**:
    *   Replace `useCpfProfiles` with `useProfileList(cpfSaAdapter)`.
    *   Remove the list-card name editor and the `onRename` prop.
    *   Delete keeps its confirm, `Delete "${name}"? This cannot be undone.`,
        then calls `remove(id)`. On `ok: false` it shows
        `alert("Couldn't delete. Please try again.")`.
    *   `handleAdd` calls `push("/tools/cpf-sa-calculator/new")` and writes
        nothing.
    *   Profile cards use `useGuardedRouter().push`.
    *   The back link uses `GuardedLink`.
    *   Render a placeholder until `status === "ready"`.

##### 23. `src/app/tools/cpf-sa-calculator/[profileId]/page.tsx` (Modify)

*   **Type / Scope**: Client detail page.
*   **Proposed Changes**:
    *   Read `const { profileId } = useParams<{ profileId: string }>()`, then
        call `useProfileDraft(cpfSaAdapter, profileId)`.
    *   **Edits.** Field edits call `setDraft`.
    *   **Name editor.** It keeps its commit-on-blur and Enter behaviour. It
        now calls `setDraft((p) => ({ ...p, name }))`, and its prop is renamed
        from `onSave` to `onCommit`.
    *   **Routing.** Get `replaceWithoutPrompt` from `useGuardedRouter()` at the
        top level, then call it in two places:
        *   `useEffect(() => { if (notFound) replaceWithoutPrompt(cpfSaAdapter.listPath) }, [notFound, replaceWithoutPrompt])`;
        *   in the Save handler:
            ``const r = save(); if (r.ok && profileId === "new") replaceWithoutPrompt(`${cpfSaAdapter.listPath}/${draft.id}`)``.
            Whether Next remounts the page on the param change or keeps it
            mounted, the hook stays consistent. Its state already holds the
            saved profile, and the new id reads as `"existing"`.
    *   **Rendering.**
        *   Render a placeholder while `status !== "ready"`, and when
            `draft === null`.
        *   Render `ManualSaveNotice` above the content, `LastSaved` under the
            profile name, and `SaveBar` at the bottom.
        *   Back links use `GuardedLink`.

##### 24. `src/hooks/useCpfProfiles.ts` (Delete)

*   **Type / Scope**: Old hook.
*   **Proposed Changes**: Delete it once items 22-23 no longer import it. Its
    contents now live in `adapters/cpf-sa.ts`.

##### 25. `src/components/SiteHeader.tsx`, `src/components/ToolCard.tsx`, `src/app/tools/[slug]/page.tsx` (Modify)

*   **Type / Scope**: Shared components and the coming-soon page.
*   **Proposed Changes**: Replace `next/link` with `GuardedLink`. The wordmark
    in `SiteHeader` sits on every Save page, so it must be guarded from this
    stage on. `ToolCard` and the coming-soon page change so that the lint rule
    has no exceptions.

#### Stage 4: The other multi-profile tools

##### 26. Adapters `cpf-ma.ts`, `cpf-oa.ts`, `hysa-tracker.ts`, `savings-goal.ts` in `src/lib/persistence/adapters/` (Create)

*   **Type / Scope**: Profile adapters, each registered in `registry.ts`.
*   **Proposed Changes**:

    | Adapter | Moves in | Read rule | `newProfile()` |
    | --- | --- | --- | --- |
    | `cpf-ma.ts` | `CpfMaParams`, `CpfMaProfile`, `CPF_MA_DEFAULT_PARAMS` | `startMonth ?? 1`, spread the rest | `p_${Date.now()}`, "New Scenario", `CPF_MA_DEFAULT_PARAMS` |
    | `cpf-oa.ts` | `CpfOaParams`, `CpfOaProfile`, `StoredCpfOaProfile`, defaults | The field-by-field rebuild also copies `savedAt` | `p_${Date.now()}`, "New Scenario", `CPF_OA_DEFAULT_PARAMS` |
    | `hysa-tracker.ts` | `HysaScenario`, `HysaMonthEntry` | As loaded today | `genId("hysa")`, "New Scenario", `entries: []` |
    | `savings-goal.ts` | `SavingsScenario` and its item type | The rebuild copies `savedAt`. A missing id becomes `sg_legacy_${i}`. | `sg_${Date.now()}`, "New Goal", `targetAmount: 10_000`, `defaultTargetDate()`, `items: []` |

    Each profile type gains `savedAt?: string`. Each adapter imports
    `toolMeta.ts`, and is added to `registry.ts` (Modify).

    **Test files (Create):** `cpf-ma.test.ts`, `cpf-oa.test.ts`,
    `hysa-tracker.test.ts` and `savings-goal.test.ts` in
    `src/lib/persistence/adapters/`. Each covers the profile-adapter cases from
    the Verification Plan. The savings-goal file also covers the stable legacy
    id.

##### 27. List and detail pages for CPF MA, CPF OA annuity, HYSA tracker and savings goal (Modify)

*   **Type / Scope**: Client pages. The changes match items 22-23.

    | File | Route param | Differences from CPF SA |
    | --- | --- | --- |
    | `src/app/tools/cpf-ma-calculator/page.tsx` | none | None |
    | `src/app/tools/cpf-ma-calculator/[profileId]/page.tsx` | `profileId` | None |
    | `src/app/tools/cpf-oa-annuity-calculator/page.tsx` | none | None |
    | `src/app/tools/cpf-oa-annuity-calculator/[profileId]/page.tsx` | `profileId` | None |
    | `src/app/tools/hysa-tracker/page.tsx` | none | None |
    | `src/app/tools/hysa-tracker/[scenarioId]/page.tsx` | `scenarioId` | "Add month", "Remove last month" and all entry edits become draft changes. The remove-month confirm drops "This cannot be undone". The empty-list blank page goes away, because `notFound` no longer depends on the list having items. |
    | `src/app/tools/savings-goal/page.tsx` | none | The list-card `ScenarioNameEditor` is removed. |
    | `src/app/tools/savings-goal/[scenarioId]/page.tsx` | `scenarioId` | Adding, removing, editing and reordering items become draft changes. The empty-list blank page goes away. `useParams()` gets the type `useParams<{ scenarioId: string }>()`. |

##### 28. `src/hooks/useCpfMaProfiles.ts`, `useCpfOaProfiles.ts`, `useHysaScenarios.ts`, `useSavingsGoal.ts` (Delete)

*   **Type / Scope**: Old hooks.
*   **Proposed Changes**: Delete each one once item 27 no longer imports it.

#### Stage 5: Single-state tools

##### 29. `src/hooks/useToolDraft.ts` (Create)

*   **Type / Scope**: Client hook.
*   **Proposed Changes**: `useToolDraft<T>(adapter: ToolAdapter<T>)`. It follows
    the same rules as item 17, except:
    *   it has no `notFound` and no `new` mode;
    *   state is `{ snapshot: T; draft: T; savedAt: string | null; exists: boolean }`;
    *   the server branch of the initial read returns
        `{ snapshot: defaults, draft: defaults, savedAt: null, exists: false }`,
        where `defaults = adapter.defaults()`. The client branch uses
        `adapter.read(localStorage)`;
    *   `setDraft(updater: (d: T) => T)` always applies, because the draft is
        never null;
    *   `dateState` is `dateStateOf({ exists, savedAt })`;
    *   `save()` lets `now = new Date().toISOString()` and calls
        `saveTool(localStorage, adapter, latestDraft.current, now)`. On success
        it sets `snapshot = draft`, `savedAt = now` and `exists = true`;
    *   on mount, if `location.search` is not empty, it calls
        `history.replaceState(null, "", location.pathname + location.hash)`.

##### 30. Single-state adapters in `src/lib/persistence/adapters/` (Create, 7 files)

*   **Type / Scope**: Tool adapters, each registered in `registry.ts`.
*   **Proposed Changes**:
    *   **Shared rules:**
        *   `read` always takes `savedAt` out of the record and returns it
            separately.
        *   For the five former `useToolState` tools (compound interest, FIRE,
            mortgage, emergency fund, budget planner), `read` applies today's
            type filter (`useToolState.ts:53-69`) to `inputs` only, after
            removing `savedAt`. That filter keeps a stored field only when its
            type matches the default.
        *   `exists` is true when any of `keys` is present.
        *   **Stored shape stays flat.** `toEntries` writes `tool:<slug>` as
            `JSON.stringify(savedAt ? { ...record.inputs, savedAt } : record.inputs)`.
            It writes list keys as plain arrays and `srs:withdrawal` as
            `{ ...withdrawal, savedAt }`. Only the stored type gains `savedAt?`.
            The in-memory record types never carry it.
        *   **Test files (Create):** one `<file>.test.ts` beside each adapter
            below. Each covers the tool-adapter cases from the Verification
            Plan, plus "a flat legacy `tool:<slug>` value reads into `inputs`,
            and `toEntries` writes it back flat". The dividend file also covers
            all three formats.
        *   Each adapter imports `toolMeta.ts`, and is added to `registry.ts`
            (Modify).

    | File | Record type | Keys (date key in bold) | Moves in |
    | --- | --- | --- | --- |
    | `compound-interest.ts` | `{ inputs }` | **`tool:compound-interest`** | Input defaults from `compound-interest/page.tsx:512` |
    | `fire-calculator.ts` | `{ inputs, yieldSources, drawdownSources }` | `fire:yield-sources-v2`, `fire:drawdown-sources-v2`, **`tool:fire-calculator`** | `YieldSource`, `DrawdownSource`, defaults |
    | `mortgage-calculator.ts` | `{ inputs, partialRepayments }` | `mortgage:partial-repayments`, **`tool:mortgage-calculator`** | `PartialRepayment` |
    | `emergency-fund.ts` | `{ inputs, sources }` | `emergency-fund:sources`, **`tool:emergency-fund`** | `SavingsSource` |
    | `budget-planner.ts` | `{ inputs, items }` | `budget:items`, **`tool:budget-planner`** | `BudgetItem`, `BudgetCategory` (and `CATEGORIES` if needed) |
    | `srs-calculator.ts` | `{ deposits, withdrawal }` | `srs:deposits`, **`srs:withdrawal`** | `Deposit`, `WithdrawalSettings`, `DEFAULT_DEPOSITS`, `DEFAULT_WITHDRAWAL` |
    | `dividend-calculator.ts` | `{ sources, projectionYears }` | `dividend:sources`, **`dividend:projection-years`** | The page's `YieldSource`, renamed `DividendSource`. `read` accepts a number, a numeric string or `{ years, savedAt }`. `toEntries` always writes the object. |

##### 31. The seven single-state tool pages (Modify)

*   **Files**:
    *   `src/app/tools/compound-interest/page.tsx`, which moves first;
    *   `src/app/tools/fire-calculator/page.tsx`;
    *   `src/app/tools/mortgage-calculator/page.tsx`;
    *   `src/app/tools/emergency-fund/page.tsx`;
    *   `src/app/tools/budget-planner/page.tsx`;
    *   `src/app/tools/srs-calculator/page.tsx`;
    *   `src/app/tools/dividend-calculator/page.tsx`.
*   **Type / Scope**: Client pages.
*   **Proposed Changes**:
    *   **One draft.** Replace `useToolState` and the page-level `useState`
        and `loadArray` state with one `useToolDraft(<tool>Adapter)`.
    *   **Setters become draft updates.** Each setter becomes a `setDraft`
        updater with no storage write:
        *   FIRE `setYieldSources` (`fire-calculator/page.tsx:938-944`) and
            `setDrawdownSources` (`:946-952`);
        *   the mortgage, emergency-fund, budget and dividend array setters;
        *   dividend `handleYearsChange` (`dividend-calculator/page.tsx:469`).
    *   **SRS.** Delete the SRS mount-write effects
        (`srs-calculator/page.tsx:530-541`).
    *   **Types.** Import the moved types from the adapter.
    *   **Rendering.**
        *   Render a placeholder until `status === "ready"`.
        *   Render `ManualSaveNotice` above the content, `LastSaved` under the
            title, and `SaveBar` at the bottom.
        *   Back links use `GuardedLink`.

##### 32. `src/hooks/useToolState.ts` (Delete) and `src/lib/utils.ts` (Modify)

*   **Type / Scope**: Old hook and utilities.
*   **Proposed Changes**:
    *   Delete `useToolState.ts` once no page imports it. This also removes the
        URL read and write and the page-load save.
    *   Remove `loadArray` and `saveArray` from `utils.ts`. Keep `fmtAxis`,
        `niceMax`, `genId` and `todayISO`.

#### Stage 6: Export, import and lint rules

##### 33. `src/lib/persistence/import.ts` and `import.test.ts` (Create)

*   **Type / Scope**: Pure module and its test.
*   **Proposed Changes**:
    *   `importBackup(storage, data: Record<string, unknown>)` returns
        `SaveResult & { toolsImported: number; keysSkipped: string[] }`.
    *   **For each adapter that owns at least one key in `data`:**
        1.  Build a read-only view. `getItem(k)` returns
            `JSON.stringify(data[k])` when `k` is in `data`, and
            `storage.getItem(k)` otherwise.
        2.  Read the view with `read` or `readAll`.
        3.  Work out the date:
            *   For tool adapters, `savedAt` is the read value if `data` has the
                `dateKey`, and `null` otherwise.
            *   Profiles keep each record's `savedAt` from the file.
        4.  Collect the entries from `toEntries(record, savedAt)`, or the
            profile array entry.
    *   **Write and report.**
        *   One `saveEntries` call writes all the collected entries.
        *   Keys that no adapter owns, such as `tool:srs-calculator`, go into
            `keysSkipped`.
        *   `toolsImported` is the number of adapters touched.
    *   **Tests:**
        *   a full file restores data and dates;
        *   a file without a tool's `dateKey` imports that tool with no date;
        *   a quota failure part-way leaves storage unchanged;
        *   unknown keys are skipped;
        *   an old numeric dividend value imports.

##### 34. `src/components/DataPortability.tsx` (Modify)

*   **Type / Scope**: Client component.
*   **Proposed Changes**:
    *   **Export.** Replace `STORAGE_KEYS` with `REGISTERED_KEYS`. Compared with
        today's 19 keys, this drops `tool:srs-calculator`. The HYSA key was
        already added in stage 1.
    *   **Import.**
        *   Call `importBackup(localStorage, payload.data)`.
        *   On `ok: false`, show "Couldn't import. Nothing was changed."
        *   On success, show "Imported N tools", plus the skipped-key note, and
            reload as today.
    *   **Remove** the direct `localStorage.setItem` loop.

##### 35. `eslint.config.mjs` (Modify)

*   **Type / Scope**: Lint configuration.
*   **Proposed Changes**: Add these flat-config objects:
    *   **For `src/**`:**
        *   `no-restricted-imports` with `paths` set to
            `[{ name: "next/link", message: "Use GuardedLink" }, { name: "next/navigation", importNames: ["useRouter"], message: "Use useGuardedRouter" }]`;
        *   `no-restricted-properties` with
            `[{ property: "setItem", message: "Write through saveEntries (§7)" }, { property: "removeItem", message: "Write through saveEntries (§7)" }]`.
    *   **`no-restricted-imports` off** for `src/components/GuardedLink.tsx` and
        `src/hooks/useGuardedRouter.ts`.
    *   **`no-restricted-properties` off** for:
        *   `src/lib/persistence/save.ts`;
        *   `src/lib/persistence/testing/memoryStorage.ts`;
        *   `src/**/*.test.ts`;
        *   `src/hooks/useTheme.ts`;
        *   `src/components/ManualSaveNotice.tsx`.

    Before this stage, these 20 files import `next/link`, and stages 3-5 move
    every one of them:
    *   the 12 tool pages;
    *   the 5 detail pages;
    *   `SiteHeader.tsx`;
    *   `ToolCard.tsx`;
    *   `tools/[slug]/page.tsx`.

#### Stage 7: Documentation and QA

##### 36. `docs/architecture.md` (Modify)

*   **Type / Scope**: Documentation.
*   **Proposed Changes**:
    *   Fill in "Data Flow" with adapter → draft hook → save module, and point
        to §7 for the write exceptions and to Risks & Mitigations for guard
        coverage.
    *   Under "Key Decisions", add "Explicit Save replaces autosave" and "Shared
        links removed", each with its reason.
    *   Record the `cacheComponents` watch item.

##### 37. `README.md` (Modify)

*   **Type / Scope**: Documentation.
*   **Proposed Changes**: Add `npm test` under Getting Started.

### Verification Plan

*   **Compilation/Build**: `npm run build` passes after every stage.
*   **Unit Tests**: `npm test` passes after every stage from stage 2 onwards.
*   **Static Analysis & Linting**: `npm run lint` passes after every stage.
    From stage 6, the two restriction rules enforce the "only writer" and
    guard rules.
*   **Test Coverage Requirement**: Every case listed in items 4, 6-9, 13 and 33
    passes, plus these adapter cases:
    *   **The 7 tool adapters:**
        *   `read` on empty storage gives `exists: false` with zero writes;
        *   reading legacy data writes nothing and round-trips unchanged.
            "Round-trips" means `read(toEntries(read(x).record, null)).record`
            is `sameData` with `read(x).record`;
        *   `savedAt` is removed from the record, including when nested.
    *   **The 5 profile adapters:**
        *   `readAll` on empty storage gives `[]` with zero writes;
        *   a legacy record round-trips unchanged;
        *   `savedAt` survives `readAll`;
        *   `newProfile()` gives a fresh id each call.
    *   **Tool-specific cases:**
        *   dividend reads all three formats;
        *   the CPF SA migration produces one profile with no date, and is
            exempt from the zero-write case;
        *   savings goal gives a record without an id the same id on two reads.
*   **Manual QA** (desktop Chrome, desktop Firefox and iOS Safari; record the
    results in the release PR):
    1.  **Fresh browser profile.**
        *   The 7 tool pages and the 5 `/new` pages show "Not saved yet", with
            Save enabled and Discard hidden.
        *   The 5 list pages show no Save bar.
        *   A made-up detail id redirects to its list page.
        *   DevTools shows no storage write on any page load.
    2.  **CUJs.** CUJs 1-10 behave as written.
    3.  **Leave guards.** With unsaved changes, the wordmark and every back
        link on each Save page prompt. Cancel keeps the draft and OK leaves.
        After Save, the same links leave without a prompt.
    4.  **Browser back** with unsaved changes leaves without a prompt. This is
        the documented gap.
    5.  **Tab close** with unsaved changes prompts in Chrome and Firefox. Record
        what iOS Safari does.
    6.  **Old bookmark.** `/tools/mortgage-calculator?propertyPrice=1` loads
        saved data, removes the query, and has no unsaved changes.
    7.  **Storage full.** In DevTools, fill storage with a script that writes
        large strings to a throwaway key until `setItem` throws. Then press
        Save: the page shows "Couldn't save" and the date does not change.
        Remove the throwaway key afterwards.
    8.  **Small screen.** On a 375 px wide screen, the Save bar does not cover
        content, and it is visible when the keyboard is closed.
    9.  **Screen reader.** VoiceOver announces "Unsaved changes" and "Couldn't
        save".

--------------------------------------------------------------------------------

*Drafted with EGM*
