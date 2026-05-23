"use client";

import { useState, useCallback } from "react";
import { loadArray, saveArray, genId } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScbMonthEntry = {
  year:               number;
  month:              number;  // 1-12
  monthSaved:         number;  // net deposit (negative = withdrawal)
  salaryAmount:       number;  // S$ credited as salary (≥3,000 qualifies)
  cardSpendAmount:    number;  // S$ spent on SCB card this month
  insureAmount:       number;  // S$ paid for eligible insurance (> 0 = active)
  investAmount:       number;  // S$ in eligible investment (> 0 = active)
  investmentPL:       number;  // investment portfolio P&L this month
  investmentIncome:   number;  // dividends / interest received from investments
};

export type ScbScenario = {
  id:             string;
  name:           string;
  startYear:      number;
  startMonth:     number;      // 1-12
  initialBalance: number;
  entries:        ScbMonthEntry[];
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "scb-bonus-saver:scenarios";

function readScenarios(): ScbScenario[] {
  return loadArray<ScbScenario>(STORAGE_KEY, []);
}

function writeScenarios(scenarios: ScbScenario[]): void {
  saveArray(STORAGE_KEY, scenarios);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type UseScbScenariosReturn = {
  scenarios:       ScbScenario[];
  addScenario:     () => string;
  removeScenario:  (id: string) => void;
  updateScenario:  (id: string, changes: Partial<Omit<ScbScenario, "id" | "entries">>) => void;
  updateEntry:     (scenarioId: string, year: number, month: number, changes: Partial<ScbMonthEntry>) => void;
  addMonth:        (scenarioId: string) => void;
  removeLastMonth: (scenarioId: string) => void;
};

export function useScbScenarios(): UseScbScenariosReturn {
  const [scenarios, setScenarios] = useState<ScbScenario[]>(() => readScenarios());

  const addScenario = useCallback((): string => {
    const id = genId("scb");
    const now = new Date();
    setScenarios((prev) => {
      const next: ScbScenario[] = [
        ...prev,
        {
          id,
          name:           "New Scenario",
          startYear:      now.getFullYear(),
          startMonth:     now.getMonth() + 1,
          initialBalance: 10_000,
          entries:        [],
        },
      ];
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
    changes: Partial<Omit<ScbScenario, "id" | "entries">>
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
    changes: Partial<ScbMonthEntry>
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
          year  = s.startYear;
          month = s.startMonth;
        } else {
          const last = entries[entries.length - 1];
          year  = last.month === 12 ? last.year + 1 : last.year;
          month = last.month === 12 ? 1 : last.month + 1;
        }
        entries.push({
          year, month,
          monthSaved: 0, salaryAmount: 0, cardSpendAmount: 0,
          insureAmount: 0, investAmount: 0,
          investmentPL: 0, investmentIncome: 0,
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
