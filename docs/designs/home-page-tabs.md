# Home Page: Tracking Tools and Calculators Tabs

*   **Author:** Des with Agents
*   **Status:** Proposed
*   **Date:** 2026-11-08
*   **Builds on:** PR #2, explicit Save and last-saved dates (merged to `main` on 2026-11-08)

--------------------------------------------------------------------------------

## Overview

The home page shows all 17 tools in one flat grid. Twelve are live and five are marked "coming soon". This change deletes the five coming-soon tools and splits the 12 live tools into two tabs, built with shadcn Tabs:

*   **Tracking Tools** (opens first, every time). Subtitle: "Saved on this device, for your own numbers." Ten tools: CPF Special Account (SA), CPF Medisave Account (MA), CPF Ordinary Account (OA) Annuity, High Yield Savings Account Tracker, FIRE Planner, Savings / Emergency Fund, SRS Fund, Dividend Planner, Budget Planner, Savings Goal.
*   **Calculators**. Subtitle: "Quick, one-off what-ifs." Two tools today: Compound Interest Calculator and Mortgage Calculator. More may be added.

The word "Calculator" is dropped from the name of each of the ten Tracking Tools wherever it is shown. URL slugs do not change, so bookmarks and saved browser data keep working. A display name is the text shown to users, for example "FIRE Planner". A slug is the URL segment, for example `fire-calculator`; slugs keep the old word.

**Dependency on PR #2.** `toolMeta()` (`src/lib/persistence/toolMeta.ts`), added by PR #2, reads tool names from `src/lib/tools.ts` and feeds them to the persistence adapters and the "You have unsaved changes to X" prompt, so renaming a tool also renames that prompt. PR #2 is merged, and this work is branched from `main`.

## The Problem

A returning user opens the app to update their own numbers: a CPF balance, a savings account, a budget. Today those tools sit in the same grid as generic calculators and as five tools that cannot be opened yet. Nothing on the page says which tools keep the user's data and which are one-off what-ifs.

Three further problems sit alongside it:

*   Ten of the 12 live tools keep the user's own numbers. The names "FIRE Calculator" and "Dividend Calculator", and the intro line "Every calculator runs in your browser", describe them as generic calculators.
*   The five coming-soon tools take up grid space and need a branch of code in `ToolCard` and a placeholder page.
*   The footer says "No data stored". Since explicit Save, the app stores data in the user's browser.

## Goals

*   The home page shows two tabs, **Tracking Tools** and **Calculators**, each with its one-line subtitle. Tracking Tools is selected on every load.
*   All 12 live tools are assigned to a tab through a required `group` field on each tool. The group is not worked out from category, name or slug.
*   The ten Tracking Tool names no longer contain "Calculator" in cards, page headings, tests and the live docs (`README.md`, `docs/architecture.md`; neither mentions the old names today). FIRE Calculator becomes FIRE Planner and Dividend Calculator becomes Dividend Planner. The Compound Interest card becomes Compound Interest Calculator, to match its page heading.
*   The five page headings whose text changes (FIRE Planner, Dividend Planner and the three CPF detail pages) read their name from `toolMeta`, so those names cannot drift from the card or the unsaved-changes prompt.
*   The five coming-soon tools, `tools/[slug]/page.tsx`, the `comingSoon` field, the `ToolCard` coming-soon branch, `categoryOrder`, the Debt category and its colour, `accent: "tertiary"` and the four icons only they used are removed.
*   A custom `src/app/not-found.tsx` shows a short message and a link home, so old coming-soon URLs end somewhere useful.
*   The intro reads "No account required. Everything runs in your browser — your numbers stay yours." The footer reads "Personal finance tools. No sign-up. Your data stays in this browser."
*   The tabs work by keyboard and screen reader (arrow keys, Home and End). Both panels are in the server-rendered HTML, so the Calculators content can be crawled. Without JavaScript the Calculators panel is not reachable; this is accepted because every tool needs JavaScript to run anyway.

## Non-Goals

*   Changing URL slugs, storage keys or the export file format.
*   Remembering the last tab, or linking to a tab by URL. This is the author's product decision, not a technical limit (see Alternative B). A fresh load, or a link to the home page, opens on Tracking Tools. The browser's Back button may restore the last tab from its page cache; in Chrome, Back from Mortgage Calculator reopened the Calculators tab.
*   A note about sensitive data on the Tracking Tools tab. Grouping is the only change to that section.
*   Redirects for deleted routes. A 404 is accepted.
*   Changing category badges, the order of tools in `tools.ts`, or the disclaimer paragraph and Export/Import block.
*   A formal test that a returning user can find their stuff, a trial period, or a fallback to stacked sections.
*   A `<noscript>` fallback for the tabs.
*   Editing the historical design documents and review reports under `docs/designs/` that quote the old names.

## Open Questions

None. The copy, the tab labels, the install route and the component boundary are all decided in this document.

## Technical Plan (Architecture)

### Data model

`src/lib/tools.ts` is the single list of tools. It gains one required field and loses several:

*   **Add** `group: "tracking" | "calculators"` to the `Tool` type, required, exported as `ToolGroup`. Every tool sets it by hand. It is not worked out from category, name or slug, because Tracking spans the CPF, Savings, Planning and Investment categories and Calculators holds one Investment and one Property tool.
*   **Remove** `comingSoon` and `accent` from the `Tool` type, `"Debt"` from `ToolCategory` and `categoryColors`, and `categoryOrder` entirely (nothing reads it). Five tool entries are deleted.
*   **Rename** display names: the three CPF tools drop "Calculator", FIRE Calculator becomes FIRE Planner, Dividend Calculator becomes Dividend Planner, Compound Interest becomes Compound Interest Calculator.
*   Array order stays as it is. Each tab shows its tools in array order, so Compound Interest comes first in the Calculators tab and Mortgage Calculator second.
*   **Export** `groupMeta: Record<ToolGroup, { label: string; subtitle: string }>` from `tools.ts`: `tracking` is "Tracking Tools" / "Saved on this device, for your own numbers."; `calculators` is "Calculators" / "Quick, one-off what-ifs." Only the server page reads it.

### Rendering and component boundary

The page stays a server component. Only the tab switch runs in the browser.

*   `src/app/page.tsx` (server) filters `tools` by `group`, builds two grids of `ToolCard` (server-rendered), and passes them to `HomeTabs` together with `labels={groupMeta}`.
*   `src/components/HomeTabs.tsx` (client, `"use client"`) props are `{ tracking: ReactNode; calculators: ReactNode; labels: Record<ToolGroup, { label: string; subtitle: string }> }`. `ToolGroup` is imported with `import type`, so nothing from `tools.ts` reaches the browser bundle. There are no tool counts in the tab labels.
*   `HomeTabs` renders shadcn `Tabs` with `defaultValue="tracking"` and no state, URL or storage, so every load opens on Tracking Tools. Each `TabsContent` uses `forceMount` so both panels are in the server HTML.
*   **Hiding the inactive panel.** Radix does not hide a force-mounted inactive panel on its own; it only sets `data-state="inactive"`. Each `TabsContent` therefore carries the class `data-[state=inactive]:hidden`, so the inactive panel is `display: none`. After the install, view the page source to confirm the inactive panel is present with `data-state="inactive"`, and check in the browser that it is not visible. If Radix also sets the `hidden` attribute, the class is harmless.
*   Each panel starts with its subtitle from `labels`, so a subtitle shows only while its tab is selected.
*   `src/components/ui/tabs.tsx` is the shadcn Tabs wrapper, restyled to the repo's CSS variables (see the implementation plan for exact classes).

```text
page.tsx (server)
  ├─ SiteHeader, HeroSection              (copy edits only)
  └─ <section id="tools">
       ├─ intro, disclaimer, DataPortability   (intro line edited)
       └─ <HomeTabs labels={groupMeta}           (client)
            tracking={<grid>ToolCard x10</grid>}   (server-rendered)
            calculators={<grid>ToolCard x2</grid>} (server-rendered)
          />
            └─ Tabs defaultValue="tracking"
                 ├─ TabsList: [Tracking Tools] [Calculators]
                 ├─ TabsContent forceMount value=tracking    -> subtitle + grid
                 └─ TabsContent forceMount value=calculators -> subtitle + grid
                                           (hidden by data-[state=inactive]:hidden)
```

The `id="tools"` anchor stays on the existing section, above the intro. "Explore all tools" in the hero still scrolls to the intro, and the tabs sit directly below it. The Export/Import block stays above the tabs because it covers every tool.

### Installing shadcn Tabs

The author chose to run the shadcn CLI. The repo has no `components.json`, no `src/components/ui/` and no Radix package. `shadcn init` writes colour tokens to `src/app/globals.css`, including a `--primary` that already exists with another meaning, and a `cn()` helper to `src/lib/utils.ts`, which already holds chart and ID helpers. The install is therefore a fixed sequence that ends in a bounded set of changes. The exact steps are in file 15 of the implementation plan.

End state: only these files change in commit 3: `package.json`, `package-lock.json`, `components.json`, `src/lib/cn.ts`, `src/components/ui/tabs.tsx`, `src/components/HomeTabs.tsx` and `src/app/page.tsx`. `src/app/globals.css` and `src/lib/utils.ts` are unchanged (`git diff` is empty for both). The only new package is `@radix-ui/react-tabs` (the CLI installs the unified `radix-ui` package, which pulls in about 50 Radix packages; it is replaced by this one). Any other package the CLI adds is uninstalled.

### Names in one place

Five page headings change text today: FIRE, Dividend and the three CPF `[profileId]` pages. Each reads its name from `toolMeta(slug).name` (`src/lib/persistence/toolMeta.ts`, which imports only `@/lib/tools`, so client pages can call it). Mortgage and Compound Interest already show their final names, and Budget Planner, Savings / Emergency Fund, HYSA Tracker, Savings Goal and SRS Fund already match their cards, so those headings stay hand-typed. The remaining drift risk on those seven pages is accepted. A heading component or a lint rule for it is out of scope.

### Deleted routes

`src/app/tools/[slug]/page.tsx` is the only user of `generateStaticParams` over `tools` and serves the coming-soon page. Deleting it makes `/tools/rent-vs-buy` and the other four old paths return Next's 404. A new `src/app/not-found.tsx` replaces the default 404 with the same layout the deleted page used. It uses `GuardedLink` because the repo's lint rule (`eslint.config.mjs`, `no-restricted-imports`) forbids `next/link`.

### Copy changes

*   Intro in `page.tsx`: "No account required. Everything runs in your browser — your numbers stay yours."
*   Footer in `page.tsx`: "Personal finance tools. No sign-up. Your data stays in this browser."
*   `HeroSection.tsx` line 59 says "personal finance calculators — from mortgage repayments to debt payoff strategies". No live tool covers debt payoff, so it becomes "A curated suite of personal finance tools — track your CPF, savings and budget, or run a quick calculation."
*   `SiteHeader.tsx` line 64: "Just honest calculators that help you think clearly about money." becomes "Just honest tools that help you think clearly about money."
*   The "Open Calculator" label on each profile card of the three CPF list pages becomes "Open". Those cards open a profile, not a calculator.
*   FIRE Planner tagline: "Financial independence, retire early: find your FIRE number and when you can retire." The Dividend Planner tagline ("Track your dividend portfolio. See annual and monthly income from every yield source.") already describes the tool and is unchanged.

### Persistence and tests

No stored data changes. Slugs, storage keys and the export format are untouched. `src/lib/persistence/import.ts` never reads a display name, so old export files import as before. `cpf-sa.test.ts:22` asserts the old CPF SA name and is updated. `unsavedStore.test.ts` uses "FIRE Calculator" as a free-text example, which is updated to "FIRE Planner". A new data test, `src/lib/tools.test.ts`, checks the tool list. Tab behaviour and `not-found.tsx` get no automated test, because vitest runs only `src/**/*.test.ts` in a node environment; manual checks in the Verification Plan cover them.

## Alternatives Considered

### Alternative A: Stacked sections instead of tabs

*   **Pros**: No client state and no new dependency. Nothing is hidden, so a first-time visitor sees the calculators without a click.
*   **Cons**: The page grows with every calculator added, and a returning user still scrolls past both groups to reach what they use.
*   **Reason for Rejection**: Rejected by author: tabs let a returning user see only their own tools on load, and one extra tap to reach Calculators is accepted.

### Alternative B: Remember the last tab, or put the tab in the URL

*   **Pros**: A returning Calculators user would not need an extra tap, and Back from a tool page would return to the same tab.
*   **Cons**: Technically possible without a server/browser mismatch: render `tracking` on the server and first client render, then restore the tab after mount from the URL hash or `sessionStorage`, and write it back with `history.replaceState`. The cost is controlled tab state, a brief flash for Calculators users, hash handling that must not clash with the `#tools` anchor, and more tests.
*   **Reason for Rejection**: Rejected by author as a product decision: the page stays stateless and always opens on Tracking Tools.

### Alternative C: A note about sensitive data on the Tracking Tools tab

*   **Pros**: Tells users up front that this tab holds personal numbers.
*   **Cons**: Repeats what the tab subtitle and the privacy note in `SiteHeader` already say.
*   **Reason for Rejection**: Rejected by author: the subtitle is enough, and grouping is the only change to that section.

### Alternative D: Keep the coming-soon tools in a separate place

*   **Pros**: Keeps a visible roadmap signal.
*   **Cons**: Keeps the `comingSoon` branch in `ToolCard`, the `tools/[slug]` placeholder page and the unused Debt category.
*   **Reason for Rejection**: Rejected by author: delete them. Old links may 404.

### Alternative E: Redirect deleted routes to the home page

*   **Pros**: Old links land somewhere useful instead of a 404.
*   **Cons**: Needs a redirect rule per route, and hides that the page is gone.
*   **Reason for Rejection**: Rejected by author: a 404 with a link home is enough.

### Alternative F: One flat list ordered by saved data

*   **Pros**: No tabs and nothing hidden. Tools with saved data show first with a "last saved" chip.
*   **Cons**: The order changes between visits, and it reads saved data on the client at load, which risks a server/browser mismatch.
*   **Reason for Rejection**: Rejected by author: the two-tab layout is the chosen design.

### Alternative G: A marker on each card ("Saves your data" / "One-off") with no groups

*   **Pros**: The card says what the tool is, so the home page needs no top-level split.
*   **Cons**: Adds a visual element to every card and gives no separate section for the user's own tools.
*   **Reason for Rejection**: Rejected by author: the two-section split is the requested layout.

### Alternative H: Install only the Radix tabs package and copy the shadcn Tabs source by hand

*   **Pros**: Smallest diff. No `components.json`, no `globals.css` change, and the styling matches from the start.
*   **Cons**: The copied file drifts from upstream shadcn, and a later `shadcn add` still needs `init` run first.
*   **Reason for Rejection**: Rejected by author: run the shadcn CLI, reviewing its diff afterwards.

### Alternative I: Hand-written tabs with no new dependency

*   **Pros**: No package to add.
*   **Cons**: The tab roles, roving focus and arrow, Home and End keys are written and tested in-repo, and a missed ARIA detail makes the tabs unusable by keyboard or screen reader.
*   **Reason for Rejection**: Rejected by author: use shadcn Tabs for built-in keyboard and screen-reader support.

### Alternative J: A client component that renders `ToolCard` from lists passed as props, or imports `tools.ts` itself

*   **Pros**: The tab and its content live in one file.
*   **Cons**: `ToolCard` and `categoryColors` join the client bundle, and importing `tools.ts` in the client ships the full list to the browser.
*   **Reason for Rejection**: Rejected by author: server-rendered panels are passed as children to a thin client tab shell.

### Alternative K: Keep the Debt category for future tools

*   **Pros**: A debt tool could return without a type change.
*   **Cons**: It leaves an unused type value and colour in `tools.ts`.
*   **Reason for Rejection**: Rejected by author: remove it now; adding it back takes a few lines.

--------------------------------------------------------------------------------

## Risks & Mitigations

| Risk | Mitigation | Check |
| :-- | :-- | :-- |
| Another change to `tools.ts` or `toolMeta.ts` lands on `main` while this is in review, causing conflicts. | Keep the three commits small; rebase this branch onto `main` before merging. | `npm test` and `npm run build` pass after any rebase. |
| `shadcn init` overwrites tokens in `globals.css` or helpers in `utils.ts`. | Fixed install sequence with revert steps and a bounded end state (file 15). | `git diff src/app/globals.css src/lib/utils.ts` is empty; `git status` lists only the files named in the end state. |
| A force-mounted inactive panel stays visible, so both grids show. | The class `data-[state=inactive]:hidden` on each `TabsContent`. | Manual check: only one grid visible per tab; view-source shows both panels. |
| First-time visitors miss the Calculators tab. | Accepted by the author; the tab subtitles say what each tab holds. | None. |
| Old coming-soon links 404. | Accepted by the author; `not-found.tsx` links home. | Manual check of `/tools/rent-vs-buy`. |
| Seven page headings stay hand-typed and can drift from their card names. | Accepted; the new test checks only `tools.ts` names. | None. |

## Non-Functional Requirements

*   **Privacy and data**: No stored data changes. Slugs, storage keys and the export format are untouched. The new copy says the user's data stays in this browser, which is how explicit Save works.
*   **Accessibility**: The tabs use Radix's WAI-ARIA tabs pattern: `tablist`, `tab` and `tabpanel` roles, arrow keys to move, Home and End to jump. The trigger has a visible focus ring and is at least 44 px tall.
*   **Performance**: One new client dependency (the Radix tabs package), loaded with the home page. The cards stay server-rendered. The size of the package is not measured, because it is small next to the existing page.
*   **Rollout and rollback**: No data migration. The change ships as one PR with three commits (see the order of work). Rollback is a git revert.

## Future Improvements

*   **Order by saved data** (Alternative F) and **remember the last tab** (Alternative B) are available if the author wants them later.

## Detailed Implementation Plan

### Order of work

Three commits on one branch, in this order. Each leaves build, lint and tests passing. Item numbers below are one per edit; items 2 and 5 are two passes over `src/lib/tools.ts` in different commits, and items 14 and 18 are two passes over `src/app/page.tsx`.

1.  **Delete the coming-soon tools and dead code, and add the not-found page.** Items 1 to 4. After this commit `page.tsx` still renders all 12 tools in one grid.
2.  **Group field, renames and copy.** Items 5 to 14, including the intro and footer copy in `page.tsx`. After this commit `page.tsx` still renders one grid.
3.  **Tabs.** Items 15 to 18.

Line numbers are correct at the current commit of `main` (`6d7d965`); they shift as earlier commits land, so each item also names the text to find.

### Target Files to Create/Modify

#### 1. `src/app/tools/[slug]/page.tsx` (Delete)

*   **Type / Scope**: Next.js page, coming-soon placeholder.
*   **Proposed Changes**: Delete the file. It is the only page that serves the five coming-soon slugs and the only user of `generateStaticParams` over `tools`. Static routes for the 12 live tools take priority over it, so they are unaffected.

#### 2. `src/lib/tools.ts` (Modify, first pass)

*   **Type / Scope**: TypeScript module, the single list of tools.
*   **Proposed Changes**: Delete the five coming-soon entries (rent-vs-buy, cpf-oa-to-sa, debt-repayment, loan-comparison, net-worth). Remove `comingSoon` and `accent` from the `Tool` type. Remove `"Debt"` from `ToolCategory` and from `categoryColors`. Delete the exported `categoryOrder` array; it has no other user. Remove the "Live tools" and "Coming soon" separator comments.

#### 3. `src/components/ToolCard.tsx` (Modify)

*   **Type / Scope**: React component.
*   **Proposed Changes**: Remove the `if (comingSoon) { ... }` branch (lines 53 to 99) and remove `accent` and `comingSoon` from the destructured props on the function signature (line 48). Replace the `accentColor` definition at line 49 with `const accentColor = "var(--primary)"`; its uses at lines 117, 148 and 156 stay. Remove the icon paths for `Scale`, `ArrowRightLeft`, `TrendingDown` and `GitCompare`. Keep `Wallet`: it is the fallback icon, and `hysa-tracker` uses it because its icon `TableProperties` is not in the `ICONS` map. `ToolCardProps = Tool` means `group` becomes a required prop in commit 2; `ToolCard` ignores it, and the `{...tool}` spread in `page.tsx` supplies it.

#### 4. `src/app/not-found.tsx` (Create)

*   **Type / Scope**: Next.js not-found page, server component, with the default export Next requires.
*   **Proposed Changes**: Copy the layout of the deleted `[slug]/page.tsx`: an outer `div` with classes `min-h-screen flex flex-col items-center justify-center px-5 text-center` and `backgroundColor: var(--surface-container-low)`. Inside it: an eyebrow `p` ("Page not found", `text-xs font-semibold tracking-widest uppercase mb-4`, colour `var(--primary)`); an `h1` ("That page doesn't exist.", `text-4xl font-bold mb-4`, colour `var(--on-surface)`); a `p` ("The link may be old or mistyped. Every tool is on the home page.", `text-base mb-8 max-w-sm`, colour `var(--on-surface-sub)`); and a `GuardedLink` to `/` labelled "← Back to all tools", using the same gradient button style as the deleted page. No `SiteHeader`, which is a client component with a theme toggle and is not needed here. The layout is mobile first because it is a single centred column that needs no breakpoints.

#### 5. `src/lib/tools.ts` (Modify, second pass)

*   **Type / Scope**: TypeScript module.
*   **Proposed Changes**: Add `export type ToolGroup = "tracking" | "calculators"` and a required `group: ToolGroup` on `Tool`. Set `group` on all 12 tools: `"calculators"` for `compound-interest` and `mortgage-calculator`, `"tracking"` for the other ten. Rename: `cpf-sa-calculator` to "CPF Special Account (SA)", `cpf-ma-calculator` to "CPF Medisave Account (MA)", `cpf-oa-annuity-calculator` to "CPF Ordinary Account (OA) Annuity", `fire-calculator` to "FIRE Planner", `dividend-calculator` to "Dividend Planner", `compound-interest` to "Compound Interest Calculator". Set the FIRE tagline to "Financial independence, retire early: find your FIRE number and when you can retire." Leave the Dividend tagline. Add `export const groupMeta: Record<ToolGroup, { label: string; subtitle: string }>` with the labels and subtitles from the Technical Plan. Array order does not change.

#### 6. `src/lib/persistence/adapters/cpf-sa.test.ts` (Modify)

*   **Type / Scope**: Unit test.
*   **Proposed Changes**: Line 22: `expect(cpfSaAdapter.name).toBe("CPF Special Account (SA)")`. This test fails as soon as item 5 lands, so it is part of the same commit.

#### 7. `src/lib/unsavedStore.test.ts` (Modify)

*   **Type / Scope**: Unit test.
*   **Proposed Changes**: Replace the free-text example "FIRE Calculator" with "FIRE Planner" (lines 12 and 13). "Mortgage Calculator" (lines 32 and 37) is still a real tool name and stays.

#### 8. `src/lib/tools.test.ts` (Create)

*   **Type / Scope**: Unit test, vitest, node environment (matched by `src/**/*.test.ts`).
*   **Proposed Changes**: Import `tools` and `groupMeta`. Assert: slugs are unique; each slug has a directory at `path.join(process.cwd(), "src/app/tools", slug)` (checked with `fs.existsSync`); every tool's `group` is `"tracking"` or `"calculators"`; no tool with `group: "tracking"` has a name containing "Calculator"; `groupMeta` has both keys with a non-empty `label` and `subtitle`; the six renamed tools have exactly the names listed in item 5 (looked up by slug). No assertions on how many tools there are, so adding a calculator does not break the test.

#### 9. `src/app/tools/fire-calculator/page.tsx` (Modify)

*   **Type / Scope**: Client tool page.
*   **Proposed Changes**: Replace the hard-coded heading text "FIRE Calculator" (line 1003, inside the `h1`) with `{toolMeta("fire-calculator").name}`, importing `toolMeta` from `@/lib/persistence/toolMeta`. The exported function name `FireCalculatorPage` is not shown to users and stays.

#### 10. `src/app/tools/dividend-calculator/page.tsx` (Modify)

*   **Type / Scope**: Client tool page.
*   **Proposed Changes**: Replace the heading text "Dividend Calculator" (line 530) with `{toolMeta("dividend-calculator").name}`, with the same import.

#### 11. `src/app/tools/cpf-sa-calculator/[profileId]/page.tsx`, `src/app/tools/cpf-ma-calculator/[profileId]/page.tsx`, `src/app/tools/cpf-oa-annuity-calculator/[profileId]/page.tsx` (Modify, three files)

*   **Type / Scope**: Client tool detail pages.
*   **Proposed Changes**: Replace the heading text ending in "Calculator" with `{toolMeta("cpf-sa-calculator").name}` (line 671), `{toolMeta("cpf-ma-calculator").name}` (line 758) and `{toolMeta("cpf-oa-annuity-calculator").name}` (line 619), each importing `toolMeta`.

#### 12. `src/app/tools/cpf-sa-calculator/page.tsx`, `src/app/tools/cpf-ma-calculator/page.tsx`, `src/app/tools/cpf-oa-annuity-calculator/page.tsx` (Modify, three files)

*   **Type / Scope**: Client list pages.
*   **Proposed Changes**: Change the "Open Calculator" label on each profile card (lines 86, 81 and 81) to "Open". The `h1` on these pages already omits "Calculator".

#### 13. `src/components/HeroSection.tsx`, `src/components/SiteHeader.tsx` (Modify)

*   **Type / Scope**: Copy.
*   **Proposed Changes**: `HeroSection.tsx` line 59 becomes "A curated suite of personal finance tools — track your CPF, savings and budget, or run a quick calculation." `SiteHeader.tsx` line 64 becomes "Just honest tools that help you think clearly about money." (lines 61 to 63 already say "personal finance tools"). The `DebtProgressCard` widget in `HeroSection.tsx` is decoration and is not touched.

#### 14. `src/app/page.tsx` (Modify, first pass)

*   **Type / Scope**: Server component.
*   **Proposed Changes**: Change the intro paragraph (line 28) to "No account required. Everything runs in your browser — your numbers stay yours." Change the footer line (line 64) to "Personal finance tools. No sign-up. Your data stays in this browser." The grid is unchanged in this commit.

#### 15. `package.json`, `package-lock.json`, `components.json`, `src/lib/cn.ts`, `src/components/ui/tabs.tsx`, `src/app/globals.css`, `src/lib/utils.ts` (Install shadcn Tabs, fixed sequence)

*   **Type / Scope**: Dependency and tooling setup, run once at the start of commit 3. The trade-off was discussed with the author: one new client package for built-in tab accessibility (Alternatives H and I).
*   **Proposed Changes**: Run these steps in order.
    1.  Create `src/lib/cn.ts` with a named export `cn(...inputs: ClassValue[])` that returns `twMerge(clsx(inputs))`. `clsx` and `tailwind-merge` are already in `package.json`.
    2.  Run `npx shadcn@latest init --base radix --preset nova --template next -y --no-monorepo --no-rtl` (CLI version 4.23.0; record it in the commit message). Without `--base radix` the CLI uses Base UI, and without `--preset` it stops at an interactive prompt. `init` changes more than the colour tokens: it overwrites `src/lib/utils.ts` with a re-export from a bare npm package called `cn`, changes the app font in `src/app/layout.tsx`, adds about 177 lines to `src/app/globals.css`, creates `src/components/ui/button.tsx`, and adds the packages `cn`, `radix-ui`, `shadcn` and `tw-animate-css`.
    3.  Open `components.json` and set `aliases.utils` to `@/lib/cn`.
    4.  Run `git checkout src/app/globals.css src/app/layout.tsx src/lib/utils.ts`, delete `src/components/ui/button.tsx`, and run `npm uninstall cn shadcn tw-animate-css`.
    5.  Run `npx shadcn@latest add tabs -y`. This creates `src/components/ui/tabs.tsx`. The generated file imports `cn` from the bare package name `"cn"`, which is why item 16 rewrites it.
    6.  Run `git checkout package.json package-lock.json`, then `npm install @radix-ui/react-tabs`. This swaps the unified `radix-ui` package for the single tabs package (the lockfile gains 16 packages instead of 82).
    7.  Run `git status`. The files that changed must be exactly: `package.json`, `package-lock.json`, `components.json`, `src/lib/cn.ts` and `src/components/ui/tabs.tsx`. `globals.css`, `layout.tsx` and `utils.ts` must not appear.
    8.  Rewrite `tabs.tsx` as described in item 16, importing `@radix-ui/react-tabs`.

#### 16. `src/components/ui/tabs.tsx` (Create, restyle)

*   **Type / Scope**: shadcn Tabs wrapper over the Radix tabs package; named exports `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
*   **Proposed Changes**: Replace every shadcn colour class (`bg-muted`, `text-muted-foreground`, `bg-background`, `text-foreground` and similar) with the repo's variables, using these classes. `TabsList`: `w-full grid grid-cols-2 gap-1 rounded-lg p-1 bg-[var(--surface-container)]`. `TabsTrigger`: `min-h-11 rounded-md px-3 text-sm font-semibold text-[var(--on-surface-sub)] data-[state=active]:bg-[var(--surface-container-lowest)] data-[state=active]:text-[var(--on-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]`. `TabsContent`: `mt-6 data-[state=inactive]:hidden`; it accepts `forceMount` as the Radix component does.

#### 17. `src/components/HomeTabs.tsx` (Create)

*   **Type / Scope**: Client component (`"use client"`), named export `HomeTabs`.
*   **Proposed Changes**: Props `{ tracking: ReactNode; calculators: ReactNode; labels: Record<ToolGroup, { label: string; subtitle: string }> }`, with `ToolGroup` imported via `import type`. Render `Tabs` with `defaultValue="tracking"`, a `TabsList` with two `TabsTrigger`s labelled `labels.tracking.label` and `labels.calculators.label`, and two `TabsContent` panels with `forceMount`. Each panel starts with a `p` holding its subtitle (`text-sm mb-4`, colour `var(--on-surface-sub)`), then the node passed in. No tool counts.

#### 18. `src/app/page.tsx` (Modify, second pass)

*   **Type / Scope**: Server component.
*   **Proposed Changes**: Filter `tools` by `group` into `trackingTools` and `calculatorTools`. Replace the single grid with `<HomeTabs labels={groupMeta} tracking={...} calculators={...} />`, where each prop is `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">` of `ToolCard`. Import `groupMeta` from `@/lib/tools`. Keep `id="tools"`, the disclaimer, the `DataPortability` block and the "Pick your tool. Start immediately." heading.

### Verification Plan

*   **Compilation/Build**: `rm -rf .next/dev && npm run build`. The `rm` avoids an existing break on `main`: once `next dev` has generated `.next/dev/types`, the build fails because the seven single-state tool pages export a named function and a default. This is not part of this change.
*   **Unit Tests**: `npm test`. The updated `cpf-sa.test.ts` and `unsavedStore.test.ts` and the new `tools.test.ts` must pass. `src/lib/persistence/import.test.ts` covers import by storage key; `import.ts` reads no display names, so old export files import as before.
*   **Static Analysis & Linting**: `npm run lint`, then `rm -rf .next/dev && npx tsc --noEmit`. `not-found.tsx` uses `GuardedLink`, not `next/link`.
*   **Test Coverage Requirement**: No coverage threshold applies. `tools.test.ts` covers the tool list; the manual checks below cover the tabs and the not-found page.
*   **E2E/Integration** (manual, in Chrome with `next dev`):
    *   Home page opens on Tracking Tools showing 10 cards; the Calculators tab shows 2 and its subtitle; only one grid is visible at a time.
    *   View-source shows both panels, the inactive one with `data-state="inactive"`.
    *   Arrow keys, Home and End move between tabs; the focus ring is visible; each trigger measures at least 44 px tall in devtools.
    *   At 375 px wide: the tab list fits on one row, cards stack in one column, no horizontal scroll.
    *   "Explore all tools" in the hero still scrolls to the tools section.
    *   Opening a Calculators tool and pressing the browser's Back button may restore the Calculators tab from the page cache; a link to the home page opens on Tracking Tools (the Non-Goal above).
    *   `/tools/rent-vs-buy` shows the not-found page with a link home.
    *   An edit with unsaved changes on FIRE Planner, then a click on the home link, shows "You have unsaved changes to FIRE Planner."
    *   In both light and dark themes the selected trigger has `--surface-container-lowest` background and `--on-surface` text, the tab list has `--surface-container` background, and `git diff src/app/globals.css` is empty.

--------------------------------------------------------------------------------

*Drafted with EGM*
