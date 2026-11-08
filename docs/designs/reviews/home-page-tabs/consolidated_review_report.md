# Consolidated Review Report: Home Page Tabs

Target: `docs/designs/home-page-tabs.md` (352 lines; FeatureRange 1-210, DetailedRange 211-352)
Mode: consolidated, uninterrupted. The document was not edited during the review.

Stage reports (same folder): `zoom_out_report.md` (Z, I), `comprehension_report.md` (C), `critic_report.md` (D, S, Y), `intermediate_zoom_out_report.md` (ZO), `implementation_readiness_report.md` (R, K, W).

All 14 reviewer runs completed (zoom-out x2, inventive-catalyst, comprehension, design, structural, style x2, implementation-readiness, codebase-details). None is recorded as not run. The codebase-details reviewer and the inventive-catalyst reviewer could not run commands, so no build, lint or test was executed by any reviewer.

## Verdict

The design is sound at its core. No reviewer disputes the `group` field, the thin client `HomeTabs` shell with server-rendered panels, or the three-commit order. Line numbers for commits 1 and 2 match the repo.

It is not ready to implement. Commit 3 (shadcn Tabs) has an unspecified install and a probable wrong claim about `hidden`, and the document contradicts itself in several places.

## Priority 1: fix before implementation

| # | Action | Evidence | Sources |
| :-- | :-- | :-- | :-- |
| P1 | **The `hidden` claim is probably wrong.** Radix `TabsContent` sets `hidden={!present}`, which is false under `forceMount`, so both grids would show. State the exact class (for example `data-[state=inactive]:hidden`) and the expected SSR markup, and fix the check at line 341. Verify once the package is installed. Not confirmed by any reviewer because `@radix-ui` is not in `node_modules`. | Two independent reviewers reached the same conclusion from memory of Radix's source. | R1, K1, C2, D5 |
| P2 | **`HomeTabs` props cannot supply label or counts.** A client import of `groupMeta` from `tools.ts` ships `tools`, `categoryColors` and `liftColor` to the browser (what Alternative J rejected). Decide: `page.tsx` passes labels and subtitles as props (simplest), and drop the counts. | `HomeTabs` takes only two `ReactNode` props. | Z1, I6, R4, ZO-5 |
| P3 | **Heading count and "one place" claim.** "Eight pages" is wrong: seven are listed and a grep finds seven. Either narrow the goal to "the seven pages that change read from `toolMeta`" or convert all 12 by hand. A `ToolHeading` component and a heading guard test are scope creep per ZO-4; the inventive-catalyst asked for them (I2). | grep of "Calculator" in `src` | Z2, I5, I2, C5, D7, Y6, K3, ZO-4 |
| P4 | **shadcn install is under-specified.** Give a numbered sequence (create `cn.ts`, run `init`, revert `globals.css` and `utils.ts`, run `add tabs`, rewrite classes), pin the CLI version, give the `init` answers or a pre-written `components.json`, and bound the expected `package.json` diff (current shadcn may use `radix-ui` and add `tw-animate-css`). State the end state once and the check that proves it. Consider the throwaway-copy approach (I3). | `shadcn@latest` is unpinned; `add` needs `components.json`. | R2, R3, K2, D5, C7, Y5, I3, ZO-6, W2, W9 |
| P5 | **Open Questions are stale.** Both are answered in the Technical Plan. Delete them, settle one FIRE tagline (line 246 gives the text) and "leave Dividend alone", and remove "checked and reworded only if" at line 121. | Self-contradiction. | Z3, Z4, C1, C9, D4, S3, Y8, ZO-7 |
| P6 | **Goal "A returning user can find their stuff" has no check** and duplicates a Non-Goal. Replace with a testable goal already in the plan ("Tracking Tools is selected on every load"), or state why a subjective criterion is acceptable. | Lines 42 and 51. | Z10, C13, D3, S4, Y3, ZO-11 |
| P7 | **No Risks & Mitigations section.** Add a short one covering three real risks: PR #2 merge order, shadcn CLI side effects, `forceMount`/`hidden` behaviour. Pair each with a check already in the Verification Plan. Do not add new work. | Standard requires it; risks are scattered. | D2, S1, ZO-2 |
| P8 | **Commit split is inconsistent.** Commit 1 includes `not-found.tsx` (not described by its title); commit 2 is titled "renames and copy" but the intro and footer copy are in commit 3; items 2 and 5 are the same file. Rename the commits, note that `page.tsx` is unchanged in commit 2, and put item 5 before items 6-7. | Lines 217-219, 328-331. | C8, R7, K5, W1 |
| P9 | **`not-found.tsx` and other copy are unspecified.** Give the explanation text, classes (copy the deleted `[slug]/page.tsx` layout), and whether `SiteHeader` works inside the boundary. State whether "No account required." stays in the intro. Give the label text and a 44 px class (for example `min-h-11`). | `[slug]/page.tsx` has a ready layout. | R5, R8, R11, K4, W6, W11 |
| P10 | **No-JS goal and claim disagree.** Line 41 says the Calculators cards are in the server HTML; without JS they stay hidden. Reword the goal so it promises crawlable HTML, not reachability. Do not add a `<noscript>` override (ZO-3). Keep one manual check that display classes do not override `hidden`. | Tools are client-rendered and need JS anyway. | C3, D6, Y4, I4, ZO-3 |

## Priority 2: fix while editing

| # | Action | Sources |
| :-- | :-- | :-- |
| P11 | `tools.test.ts`: drop the exact 12/10/2 counts, the tautological `toolMeta` check and the `categoryColors` check; keep slug-has-folder, unique slugs and no "Calculator" in tracking names; say how the path is resolved; add a `groupMeta` check if it stays in `tools.ts`; say which manual steps stand in for `HomeTabs` and `not-found`. | Z5, R6, K4, ZO-10 |
| P12 | Line 68 is wrong (no CPF tool is in Calculators). Delete the clause and say "array order". | I8, C4, D8, Y2, ZO-8 |
| P13 | Scope the Overview sentence "Calculator is dropped from every Tracking Tool name" to the ten Tracking Tools (Compound Interest gains the word). Name "CPF Ordinary Account (OA) Annuity" unambiguously. | Y1, Y2, C11 |
| P14 | `categoryOrder` has no consumer. Delete it in commit 1 (Alternative K rejects dead code), or state why it stays. | Z6, I7, C10, Y7, ZO-9, W7 |
| P15 | Move the `next dev` build break out of Future Improvements into a note or the Verification Plan. | D11, S9, Y16, ZO-12 |
| P16 | State the PR #2 merge-order decision once (build on PR #2 or rebase); remove the repeats at lines 18 and 203. | Y7, C15, S5, ZO-15 |
| P17 | Make verification claims testable: name the import/export test files or say "expected"; replace "look right" with a stated criterion; add a manual check for the 44 px target; run `tsc` after `rm -rf .next/dev`. | W3, W4, W5, R12, I11 |
| P18 | Cite the author's decision (Alternatives H and I) instead of "Per CLAUDE.md"; use imperative mood for item 15. | R13, K7, W2 |
| P19 | `ToolCard`: say how `accentColor` is handled (constant or inline) and that the destructured props at line 48 go; say Wallet stays because `hysa-tracker` falls back to it. | R10, K8, K9 |
| P20 | Rewrite the unclear sentences: `categoryOrder` parenthetical (line 231), "loses four things" (line 62), "clash in two places" (lines 99-100), "in one place" (line 281). | W7, W8, Y5, Y17 |

## Contested findings (need the author's decision)

| Item | Positions |
| :-- | :-- |
| **Rejection rationales** (all eleven alternatives read "Rejected by author", no links) | Design critic rates it a **Blocker** (D1, with S2, Y13). The intermediate zoom-out rates it a **Nit** (ZO-1): the author's decision is a legitimate reason for a small UI change, and eleven alternatives is already too many. Zoom-out suggests folding or deleting A, F, G, H, I, K. The author decides: add a short technical reason to each, or shorten the list. |
| **Remember the tab after mount** (I1) | Inventive-catalyst calls "SSR mismatch" a false compromise: render `tracking`, then restore from hash or `sessionStorage` after mount. The author ruled out remembered and URL-linked tabs. If the rule stays, reword the document so it presents this as a product decision, not an SSR limit. |
| **Heading guard** (I2) | Inventive-catalyst proposes a `ToolHeading` component and a guard test; zoom-out calls it scope creep. See P3. |
| **Throwaway-copy shadcn install** (I3) | Inventive-catalyst proposes running the CLI in a scratch copy; zoom-out finds it reasonable and consistent with the author's choice. Optional wording in P4. |

## Priority 3: nits (apply if cheap)

Numerals vs words (Y9); drop "and may be sensitive" (Y10); drop duplicated sentence at line 30 (Y10, Y11); process narration "The author asked/chose" (Y13); "if tabs disappoint" and "if Calculators users complain" have no trigger (Y14); filler words in Alternatives (Y15); unverified claims about PR #2 and `main` (Y16, Y18); headings differ from the standard's names (S6); inconsistent horizontal rules (S7); diagram indentation (S10); drop the `HomeTabs` mention from the `GuardedLink` check (K6); `SiteHeader` line note (K10); `git checkout` command in full (W10); hard-coded line numbers will rot, prefer names (ZO-14, W12); "(accepted)" needs a source (W13); filler "None set" (W14); not-found should not grow into a tool list (ZO-13, I9); `title`/`aria-describedby` on triggers (I10); bundle-size figure (D9); which docs are in scope for the rename (D10).

## Traceability matrix

| Consolidated | Raw findings |
| :-- | :-- |
| P1 | R1, K1, C2, D5 |
| P2 | Z1, I6, R4, ZO-5 |
| P3 | Z2, I2, I5, C5, D7, Y6, K3, ZO-4 |
| P4 | R2, R3, K2, D5, C7, Y5, I3, ZO-6, W2, W9 |
| P5 | Z3, Z4, C1, C9, D4, S3, Y8, ZO-7 |
| P6 | Z10, C13, D3, S4, Y3, ZO-11 |
| P7 | D2, S1, ZO-2 |
| P8 | C8, R7, K5, W1 |
| P9 | R5, R8, R11, K4, W6, W11 |
| P10 | C3, D6, Y4, I4, ZO-3 |
| P11 | Z5, R6, K4, ZO-10 |
| P12 | I8, C4, D8, Y2, ZO-8 |
| P13 | Y1, Y2, C11 |
| P14 | Z6, I7, C10, ZO-9, W7 |
| P15 | D11, S9, Y16, ZO-12 |
| P16 | Y7, C15, S5, ZO-15 |
| P17 | W3, W4, W5, R12, I11 |
| P18 | R13, K7, W2 |
| P19 | R10, K8, K9 |
| P20 | W7, W8, Y5, Y17 |
| Contested | D1 / S2 / Y13 vs ZO-1; I1; I2; I3 |
| Nits | Z7-Z9, D9-D10, S5-S10, Y9-Y18, C12, C14, I9-I10, ZO-13-14, R9, R12, K6, K10, W10-W14 |

## Resolution (applied to `docs/designs/home-page-tabs.md`)

All Priority 1 and Priority 2 actions were applied in one pass; the file was rewritten and the previous version kept only in the session scratchpad. Not re-audited by fresh reviewers.

| Action | What changed |
| :-- | :-- |
| P1 | Inactive panel hidden with `data-[state=inactive]:hidden` on each `TabsContent`; the plan now says Radix only sets `data-state`; manual check = view-source plus visual. Still unverified until the package is installed (Risks table). |
| P2 | `HomeTabs` takes a `labels` prop from the server page; `ToolGroup` imported with `import type`; tool counts dropped. |
| P3 | Goal narrowed to the five headings whose text changes (FIRE, Dividend, 3 CPF detail pages). Mortgage and Compound Interest are no longer edited (old item 12 removed). `ToolHeading` component and heading guard test not added. |
| P4 | Install is a fixed seven-step sequence (item 15) with a bounded end state; CLI version and added package recorded in the commit message. |
| P5 | Open Questions replaced with "None"; one FIRE tagline; Dividend tagline unchanged. |
| P6 | Goal replaced with "Tracking Tools is selected on every load"; the "find their stuff" test is listed in Non-Goals. |
| P7 | New Risks & Mitigations table (six rows, each with a check). |
| P8 | Commits renamed; intro and footer copy moved into commit 2 (item 14); items 2/5 and 14/18 noted as two passes over the same file. |
| P9 | `not-found.tsx` spec copied from the deleted page with exact strings and classes (no `SiteHeader`); intro keeps "No account required."; trigger classes given. |
| P10 | No-JS goal reworded to "crawlable"; `<noscript>` listed as a Non-Goal. |
| P11-P20 | Test narrowed to uniqueness, route folder, tracking names, `groupMeta` keys, six exact renames; line 68 fixed; Overview scoped; `categoryOrder` deleted; build-break note moved to Verification; PR #2 decision stated once in the header block; verification claims named; CLAUDE.md citation replaced; `accentColor` and Wallet handled; unclear sentences rewritten. |

Decisions I made on the contested items (the author can reverse them):
*   **Rejection rationales**: kept all eleven alternatives, each with one concrete technical or scope reason, instead of deleting any.
*   **Remembered tab**: Alternative B now states the restore-after-mount approach and says the rule is a product decision, not an SSR limit.
*   **Heading guard**: not added.
*   **Throwaway-copy shadcn install**: not adopted; the in-repo sequence with reverts follows the author's choice.
