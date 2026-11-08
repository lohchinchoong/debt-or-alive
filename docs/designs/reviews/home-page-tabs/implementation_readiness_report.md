# Stage 9: Implementation Readiness Report

Target: `docs/designs/home-page-tabs.md`, DetailedRange lines 211-352
Reviewers: egm-implementation-readiness (completed, verdict FAIL), egm-codebase-details (completed, no Blocker; could not run commands), egm-style (completed, no Blocker)

Line numbers in the plan for commits 1 and 2 were checked against the repo and match: `ToolCard` coming-soon branch 53-99; headings at fire 1003, dividend 530, cpf-sa 671, cpf-ma 758, cpf-oa 619, mortgage 748, compound-interest 617; "Open Calculator" at 86/81/81; `cpf-sa.test.ts:22`; `unsavedStore.test.ts` 12-13 and 32/37; `HeroSection.tsx:59`; `SiteHeader.tsx:64`. All 12 live tools have a route folder. No other file in `src` uses `comingSoon`, `accent` or `categoryOrder`.

## Implementation Readiness (egm-implementation-readiness)

| ID | Sev | Lines | Finding |
| :-- | :-- | :-- | :-- |
| R1 | Major | 321, 326, 341 | The `hidden` claim is probably wrong. Radix `TabsContent` sets `hidden={!present}` where `present` is true under `forceMount`, so a force-mounted inactive panel is not hidden and both grids would show. The usual fix is a class such as `data-[state=inactive]:hidden`. Could not confirm because `@radix-ui/react-tabs` is not installed. The plan must state the exact class and the expected SSR markup; the check at line 341 would fail as written. |
| R2 | Major | 293-322 | The shadcn CLI step is non-deterministic: `shadcn@latest` is unpinned; current shadcn may import from the unified `radix-ui` package and add `tw-animate-css` and a `shadcn/tailwind.css` import; "whatever the shadcn CLI adds" and "keep only what Tabs needs, if anything" are open-ended; the `init` answers (style, base colour, `cssVariables`, `rsc`, css path, icon library) are not given; no exact `components.json` or expected `package.json` diff. |
| R3 | Major | 293-322 | Order of operations is wrong: `add tabs` (item 15) is listed before `init` and `components.json` (item 16) but needs it. `cn.ts` (item 17) must exist before `add tabs` so the generated file can import it. Items 18-19 are revert steps. Needs a numbered sequence: create `cn.ts`, run `init`, review and revert `globals.css` and `utils.ts`, run `add tabs`, rewrite classes. |
| R4 | Major | 326 | `HomeTabs` counts have no data source: props are only `{ tracking, calculators }`. If `HomeTabs` imports `groupMeta` from `@/lib/tools`, the client bundle gets `tools`, `categoryColors` and `liftColor` (what Alternative J rejected). Decide: a separate client-safe `src/lib/groupMeta.ts`, or `page.tsx` passes labels (and counts) as props; and whether counts are shown at all. "For example" leaves the label text open. |
| R5 | Major | 238-241 | `not-found.tsx` is unspecified: no explanation text, classes or layout. The deleted `[slug]/page.tsx` has a ready layout (`min-h-screen flex flex-col items-center justify-center`, h1 `text-4xl font-bold mb-4`, a gradient `GuardedLink`) to copy. Say whether `SiteHeader` (a client component using `ThemeToggle`) works inside the not-found boundary. |
| R6 | Major | 258-261 | `tools.test.ts` gaps: no path resolution for `src/app/tools` (`process.cwd()` or `import.meta.url`); nothing tests `groupMeta`; the `toolMeta(slug)` check is trivial; no assertions on exact renamed names or the FIRE tagline; vitest runs only `src/**/*.test.ts` in node, so `HomeTabs` and `not-found` get no automated test, and the plan should say which manual steps stand in for them. |
| R7 | Minor | 217-219 vs 328-331 | Commit 2 is titled "Group field, renames and copy" but the intro and footer copy sit in file 22 (commit 3). Also say that in commit 2 `page.tsx` still renders every tool unchanged. |
| R8 | Nit | 331 | The intro edit is ambiguous: current text is "No account required. Every calculator runs in your browser — your numbers stay yours." State whether "No account required." is dropped. |
| R9 | Nit | 273-276 | "Matching slug" is not spelled out. List `cpf-sa-calculator`, `cpf-ma-calculator`, `cpf-oa-annuity-calculator` and the `toolMeta` import for each file; same for file 12. |
| R10 | Nit | 236 | `accentColor` handling is ambiguous (used at ToolCard lines 117, 148, 156): keep a constant or inline it? `ToolCardProps = Tool` makes `group` a required prop, harmless for the spread in `page.tsx`; `ToolCard` ignores it. |
| R11 | Nit | 321 | The 44 px target and full-width list have no concrete classes (for example `min-h-11`, `w-full grid grid-cols-2`); the focus ring is a bare `var(--primary)`. |
| R12 | Nit | 337 | `npx tsc --noEmit` is also affected by stale `.next/dev/types`; run it after `rm -rf .next/dev`. |
| R13 | Nit | 15-19, 296 | "Per CLAUDE.md" approval: CLAUDE.md only says to discuss trade-offs. Cite the author's decision (Alternatives H and I). |

## Codebase Details (egm-codebase-details)

| ID | Sev | Lines | Finding |
| :-- | :-- | :-- | :-- |
| K1 | Major | 321, 340-341 | Same as R1: `forceMount` keeps the inactive panel visible; the plan never gives the class that hides it. |
| K2 | Major | 293-306 | Same as R2: open-ended dependency list (the Performance NFR at line 201 says "one new client dependency"); `init` flags and answers missing; item 18 is conditional ("if anything"). |
| K3 | Major | 281, 108 | "Eight headings" is wrong: the plan lists seven and a grep of "Calculator" in `src` finds exactly seven headings. |
| K4 | Major | 241, 321-326, 333 | Copy and design values left open: not-found text and classes; trigger label and count format; the touch-target class; how `tools.test.ts` resolves the path; no test for `groupMeta`. |
| K5 | Major | 217-222 | `tools.ts` appears twice (items 2 and 5) without exact before/after per pass; `cpf-sa.test.ts` fails the moment the name changes, so item 5 must land before items 6-7 in commit 2. No per-commit list of touched tests. |
| K6 | Nit | 337 | `HomeTabs.tsx` renders no links, so the "uses `GuardedLink`" claim applies only to `not-found.tsx`. |
| K7 | Nit | 296 | "Per CLAUDE.md the trade-off was discussed" is not in CLAUDE.md (same as R13). |
| K8 | Nit | 236 | Wallet is also used today by `hysa-tracker`, whose icon `TableProperties` is not in `ICONS` and falls back to Wallet. Say so, so nobody deletes it. |
| K9 | Nit | 231 | Removing `comingSoon` and `accent` means removing the destructured props at `ToolCard.tsx:48`, and `accentColor` is used at lines 117, 148 and 156. |
| K10 | Nit | 291 | `SiteHeader.tsx` lines 61-64 already say "personal finance tools"; only the word "calculators" on line 64 changes (the plan is correct). |

## Style (egm-style)

| ID | Sev | Lines | Finding |
| :-- | :-- | :-- | :-- |
| W1 | Major | 217-219, 221-331 | Order of work says "Files 1 to 4 / 5 to 14 / 15 to 22" but items 2 and 5 are the same file, and commit 1 also adds `not-found.tsx`, which its title ("Delete ... dead code") does not describe. |
| W2 | Major | 295 | "and whatever the shadcn CLI adds" is unbounded; "Per CLAUDE.md" cites a private file and gives no trade-off. Use the decision itself, in imperative mood. |
| W3 | Major | 321 | "44 px high" has no verification step in the Verification Plan. |
| W4 | Major | 311, 348 | "look right" and "unchanged" have no pass criterion. Use a testable statement (tokens used; no computed-colour diff or a screenshot comparison). |
| W5 | Major | 336 | "The existing import and export tests confirm old export files still import" names no test file. Name them or say "expected". |
| W6 | Nit | 241 | "Mobile first." is a fragment; "a one-line explanation" gives no text. |
| W7 | Nit | 231 | "(the array stays; it has no other user, ...)" reads as a contradiction. |
| W8 | Nit | 281 | "in one place" is vague; say "read from `toolMeta`". |
| W9 | Nit | 296, 301, 311 | "Keep the style choices that do not touch colour" is undefined; 301 and 311 overlap. |
| W10 | Nit | 316 | Write the command in full: `git checkout src/lib/utils.ts`. |
| W11 | Nit | 326, 331 | "for example" leaves labels unspecified; two sources for the same copy (`groupMeta` and the Overview). |
| W12 | Nit | 266, 276 | Hard-coded line numbers go stale after earlier commits; add "at the current commit" once, or quote heading text. |
| W13 | Nit | 345 | "(accepted)" has no source; link to Future Improvements. |
| W14 | Nit | 338 | "None set for the repo" is filler. |
