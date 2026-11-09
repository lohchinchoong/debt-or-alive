# Stage 6: Comprehension Test Report

**Target:** `docs/designs/cpf-oa-annuity-calculator.md` (FeatureRange 1-233, DetailedRange 234-363). The reviewer read the document alone, with no other context.

**What this proposes**

The CPF OA Annuity tool stops being a list of named saved scenarios and becomes a single calculator page at `/tools/cpf-oa-annuity-calculator`. The page has one saved set of inputs, loaded on visit and written only when the user presses Save, like the Compound Interest calculator. The maths is unchanged. The tool is renamed with a new tagline and moves from the Tracking Tools tab to the first card of the Calculators tab. Existing users' data is migrated: the profile with the latest `savedAt` pre-fills the page, the other profiles are deleted, and a notice says how many were not carried over. Old backup files containing `cpf-oa:profiles` import by the same rule. Old profile URLs return the default 404.

**How the existing system works, per this document**

The tool is a list of named profiles saved in `localStorage` under `cpf-oa:profiles`, and each profile opens its own page at `[profileId]` (and `/new`). The page takes four inputs (birth year, start drawdown age, balance at start age, end drawdown age) and computes a constant monthly payout. Persistence goes through "adapters": `ToolAdapter` for single-record tools via `createInputsAdapter` and `TOOL_ADAPTERS`, and `ProfileAdapter` for list tools via `PROFILE_ADAPTERS`. The hooks `useToolDraft`, `useProfileList` and `useProfileDraft` drive the pages. `saveTool` and `importBackup` write through `saveEntries`, and `REGISTERED_KEYS` drives export. Reads must not write. The CPF SA adapter migrates inside `read()`, which this design rejects for OA. Several of these mechanisms are described only by name (findings 1 and 2).

## Findings

1. **Major.** Scope: Overview and Technical Plan; terms such as `createInputsAdapter`, `ToolAdapter`, `TOOL_ADAPTERS`, `PROFILE_ADAPTERS`, `useToolDraft`, `saveEntries`, `ToolRead`, `StorageLike`, `SaveBar`, `LastSaved`, `ManualSaveNotice`, `GuardedLink` and "overlay".
   - These project-internal names are not defined or linked. A fresh reader cannot judge claims such as "the read view hides the device's new key" (line 133) or "the import view throws on writes" (line 213) without knowing what the overlay is.
   - `useToolDraft`'s behaviour is only implied: it derives `canSave` from the date state, and the states `"saved"` and `"legacy"` appear without being enumerated.
   - Add a short glossary or one paragraph on the persistence layer: adapter, record, `savedAt`, date state, overlay.

2. **Major.** Scope: "the Compound Interest calculator" (lines 13, 26, 153) and "the unsaved-changes guard" (line 26).
   - The design relies on this existing tool as its reference pattern ("load, write only on Save") without describing it. The guard is never explained.
   - Define the pattern in two or three sentences.

3. **Major.** Scope: Enabling Save (lines 120-122) versus the Page spec (line 299).
   - The two sections contradict each other. Line 122: `canSave={draft.canSave || otherCount > 0 || legacyPending}`. Line 299: `canSave={draft.canSave || legacy.pending}`.
   - The Notice section says `pending` and `others` come from a helper (`readLegacyOaState`), but the first section refers to "the helper's `pending` value" without naming it.
   - The section heading says "option 2" while the Notice section is labelled "option 1", and Alternative F says "option 2" is a `ToolRead` field and "option 3" is a flag. The option labels (A, 1, 2, B, 3) refer to a brief the reader does not have, and "option 2" means two different things. Remove the labels or define them.

4. **Major.** Scope: "the winner's `savedAt` is kept" and the "Last saved" behaviour (CUJ 2, line 60; Read path, line 107; Alternative G).
   - CUJ 2 says the "Last saved" date is the winner's `savedAt` "until the new save replaces it", but the document never says what `LastSaved` displays for each state (`"saved"`, `"legacy"`, default).
   - Line 107 says a missing `savedAt` gives null and the `"legacy"` state. It does not say whether Save is enabled then (presumably yes), or what `"legacy"` means for the UI.
   - List the date states and their effects.

5. **Major.** Scope: "Stale old key on load" (lines 118-119) versus "Save is the only write".
   - The paragraph declares an exception to "Save is the only write", but that rule is stated only here, in Alternative E, and in the Goals ("written only on Save"). Overview line 12, CUJ 1 and CUJ 2 ("No write happens on load") are not qualified, and CUJ 2 does not cover the stale-key cases.
   - Line 118 says the stale key is removed "as decided in the brief". The reader does not have the brief.
   - Cross-reference the exception in the Goals and CUJs.

6. **Major.** Scope: Import (lines 130-138) and Import in the Detailed Plan (item 5, lines 268-278).
   - The mechanism is hard to follow without knowing `importBackup`'s current behaviour. "Owned", "took part", `keysSkipped`, "the overlay" and "the normal path" are used without definitions. "A legacy key counts as owned only when it was used" is not explained.
   - The statement that "a backup that holds only the old key replaces whatever OA record the device has" (line 66) is presumably the result of the "second view". Nothing says why replacing, rather than merging, is intended.
   - Describe the existing import flow in a few sentences, so the changes read as a delta.

7. **Major.** Scope: data flow diagram, Import section (lines 176-181).
   - It is the only visual for import and shows only "file {cpf-oa:profiles}". It omits the "both keys in file" and "new-format backup onto a device with a stale legacy key" branches described in the text.
   - "Carried" dates are not explained: item 5 says "Treat the date as carried", a term not defined elsewhere.

8. **Nit.** Scope: notice text and CUJs (lines 60, 126, 300).
   - The template `{N} other scenario(s)` is inconsistent: CUJ 2 uses "two other scenarios", and line 300 says "singular or plural by count" without giving the singular wording.
   - `others` is `count - 1` where `count` counts only usable profiles. A user with unusable items would see a different number than they expect; the document does not say whether this is intended.

9. **Nit.** Scope: Storage (line 88). The record is stored as `{ birthYear, ..., savedAt }` and "the record shape in code is `{ inputs: CpfOaParams }`". The distinction between stored shape and in-code shape, and how `savedAt` is attached, is not explained.

10. **Nit.** Scope: Open Questions (line 46) and "the brief" (lines 46, 118). "The brief treats this as intended" is listed as an open question yet is already resolved. Either it is not open, or the decision needs recording in this document. The brief is never linked or named.

11. **Nit.** Scope: the Detailed Plan opening (line 236). It tells the reader to read `node_modules/next/dist/docs/` without saying which guides are relevant, and says "the main check is how stale `.next` type output behaves", which is vague. Item 9 states the 404 comes from `src/app/not-found.tsx`, which is not mentioned earlier. Name the guides or drop the line.

12. **Nit.** Scope: "Tracking Tools" and "Calculators" tabs, and "(Quick, one-off what-ifs.)" in Non-Goals. The tab subtitles are mentioned, but the home page structure (tabs, groups, the `group` field in `tools.ts`) is never described. Line 149 gives the ordering rule only in passing.

13. **Nit.** Scope: Detailed Plan items 8 and 16.
   - Item 8's `useEffect` uses an "empty dependency list" while reading state "first" because the effect runs after render. This relies on knowing React's ordering. The StrictMode note in Alternative E is not carried over: under StrictMode the mount effect runs twice in development, and the plan does not say this is harmless (it is idempotent).
   - Item 16 says "if needed", which is not a plan. It refers to a "completeness check" and a `legacy` table in `toolAdapters.test.ts` that are never described.

**Section paraphrase check.** The reviewer could paraphrase every section, so there are no Blockers. The sections that connect least clearly are finding 3 (the Save-enabling logic is stated in two incompatible ways) and finding 6 (the import mechanics).

Severity counts: 0 Blocker, 7 Major, 6 Nit.
