"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SavingsItem = {
  id: string;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
};

export type SavingsScenario = {
  id:           string;
  name:         string;
  targetAmount: number;
  targetDate:   string; // YYYY-MM-DD
  items:        SavingsItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultTargetDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "savings-goal:scenarios";

function writeScenarios(scenarios: SavingsScenario[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch {
    // Quota exceeded — fail silently
  }
}

function readScenarios(): SavingsScenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavingsScenario>[];
      // Backfill targetAmount / targetDate for legacy records
      return parsed.map((s, i) => ({
        id:           s.id           ?? `sg_${Date.now()}_${i}`,
        name:         s.name         ?? "Untitled",
        targetAmount: s.targetAmount ?? 0,
        targetDate:   s.targetDate   ?? defaultTargetDate(),
        items:        s.items        ?? [],
      }));
    }
  } catch {}
  return [];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type UseSavingsGoalReturn = {
  scenarios:      SavingsScenario[];
  addScenario:    () => string;
  removeScenario: (id: string) => void;
  updateScenario: (id: string, changes: Partial<Omit<SavingsScenario, "id" | "items">>) => void;
  addItem:        (scenarioId: string, item: Omit<SavingsItem, "id">) => void;
  removeItem:     (scenarioId: string, itemId: string) => void;
  updateItem:     (scenarioId: string, itemId: string, changes: Partial<Omit<SavingsItem, "id">>) => void;
  updateItems:    (scenarioId: string, items: SavingsItem[]) => void;
};

export function useSavingsGoal(): UseSavingsGoalReturn {
  const [scenarios, setScenarios] = useState<SavingsScenario[]>(() => readScenarios());

  const addScenario = useCallback((): string => {
    const id = `sg_${Date.now()}`;
    setScenarios((prev) => {
      const next = [
        ...prev,
        {
          id,
          name:         "New Goal",
          targetAmount: 10_000,
          targetDate:   defaultTargetDate(),
          items:        [],
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

  const updateScenario = useCallback(
    (id: string, changes: Partial<Omit<SavingsScenario, "id" | "items">>): void => {
      setScenarios((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...changes } : s));
        writeScenarios(next);
        return next;
      });
    },
    []
  );

  const addItem = useCallback((scenarioId: string, item: Omit<SavingsItem, "id">): void => {
    const itemId = `item_${Date.now()}`;
    setScenarios((prev) => {
      const next = prev.map((s) =>
        s.id === scenarioId
          ? { ...s, items: [...s.items, { id: itemId, ...item }] }
          : s
      );
      writeScenarios(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((scenarioId: string, itemId: string): void => {
    setScenarios((prev) => {
      const next = prev.map((s) =>
        s.id === scenarioId
          ? { ...s, items: s.items.filter((it) => it.id !== itemId) }
          : s
      );
      writeScenarios(next);
      return next;
    });
  }, []);

  const updateItem = useCallback(
    (scenarioId: string, itemId: string, changes: Partial<Omit<SavingsItem, "id">>): void => {
      setScenarios((prev) => {
        const next = prev.map((s) =>
          s.id === scenarioId
            ? {
                ...s,
                items: s.items.map((it) =>
                  it.id === itemId ? { ...it, ...changes } : it
                ),
              }
            : s
        );
        writeScenarios(next);
        return next;
      });
    },
    []
  );

  const updateItems = useCallback((scenarioId: string, items: SavingsItem[]): void => {
    setScenarios((prev) => {
      const next = prev.map((s) => (s.id === scenarioId ? { ...s, items } : s));
      writeScenarios(next);
      return next;
    });
  }, []);

  return {
    scenarios,
    addScenario,
    removeScenario,
    updateScenario,
    addItem,
    removeItem,
    updateItem,
    updateItems,
  };
}
