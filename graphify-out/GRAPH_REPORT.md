# Graph Report - debt-or-alive  (2026-11-13)

## Corpus Check
- 150 files · ~183,124 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 979 nodes · 2401 edges · 44 communities (42 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 115 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ef23e1c3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- networth.ts
- GuardedLink
- types.ts
- importBackup
- vitest
- Prioritized Findings (Blockers -> Major -> Nits)
- DataPortability.tsx
- theme.ts
- savings-goal/[scenarioId]/page.tsx
- preview.ts
- cpf-ma-calculator/page.tsx
- cpf-oa-annuity-calculator/page.tsx
- components.json
- niceMax
- ManualSaveNotice
- registry.ts
- budget-planner/page.tsx
- saveTool
- GuardedLink
- compilerOptions
- useProfileDraft.ts
- cpf-sa-calculator/[profileId]/page.tsx
- ImportConfirmDialog.tsx
- Share-Sheet Backup
- savings-goal/[scenarioId]/page.tsx
- Design System Strategy: The Fiscal Atelier
- types.ts
- cpf-oa.ts
- localStorage data flow (no backend)
- Prioritized Findings (Blockers -> Major -> Nits)
- Files to Create/Modify/Delete
- cpf-oa-annuity-calculator/page.tsx
- Alternatives Considered
- vitest
- useProfileDraft
- useGuardedRouter
- cpf-ma-calculator/[profileId]/page.tsx
- emergency-fund/page.tsx
- toolMeta
- app/page.tsx
- Prioritized Findings (Blockers -> Major -> Nits)
- networth-summary.test.ts
- useToolDraft.ts
- preview.test.ts

## God Nodes (most connected - your core abstractions)
1. `GuardedLink()` - 42 edges
2. `SiteHeader()` - 40 edges
3. `react` - 31 edges
4. `ManualSaveNotice()` - 30 edges
5. `LastSaved()` - 28 edges
6. `niceMax()` - 28 edges
7. `SaveBar()` - 27 edges
8. `fmtAxis()` - 26 edges
9. `useToolDraft()` - 25 edges
10. `NetworthSummaryPage()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Import confirmation (`src/components/ImportConfirmDialog.tsx`)` --references--> `AlertDialogAction()`  [INFERRED]
  docs/designs/share-sheet-backup.md → src/components/ui/alert-dialog.tsx
- `Import preview (`src/lib/persistence/preview.ts`, pure, read-only)` --references--> `parseBackup()`  [INFERRED]
  docs/designs/share-sheet-backup.md → src/lib/persistence/backup.ts
- `Backup module (`src/lib/persistence/backup.ts`, pure, no DOM)` --references--> `importBackup()`  [INFERRED]
  docs/designs/share-sheet-backup.md → src/lib/persistence/import.ts
- `Import preview (`src/lib/persistence/preview.ts`, pure, read-only)` --references--> `importBackup()`  [INFERRED]
  docs/designs/share-sheet-backup.md → src/lib/persistence/import.ts
- `Phase 1: Backup module` --references--> `importBackup()`  [INFERRED]
  docs/designs/share-sheet-backup.md → src/lib/persistence/import.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Explicit-save spec review pipeline (stages 5 to 9 and resolution)** — docs_designs_reviews_zoom_out_report, docs_designs_reviews_critic_report, docs_designs_reviews_intermediate_zoom_out_report, docs_designs_reviews_implementation_readiness_report, docs_designs_reviews_goldfish_review_report, docs_designs_reviews_implementation_readiness_report_v2 [EXTRACTED 0.95]
- **Three places the legacy key is handled** — docs_designs_reviews_cpf_oa_annuity_calculator_round1_consolidated_review_report_migration_timing, docs_designs_reviews_cpf_oa_annuity_calculator_round1_consolidated_review_report_import_legacy_key_handling, docs_designs_reviews_cpf_oa_annuity_calculator_round1_consolidated_review_report_export_gap [EXTRACTED 1.00]
- **CPF OA legacy profile migration** — docs_designs_cpf_oa_annuity_calculator_readlegacy, docs_designs_cpf_oa_annuity_calculator_legacytomigrate, docs_designs_cpf_oa_annuity_calculator_import_legacy_path, docs_designs_cpf_oa_annuity_calculator_savetool_legacy_removal, docs_designs_cpf_oa_annuity_calculator_migration_notice [EXTRACTED 1.00]
- **Design review reports for explicit-save spec** — docs_designs_reviews_comprehension_report, docs_designs_reviews_consolidated_review_report, docs_designs_explicit_save_last_saved_dates [EXTRACTED 1.00]
- **Explicit Save persistence flow** — docs_architecture_adapters, docs_architecture_draft_hooks, docs_architecture_save_module, docs_architecture_leave_guards [EXTRACTED 1.00]
- **Explicit Save write path (adapter, draft hook, save module)** — docs_designs_explicit_save_last_saved_dates_tool_adapter, docs_designs_explicit_save_last_saved_dates_use_tool_draft, docs_designs_explicit_save_last_saved_dates_save_entries, docs_designs_explicit_save_last_saved_dates_save_tool [EXTRACTED 1.00]
- **Unsaved-changes leave guard infrastructure** — docs_designs_explicit_save_last_saved_dates_unsaved_store, docs_designs_explicit_save_last_saved_dates_guarded_link, docs_designs_explicit_save_last_saved_dates_use_guarded_router, docs_designs_explicit_save_last_saved_dates_use_unsaved_guard [EXTRACTED 1.00]
- **Networth Summary modules** — docs_designs_networth_summary_networth_ts, docs_designs_networth_summary_adapter, docs_designs_networth_summary_target_chart, docs_designs_networth_summary_section_components [EXTRACTED 1.00]
- **Draft hook design gaps (SSR, ref, state shape, storage format)** — docs_designs_reviews_implementation_readiness_report_draft_hook_mechanics, docs_designs_reviews_implementation_readiness_report_v2_latestdraft_ref, docs_designs_reviews_implementation_readiness_report_v2_draft_state_shape, docs_designs_reviews_implementation_readiness_report_v2_tool_storage_format [INFERRED 0.85]
- **Home tabs shadcn Tabs risks** — docs_designs_reviews_home_page_tabs_consolidated_review_report_forcemount_hidden_claim, docs_designs_reviews_home_page_tabs_consolidated_review_report_shadcn_install_sequence, docs_designs_reviews_home_page_tabs_consolidated_review_report_hometabs_props [INFERRED 0.85]
- **Only-writer rule and its enforcement/exception findings** — docs_designs_reviews_critic_report_only_writer_rule, docs_designs_reviews_implementation_readiness_report_grep_only_writer_check, docs_designs_reviews_implementation_readiness_report_cpf_sa_migration, docs_designs_reviews_zoom_out_report_import_through_save_module [INFERRED 0.85]

## Communities (44 total, 2 thin omitted)

### Community 0 - "networth.ts"
Cohesion: 0.07
Nodes (62): NetworthSummaryPage(), CpfCard(), CpfCardProps, leftOutNames(), NetworthHeadline(), fieldClass, format(), NumberField() (+54 more)

### Community 1 - "GuardedLink"
Cohesion: 0.07
Nodes (56): nextConfig, next, react, NotFound(), CpfMaLandingPage(), EmptyState(), ProfileCard(), StatLine() (+48 more)

### Community 2 - "types.ts"
Cohesion: 0.06
Nodes (48): concepts_brief.md (untracked brainstorm record), Explicit Save and Last saved Dates - Feature Spec, Explicit Save and Last saved Date - Brainstorm Brief, Alternatives Weighed (A-V), Current autosave behaviour (mount writes, URL sync), Explicit Save model (replaces autosave), Stage 6 Comprehension Report, Consolidated Review Report (+40 more)

### Community 3 - "importBackup"
Cohesion: 0.05
Nodes (51): CPF OA Annuity Calculator design doc, Home Page Tabs design doc, cpf oa annuity calculator round1 comprehension report, cpf oa annuity calculator round1 consolidated review report, Alternatives rejected on author preference, Export gap: silent data loss before first Save, Phased implementation plan with build checkpoints, Import of unusable legacy key must not overwrite device record (+43 more)

### Community 4 - "vitest"
Cohesion: 0.05
Nodes (50): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, lucide-react@^1.7.0, next@^16.2.1, @radix-ui/react-alert-dialog@^1.2.1, @radix-ui/react-tabs@^1.2.1, react@^19.0.0 (+42 more)

### Community 5 - "Prioritized Findings (Blockers -> Major -> Nits)"
Cohesion: 0.05
Nodes (41): Decisions resolved by the author after iteration 2, Staging S0-S7, CUJ 4: Leave with unsaved changes, DataPortability component (export/import), ESLint restriction rules (next/link, useRouter, setItem), GuardedLink component, importBackup (import through adapters), ManualSaveNotice component (+33 more)

### Community 6 - "DataPortability.tsx"
Cohesion: 0.09
Nodes (42): Backup module (`src/lib/persistence/backup.ts`, pure, no DOM), Buttons and layout (`src/components/DataPortability.tsx`), Detailed Implementation Plan, Phase 1: Backup module, Phase 3: Share and download, Phase 4: Dialog primitive, Phase 5: Hook, dialog and page component, Phase 6: Docs and acceptance (+34 more)

### Community 7 - "theme.ts"
Cohesion: 0.09
Nodes (26): metadata, HomePage(), ToolGrid(), BudgetSplitCard(), DebtProgressCard(), HeroSection(), PortfolioCard(), ThemeToggle() (+18 more)

### Community 8 - "savings-goal/[scenarioId]/page.tsx"
Cohesion: 0.20
Nodes (17): CumulativePoint, fmt(), fmtDate(), FocusInput(), InlineInput(), ItemSavingsRow(), monthsBetween(), SavingsChart() (+9 more)

### Community 9 - "preview.ts"
Cohesion: 0.12
Nodes (30): Alternative F: Split `importBackup` into a plan step and an apply step, Import flow (`src/lib/persistence/importState.ts`, `src/hooks/useBackupImport.ts`), Phase 2: Preview and import state, Proposed Architecture, What does not change, importedMessage(), useBackupImport(), ParsedBackup (+22 more)

### Community 10 - "cpf-ma-calculator/page.tsx"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 11 - "cpf-oa-annuity-calculator/page.tsx"
Cohesion: 0.08
Nodes (34): CpfOaAnnuityCalculatorPage(), fmt(), FocusInput(), MigrationNotice(), OaChart(), simulate(), solveMonthlyDrawdown(), StatCard() (+26 more)

### Community 12 - "components.json"
Cohesion: 0.20
Nodes (14): DepositRow(), fmt(), ProjectionChart(), ProjectionPoint, projectSRS(), SRSCalculatorPage(), weightedAvgRate(), yearFromISO() (+6 more)

### Community 13 - "niceMax"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 14 - "ManualSaveNotice"
Cohesion: 0.12
Nodes (16): C10 Three-state date model (isDirty vs canSave), Explicit Save (replaces autosave), formatSavedDate, LastSaved component, Last saved: D Mon YYYY date display, SaveBar component, Save pages (7 single-state + 5 detail pages), Three date states (saved, never, legacy) (+8 more)

### Community 15 - "registry.ts"
Cohesion: 0.12
Nodes (18): data(), CPF_MA_DEFAULT_PARAMS, cpfMaAdapter, CpfMaProfile, defaultSources(), dividendAdapter, DividendRecord, DividendSource (+10 more)

### Community 16 - "budget-planner/page.tsx"
Cohesion: 0.18
Nodes (19): BudgetItemRow(), BudgetPlannerPage(), CATEGORIES, CATEGORY_COLORS, CategoryBreakdownChart(), fmt(), FocusInput(), InlineInput() (+11 more)

### Community 17 - "saveTool"
Cohesion: 0.15
Nodes (19): calculateGrowth(), CompoundingFreq, CompoundInterestPage(), ContributionTiming, fmt(), FocusInput(), FocusInputProps, FocusSelect() (+11 more)

### Community 18 - "GuardedLink"
Cohesion: 0.47
Nodes (9): BAR_COLORS, BreakdownChart(), DividendCalculatorPage(), fmt(), GrowthChart(), InlineInput(), netYieldRate(), SourceRow() (+1 more)

### Community 19 - "compilerOptions"
Cohesion: 0.22
Nodes (16): calculateFireProjection(), FIRE_TIERS, FireCalculatorPage(), FireChart(), FireScoreBadge(), FireTable(), FireTier, fmt() (+8 more)

### Community 20 - "useProfileDraft.ts"
Cohesion: 0.16
Nodes (13): DraftState, initialState(), NEW_PROFILE_ID, useProfileDraft(), UseProfileDraftReturn, deleteProfile(), saveProfile(), Demo (+5 more)

### Community 21 - "cpf-sa-calculator/[profileId]/page.tsx"
Cohesion: 0.22
Nodes (15): CpfChart(), cpfMonthlyInterest(), CpfSaCalculatorPage(), fmt(), FocusInput(), FocusSelect(), MONTHS, ProfileNameEditor() (+7 more)

### Community 22 - "ImportConfirmDialog.tsx"
Cohesion: 0.19
Nodes (20): BUTTON_PRIMARY, BUTTON_SECONDARY, HomeTabs(), HomeTabsProps, dateText(), ImportConfirmDialog(), ImportConfirmDialogProps, toolCount() (+12 more)

### Community 23 - "Share-Sheet Backup"
Cohesion: 0.08
Nodes (23): Additional Resources, Alternative A: Google Drive sign-in with Backup and Restore buttons, Alternative B: Confirmation and extraction only, no Share button, Alternative C: Confirmation shows the file only, with no summary of this browser, Alternative D: Per-tool comparison in the confirmation, Alternative E: Native `<dialog>` or an inline panel for the confirmation, Alternative G: Other formats and transports, Alternatives Considered (+15 more)

### Community 24 - "savings-goal/[scenarioId]/page.tsx"
Cohesion: 0.31
Nodes (12): daysBetween(), EmergencyFundPage(), fmt(), FocusInput(), formatDate(), ProgressBar(), ProjectionChart(), ProjectionPoint (+4 more)

### Community 25 - "Design System Strategy: The Fiscal Atelier"
Cohesion: 0.29
Nodes (13): BalanceChart(), calcMonthlyPayment(), calculateAmortization(), fmt(), FocusInput(), InlineInput(), MonthRow, MortgageCalculatorPage() (+5 more)

### Community 26 - "types.ts"
Cohesion: 0.27
Nodes (11): Import preview (`src/lib/persistence/preview.ts`, pure, read-only), migrateLegacy(), ImportResult, removeReplacedKeys(), saveEntries(), toError(), DateState, SaveResult (+3 more)

### Community 27 - "cpf-oa.ts"
Cohesion: 0.22
Nodes (10): Alternatives A-P (rejected options), CPF OA Annuity Calculator brief, CPF OA Annuity Calculator design, importBackup legacy-key path, legacyToMigrate helper, New key tool:cpf-oa-annuity-calculator, readLegacy adapter method, Remove Amt columns from HYSA Tracker design (+2 more)

### Community 28 - "localStorage data flow (no backend)"
Cohesion: 0.20
Nodes (7): Architecture doc, Leave guards (GuardedLink, useGuardedRouter), localStorage data flow (no backend), Save module (saveEntries), Legacy key cpf-oa:profiles, saveTool legacy key removal, Progress Tracker

### Community 29 - "Prioritized Findings (Blockers -> Major -> Nits)"
Cohesion: 0.25
Nodes (7): Persistence adapters, Draft hooks (useToolDraft, useProfileDraft, useProfileList), canSave override during pending migration, Date states (never, legacy, saved), Migration notice (others not carried over), HYSA readAll, networthAdapter (single nested key)

### Community 30 - "Files to Create/Modify/Delete"
Cohesion: 0.22
Nodes (8): Home page tabs brief, Remove coming-soon tools and not-found page, Home page tabs design, HomeTabs client component, shadcn Tabs install sequence (@radix-ui/react-tabs), Tool group field (tracking | calculators), toolMeta name lookup, tools.ts single tool list

### Community 31 - "cpf-oa-annuity-calculator/page.tsx"
Cohesion: 0.29
Nodes (5): Botanical green palette and surface hierarchy, Botanical Shadow elevation, The Fiscal Atelier design system, Manrope typography scale, TargetChart inline SVG

### Community 32 - "Alternatives Considered"
Cohesion: 0.38
Nodes (5): Next.js breaking changes agent rules, CLAUDE.md Project Conventions, Debt or Alive README, Project structure (src/app, components, hooks, lib), Tech stack: Next.js, TypeScript, Tailwind, shadcn/ui

### Community 33 - "vitest"
Cohesion: 0.21
Nodes (9): vitest, CPF_DEFAULT_PARAMS, CpfParams, CpfProfile, cpfSaAdapter, legacy, normalise(), sameData() (+1 more)

### Community 34 - "useProfileDraft"
Cohesion: 0.43
Nodes (4): Import confirmation (`src/components/ImportConfirmDialog.tsx`), LastSaved(), formatSavedDate(), MONTHS

### Community 35 - "useGuardedRouter"
Cohesion: 0.50
Nodes (4): Networth Summary design, Manual USD/AUD to SGD rates, networth.ts pure calculation module, Networth components (SectionCard, RecordRow, RatesPanel, NetworthHeadline)

### Community 36 - "cpf-ma-calculator/[profileId]/page.tsx"
Cohesion: 0.25
Nodes (14): CpfMaCalculatorPage(), cpfMaMonthlyInterest(), fmt(), FocusInput(), FocusSelect(), MaChart(), MONTHS, ProfileNameEditor() (+6 more)

### Community 37 - "emergency-fund/page.tsx"
Cohesion: 0.50
Nodes (3): Risks and Mitigations table, A8: rollback section wrong about stale savedAt, A9: no Risks and Mitigations section

### Community 38 - "toolMeta"
Cohesion: 0.50
Nodes (4): createMemoryStorage test fake, Verification Plan and Manual QA, vitest setup (node env, TZ pinned), A15: test coverage gaps

### Community 41 - "networth-summary.test.ts"
Cohesion: 0.25
Nodes (8): withLegacy(), goodRecord, readFrom(), createMemoryStorage(), MemoryStorage, MemoryStorageOptions, Demo, demoAdapter

### Community 42 - "useToolDraft.ts"
Cohesion: 0.33
Nodes (8): DraftState, initialState(), useToolDraft(), UseToolDraftReturn, useUnsavedGuard(), dateStateOf(), saveTool(), setUnsaved()

### Community 43 - "preview.test.ts"
Cohesion: 0.25
Nodes (3): A, B, C

## Knowledge Gaps
- **80 isolated node(s):** `Alternatives A-P (rejected options)`, `importBackup legacy-key path`, `New key tool:cpf-oa-annuity-calculator`, `Date states (never, legacy, saved)`, `Migration notice (others not carried over)` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 293 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `GuardedLink` to `networth.ts`, `vitest`, `DataPortability.tsx`, `theme.ts`, `savings-goal/[scenarioId]/page.tsx`, `preview.ts`, `cpf-oa-annuity-calculator/page.tsx`, `components.json`, `budget-planner/page.tsx`, `saveTool`, `GuardedLink`, `compilerOptions`, `useProfileDraft.ts`, `cpf-sa-calculator/[profileId]/page.tsx`, `ImportConfirmDialog.tsx`, `savings-goal/[scenarioId]/page.tsx`, `Design System Strategy: The Fiscal Atelier`, `cpf-ma-calculator/[profileId]/page.tsx`, `useToolDraft.ts`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **What connects `Alternatives A-P (rejected options)`, `importBackup legacy-key path`, `New key tool:cpf-oa-annuity-calculator` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `networth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07171171171171171 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `vitest` to `networth.ts`, `GuardedLink`, `useProfileDraft`, `vitest`, `DataPortability.tsx`, `theme.ts`, `networth-summary.test.ts`, `preview.ts`, `cpf-oa-annuity-calculator/page.tsx`, `preview.test.ts`, `registry.ts`, `useProfileDraft.ts`, `types.ts`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `GuardedLink` be split into smaller, more focused modules?**
  _Cohesion score 0.07283702213279677 - nodes in this community are weakly interconnected._
- **Why does `importBackup()` connect `preview.ts` to `networth-summary.test.ts`, `types.ts`, `preview.test.ts`, `DataPortability.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055152394775036286 - nodes in this community are weakly interconnected._