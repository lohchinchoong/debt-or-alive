# Graph Report - debt-or-alive  (2026-11-11)

## Corpus Check
- 135 files · ~170,575 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 1380 nodes · 3099 edges · 86 communities (85 shown, 1 thin omitted)
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 606 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a9239980`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- networth.ts
- package.json
- types.ts
- importBackup
- vitest
- Prioritized Findings (Blockers -> Major -> Nits)
- 🟡 Major
- Part 1: Should the requested additions go into this doc?
- Stage 2: Test setup and the pure core
- Alternatives Considered
- cpf-ma-calculator/page.tsx
- createInputsAdapter
- components.json
- niceMax
- ManualSaveNotice
- registry.ts
- hysa-tracker/[scenarioId]/page.tsx
- saveTool
- GuardedLink
- compilerOptions
- srs-calculator/page.tsx
- SpreadsheetTable
- Stage 5: Initial Zoom Out Report
- Prioritized Findings & AI Suggestions
- savings-goal/[scenarioId]/page.tsx
- Design System Strategy: The Fiscal Atelier
- HomeTabs.tsx
- cpf-oa.ts
- 🟢 Nits
- Prioritized Findings (Blockers -> Major -> Nits)
- Files to Create/Modify/Delete
- cpf-oa-annuity-calculator/page.tsx
- Alternatives Considered
- GuardedLink
- useProfileDraft
- useGuardedRouter
- budget-planner/page.tsx
- emergency-fund/page.tsx
- toolMeta
- app/page.tsx
- Prioritized Findings (Blockers -> Major -> Nits)
- useTheme
- confirmLeave
- cpf-sa.ts
- Alternatives Considered
- Target Files to Create/Modify
- Major
- Stage 8: Intermediate Zoom Out Report
- CPF Ordinary Account (OA) Annuity Calculator
- ProfileAdapter
- ManualSaveNotice
- Target Files to Create/Modify
- Remove the Amt Columns from the HYSA Tracker
- Alternatives Considered
- Stage 3: CPF SA as the first full slice
- Critical User Journeys (CUJs)
- 🟡 Majors
- cpf-ma-calculator/[profileId]/page.tsx
- Technical Plan (Architecture)
- savings-goal/page.tsx
- Alternatives Considered
- Consolidated Review Report, Round 3 (quick run)
- StorageLike
- Debt or Alive — Claude Instructions
- Goldfish Review Report: Implementation Readiness Test (Stage 9), Re-audit
- CPF Ordinary Account (OA) Annuity Calculator
- Explicit Save and "Last saved" Dates
- Stage 6: Export, import and lint rules
- Consolidated Review Report: Home Page Tabs
- Critical User Journeys (CUJs)
- Action items (no decision needed)
- Major
- Consolidated Review Report, Round 4 (quick run)
- Stage 9: Implementation Readiness Report
- liftColor
- Architecture
- Technical Plan (Architecture)
- The Problem
- Consolidated Review Report
- Round 2, Stage 8: Intermediate Zoom Out Report
- Debt or Alive
- ToolAdapter
- Round 2, Stage 5: Initial Zoom Out Report
- Progress Tracker
- Goldfish Review Report: Stage 5, Initial Zoom Out Review
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `saveEntries()` - 59 edges
2. `useToolDraft()` - 54 edges
3. `toolMeta()` - 47 edges
4. `GuardedLink()` - 42 edges
5. `SiteHeader()` - 42 edges
6. `Prioritized Findings (Blockers -> Major -> Nits)` - 42 edges
7. `saveTool()` - 38 edges
8. `useGuardedRouter()` - 37 edges
9. `useProfileDraft()` - 35 edges
10. `ManualSaveNotice()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Risks and Mitigations` --references--> `toSgdCents()`  [INFERRED]
  docs/designs/networth-summary.md → src/lib/networth.ts
- `A5. No single rule for what the Save bar and the date label show` --references--> `SaveResult`  [INFERRED]
  docs/designs/reviews/consolidated_review_report.md → src/lib/persistence/types.ts
- `[Issue A5] [`egm-comprehension`, `egm-zoom-out`, `egm-implementation-readiness`, `egm-style`] - Severity: Major` --references--> `SaveResult`  [INFERRED]
  docs/designs/reviews/goldfish_review_report.md → src/lib/persistence/types.ts
- `Alternative O: A count of dropped profiles in the import summary` --references--> `ImportResult`  [INFERRED]
  docs/designs/cpf-oa-annuity-calculator.md → src/lib/persistence/import.ts
- `Alternative K: Enable Save through the shared hook or a null date` --references--> `ToolRead`  [INFERRED]
  docs/designs/cpf-oa-annuity-calculator.md → src/lib/persistence/types.ts

## Import Cycles
- None detected.

## Communities (86 total, 1 thin omitted)

### Community 0 - "networth.ts"
Cohesion: 0.06
Nodes (79): 10. `src/components/networth/RecordRow.tsx` (Create), 11. `src/lib/tools.ts` (Modify), 12. `src/lib/tools.test.ts` (Modify), 13. `src/lib/persistence/registry.ts` (Modify), 1. `src/lib/networth.ts` (Create), 2. `src/lib/networth.test.ts` (Create), 3. `src/lib/persistence/adapters/networth-summary.ts` (Create), 5. `src/app/tools/networth-summary/page.tsx` (Create) (+71 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (48): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, lucide-react@^1.7.0, next@^16.2.1, @radix-ui/react-tabs@^1.2.1, react@^19.0.0, react-dom@^19.0.0 (+40 more)

### Community 2 - "types.ts"
Cohesion: 0.17
Nodes (16): 🟡 M1. The "only writer" grep check cannot detect what it claims to - Severity: Major, DraftState, initialState(), NEW_PROFILE_ID, UseProfileDraftReturn, DraftState, initialState(), UseToolDraftReturn (+8 more)

### Community 3 - "importBackup"
Cohesion: 0.11
Nodes (32): 12. `src/lib/persistence/import.ts` (Modify, Phase 3), Alternative D: Start every user from default inputs, with no migration, Alternative E: Migrate inside `adapter.read()`, Key Decisions & Staging for Next Steps, Import, 11. `src/lib/persistence/adapters/cpf-sa.ts` (Create), Action items, 🔴 Blocker (+24 more)

### Community 4 - "vitest"
Cohesion: 0.10
Nodes (18): vitest, CPF_OA_DEFAULT_PARAMS, A, B, C, C1, C2, F (+10 more)

### Community 5 - "Prioritized Findings (Blockers -> Major -> Nits)"
Cohesion: 0.05
Nodes (41): A13. Most tools' record types, and the type moves, are left to the implementer, [Issue A13] [`egm-implementation-readiness`, `egm-codebase-details`, `egm-style`, `egm-zoom-out`, `egm-design`] - Severity: Major, 🔴 B1. The "Save" to "Done" button rename targets a button that does not exist - Severity: Blocker, Goldfish Review Report: Implementation Readiness Test (Stage 9), 🟡 M15. The import partial-file rule is untested, and `adaptersForKey` has no caller - Severity: Major, 🟡 M16. Manual QA step 1 cannot be run as written - Severity: Major, 🟡 M17. Manual QA step 3 tests a guarded `push` that cannot be observed - Severity: Major, 🟡 M18. The plan contradicts spec §3 and §4 (router, lint scope, naming) - Severity: Major (+33 more)

### Community 6 - "🟡 Major"
Cohesion: 0.06
Nodes (31): A10. The navigation-guard API is defined twice, and the two versions disagree, A11. The site wordmark is unguarded while stages 4 and 5 are in production, A12. The draft-hook mechanics are unspecified, and the obvious code fails lint, A14. Profile save, delete and create behaviour is incomplete, A15. Test coverage has gaps and doesn't fit the profile adapters, A16. The count of Save pages and the manual QA steps are wrong, A17. The keyboard requirement for the Save bar has no mechanism, A18. Staging builds every piece before any page uses it, and says nothing about the mixed period (+23 more)

### Community 7 - "Part 1: Should the requested additions go into this doc?"
Cohesion: 0.07
Nodes (26): 🟡 1.1 Risks & Mitigations section (Critic 5): include it, but compressed, 🟡 1.2 Rollback fixes (Critic 2): correct the claim, do not add a guard, 🟡 1.3 Fuller alternative trade-offs (Critic 1, a Blocker in Stage 7): cut the list first, 🟢 1.4 Save-bar state table (Stage 6 Nit): add it to §5 in place of prose, 🟢 1.5 Accessibility, design tokens and the CLAUDE.md shadcn line (Critic 14): compress each, 🟢 1.6 Keyboard covering the Save bar (Critic 4): relax the requirement, 🟢 1.7 More CUJs (Critic 12): add three at most, 🟢 1.9 Data fingerprint and conflict check: defer (+18 more)

### Community 8 - "Stage 2: Test setup and the pure core"
Cohesion: 0.25
Nodes (8): 2. `package.json` and `package-lock.json` (Modify), 3. `vitest.config.mts` (Create), 4. `src/lib/formatSavedDate.ts` and `src/lib/formatSavedDate.test.ts` (Create), 6. `src/lib/persistence/equality.ts` and `equality.test.ts` (Create), 7. `src/lib/persistence/save.ts` and `save.test.ts` (Create), 8. `src/lib/persistence/tool.ts` and `tool.test.ts` (Create), 9. `src/lib/persistence/profiles.ts` and `profiles.test.ts` (Create), Stage 2: Test setup and the pure core

### Community 9 - "Alternatives Considered"
Cohesion: 0.07
Nodes (26): Alternative A: One record list with a `section` field, plus flat inputs, Alternative B: Five record lists, one per section, Alternative C: Per-bar chart scale, Alternative D: Clip at the track with an overflow arrow, Alternative E: Pre-filled default rates, or a blank rate counted as 0 or 1, Alternative F: Live exchange rates, Alternative G: Store amounts already converted to SGD, Alternative H: Inputs first, or a sticky summary (+18 more)

### Community 10 - "cpf-ma-calculator/page.tsx"
Cohesion: 0.17
Nodes (14): 26. Adapters `cpf-ma.ts`, `cpf-oa.ts`, `hysa-tracker.ts`, `savings-goal.ts` in `src/lib/persistence/adapters/` (Create), 27. List and detail pages for CPF MA, CPF OA annuity, HYSA tracker and savings goal (Modify), 28. `src/hooks/useCpfMaProfiles.ts`, `useCpfOaProfiles.ts`, `useHysaScenarios.ts`, `useSavingsGoal.ts` (Delete), Stage 4: The other multi-profile tools, CpfMaLandingPage(), EmptyState(), ProfileCard(), StatLine() (+6 more)

### Community 11 - "createInputsAdapter"
Cohesion: 0.12
Nodes (17): Data flow, Enabling Save during a pending migration, Notice, Page, Proposed Architecture, Read path and the pending-migration helper, Reading the legacy key (`readLegacy`), Registry (+9 more)

### Community 12 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 13 - "niceMax"
Cohesion: 0.22
Nodes (19): 32. `src/hooks/useToolState.ts` (Delete) and `src/lib/utils.ts` (Modify), Major, Claims the reviewers checked and found correct, GrowthChart(), BAR_COLORS, BreakdownChart(), DividendCalculatorPage(), fmt() (+11 more)

### Community 14 - "ManualSaveNotice"
Cohesion: 0.18
Nodes (17): NotFound(), calculateGrowth(), CompoundingFreq, CompoundInterestPage(), ContributionTiming, fmt(), FocusInput(), FocusInputProps (+9 more)

### Community 15 - "registry.ts"
Cohesion: 0.13
Nodes (22): 30. Single-state adapters in `src/lib/persistence/adapters/` (Create, 7 files), data(), cpfOaAdapter, dividendAdapter, readProjectionYears(), budgetAdapter, BudgetItem, compoundInterestAdapter (+14 more)

### Community 16 - "hysa-tracker/[scenarioId]/page.tsx"
Cohesion: 0.19
Nodes (20): 1. `src/lib/persistence/adapters/hysa-tracker.ts` (Modify), Goals, Type and defaults, N6. Logic and names from the deleted hooks have no stated destination, CAT_COLORS, GainChart(), HysaTrackerPage(), MONTH_NAMES (+12 more)

### Community 17 - "saveTool"
Cohesion: 0.19
Nodes (13): Verification Plan, 4. `src/lib/persistence/adapters/networth-summary.test.ts` (Create), Terms and existing files, 1. No phasing or ordering; the build breaks mid-plan, 2. Import of a legacy key with no usable winner is undefined and can overwrite real data, Blockers, Nit, Reuse check (+5 more)

### Community 18 - "GuardedLink"
Cohesion: 0.29
Nodes (12): BalanceChart(), calcMonthlyPayment(), calculateAmortization(), fmt(), FocusInput(), InlineInput(), MonthRow, MortgageCalculatorPage() (+4 more)

### Community 19 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 20 - "srs-calculator/page.tsx"
Cohesion: 0.32
Nodes (10): DepositRow(), fmt(), ProjectionChart(), ProjectionPoint, projectSRS(), SRSCalculatorPage(), weightedAvgRate(), yearFromISO() (+2 more)

### Community 21 - "SpreadsheetTable"
Cohesion: 0.36
Nodes (9): 2. `src/app/tools/hysa-tracker/[scenarioId]/page.tsx` (Modify), EditableCell(), fmt(), fmtCompact(), MonthCell(), SpreadsheetTable(), groupTh(), intColor() (+1 more)

### Community 22 - "Stage 5: Initial Zoom Out Report"
Cohesion: 0.40
Nodes (4): Duplicates across reviewers, Inventive Catalyst (egm-inventive-catalyst), Stage 5: Initial Zoom Out Report, Zoom Out (egm-zoom-out)

### Community 23 - "Prioritized Findings & AI Suggestions"
Cohesion: 0.05
Nodes (37): 19. `src/components/LastSaved.tsx` (Create), 10. An invalid `savedAt` on the winner is returned as is, 11. `canSave` expression and migration helper naming differ between design and plan, 12. The mount-effect guarantee is over-claimed, 13. The test coverage claims do not match the test list, 14. The `[profileId]` folder check does not state how it runs, 15. Unactionable and speculative statement about `.next`, 3. `legacyDiscarded` and the notice count are computed differently (+29 more)

### Community 24 - "savings-goal/[scenarioId]/page.tsx"
Cohesion: 0.19
Nodes (20): What the code does today (verified in iteration 1, still accurate), CumulativePoint, fmt(), fmtDate(), FocusInput(), InlineInput(), ItemSavingsRow(), monthsBetween() (+12 more)

### Community 25 - "Design System Strategy: The Fiscal Atelier"
Cohesion: 0.12
Nodes (16): 1. Overview & Creative North Star, 2. Colors & Surface Architecture, 3. Typography: The Manrope Scale, 4. Elevation & Depth, 5. Components & Primitive Styling, 6. Do's and Don'ts, Buttons (The Statement Piece), Cards & Tool Modules (+8 more)

### Community 26 - "HomeTabs.tsx"
Cohesion: 0.35
Nodes (10): 16. `src/components/ui/tabs.tsx` (Create, restyle), Rendering and component boundary, Stage 8: Intermediate Zoom Out Report, HomeTabs(), HomeTabsProps, Tabs(), TabsContent(), TabsList() (+2 more)

### Community 27 - "cpf-oa.ts"
Cohesion: 0.17
Nodes (12): 5. `src/lib/persistence/adapters/cpf-oa.ts` (Rewrite, Phase 2), 8. The page rewrite (item 8) leaves choices open and misstates the edit, base, CpfOaParams, isUsable(), normalise(), readLegacy(), savedAtTime() (+4 more)

### Community 28 - "🟢 Nits"
Cohesion: 0.12
Nodes (16): N10. The placeholder has no markup, N12. The order of the ESLint config objects is implicit, N13. The safe-area padding does nothing without `viewport-fit=cover`, N15. Inaccurate counts and claims about the lint rule, N16. The "lint allowlist" wording overstates the rule, N17. "Round-trips unchanged" needs a definition, N18. The `memoryStorage` helper's API is unclear, N19. QA step 1's write check is not directly observable (+8 more)

### Community 29 - "Prioritized Findings (Blockers -> Major -> Nits)"
Cohesion: 0.10
Nodes (19): 🟡 10. The rollout sentence gets the logic backwards - Severity: Major, 🟡 11. Architecture diagram shows the guards writing to storage - Severity: Major, 🟡 12. CUJs don't cover several Goals and edge cases - Severity: Major, 🟡 13. The navigation-guard lint rule has gaps - Severity: Major, 🟡 14. Accessibility, design system and CLAUDE.md gaps in the UI components - Severity: Major, 🔴 1. Most rejection reasons give an owner, not a trade-off - Severity: Blocker, 🟡 2. The rollback claim is wrong for several tools - Severity: Major, 🟡 3. Existing (legacy) users can't get a date without making a fake edit - Severity: Major (+11 more)

### Community 30 - "Files to Create/Modify/Delete"
Cohesion: 0.15
Nodes (13): 10. `src/lib/persistence/adapters/cpf-oa.test.ts` (Create, Phase 2), 11. `src/lib/persistence/adapters/toolAdapters.test.ts` (Modify, Phase 2), 13. `src/lib/persistence/import.test.ts` (Modify, Phase 3), 14. `src/lib/tools.ts` (Modify, Phase 4), 15. `src/lib/tools.test.ts` (Modify, Phase 4), 2. `src/lib/persistence/tool.ts` (Modify, Phase 1), 3. `src/lib/persistence/testing/memoryStorage.ts` (Modify, Phase 1), 4. `src/lib/persistence/tool.test.ts` (Modify, Phase 1) (+5 more)

### Community 31 - "cpf-oa-annuity-calculator/page.tsx"
Cohesion: 0.29
Nodes (14): 7. `src/app/tools/cpf-oa-annuity-calculator/page.tsx` (Rewrite, Phase 2), Goals vs. Non-Goals, Non-Goals, CpfOaAnnuityCalculatorPage(), fmt(), FocusInput(), MigrationNotice(), OaChart() (+6 more)

### Community 32 - "Alternatives Considered"
Cohesion: 0.13
Nodes (15): Alternative A: Redirect old profile URLs to the calculator, Alternative B: Keep profiles behind the calculator, Alternative C: Keep the old profile array under a backup key instead of deleting it, Alternative F: Migrate once on mount with one `saveEntries`, Alternative G: Normalise the backup before the import loop, Alternative H: Export also emits legacy keys that still exist, Alternative I: Export through each adapter's `read()`, Alternative J: Notice with a stored dismissal flag (+7 more)

### Community 33 - "GuardedLink"
Cohesion: 0.27
Nodes (13): CpfChart(), cpfMonthlyInterest(), CpfSaCalculatorPage(), fmt(), FocusInput(), FocusSelect(), MONTHS, ProfileNameEditor() (+5 more)

### Community 34 - "useProfileDraft"
Cohesion: 0.15
Nodes (26): Data Flow, Analysis, Data layer: `stripLegacyAmounts`, Findings, Paraphrase: Detailed Implementation, Paraphrase: Feature Specification, Stage 6: Comprehension Test, Nit (+18 more)

### Community 35 - "useGuardedRouter"
Cohesion: 0.19
Nodes (14): 🟡 M8. The redirect is written as a call during render - Severity: Major, nextConfig, next, CpfSaLandingPage(), EmptyState(), ProfileCard(), StatLine(), EmptyState() (+6 more)

### Community 36 - "budget-planner/page.tsx"
Cohesion: 0.26
Nodes (14): BudgetItemRow(), BudgetPlannerPage(), CATEGORIES, CATEGORY_COLORS, CategoryBreakdownChart(), fmt(), FocusInput(), InlineInput() (+6 more)

### Community 37 - "emergency-fund/page.tsx"
Cohesion: 0.33
Nodes (12): daysBetween(), EmergencyFundPage(), fmt(), FocusInput(), formatDate(), ProgressBar(), ProjectionChart(), ProjectionPoint (+4 more)

### Community 38 - "toolMeta"
Cohesion: 0.12
Nodes (24): 9. `src/app/tools/fire-calculator/page.tsx` (Modify), Findings, How the existing system works, per this document, Stage 6: Comprehension Test Report, What this proposes, Cross-reviewer duplicates, Design (egm-design) — verdict: not passing as written (D1, D2), Stage 7: Critic Review Report (+16 more)

### Community 39 - "app/page.tsx"
Cohesion: 0.15
Nodes (13): 25. `src/components/SiteHeader.tsx`, `src/components/ToolCard.tsx`, `src/app/tools/[slug]/page.tsx` (Modify), 3. `src/components/ToolCard.tsx` (Modify), HomePage(), ToolGrid(), DataPortability(), ExportPayload, ICONS, ToolCard() (+5 more)

### Community 40 - "Prioritized Findings (Blockers -> Major -> Nits)"
Cohesion: 0.13
Nodes (15): Date states, [Issue A15] [`egm-implementation-readiness`, `egm-style`, `egm-codebase-details`, `egm-design`] - Severity: Major, 🟡 M11. Promised tests are missing (`tool.ts` and others) - Severity: Major, 10. The "date entry last" rule is enforced in three places - Severity: Nit, 11. Implementation detail in the Technical Plan repeats the Detailed Plan - Severity: Nit, 12. `savedAt` may be dropped on read by the existing key filter - Severity: Nit, 13. "Still correct" confirmation for dated records is not addressed - Severity: Nit, 2. Legacy records can't be saved, so returning users can't get a date - Severity: Major (+7 more)

### Community 41 - "useTheme"
Cohesion: 0.52
Nodes (5): ThemeToggle(), getServerSnapshot(), getSnapshot(), subscribe(), useTheme()

### Community 42 - "confirmLeave"
Cohesion: 0.27
Nodes (9): 13. `src/lib/unsavedStore.ts` and `unsavedStore.test.ts` (Create), 15. `src/hooks/useGuardedRouter.ts` (Create), 4. Unsaved store and leave guards, 🟡 M22. The `GuardedLink` order of operations is ambiguous - Severity: Major, N14. The spec names a store consumer that the plan never builds, confirmLeave(), getUnsaved(), owners (+1 more)

### Community 43 - "cpf-sa.ts"
Cohesion: 0.31
Nodes (7): 🟡 M5. Type ownership between stage 2 and stages 4-6 is undecided - Severity: Major, N20. Some list-page edits do not name their file, CPF_DEFAULT_PARAMS, CpfParams, CpfProfile, cpfSaAdapter, legacy

### Community 44 - "Alternatives Considered"
Cohesion: 0.08
Nodes (24): Alternative A: Stacked sections instead of tabs, Alternative B: Remember the last tab, or put the tab in the URL, Alternative C: A note about sensitive data on the Tracking Tools tab, Alternative D: Keep the coming-soon tools in a separate place, Alternative E: Redirect deleted routes to the home page, Alternative F: One flat list ordered by saved data, Alternative G: A marker on each card ("Saves your data" / "One-off") with no groups, Alternative H: Install only the Radix tabs package and copy the shadcn Tabs source by hand (+16 more)

### Community 45 - "Target Files to Create/Modify"
Cohesion: 0.10
Nodes (23): 10. `src/app/tools/dividend-calculator/page.tsx` (Modify), 11. `src/app/tools/cpf-sa-calculator/[profileId]/page.tsx`, `src/app/tools/cpf-ma-calculator/[profileId]/page.tsx`, `src/app/tools/cpf-oa-annuity-calculator/[profileId]/page.tsx` (Modify, three files), 12. `src/app/tools/cpf-sa-calculator/page.tsx`, `src/app/tools/cpf-ma-calculator/page.tsx`, `src/app/tools/cpf-oa-annuity-calculator/page.tsx` (Modify, three files), 14. `src/app/page.tsx` (Modify, first pass), 15. `package.json`, `package-lock.json`, `components.json`, `src/lib/cn.ts`, `src/components/ui/tabs.tsx`, `src/app/globals.css`, `src/lib/utils.ts` (Install shadcn Tabs, fixed sequence), 18. `src/app/page.tsx` (Modify, second pass), 1. `src/app/tools/[slug]/page.tsx` (Delete), 2. `src/lib/tools.ts` (Modify, first pass) (+15 more)

### Community 46 - "Major"
Cohesion: 0.14
Nodes (13): 1. No Risks & Mitigations section, 2. The accepted export gap is silent data loss, 3. Import design is under-specified, 4. Migrated parameters skip type validation, 5. Alternatives rationales are assertions, 6. The brief and decision labels are unresolved, 7. Two helpers are described inconsistently, 8. Open Questions holds a resolved decision (+5 more)

### Community 47 - "Stage 8: Intermediate Zoom Out Report"
Cohesion: 0.15
Nodes (12): 1. Fixing Stage 6 and 7 findings in place would harden machinery that Stage 5 says to cut, 3. Type validation of migrated params has a free reuse path, 4. Proportionality is never argued, 5. The Stage 7 Risks and Mitigations Blocker is a symptom of mechanism count, 6. The Detailed Plan altitude problem (Stage 5 finding 7) is worse than reported, 7. Positive: reuse choices remain correct, Blocker, Major (+4 more)

### Community 48 - "CPF Ordinary Account (OA) Annuity Calculator"
Cohesion: 0.29
Nodes (3): Alternatives Weighed, CPF Ordinary Account (OA) Annuity Calculator, Overview

### Community 49 - "ProfileAdapter"
Cohesion: 0.47
Nodes (8): 1. `src/lib/persistence/types.ts` (Modify, Phase 1), Summary of changes, 🟢 Nit, Nit, Findings, 🟡 M10. The adapter test cases do not fit the 5 profile adapters - Severity: Major, ProfileAdapter, ToolRead

### Community 50 - "ManualSaveNotice"
Cohesion: 0.33
Nodes (8): react, decide(), ManualSaveNotice(), NoticeDecision, writeFlag(), subscribe(), useIsClient(), UseProfileListReturn

### Community 51 - "Target Files to Create/Modify"
Cohesion: 0.20
Nodes (10): 1. `src/components/DataPortability.tsx` (Modify), 29. `src/hooks/useToolDraft.ts` (Create), 31. The seven single-state tool pages (Modify), 36. `docs/architecture.md` (Modify), 37. `README.md` (Modify), Detailed Implementation Plan, Stage 1: HYSA export fix, Stage 5: Single-state tools (+2 more)

### Community 52 - "Remove the Amt Columns from the HYSA Tracker"
Cohesion: 0.10
Nodes (19): 3. `src/lib/persistence/adapters/profileAdapters.test.ts` (Modify), 4. `src/lib/persistence/import.test.ts` (Modify), Critical User Journeys (CUJs), CUJ 1: Open an existing scenario saved before this change, CUJ 2: Save after editing, CUJ 3: Import an old backup, Detailed Implementation Plan, Files checked and not changed (+11 more)

### Community 53 - "Alternatives Considered"
Cohesion: 0.22
Nodes (9): Alternative A: Delete the fields, no strip on load, Alternative B: Hide the columns but keep the data, Alternative C: Versioned storage key (`hysa-tracker:scenarios:v2`), old key left untouched, Alternative D: Keep qualifying amounts in a collapsed optional panel, or a per-category "met bonus" flag, Alternative E: Restructure the table in the same change, Alternative F: Whitelist normalizer that rebuilds every entry and scenario, Alternative G: Strip only on the write paths, Alternative H: Keep the Amt fields as deprecated optional fields for one release (+1 more)

### Community 54 - "Stage 3: CPF SA as the first full slice"
Cohesion: 0.18
Nodes (11): 12. `src/lib/persistence/toolMeta.ts` and `src/lib/persistence/registry.ts` (Create), 14. `src/hooks/useUnsavedGuard.ts` (Create), 16. `src/components/GuardedLink.tsx` (Create), 17. `src/hooks/useProfileDraft.ts` (Create), 18. `src/hooks/useProfileList.ts` (Create), 20. `src/components/SaveBar.tsx` (Create), 21. `src/components/ManualSaveNotice.tsx` (Create), 22. `src/app/tools/cpf-sa-calculator/page.tsx` (Modify) (+3 more)

### Community 55 - "Critical User Journeys (CUJs)"
Cohesion: 0.18
Nodes (11): Critical User Journeys (CUJs), CUJ 10: First save on defaults, CUJ 1: Edit and save a single-state tool, CUJ 2: Edit, then revert without saving, CUJ 3: Create a new profile, CUJ 4: Leave with unsaved changes, CUJ 5: Save fails, CUJ 6: Existing user after release (+3 more)

### Community 56 - "🟡 Majors"
Cohesion: 0.29
Nodes (7): 🟡 Majors, NM2. The draft hooks' state shape, `setDraft` type and post-save state are unspecified - Severity: Major, NM3. The stored format of `tool:<slug>` is unstated, and rollback safety depends on it - Severity: Major, NM4. The adapter test files are not in any item's file list - Severity: Major, NM5. `confirmLeave` calls `window.confirm`, but its tests run in vitest's `node` environment - Severity: Major, NM6. `ManualSaveNotice` appears for brand-new users after their first Save - Severity: Major, NM7. `toolMeta` in `registry.ts` creates a circular import - Severity: Major

### Community 57 - "cpf-ma-calculator/[profileId]/page.tsx"
Cohesion: 0.27
Nodes (13): CpfMaCalculatorPage(), cpfMaMonthlyInterest(), fmt(), FocusInput(), FocusSelect(), MaChart(), MONTHS, ProfileNameEditor() (+5 more)

### Community 58 - "Technical Plan (Architecture)"
Cohesion: 0.18
Nodes (11): 10. Decisions made during drafting, 1. Adapters, 2. Save module, 3. Draft hooks, 5. UI components, 6. Export and import, 7. Exceptions to "Save is the only write", 8. Tests (vitest) (+3 more)

### Community 59 - "savings-goal/page.tsx"
Cohesion: 0.52
Nodes (6): EmptyState(), fmtAmount(), fmtMonthYear(), SavingsGoalLandingPage(), ScenarioCard(), StatLine()

### Community 60 - "Alternatives Considered"
Cohesion: 0.20
Nodes (10): Alternative 1: Autosave, with page-load writes removed and one save module, Alternative 2: Explicit Save only for record-keeping tools, Alternative 3: Other places for the draft to live, Alternative 4: One draft per tool, shared by the list and detail pages, Alternative 5: One date key per tool (`meta:last-saved:<slug>`), Alternative 6: Other date locations for SRS and dividend, Alternative 7: Keep shared links in some form, Alternative 8: Other leave-warning approaches (+2 more)

### Community 61 - "Consolidated Review Report, Round 3 (quick run)"
Cohesion: 0.33
Nodes (6): Consolidated Review Report, Round 3 (quick run), Fixes without a decision, Major, Nit, Notes, Verdict

### Community 62 - "StorageLike"
Cohesion: 0.29
Nodes (7): 10. `src/lib/persistence/testing/memoryStorage.ts` (Create), 5. `src/lib/persistence/types.ts` (Create), Blockers, Major, Round 2, Stage 9: Implementation Readiness Report, N9. Import details are missing, StorageLike

### Community 63 - "Debt or Alive — Claude Instructions"
Cohesion: 0.20
Nodes (9): Code Conventions, Commits, Debt or Alive — Claude Instructions, Design, File Structure, General, graphify, Project (+1 more)

### Community 64 - "Goldfish Review Report: Implementation Readiness Test (Stage 9), Re-audit"
Cohesion: 0.40
Nodes (4): 🔴 Blockers, Claims the reviewers checked and found correct, Goldfish Review Report: Implementation Readiness Test (Stage 9), Re-audit, New findings (Blockers -> Majors -> Nits)

### Community 65 - "CPF Ordinary Account (OA) Annuity Calculator"
Cohesion: 0.22
Nodes (9): CPF Ordinary Account (OA) Annuity Calculator, Detailed Implementation Plan, Goals, Open Questions, Overview, Phases, Risks & Mitigations, Terms (+1 more)

### Community 66 - "Explicit Save and "Last saved" Dates"
Cohesion: 0.22
Nodes (9): Explicit Save and "Last saved" Dates, Future Improvements, Goals, Non-Functional Requirements, Non-Goals, Open Questions, Overview, Risks & Mitigations (+1 more)

### Community 67 - "Stage 6: Export, import and lint rules"
Cohesion: 0.50
Nodes (4): 33. `src/lib/persistence/import.ts` and `import.test.ts` (Create), 34. `src/components/DataPortability.tsx` (Modify), 35. `eslint.config.mjs` (Modify), Stage 6: Export, import and lint rules

### Community 68 - "Consolidated Review Report: Home Page Tabs"
Cohesion: 0.18
Nodes (10): 17. `src/components/HomeTabs.tsx` (Create), Consolidated Review Report: Home Page Tabs, Contested findings (need the author's decision), Priority 1: fix before implementation, Priority 2: fix while editing, Priority 3: nits (apply if cheap), Resolution (applied to `docs/designs/home-page-tabs.md`), Traceability matrix (+2 more)

### Community 69 - "Critical User Journeys (CUJs)"
Cohesion: 0.25
Nodes (8): Critical User Journeys (CUJs), CUJ 1: New user opens the calculator, CUJ 2: Existing user with saved profiles, CUJ 3: Importing an old backup, CUJ 4: Visiting an old profile URL, CUJ 5: Finding the tool on the home page, CUJ 6: Save fails during a pending migration, CUJ 7: Discard during a pending migration

### Community 70 - "Action items (no decision needed)"
Cohesion: 0.22
Nodes (9): Action items (no decision needed), Consolidated Review Report, Round 2, Major, Nit, Notes, Open author question, Specification hazard (fix whichever option is chosen), Traceability (+1 more)

### Community 71 - "Major"
Cohesion: 0.25
Nodes (7): 2. Alternative F's pros and cons do not match the design or the precedent, 3. Load deletes the legacy key when the new key is unreadable, 4. Terminology rule is stated but not followed, 5. Uncalibrated and subjective claims in The Problem, Blockers, Major, Round 2, Stage 7: Critic Review Report

### Community 72 - "Consolidated Review Report, Round 4 (quick run)"
Cohesion: 0.29
Nodes (6): Author decisions needed, Consolidated Review Report, Round 4 (quick run), Fixes without a decision, Nit, Notes, Verdict

### Community 73 - "Stage 9: Implementation Readiness Report"
Cohesion: 0.40
Nodes (4): Codebase Details (egm-codebase-details), Implementation Readiness (egm-implementation-readiness), Stage 9: Implementation Readiness Report, Style (egm-style)

### Community 74 - "liftColor"
Cohesion: 0.19
Nodes (10): 13. `src/components/HeroSection.tsx`, `src/components/SiteHeader.tsx` (Modify), metadata, BudgetSplitCard(), DebtProgressCard(), HeroSection(), PortfolioCard(), liftColor(), Theme (+2 more)

### Community 76 - "Architecture"
Cohesion: 0.07
Nodes (24): Architecture, Components, `DebtCard`, Explicit Save replaces autosave, Key Decisions, Overview, Pages & Routes, Shared links removed (+16 more)

### Community 77 - "Technical Plan (Architecture)"
Cohesion: 0.33
Nodes (6): Copy changes, Deleted routes, Installing shadcn Tabs, Names in one place, Persistence and tests, Technical Plan (Architecture)

### Community 78 - "The Problem"
Cohesion: 0.50
Nodes (4): Constraint: existing data, Scale and cost, The Problem, Why change

### Community 79 - "Consolidated Review Report"
Cohesion: 0.33
Nodes (5): Consolidated Review Report, Notes for the author, Recommended order of work, Traceability matrix, Verdict

### Community 80 - "Round 2, Stage 8: Intermediate Zoom Out Report"
Cohesion: 0.29
Nodes (6): 2. `clearStaleLegacyKey` is the cheapest cut and also the riskiest piece, Blocker, Major, Nit, Passes (unchanged), Round 2, Stage 8: Intermediate Zoom Out Report

### Community 82 - "Debt or Alive"
Cohesion: 0.33
Nodes (5): Contributing, Debt or Alive, Getting Started, Project Structure, Tech Stack

### Community 83 - "ToolAdapter"
Cohesion: 0.21
Nodes (7): How saving works today, Findings, Stage 6: Comprehension Test Report, 2. The design's own precedent supports the simpler option, and Alternative E misstates it, Round 2, Stage 6: Comprehension Test Report, 6. The tool and profile persistence paths are duplicated - Severity: Nit, ToolAdapter

### Community 84 - "Round 2, Stage 5: Initial Zoom Out Report"
Cohesion: 0.13
Nodes (14): 1. The migration is out of proportion to the data it protects, 2. The "read-only until Save" rule produces a workaround stack and a pattern exception, 3. Import grows a branchy "participating adapter" concept, 4. Export gap silently loses OA data in backups, 5. Save irreversibly deletes the other scenarios, with only a notice as mitigation, 6. The Detailed Implementation Plan drops into code-level detail (Zoom Out rated it Major), 7. `readLegacy` steps 1-5 are pseudocode-level, 8. Optional members on the shared `ToolAdapter` are speculative generality (+6 more)

### Community 85 - "Progress Tracker"
Cohesion: 0.40
Nodes (4): Done, In Progress, Progress Tracker, Up Next

### Community 87 - "Goldfish Review Report: Stage 5, Initial Zoom Out Review"
Cohesion: 0.50
Nodes (3): Goldfish Review Report: Stage 5, Initial Zoom Out Review, Reviewer Status, Verified as fine (no action)

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useToolDraft()` connect `useProfileDraft` to `networth.ts`, `types.ts`, `importBackup`, `createInputsAdapter`, `niceMax`, `ManualSaveNotice`, `saveTool`, `GuardedLink`, `srs-calculator/page.tsx`, `cpf-oa-annuity-calculator/page.tsx`, `budget-planner/page.tsx`, `emergency-fund/page.tsx`, `toolMeta`, `Prioritized Findings (Blockers -> Major -> Nits)`, `ProfileAdapter`, `ManualSaveNotice`, `Consolidated Review Report, Round 3 (quick run)`, `Architecture`, `Round 2, Stage 8: Intermediate Zoom Out Report`, `ToolAdapter`, `Round 2, Stage 5: Initial Zoom Out Report`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Are the 48 inferred relationships involving `saveEntries()` (e.g. with `Data Flow` and `12. `src/lib/persistence/import.ts` (Modify, Phase 3)`) actually correct?**
  _`saveEntries()` has 48 INFERRED edges - model-reasoned connections that need verification._
- **Should `networth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05586722767648434 - nodes in this community are weakly interconnected._
- **Why does `toolMeta()` connect `toolMeta` to `networth.ts`, `cpf-ma-calculator/page.tsx`, `createInputsAdapter`, `niceMax`, `registry.ts`, `hysa-tracker/[scenarioId]/page.tsx`, `saveTool`, `Stage 5: Initial Zoom Out Report`, `savings-goal/[scenarioId]/page.tsx`, `HomeTabs.tsx`, `cpf-oa.ts`, `cpf-oa-annuity-calculator/page.tsx`, `GuardedLink`, `useProfileDraft`, `cpf-sa.ts`, `Alternatives Considered`, `Target Files to Create/Modify`, `🟡 Majors`, `cpf-ma-calculator/[profileId]/page.tsx`, `StorageLike`, `Consolidated Review Report: Home Page Tabs`, `Action items (no decision needed)`, `Consolidated Review Report, Round 4 (quick run)`, `Stage 9: Implementation Readiness Report`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Are the 29 inferred relationships involving `useToolDraft()` (e.g. with `Data Flow` and `7. `src/app/tools/cpf-oa-annuity-calculator/page.tsx` (Rewrite, Phase 2)`) actually correct?**
  _`useToolDraft()` has 29 INFERRED edges - model-reasoned connections that need verification._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.053061224489795916 - nodes in this community are weakly interconnected._
- **Why does `saveEntries()` connect `importBackup` to `Alternatives Considered`, `CPF Ordinary Account (OA) Annuity Calculator`, `useProfileDraft`, `Stage 6: Export, import and lint rules`, `types.ts`, `🟡 Major`, `Stage 2: Test setup and the pure core`, `Prioritized Findings (Blockers -> Major -> Nits)`, `createInputsAdapter`, `cpf-sa.ts`, `ProfileAdapter`, `saveTool`, `ToolAdapter`, `Prioritized Findings & AI Suggestions`, `StorageLike`, `Technical Plan (Architecture)`, `🟢 Nits`, `Files to Create/Modify/Delete`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._