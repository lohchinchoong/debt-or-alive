import { toolMeta } from "../toolMeta";
import type { ProfileAdapter } from "../types";

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
  savedAt?:     string;
};

export function defaultTargetDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

// ─── Pure draft helpers (the page applies these through setDraft) ─────────────

export function addItem(scenario: SavingsScenario, item: Omit<SavingsItem, "id">): SavingsScenario {
  return { ...scenario, items: [...scenario.items, { id: `item_${Date.now()}`, ...item }] };
}

export function removeItem(scenario: SavingsScenario, itemId: string): SavingsScenario {
  return { ...scenario, items: scenario.items.filter((it) => it.id !== itemId) };
}

export function updateItem(
  scenario: SavingsScenario,
  itemId: string,
  changes: Partial<Omit<SavingsItem, "id">>,
): SavingsScenario {
  return { ...scenario, items: scenario.items.map((it) => (it.id === itemId ? { ...it, ...changes } : it)) };
}

/** Swaps the item at `index` with its neighbour in `direction`. */
export function moveItem(scenario: SavingsScenario, index: number, direction: -1 | 1): SavingsScenario {
  const target = index + direction;
  if (target < 0 || target >= scenario.items.length) return scenario;
  const items = [...scenario.items];
  [items[index], items[target]] = [items[target], items[index]];
  return { ...scenario, items };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

const KEY = "savings-goal:scenarios";

export const savingsGoalAdapter: ProfileAdapter<SavingsScenario> = {
  ...toolMeta("savings-goal"),
  listPath: "/tools/savings-goal",
  key: KEY,
  readAll(storage) {
    try {
      const raw = storage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Partial<SavingsScenario>[];
      // Backfill fields for legacy records. A missing id gets a stable
      // fallback so the list and detail pages agree on it across reads.
      return parsed.map((s, i) => {
        const scenario: SavingsScenario = {
          id:           s.id           ?? `sg_legacy_${i}`,
          name:         s.name         ?? "Untitled",
          targetAmount: s.targetAmount ?? 0,
          targetDate:   s.targetDate   ?? defaultTargetDate(),
          items:        s.items        ?? [],
        };
        return s.savedAt ? { ...scenario, savedAt: s.savedAt } : scenario;
      });
    } catch {
      return [];
    }
  },
  newProfile() {
    return {
      id:           `sg_${Date.now()}`,
      name:         "New Goal",
      targetAmount: 10_000,
      targetDate:   defaultTargetDate(),
      items:        [],
    };
  },
};
