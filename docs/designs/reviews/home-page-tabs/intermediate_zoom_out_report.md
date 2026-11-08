# Stage 8: Intermediate Zoom Out Report

Target: `docs/designs/home-page-tabs.md` (full file, lines 1-352)
Reviewer: egm-zoom-out (completed). Read the persona, the standard, the document and the Stage 5, 6 and 7 reports, and spot-checked the repo.

Verdict: passes the context and root-problem checks. No Blockers. The `group` field, the thin client `HomeTabs` shell and the three-commit order are sound. The Critic's D1 Blocker (rejection rationales) is downgraded to a Nit. Several asks from the later stages would push the design to the wrong altitude or add scope.

Repo checks: `categoryOrder` (`tools.ts:146`) has no consumer in `src`. `clsx` and `tailwind-merge` are in `package.json` but unused in `src`; no Radix or `tw-animate` packages are present. `toolMeta.ts` imports only `@/lib/tools`.

| ID | Sev | Lines | Finding and recommendation |
| :-- | :-- | :-- | :-- |
| ZO-1 | Nit (Critic says Blocker) | 133-193 | "Rejected by author" is a legitimate reason for a small UI change; eleven alternatives is already too many. Keep rejection lines short and fold or delete the ones that restate the requirement (A, F, G, H, I, K). Do not expand them. |
| ZO-2 | Major (scope risk) | whole doc | A Risks section is needed, but only as a few lines listing three real risks: PR #2 merge order, shadcn CLI side effects, `forceMount`/`hidden` behaviour. Each gets a one-line check already in the Verification Plan. Do not add work items (`<noscript>`, version pin study, bundle size, bookmark study). |
| ZO-3 | Major | 41, 77 | Do not add a no-JS override: the tools are client-rendered and need JS anyway. Reword the goal so it does not promise reachability ("both panels are in the server HTML so the content is crawlable"). Keep one cheap manual check that `TabsContent` display classes do not override `hidden`. |
| ZO-4 | Major | 37, 106-108, 263-281 | Fix the count (seven, not eight). Reject the `ToolHeading` component and heading-literal lint rule as scope creep. Either narrow the goal to "the seven pages that change read from `toolMeta`" or convert all 12 by hand. Mortgage and Compound already show the right text, so the narrowed option is simpler. Drop the planned heading guard test. |
| ZO-5 | Major | 321-326, 76, 183-187 | `HomeTabs` (client) importing `groupMeta` from `tools.ts` ships the whole list to the browser, which Alternative J rejected, and it has no lists to count. Drop the counts; have the server `page.tsx` pass labels and subtitles as props. |
| ZO-6 | Major | 98-104, 293-319 | Author chose the CLI, so not blocking. State the end state once (only `tabs.tsx`, the `package.json` change and `cn.ts` land; `globals.css` and `utils.ts` unchanged) and the check that proves it; collapse items 16-19. Interactive CLI answers are implementation detail. `cn.ts` exists only because the generated `tabs.tsx` imports `cn`; confirm that, or inline a plain class string. |
| ZO-7 | Major | 54-57, 118-121, 246, 202 | The Open Questions are answered later. Delete them, keep the proposals as decided, settle one FIRE tagline (line 246) and "leave Dividend alone"; remove "checked and reworded only if" at line 121. |
| ZO-8 | Nit | 68 | "Compound Interest comes before the CPF tools in the Calculators tab" is false. Delete the clause and say "array order". |
| ZO-9 | Nit | 231, `tools.ts:146` | `categoryOrder` has no consumer. Delete it in commit 1. |
| ZO-10 | Nit | 125, 258-261 | The new test is brittle. Drop the exact 12/10/2 counts, the tautological `toolMeta` check and the `categoryColors` check (enforced by the `Record` type). Keep slug-has-folder, unique slugs, and no "Calculator" in tracking names. |
| ZO-11 | Nit | 42, 51 | "A returning user can find their stuff" is a goal with no check. Move it out of Goals; replace it with "Tracking Tools is selected on every load". |
| ZO-12 | Nit | 207-209 | The `next dev` build break is not a future improvement. Delete it or make it a note; the `rm -rf .next/dev` workaround in the Verification Plan can stay. |
| ZO-13 | Nit | 112 | Custom `not-found.tsx` is beyond the accepted 404, but small. Keep it; do not grow it into a tool list. |
| ZO-14 | Nit | 221+ | Line numbers in the file plan will rot as PR #2 changes files. Prefer names. |
| ZO-15 | Nit | 18, 203 | Make one decision on merge order for PR #2 and state it once. |

Altitude summary. Too low: items 16-19, per-file line numbers, interactive CLI answers. Too much scope if the later stages are followed: a `ToolHeading` component and guard tests, `<noscript>` handling, expanded rationale for all 11 alternatives, a bundle-size figure, a version-pin study. Only ZO-5 and ZO-4 change the design itself.

Recommended edit order: ZO-5, ZO-4, ZO-7, ZO-8, ZO-9, ZO-10, ZO-11, collapse shadcn (ZO-6), minimal risks note (ZO-2), short rejections (ZO-1).
