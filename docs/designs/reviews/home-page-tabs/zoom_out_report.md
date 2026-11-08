# Stage 5: Initial Zoom Out Report

Target: `docs/designs/home-page-tabs.md` (full file, lines 1-352)
Reviewers: egm-zoom-out (completed), egm-inventive-catalyst (completed)

## Zoom Out (egm-zoom-out)

Verdict: passes the context check and is mostly sound. Two Majors, several Nits. Most line references checked against the repo and are accurate.

| ID | Sev | Lines | Finding |
| :-- | :-- | :-- | :-- |
| Z1 | Major | 321-326, 183-187, 201 | `HomeTabs` (client) takes labels and counts from `groupMeta` in `tools.ts`. Importing it from a client file pulls all of `tools.ts` (the `tools` array, `categoryColors`, `liftColor`) into the browser bundle, which is why Alternative J was rejected. Also `HomeTabs` has only two `ReactNode` props, so it has no tool lists to count. Fix: server `page.tsx` passes label and subtitle as props, or `groupMeta` moves to a tiny module with no other imports. Drop the counts, or add a `counts` prop. |
| Z2 | Major | 37, 106-108, 281 | "One place" for names is overstated, and the page count is wrong. Line 108 and 281 say eight pages; the listed pages are seven (FIRE, Dividend, 3 CPF detail, Mortgage, Compound Interest). Five pages stay hand-typed and nothing enforces the rule. Either route all 12 headings through `toolMeta` or narrow the goal. Rewriting Mortgage and Compound headings to the same text is churn unless all 12 are converted. |
| Z3 | Nit | 56-57 | Open Questions are answered later in the document. Close them. |
| Z4 | Nit | 121, 246 | FIRE tagline is described two ways (prefix the existing tagline vs a new sentence). Dividend tagline is "checked and reworded" in one place and "left alone" in another. |
| Z5 | Nit | 125, 258-261 | New test checks are brittle or redundant: exact counts 12/10/2 break when a calculator is added; "every `toolMeta(slug)` resolves" is tautological; category colour coverage is already enforced by `Record<ToolCategory, string>`. Keep the slug-has-folder and no-"Calculator" checks. |
| Z6 | Nit | 231 | `categoryOrder` has no consumer yet is kept, against Alternative K. Delete it or note a follow-up. |
| Z7 | Nit | 98-104, 298-319 | The shadcn CLI route is heavy for one component (components.json, cn.ts, revert globals.css, rewrite classes). The author chose it, so not blocking. `clsx` and `tailwind-merge` are installed but unused in `src`. |
| Z8 | Nit | 238-241, 112 | A custom `not-found.tsx` goes slightly beyond "a 404 is accepted". Fine to keep, but call it optional. |
| Z9 | Nit | 221-331, 209 | Line numbers in the file plan will rot as PR #2 changes files. The "Build break after next dev" item is not a future improvement of this design. |
| Z10 | Nit | 42, 345 | The root goal "a returning user can find their stuff" has no verification (author decision). Back from Calculators landing on Tracking is a known cost. |

## Inventive Catalyst (egm-inventive-catalyst)

Did not read repo source; code claims are taken from the document.

Contradictions the design accepts: (1) nothing hidden vs a compact page; (2) stateless render vs continuity (Back always lands on Tracking); (3) one source of truth for names vs hand-typed headings; (4) standard shadcn install vs the repo's own tokens; (5) server HTML presence vs no-JS usability.

| ID | Sev | Lines | Finding |
| :-- | :-- | :-- | :-- |
| I1 | Major | 47, 135-139, 345 | "Remembering the tab is impossible because of an SSR mismatch" is a false compromise. Server and first client render can stay on `tracking`; after mount, restore from `location.hash` or `sessionStorage` and write back with `history.replaceState`. Back then returns to the same tab, with `forceMount` unchanged. Costs: a brief flash for Calculators users, controlled tab state, hash handling that must not fight `#tools`, more tests. If the no-state rule stays, say it is a product decision, not an SSR limit. |
| I2 | Major | 36-37, 108, 125 | Name drift only partly removed. Add a `ToolHeading slug` component or `useToolName` helper on all 12 pages, and a guard test (or lint rule) that fails when a page `h1` literal differs from `toolMeta`. |
| I3 | Major | 98-104, 298-319 | shadcn `init` then manual reverts is a false compromise. Run `init` and `add tabs` in a throwaway copy, port only `tabs.tsx` and the `package.json` delta, with a pre-written `components.json` that points `utils` at `cn.ts`. `init` may also add dependencies or CSS imports (`tw-animate-css`); line 296 says "whatever the shadcn CLI adds", and line 301 is vague. |
| I4 | Major | 77, 41 | Calculators are unreachable without JS and the design accepts it. Add a `<noscript>` style or a scoped `[hidden]` override to show both panels, or use stacked sections as the no-JS baseline. Also check that `TabsContent` display classes (`flex`, `grid`) do not override the `hidden` attribute (line 321), which would show the inactive panel. |
| I5 | Major | 108 vs 263-281 | Same count error as Z2: eight stated, seven listed. Recount against the repo or use a guard test. |
| I6 | Major | 76, 183-187, 326 | Same props gap as Z1: `HomeTabs` cannot supply counts from `ReactNode` props. Drop counts or pass `counts` or `labels` from the server. |
| I7 | Nit | 189-193, 231 | `categoryOrder` kept as dead code (same as Z6). |
| I8 | Nit | 68 | "Compound Interest comes before the CPF tools in the Calculators tab" is wrong: no CPF tool is in Calculators. |
| I9 | Nit | 49, 109-112, 153-157 | The 404 page could list the 12 live tools or link to `/#tools`. |
| I10 | Nit | 78 | The subtitle shows only on the selected tab; the trigger carries no hint of which tab holds saved data. Consider `title` or `aria-describedby`. |
| I11 | Nit | 125 | "Import matches on keys, not display names" is asserted, not shown. Add one assertion if `adapter.name` is persisted anywhere. |

No false compromise found for: the server/client split, the explicit `group` field, the three-commit order, the merge-conflict risk with PR #2.

## Duplicates across reviewers

Z1 = I6 (props cannot supply counts; `groupMeta` import pulls `tools.ts` into the client). Z2 = I5 (eight vs seven pages) and overlaps I2 (one place for names). Z6 = I7 (`categoryOrder`).
