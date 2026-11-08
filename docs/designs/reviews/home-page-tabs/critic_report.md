# Stage 7: Critic Review Report

Target: `docs/designs/home-page-tabs.md`, FeatureRange lines 1-210
Reviewers: egm-design (completed), egm-structural (completed), egm-style (completed)

## Design (egm-design) — verdict: not passing as written (D1, D2)

| ID | Sev | Lines | Finding |
| :-- | :-- | :-- | :-- |
| D1 | Blocker | 133-193 (Alternatives A-K) | Every "Reason for Rejection" is "Rejected by author", with no link. The standard needs concrete technical or scope trade-offs. A, F and G restate the requirement instead of arguing against the option. H is "smallest diff" with only drift as a con, with nothing weighed against the CLI clashes the doc describes at lines 100-104. |
| D2 | Major | whole range | No Risks & Mitigations section. Only one risk is named (line 203, merge conflicts with PR #2) and it has no mitigation. Unaddressed: Calculators discoverability; users searching for "calculator" after the word is removed from 10 names; `shadcn init` side effects with no verification gate; `forceMount` + `hidden` behaviour asserted without proof (line 77); bookmarks to the five deleted routes now 404. |
| D3 | Major | 42, 51 | The goal "A returning user can find their stuff" has no check. Add a lightweight acceptance check (manual task script, tap count) or say plainly why a subjective criterion is acceptable. |
| D4 | Major | 56-57 vs 118-121 | Open Questions contradict the Copy changes section, which already proposes answers. The FIRE description question points to a "Detailed Implementation section" and line 202 to "order of work", both outside lines 1-210. |
| D5 | Major | 79, 100-104 | shadcn install assumptions are unverified: "two clashes", `bg-muted`-style tokens, compatibility with the repo's Tailwind and React. No `shadcn` or Radix version is pinned. Name which `globals.css` additions are kept (line 102 says "anything Tabs needs"). |
| D6 | Major | 41, 77, 200 | The no-JS claim conflicts with the goal: cards are in the HTML but the second panel stays `hidden`. State who is affected and why that is acceptable, or add a `<noscript>`/CSS fallback. Accessibility claims have no planned check. |
| D7 | Major | 108, 125 | "`toolMeta` ... has no server-only code, so client pages can call it" is asserted, not verified. Eight headings are edited but only a data test is planned, so nothing guards heading-versus-card consistency (line 37). |
| D8 | Nit | 68 | "Compound Interest comes before the CPF tools in the Calculators tab" is wrong. |
| D9 | Nit | 201 | No bundle-size figure for Radix Tabs; state it or say why it is negligible. |
| D10 | Nit | 36, 38, 40, 112 | Which docs are in scope for the rename (line 52 excludes historical docs); the four icons are not named; `GuardedLink` and the lint rule are not cited by file. |
| D11 | Nit | 207-209 | The `next dev` build break is a pre-existing issue, not a future improvement. |

## Structural (egm-structural)

Hierarchy is sound, with no skipped heading levels.

| ID | Sev | Lines | Finding |
| :-- | :-- | :-- | :-- |
| S1 | Major | 195-210 | No Risks & Mitigations section (same as D2). Risk content is scattered: the PR #2 risk is in NFRs, the build break is under Future Improvements. |
| S2 | Major | 133-193 | All eleven rejections read "Rejected by author" with no links, several restating the decision (same as D1). A's cons contradict its pros. |
| S3 | Major | 54-57 | Open Questions point at a "Detailed Implementation section" that is not in the reviewed range, and the questions are neither closed nor pointed at a real section. FIRE and Dividend descriptions are still undecided (line 121 covers taglines only). |
| S4 | Major | 42 | A non-goal written as a goal; duplicates Non-Goals line 51 and has no measurable form. |
| S5 | Nit | 1-5, 18 | PR #2 is not linked; no reviewers or approvals field. |
| S6 | Nit | 9-18, 20, 59 | Headings differ from the standard's names ("The Problem", "Technical Plan (Architecture)"). |
| S7 | Nit | 7, 195 | Horizontal rules used inconsistently. |
| S8 | Nit | 197-203 | "(see order of work)" at line 202 points to a section outside the range; confirm it exists. |
| S9 | Nit | 209 | Build-break bullet misfiled under Future Improvements. |
| S10 | Nit | 89-90 | The diagram shows `Tabs` as a child of `HomeTabs` under the `/>` line; fix the indentation. |

## Style (egm-style)

No Blockers.

| ID | Sev | Lines | Finding |
| :-- | :-- | :-- | :-- |
| Y1 | Major | 11, 16, 36, 67 | "Calculator is dropped from every Tracking Tool name" reads as universal while Compound Interest gains it. Scope the sentence to the ten Tracking Tools. |
| Y2 | Major | 13, 65-68 | Line 68 is wrong against the document's own definitions (no CPF tool is in Calculators). "CPF Ordinary Account (OA) Annuity" reads like a mislabel; name it unambiguously. |
| Y3 | Major | 42, 51 | Goal 42 has no criterion; add one (for example "Tracking Tools is selected without a click on every load") or move it to Non-Goals. |
| Y4 | Major | 41, 77-78 | Claim calibration: state whether the goal is crawlable HTML or user-visible content, and mark the `forceMount` behaviour as expected or cite a test. |
| Y5 | Major | 99-104 | "Clash in two places" is followed by three bullets, the third not a clash. |
| Y6 | Major | 108 | Long mixed sentence, and "eight pages" lists seven. "Mortgage and Compound keep their wording" vs "every tool page heading changes to read from `toolMeta`" is contradictory in scope. |
| Y7 | Major | 18, 202-203 | PR #2 dependency repeated three times with no decision (merge order or rebase). |
| Y8 | Major | 202, 56-57 | Dangling references to "order of work" and the "implementation section". |
| Y9 | Nit | 11 | Mixed numerals and words. |
| Y10 | Nit | 20-30 | "and may be sensitive" is a speculative hedge; "The proposed solution is..." (line 30) duplicates the Overview. |
| Y11 | Nit | 36, 108 | Two sentences restate each other. |
| Y12 | Nit | 79, 104 | "and so on" and "for example" in a spec. |
| Y13 | Nit | 100, 117, 133-193 | Process narration ("The author asked...") and a repeated "Rejected by author:" prefix that adds nothing. |
| Y14 | Nit | 163, 207, 208 | "if tabs disappoint" and "if Calculators users complain" have no measurable trigger. |
| Y15 | Nit | 174, 180, 185-186, 192 | Filler or vague wording ("anyway", "hurts", "ties the component to one data source", "easy to leave behind unnoticed"). |
| Y16 | Nit | 209 | Build break misfiled; "already exists on main" is unverified. |
| Y17 | Nit | 62-68 | "loses four things" lists more than four. |
| Y18 | Nit | 199 | "matches what explicit Save does" is an unverified claim about PR #2. |

## Cross-reviewer duplicates

Rejection rationale: D1 = S2 = Y13. Missing Risks section: D2 = S1. Goal without a check: D3 = S4 = Y3. Dangling references and Open Questions: D4 = S3 = S8 = Y8. No-JS claim: D6 = Y4. Heading count/scope: D7 = Y6. Line 68: D8 = Y2. Build break misfiled: D11 = S9 = Y16.
