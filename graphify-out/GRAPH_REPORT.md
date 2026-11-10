# Graph Report - debt-or-alive  (2026-11-10)

## Corpus Check
- 134 files · ~169,765 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 848 nodes · 2053 edges · 41 communities (39 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Networth Summary Page
- Next.js App Shell
- Explicit Save Spec
- Design Review Reports
- Dependencies & Tooling
- Save Review Findings
- HYSA Tracker
- Home Page & Data Portability
- CPF SA Calculator
- CPF MA Calculator
- shadcn Config
- CPF OA Storage & Migration
- SRS Calculator
- TypeScript Config
- Save Bar & Dates
- Backup Import
- Budget Planner
- Compound Interest
- Dividend Calculator
- FIRE Calculator
- Tool Draft Hook
- CPF SA Adapter
- Profile List Hook
- Single-State Adapters
- Emergency Fund
- Mortgage Calculator
- CPF OA Annuity Page
- CPF OA Design Decisions
- Architecture Overview
- Persistence Concepts
- Home Page Tabs
- Fiscal Atelier Design
- Project Conventions
- Memory Storage Test Fake
- Last Saved Formatter
- Networth Design
- Manual Save Notice
- Leave Guard Alternatives
- Test Strategy
- PostCSS Config
- App Icon

## God Nodes (most connected - your core abstractions)
1. `GuardedLink()` - 42 edges
2. `SiteHeader()` - 40 edges
3. `ManualSaveNotice()` - 30 edges
4. `react` - 29 edges
5. `LastSaved()` - 28 edges
6. `niceMax()` - 28 edges
7. `SaveBar()` - 27 edges
8. `fmtAxis()` - 26 edges
9. `useToolDraft()` - 25 edges
10. `useGuardedRouter()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `The Fiscal Atelier design system` --conceptually_related_to--> `Mobile-first design requirement`  [INFERRED]
  docs/design.md → CLAUDE.md
- `Project structure (src/app, components, hooks, lib)` --semantically_similar_to--> `CLAUDE.md Project Conventions`  [INFERRED] [semantically similar]
  README.md → CLAUDE.md
- `Tech stack: Next.js, TypeScript, Tailwind, shadcn/ui` --semantically_similar_to--> `CLAUDE.md Project Conventions`  [INFERRED] [semantically similar]
  README.md → CLAUDE.md
- `C10 Three-state date model (isDirty vs canSave)` --semantically_similar_to--> `Three date states (saved, never, legacy)`  [INFERRED] [semantically similar]
  docs/designs/explicit-save-last-saved-dates.brief.md → docs/designs/explicit-save-last-saved-dates.md
- `defaultDeposits()` --calls--> `todayISO()`  [EXTRACTED]
  src/lib/persistence/adapters/srs-calculator.ts → src/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Explicit Save persistence flow** — docs_architecture_adapters, docs_architecture_draft_hooks, docs_architecture_save_module, docs_architecture_leave_guards [EXTRACTED 1.00]
- **CPF OA legacy profile migration** — docs_designs_cpf_oa_annuity_calculator_readlegacy, docs_designs_cpf_oa_annuity_calculator_legacytomigrate, docs_designs_cpf_oa_annuity_calculator_import_legacy_path, docs_designs_cpf_oa_annuity_calculator_savetool_legacy_removal, docs_designs_cpf_oa_annuity_calculator_migration_notice [EXTRACTED 1.00]
- **Networth Summary modules** — docs_designs_networth_summary_networth_ts, docs_designs_networth_summary_adapter, docs_designs_networth_summary_target_chart, docs_designs_networth_summary_section_components [EXTRACTED 1.00]
- **Explicit Save write path (adapter, draft hook, save module)** — docs_designs_explicit_save_last_saved_dates_tool_adapter, docs_designs_explicit_save_last_saved_dates_use_tool_draft, docs_designs_explicit_save_last_saved_dates_save_entries, docs_designs_explicit_save_last_saved_dates_save_tool [EXTRACTED 1.00]
- **Unsaved-changes leave guard infrastructure** — docs_designs_explicit_save_last_saved_dates_unsaved_store, docs_designs_explicit_save_last_saved_dates_guarded_link, docs_designs_explicit_save_last_saved_dates_use_guarded_router, docs_designs_explicit_save_last_saved_dates_use_unsaved_guard [EXTRACTED 1.00]
- **Design review reports for explicit-save spec** — docs_designs_reviews_comprehension_report, docs_designs_reviews_consolidated_review_report, docs_designs_explicit_save_last_saved_dates [EXTRACTED 1.00]
- **Explicit-save spec review pipeline (stages 5 to 9 and resolution)** — docs_designs_reviews_zoom_out_report, docs_designs_reviews_critic_report, docs_designs_reviews_intermediate_zoom_out_report, docs_designs_reviews_implementation_readiness_report, docs_designs_reviews_goldfish_review_report, docs_designs_reviews_implementation_readiness_report_v2 [EXTRACTED 0.95]
- **Only-writer rule and its enforcement/exception findings** — docs_designs_reviews_critic_report_only_writer_rule, docs_designs_reviews_implementation_readiness_report_grep_only_writer_check, docs_designs_reviews_implementation_readiness_report_cpf_sa_migration, docs_designs_reviews_zoom_out_report_import_through_save_module [INFERRED 0.85]
- **Draft hook design gaps (SSR, ref, state shape, storage format)** — docs_designs_reviews_implementation_readiness_report_draft_hook_mechanics, docs_designs_reviews_implementation_readiness_report_v2_latestdraft_ref, docs_designs_reviews_implementation_readiness_report_v2_draft_state_shape, docs_designs_reviews_implementation_readiness_report_v2_tool_storage_format [INFERRED 0.85]
- **Three places the legacy key is handled** — docs_designs_reviews_cpf_oa_annuity_calculator_round1_consolidated_review_report_migration_timing, docs_designs_reviews_cpf_oa_annuity_calculator_round1_consolidated_review_report_import_legacy_key_handling, docs_designs_reviews_cpf_oa_annuity_calculator_round1_consolidated_review_report_export_gap [EXTRACTED 1.00]
- **Home tabs shadcn Tabs risks** — docs_designs_reviews_home_page_tabs_consolidated_review_report_forcemount_hidden_claim, docs_designs_reviews_home_page_tabs_consolidated_review_report_shadcn_install_sequence, docs_designs_reviews_home_page_tabs_consolidated_review_report_hometabs_props [INFERRED 0.85]

## Communities (41 total, 2 thin omitted)

### Community 0 - "Networth Summary Page"
Cohesion: 0.07
Nodes (57): NetworthSummaryPage(), leftOutNames(), NetworthHeadline(), fieldClass, format(), NumberField(), handleChange(), NumberFieldProps (+49 more)

### Community 1 - "Next.js App Shell"
Cohesion: 0.08
Nodes (43): nextConfig, next@^16.2.1, next, metadata, NotFound(), CpfMaLandingPage(), EmptyState(), ProfileCard() (+35 more)

### Community 2 - "Explicit Save Spec"
Cohesion: 0.06
Nodes (48): concepts_brief.md (untracked brainstorm record), Explicit Save and Last saved Dates - Feature Spec, Explicit Save and Last saved Date - Brainstorm Brief, Alternatives Weighed (A-V), Current autosave behaviour (mount writes, URL sync), Explicit Save model (replaces autosave), Stage 6 Comprehension Report, Consolidated Review Report (+40 more)

### Community 3 - "Design Review Reports"
Cohesion: 0.05
Nodes (51): CPF OA Annuity Calculator design doc, Home Page Tabs design doc, cpf oa annuity calculator round1 comprehension report, cpf oa annuity calculator round1 consolidated review report, Alternatives rejected on author preference, Export gap: silent data loss before first Save, Phased implementation plan with build checkpoints, Import of unusable legacy key must not overwrite device record (+43 more)

### Community 4 - "Dependencies & Tooling"
Cohesion: 0.05
Nodes (47): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, lucide-react@^1.7.0, @radix-ui/react-tabs@^1.2.1, react@^19.0.0, react-dom@^19.0.0, tailwind-merge@^3.5.0 (+39 more)

### Community 5 - "Save Review Findings"
Cohesion: 0.05
Nodes (41): Decisions resolved by the author after iteration 2, Staging S0-S7, CUJ 4: Leave with unsaved changes, DataPortability component (export/import), ESLint restriction rules (next/link, useRouter, setItem), GuardedLink component, importBackup (import through adapters), ManualSaveNotice component (+33 more)

### Community 6 - "HYSA Tracker"
Cohesion: 0.09
Nodes (41): CAT_COLORS, EditableCell(), fmt(), fmtCompact(), GainChart(), HysaTrackerPage(), MONTH_NAMES, MonthCell() (+33 more)

### Community 7 - "Home Page & Data Portability"
Cohesion: 0.10
Nodes (28): react, HomePage(), ToolGrid(), DataPortability(), ExportPayload, importData(), BudgetSplitCard(), DebtProgressCard() (+20 more)

### Community 8 - "CPF SA Calculator"
Cohesion: 0.14
Nodes (23): CpfChart(), cpfMonthlyInterest(), CpfSaCalculatorPage(), fmt(), FocusInput(), FocusSelect(), MONTHS, ProfileNameEditor() (+15 more)

### Community 9 - "CPF MA Calculator"
Cohesion: 0.13
Nodes (22): CpfMaCalculatorPage(), cpfMaMonthlyInterest(), fmt(), FocusInput(), FocusSelect(), MaChart(), MONTHS, ProfileNameEditor() (+14 more)

### Community 10 - "shadcn Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 11 - "CPF OA Storage & Migration"
Cohesion: 0.13
Nodes (18): base, CPF_OA_DEFAULT_PARAMS, CpfOaParams, isUsable(), legacyToMigrate(), normalise(), readLegacy(), readLegacyOaState() (+10 more)

### Community 12 - "SRS Calculator"
Cohesion: 0.18
Nodes (14): DepositRow(), fmt(), ProjectionChart(), ProjectionPoint, projectSRS(), SRSCalculatorPage(), weightedAvgRate(), yearFromISO() (+6 more)

### Community 13 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 14 - "Save Bar & Dates"
Cohesion: 0.12
Nodes (16): C10 Three-state date model (isDirty vs canSave), Explicit Save (replaces autosave), formatSavedDate, LastSaved component, Last saved: D Mon YYYY date display, SaveBar component, Save pages (7 single-state + 5 detail pages), Three date states (saved, never, legacy) (+8 more)

### Community 15 - "Backup Import"
Cohesion: 0.22
Nodes (11): migrateLegacy(), importBackup(), ImportResult, overlay(), fullBackup, PROFILE_ADAPTERS, removeReplacedKeys(), saveEntries() (+3 more)

### Community 16 - "Budget Planner"
Cohesion: 0.21
Nodes (16): BudgetItemRow(), BudgetPlannerPage(), CATEGORIES, CATEGORY_COLORS, CategoryBreakdownChart(), fmt(), FocusInput(), InlineInput() (+8 more)

### Community 17 - "Compound Interest"
Cohesion: 0.18
Nodes (16): calculateGrowth(), CompoundingFreq, CompoundInterestPage(), ContributionTiming, fmt(), FocusInput(), FocusInputProps, FocusSelect() (+8 more)

### Community 18 - "Dividend Calculator"
Cohesion: 0.26
Nodes (14): BAR_COLORS, BreakdownChart(), DividendCalculatorPage(), fmt(), GrowthChart(), InlineInput(), netYieldRate(), SourceRow() (+6 more)

### Community 19 - "FIRE Calculator"
Cohesion: 0.22
Nodes (16): calculateFireProjection(), FIRE_TIERS, FireCalculatorPage(), FireChart(), FireScoreBadge(), FireTable(), FireTier, fmt() (+8 more)

### Community 20 - "Tool Draft Hook"
Cohesion: 0.21
Nodes (9): DraftState, UseToolDraftReturn, dateStateOf(), saveTool(), Demo, demoAdapter, DateState, SaveResult (+1 more)

### Community 21 - "CPF SA Adapter"
Cohesion: 0.21
Nodes (9): vitest, CPF_DEFAULT_PARAMS, CpfParams, CpfProfile, cpfSaAdapter, legacy, normalise(), sameData() (+1 more)

### Community 22 - "Profile List Hook"
Cohesion: 0.20
Nodes (8): UseProfileListReturn, deleteProfile(), Demo, demoAdapter, toError(), writeProfiles(), ProfileAdapter, ProfileBase

### Community 23 - "Single-State Adapters"
Cohesion: 0.29
Nodes (12): data(), cpfOaAdapter, dividendAdapter, budgetAdapter, compoundInterestAdapter, emergencyFundAdapter, fireAdapter, mortgageAdapter (+4 more)

### Community 24 - "Emergency Fund"
Cohesion: 0.30
Nodes (13): daysBetween(), EmergencyFundPage(), fmt(), FocusInput(), formatDate(), ProgressBar(), ProjectionChart(), ProjectionPoint (+5 more)

### Community 25 - "Mortgage Calculator"
Cohesion: 0.29
Nodes (13): BalanceChart(), calcMonthlyPayment(), calculateAmortization(), fmt(), FocusInput(), InlineInput(), MonthRow, MortgageCalculatorPage() (+5 more)

### Community 26 - "CPF OA Annuity Page"
Cohesion: 0.33
Nodes (11): CpfOaAnnuityCalculatorPage(), fmt(), FocusInput(), MigrationNotice(), OaChart(), simulate(), solveMonthlyDrawdown(), StatCard() (+3 more)

### Community 27 - "CPF OA Design Decisions"
Cohesion: 0.22
Nodes (10): Alternatives A-P (rejected options), CPF OA Annuity Calculator brief, CPF OA Annuity Calculator design, importBackup legacy-key path, legacyToMigrate helper, New key tool:cpf-oa-annuity-calculator, readLegacy adapter method, Remove Amt columns from HYSA Tracker design (+2 more)

### Community 28 - "Architecture Overview"
Cohesion: 0.20
Nodes (7): Architecture doc, Leave guards (GuardedLink, useGuardedRouter), localStorage data flow (no backend), Save module (saveEntries), Legacy key cpf-oa:profiles, saveTool legacy key removal, Progress Tracker

### Community 29 - "Persistence Concepts"
Cohesion: 0.25
Nodes (7): Persistence adapters, Draft hooks (useToolDraft, useProfileDraft, useProfileList), canSave override during pending migration, Date states (never, legacy, saved), Migration notice (others not carried over), HYSA readAll, networthAdapter (single nested key)

### Community 30 - "Home Page Tabs"
Cohesion: 0.22
Nodes (8): Home page tabs brief, Remove coming-soon tools and not-found page, Home page tabs design, HomeTabs client component, shadcn Tabs install sequence (@radix-ui/react-tabs), Tool group field (tracking | calculators), toolMeta name lookup, tools.ts single tool list

### Community 31 - "Fiscal Atelier Design"
Cohesion: 0.29
Nodes (5): Botanical green palette and surface hierarchy, Botanical Shadow elevation, The Fiscal Atelier design system, Manrope typography scale, TargetChart inline SVG

### Community 32 - "Project Conventions"
Cohesion: 0.38
Nodes (5): Next.js breaking changes agent rules, CLAUDE.md Project Conventions, Debt or Alive README, Project structure (src/app, components, hooks, lib), Tech stack: Next.js, TypeScript, Tailwind, shadcn/ui

### Community 33 - "Memory Storage Test Fake"
Cohesion: 0.38
Nodes (5): goodRecord, readFrom(), createMemoryStorage(), MemoryStorage, MemoryStorageOptions

### Community 34 - "Last Saved Formatter"
Cohesion: 0.53
Nodes (3): LastSaved(), formatSavedDate(), MONTHS

### Community 35 - "Networth Design"
Cohesion: 0.50
Nodes (4): Networth Summary design, Manual USD/AUD to SGD rates, networth.ts pure calculation module, Networth components (SectionCard, RecordRow, RatesPanel, NetworthHeadline)

### Community 36 - "Manual Save Notice"
Cohesion: 0.60
Nodes (4): decide(), ManualSaveNotice(), NoticeDecision, writeFlag()

### Community 37 - "Leave Guard Alternatives"
Cohesion: 0.50
Nodes (3): Risks and Mitigations table, A8: rollback section wrong about stale savedAt, A9: no Risks and Mitigations section

### Community 38 - "Test Strategy"
Cohesion: 0.50
Nodes (4): createMemoryStorage test fake, Verification Plan and Manual QA, vitest setup (node env, TZ pinned), A15: test coverage gaps

## Knowledge Gaps
- **80 isolated node(s):** `Next.js breaking changes agent rules`, `Leave guards (GuardedLink, useGuardedRouter)`, `Manrope typography scale`, `Botanical Shadow elevation`, `Progress Tracker` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 249 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Home Page & Data Portability` to `Networth Summary Page`, `Next.js App Shell`, `Dependencies & Tooling`, `Manual Save Notice`, `HYSA Tracker`, `CPF SA Calculator`, `CPF MA Calculator`, `SRS Calculator`, `Budget Planner`, `Compound Interest`, `Dividend Calculator`, `FIRE Calculator`, `Tool Draft Hook`, `Profile List Hook`, `Emergency Fund`, `Mortgage Calculator`, `CPF OA Annuity Page`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `Next.js breaking changes agent rules`, `Leave guards (GuardedLink, useGuardedRouter)`, `Manrope typography scale` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Networth Summary Page` be split into smaller, more focused modules?**
  _Cohesion score 0.0741687979539642 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `CPF SA Adapter` to `Networth Summary Page`, `Memory Storage Test Fake`, `Last Saved Formatter`, `Next.js App Shell`, `Dependencies & Tooling`, `HYSA Tracker`, `Home Page & Data Portability`, `CPF OA Storage & Migration`, `Backup Import`, `Tool Draft Hook`, `Profile List Hook`, `Single-State Adapters`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `Next.js App Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.07909604519774012 - nodes in this community are weakly interconnected._
- **Why does `GuardedLink()` connect `Next.js App Shell` to `Networth Summary Page`, `HYSA Tracker`, `Home Page & Data Portability`, `CPF SA Calculator`, `CPF MA Calculator`, `SRS Calculator`, `Budget Planner`, `Compound Interest`, `Dividend Calculator`, `FIRE Calculator`, `Emergency Fund`, `Mortgage Calculator`, `CPF OA Annuity Page`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `Explicit Save Spec` be split into smaller, more focused modules?**
  _Cohesion score 0.055152394775036286 - nodes in this community are weakly interconnected._