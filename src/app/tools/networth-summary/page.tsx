"use client";

import { useMemo } from "react";
import { GuardedLink } from "@/components/GuardedLink";
import { LastSaved } from "@/components/LastSaved";
import { ManualSaveNotice } from "@/components/ManualSaveNotice";
import { NetworthHeadline } from "@/components/networth/NetworthHeadline";
import { RatesPanel } from "@/components/networth/RatesPanel";
import { SectionCard } from "@/components/networth/SectionCard";
import { TargetChart } from "@/components/networth/TargetChart";
import { SaveBar } from "@/components/SaveBar";
import { SiteHeader } from "@/components/SiteHeader";
import { useToolDraft } from "@/hooks/useToolDraft";
import {
  ASSET_SECTIONS,
  SECTIONS,
  addRecord,
  chartRows,
  localDateISO,
  platformSuggestions,
  removeRecord,
  setRate,
  setTarget,
  summarise,
  updateRecord,
  type AssetSection,
} from "@/lib/networth";
import { networthAdapter } from "@/lib/persistence/adapters/networth-summary";
import { tools } from "@/lib/tools";

const TAGLINE = tools.find((t) => t.slug === "networth-summary")?.tagline ?? "";

export function NetworthSummaryPage() {
  const tool = useToolDraft(networthAdapter);
  const { draft, setDraft } = tool;

  const summary = useMemo(() => summarise(draft), [draft]);
  const chart = useMemo(() => chartRows(summary, draft), [summary, draft]);
  const platforms = useMemo(() => platformSuggestions(draft), [draft]);

  if (tool.status !== "ready") return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <SiteHeader />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <ManualSaveNotice />
        <GuardedLink
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
          style={{ color: "var(--on-surface-sub)", textDecoration: "none" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
          Back to Home
        </GuardedLink>

        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 48, height: 48, background: "var(--primary-fill)", flexShrink: 0 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h3v-4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--on-surface)", fontFamily: "Manrope, sans-serif" }}>
              Networth Summary
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-sub)" }}>{TAGLINE}</p>
            <div className="mt-2">
              <LastSaved status={tool.status} dateState={tool.dateState} savedAt={tool.savedAt} />
            </div>
          </div>
        </div>

        <datalist id="networth-platforms">
          {platforms.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <NetworthHeadline summary={summary} />
          <RatesPanel
            usdSgd={draft.usdSgd}
            audSgd={draft.audSgd}
            onRate={(currency, value) => setDraft((d) => setRate(d, currency, value))}
          />
          <div className="lg:col-span-2">
            <TargetChart rows={chart.rows} axisMaxDollars={chart.axisMaxDollars} />
          </div>

          {SECTIONS.map(({ key }) => {
            const isAsset = (ASSET_SECTIONS as readonly string[]).includes(key);
            return (
              <SectionCard
                key={key}
                section={key}
                records={draft.records.filter((r) => r.section === key)}
                subtotalCents={summary.sections[key].cents}
                target={isAsset ? draft.targets[key as AssetSection] : undefined}
                onAdd={() => setDraft((d) => addRecord(d, key, localDateISO()))}
                onUpdate={(id, changes) => setDraft((d) => updateRecord(d, id, changes))}
                onRemove={(id) => setDraft((d) => removeRecord(d, id))}
                onTarget={isAsset ? (value) => setDraft((d) => setTarget(d, key as AssetSection, value)) : undefined}
              />
            );
          })}

          <p className="lg:col-span-2 text-xs" style={{ color: "var(--on-surface-sub)" }}>
            Figures here are typed in separately and may differ from the CPF, SRS and HYSA tools.
          </p>
        </div>
      </main>

      <SaveBar
        status={tool.status}
        isDirty={tool.isDirty}
        canSave={tool.canSave}
        dateState={tool.dateState}
        saveError={tool.saveError}
        onSave={tool.save}
        onDiscard={tool.discard}
      />
    </div>
  );
}

export default NetworthSummaryPage;
