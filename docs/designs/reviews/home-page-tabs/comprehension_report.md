# Stage 6: Comprehension Test Report

Target: `docs/designs/home-page-tabs.md` (FeatureRange 1-210, DetailedRange 211-352)
Reviewer: egm-comprehension (completed). Read the document alone.

## What this proposes

The home page currently shows 17 tools in one grid: 12 live and 5 "coming soon". The change deletes the 5 coming-soon tools and the code that supports them (the Debt category, the `comingSoon` and `accent` fields, the `[slug]` placeholder page, and the `ToolCard` branch). It then splits the 12 live tools into two shadcn tabs. "Tracking Tools" holds 10 tools that keep the user's own data and always opens first. "Calculators" holds 2 one-off tools (Compound Interest and Mortgage). Each tool gets a hand-set required `group` field. The 10 tracking tools drop "Calculator" from their names. FIRE and Dividend become "Planner". Tool page headings are changed to read their name from `toolMeta`. The intro, footer, hero and header copy are updated, and a custom `not-found.tsx` is added. A manual shadcn CLI install is also needed (`components.json`, `cn.ts`, a revert of `globals.css`, and a Tabs wrapper). The page stays a server component. A thin client `HomeTabs` takes two pre-rendered grids as props, and both panels are always in the HTML.

## How the existing system works, per this document

`src/lib/tools.ts` is the single list of tools, with category, `comingSoon`, `accent`, `categoryOrder` and `categoryColors`. `src/app/page.tsx` renders one flat grid of `ToolCard`s. Coming-soon tools render through a separate `ToolCard` branch and a `tools/[slug]/page.tsx` placeholder. Tool page headings are typed by hand, so they can differ from the card names. `toolMeta` supplies the names shown in the "unsaved changes" prompt, from PR #2's explicit-Save work (not merged). Explicit Save stores data in the browser, but the footer still says "No data stored". The repo has no shadcn, no `components.json` and no Radix. `src/lib/utils.ts` already holds chart and ID helpers, and `--primary` is already defined in `globals.css` with a different meaning.

No section was impossible to paraphrase, so there is no Blocker.

## Findings

| ID | Sev | Lines | Finding |
| :-- | :-- | :-- | :-- |
| C1 | Major | 56-57 vs 118-121, 246 | Open Questions say the copy will be proposed later "for the author's approval", and the implementation section does propose it, but nothing marks the questions as resolved. A reader cannot tell if the copy is decided. Close the questions or mark the proposals as pending. |
| C2 | Major | 77, 91, 321 | The doc says `forceMount` puts both panels in the HTML with `hidden` on the inactive one, but does not explain how `forceMount` produces `hidden`. Without JS the first panel shows only if `hidden` is rendered on the server; this is not stated. |
| C3 | Major | 41 vs 77 | The goal says Calculators cards are in the server HTML, but they are present and unreachable without JS. The reason for the goal (SEO, crawlers or no-JS access) is never given. |
| C4 | Major | 68 vs 65, 340 | "Compound Interest comes before the CPF tools in the Calculators tab" is wrong: no CPF tool is in Calculators. The Calculators tab order is unclear. |
| C5 | Major | 108, 263-281 | "Eight pages" but seven are listed. Item 11 says Mortgage and Compound headings "keep their wording" without stating the wording. |
| C6 | Major | 112, 337, 241 | `GuardedLink` is never defined, and the link to the unsaved-changes prompt is not made. It is unclear why a not-found page needs a guarded link. `DataPortability` (86, 331) and `DebtProgressCard` (291) are also undefined. |
| C7 | Major | 98-104, 293-319 | The shadcn install sequence is hard to follow. `shadcn init` asks interactive questions and the doc does not say which answers give "no colour theming". Order of `init` and `add tabs` is only implied. It is unclear who creates `cn.ts`. Line 296 refers to CLAUDE.md for an approval rule without describing it. |
| C8 | Major | 217-219 vs file numbering | Commit 1 is "Files 1 to 4", but file 2 and file 5 are both `tools.ts`. Commit 1 removes `accent`, `comingSoon` and `Debt`, but `ToolCard` and `page.tsx` read them. The claim that each commit builds is not shown. The intro/footer edits (file 22) fall in commit 3 although the Overview groups them with copy. |
| C9 | Major | 56, 118, 121, 246 | The Dividend tagline is "checked and reworded only if" in one place and "left alone" in another. The current tagline text is never shown. |
| C10 | Nit | 231, 261, 63 | `categoryOrder` is kept though "it has no other user". The test claims a category check against `categoryColors`, so it is unclear which governs display. |
| C11 | Nit | 16, 36, 256, 246 | The slug vs display name distinction is never stated; `cpf-sa-calculator` (slug) can be mistaken for a display name. |
| C12 | Nit | 47 vs 345 | Back from a Calculators tool landing on Tracking Tools is a UX consequence stated only in passing, with no reason for why it is acceptable. |
| C13 | Nit | 42, 51 | "A returning user can find their stuff" is listed as a Goal while "a formal success test" is a Non-Goal. "Find their stuff" is vague. |
| C14 | Nit | 209, 226 | "Static routes take priority" assumes Next.js routing knowledge. The `next dev` build break is not a "future improvement". |
| C15 | Nit | 18, 203 | PR #2 / `feat/explicit-save` is mentioned without a link, and the doc does not say whether this branch is based on it or on `main`. |
