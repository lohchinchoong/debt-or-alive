"use client";

import { useState, useCallback } from "react";
import { loadArray, saveArray, genId } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HysaMonthEntry = {
  year:            number;
  month:           number; // 1-12
  salaryAmount:    number; // salary credited this month
  salaryInterest:  number; // interest earned from salary bonus
  cardSpendAmount: number; // card spend this month
  cardInterest:    number; // interest earned from card spend bonus
  insureAmount:    number; // insurance premium / qualifying amount
  insureInterest:  number; // interest earned from insure bonus
  investAmount:    number; // qualifying investment amount
  investInterest:  number; // interest earned from invest bonus
  investmentPL:    number; // investment portfolio P&L
};

export type HysaScenario = {
  id:      string;
  name:    string;
  entries: HysaMonthEntry[];
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "hysa-tracker:scenarios";

function readScenarios(): HysaScenario[] {
  return loadArray<HysaScenario>(STORAGE_KEY, []);
}

function writeScenarios(scenarios: HysaScenario[]): void {
  saveArray(STORAGE_KEY, scenarios);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type UseHysaScenariosReturn = {
  scenarios:       HysaScenario[];
  addScenario:     () => string;
  removeScenario:  (id: string) => void;
  updateScenario:  (id: string, changes: Partial<Omit<HysaScenario, "id" | "entries">>) => void;
  updateEntry:     (scenarioId: string, year: number, month: number, changes: Partial<HysaMonthEntry>) => void;
  addMonth:        (scenarioId: string) => void;
  removeLastMonth: (scenarioId: string) => void;
};

export function useHysaScenarios(): UseHysaScenariosReturn {
  const [scenarios, setScenarios] = useState<HysaScenario[]>(() => readScenarios());

  const addScenario = useCallback((): string => {
    const id = genId("hysa");
    setScenarios((prev) => {
      const next: HysaScenario[] = [...prev, { id, name: "New Scenario", entries: [] }];
      writeScenarios(next);
      return next;
    });
    return id;
  }, []);

  const removeScenario = useCallback((id: string): void => {
    setScenarios((prev) => {
      const next = prev.filter((s) => s.id !== id);
      writeScenarios(next);
      return next;
    });
  }, []);

  const updateScenario = useCallback((
    id: string,
    changes: Partial<Omit<HysaScenario, "id" | "entries">>
  ): void => {
    setScenarios((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...changes } : s));
      writeScenarios(next);
      return next;
    });
  }, []);

  const updateEntry = useCallback((
    scenarioId: string,
    year: number,
    month: number,
    changes: Partial<HysaMonthEntry>
  ): void => {
    setScenarios((prev) => {
      const next = prev.map((s) => {
        if (s.id !== scenarioId) return s;
        const entries = s.entries.map((e) =>
          e.year === year && e.month === month ? { ...e, ...changes } : e
        );
        return { ...s, entries };
      });
      writeScenarios(next);
      return next;
    });
  }, []);

  const addMonth = useCallback((scenarioId: string): void => {
    setScenarios((prev) => {
      const next = prev.map((s) => {
        if (s.id !== scenarioId) return s;
        const entries = [...s.entries];
        let year: number, month: number;
        if (entries.length === 0) {
          const now = new Date();
          year  = now.getFullYear();
          month = now.getMonth() + 1;
        } else {
          const last = entries[entries.length - 1];
          year  = last.month === 12 ? last.year + 1 : last.year;
          month = last.month === 12 ? 1 : last.month + 1;
        }
        entries.push({
          year, month,
          salaryAmount: 0, salaryInterest: 0,
          cardSpendAmount: 0, cardInterest: 0,
          insureAmount: 0, insureInterest: 0,
          investAmount: 0, investInterest: 0,
          investmentPL: 0,
        });
        return { ...s, entries };
      });
      writeScenarios(next);
      return next;
    });
  }, []);

  const removeLastMonth = useCallback((scenarioId: string): void => {
    setScenarios((prev) => {
      const next = prev.map((s) =>
        s.id !== scenarioId ? s : { ...s, entries: s.entries.slice(0, -1) }
      );
      writeScenarios(next);
      return next;
    });
  }, []);

  return {
    scenarios, addScenario, removeScenario, updateScenario,
    updateEntry, addMonth, removeLastMonth,
  };
}
