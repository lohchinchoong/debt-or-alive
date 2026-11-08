# Home Page: Tracking Tools and Calculators Tabs

* **Author:** Des with Agents
* **Date:** 2026-11-08
* **Branch context:** feat/explicit-save (PR #2, not merged)

## Overview

The home page shows one flat grid of 17 tools. This change splits the 12 live tools into two tabs, shown with shadcn Tabs:

* **Tracking Tools** (opens first, every time): personalised tools that hold the user's own numbers. Subtitle: "Saved on this device, for your own numbers." Ten tools: CPF Special Account (SA), CPF Medisave Account (MA), CPF Ordinary Account (OA) Annuity, High Yield Savings Account Tracker, FIRE Planner, Savings / Emergency Fund, SRS Fund, Dividend Planner, Budget Planner, Savings Goal.
* **Calculators**: generic tools anyone can use. Subtitle: "Quick, one-off what-ifs." Two today: Compound Interest Calculator and Mortgage Calculator. More may come.

The word "Calculator" is dropped from every Tracking Tool name. URL slugs do not change, so bookmarks and saved data keep working. The five coming-soon tools and their placeholder page are deleted. Success: a returning user can find their stuff.

## Analysis

Seven reviewers looked at this.

**What the codebase shows**
* `src/lib/tools.ts` is the single list of tools. `toolMeta.ts` reads names from it, so persistence adapters and the "unsaved changes to X" prompt pick up renamed tools automatically.
* Page headings are typed by hand and do not read `tools.ts`: FIRE, Dividend, the three CPF `[profileId]` pages, Mortgage, and Compound Interest (whose heading already says "Compound Interest Calculator" while its card says "Compound Interest"). They must be edited, or read from `toolMeta`, so names cannot drift.
* `cpf-sa.test.ts:22` asserts the old CPF SA name and will fail. `unsavedStore.test.ts` uses "FIRE Calculator" and "Mortgage Calculator" as plain strings; they will not fail but go stale.
* Other copy that says "calculator": the `page.tsx` intro, `HeroSection.tsx`, `SiteHeader.tsx`, and the "Open Calculator" buttons on the three CPF list pages.
* Export/Import uses slugs and storage keys, not display names, so old export files should still import. One check confirms it.
* The repo has no tabs component, no `src/components/ui/` folder and no Radix dependency. `page.tsx` is a server component, so the tabs live in a small client component fed two lists.
* The `tools/[slug]` page is the only user of `generateStaticParams` over `tools`. It goes with the deletion, along with the `comingSoon` field and the `ToolCard` branch (`ToolCard.tsx:53-99`).
* The array order in `tools.ts` differs from the author's listed order (Compound Interest first, Mortgage between FIRE and Emergency Fund). "Keep the current order" means filter by group and keep array order.

**Objections raised, and where they landed**
* *Tabs for a 10 vs 2 split*: reviewers say stacked sections are simpler and nothing is hidden. The author chose tabs as the final design. Accepted risk: a visitor who wants a calculator must click, and from a tool page the Back button reopens on Tracking Tools.
* *"Tracking" is not a clean rule*: FIRE and the CPF tools project numbers as well as save them. Resolved with the two subtitles above.
* *Bare names*: resolved by "FIRE Planner" and "Dividend Planner".
* *Success is not testable*: the author chose not to define a formal test.
* *Page copy*: the intro "Every calculator runs in your browser" and the footer "No data stored" no longer fit. Reworded (see Key Decisions).
* *Group field*: the tab cannot come from category, because Tracking spans CPF, Savings, Planning and Investment and Calculators holds Investment and Property. A required `group` field on `Tool` is added.
* *Accessibility and no-JS*: Radix gives tab roles and keyboard support. By default it renders only the active panel, so Calculators cards would be missing from server HTML. Use `forceMount` or equivalent.

**Trade-off accepted:** one screen shows one group, so focus for returning users costs discoverability for first-time visitors. A single list ordered by saved data (a "last saved" chip first) would dissolve this, but it conflicts with the author's no-remembered-state rule, so it is recorded as an alternative.

## Goals vs. Non-Goals

* **In-Scope Goals:**
  * Two groups on the home page, as shadcn Tabs, opening on Tracking Tools, each with a one-line subtitle.
  * A required `group` field on `Tool`, assigned for all 12 tools.
  * Drop "Calculator" from the ten Tracking Tool names in cards, page headings, tests and docs. FIRE Calculator becomes FIRE Planner; Dividend Calculator becomes Dividend Planner.
  * Rename the Compound Interest card to Compound Interest Calculator, to match its heading.
  * Delete the five coming-soon tools, `tools/[slug]/page.tsx`, the `comingSoon` field and the `ToolCard` branch.
  * Remove the unused Debt category and its colour, `accent: "tertiary"`, and the icons Scale, ArrowRightLeft, TrendingDown and GitCompare. Keep Wallet (fallback icon).
  * Add a custom `src/app/not-found.tsx` with a link home.
  * Reword the intro, footer and other "calculator" copy that no longer fits.
* **Out-of-Scope Non-Goals:**
  * Changing URL slugs, storage keys or the export format.
  * Remembering the last tab, or URL-linked tabs.
  * A note about sensitive data on the Tracking section.
  * Redirects for deleted routes.
  * Changing category badges, tool order, or the disclaimer and Export/Import block.
  * A formal success test or a trial period.

## Alternatives Weighed

| ID | Option | Outcome |
| :-- | :-- | :-- |
| A1 | Stacked sections, Tracking first, then Calculators | Rejected by author: go with tabs, no trial. Simpler, but not the author's preference. |
| A2 | Remember the last tab, or link tabs by URL | Rejected by author: always open on Tracking Tools. |
| A3 | Sensitivity note on the Tracking section | Rejected by author: grouping only. |
| A4 | Keep the coming-soon tools somewhere | Rejected by author: delete them. |
| A5 | One flat list ordered by saved data, with a "last saved" chip | Not chosen. Order changes between visits and it reads local data on load, against the no-remembered-state rule. Worth revisiting if tabs disappoint. |
| A6 | A "Saves your data" / "One-off" marker on each card, no groups | Not chosen. Adds a mark to every card; the split is the author's goal. |
| A7 | Redirect deleted routes to the home page | Rejected by author: 404 is fine, with a custom not-found page. |
| A8 | Hand-rolled tabs | Rejected by author: use shadcn Tabs for built-in keyboard and screen-reader support. |
| A9 | Keep the Debt category for future tools | Rejected by author: remove now, re-add in about three lines if needed. |

## Key Decisions & Staging for Next Steps

**Decided by the author**
* Tabs, always opening on Tracking Tools. Final design; no trial.
* Ten Tracking Tools and two Calculators as listed. Savings Goal is a Tracking Tool.
* Labels "Tracking Tools" and "Calculators", with the subtitles in the Overview.
* Names: FIRE Planner, Dividend Planner, Compound Interest Calculator. CPF tools become "CPF Special Account (SA)", "CPF Medisave Account (MA)" and "CPF Ordinary Account (OA) Annuity". Page headings read from `toolMeta`. Card descriptions for FIRE Planner and Dividend Planner are checked to explain the tool in plain words.
* Intro: "Everything runs in your browser — your numbers stay yours." Footer: "Personal finance tools. No sign-up. Your data stays in this browser." The disclaimer and "Pick your tool. Start immediately." stay.
* Add shadcn Tabs (new dependency `@radix-ui/react-tabs`, discussed and approved).
* Old coming-soon URLs return 404 through a custom not-found page.
* Success: a returning user can find their stuff, with no formal test.

**Left to the draft**
* Exact card descriptions for FIRE Planner and Dividend Planner.
* Wording of other "calculator" copy in `HeroSection`, `SiteHeader` and the "Open Calculator" buttons on the CPF list pages.
* Keeping the `#tools` anchor working, and the Calculators panel present in server HTML.
* Whether to touch historical docs and review reports under `docs/designs/` (default: leave them).

**Stages (proposed)**
| Stage | Work | Acceptance |
| :-- | :-- | :-- |
| 1 | Delete coming-soon tools, `tools/[slug]` page, `comingSoon`, Debt category, `accent`, dead icons. Add `not-found.tsx`. | Build, lint and tests pass; no references to deleted slugs remain. |
| 2 | Add `group` to `Tool`; rename tools in `tools.ts`; headings read from `toolMeta`; update `cpf-sa.test.ts`; reword copy and the FIRE/Dividend descriptions. | Data test: 10 trackers, 2 calculators, unique slugs, every slug has a route folder, no tracker name contains "Calculator". An old export file still imports. |
| 3 | Add shadcn Tabs and a client component fed two lists; wire into `page.tsx`. | Opens on Tracking Tools; arrow keys, Home and End work; subtitle shows for the selected tab; `#tools` still works; Calculators cards in server HTML; 375 px layout checked in Chrome. |
