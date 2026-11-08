import { genId } from "@/lib/utils";
import { createInputsAdapter } from "../inputsAdapter";

// Adapters for the five tools that used useToolState: flat inputs in
// `tool:<slug>` plus optional list keys. Types move here from the pages.

// ─── Compound interest ────────────────────────────────────────────────────────

export const compoundInterestAdapter = createInputsAdapter({
  slug: "compound-interest",
  inputDefaults: () => ({
    initial: 10_000,
    monthly: 500,
    rate: 5,
    years: 10,
    compFreq: 12 as number,
    timing: "end" as string,
  }),
  lists: {},
});

// ─── FIRE ─────────────────────────────────────────────────────────────────────

export type YieldSource = {
  id: string;
  name: string;
  value: number;
  yieldRate: number; // annual %
  startAge: number;  // age at which yield income begins (compounds before this)
};

export type DrawdownSource = {
  id: string;
  name: string;
  value: number;
  startAge: number;
  endAge: number;
};

export const fireAdapter = createInputsAdapter({
  slug: "fire-calculator",
  inputDefaults: () => ({ monthlyExpense: 3000, currentAge: 30, retirementAge: 55, deathAge: 80 }),
  lists: {
    yieldSources: {
      key: "fire:yield-sources-v2",
      defaults: (): YieldSource[] => [
        { id: genId("src"), name: "Dividend ETF", value: 50000, yieldRate: 5, startAge: 30 },
      ],
    },
    drawdownSources: {
      key: "fire:drawdown-sources-v2",
      defaults: (): DrawdownSource[] => [
        { id: genId("src"), name: "Growth Portfolio", value: 100000, startAge: 55, endAge: 80 },
      ],
    },
  },
});

// ─── Mortgage ─────────────────────────────────────────────────────────────────

export type PartialRepayment = {
  id: string;
  year: number;  // loan year (1-based)
  amount: number;
};

export const mortgageAdapter = createInputsAdapter({
  slug: "mortgage-calculator",
  inputDefaults: () => ({ propertyPrice: 500_000, downPaymentPct: 25, annualRate: 3.5, tenureYears: 25 }),
  lists: {
    partialRepayments: { key: "mortgage:partial-repayments", defaults: (): PartialRepayment[] => [] },
  },
});

// ─── Emergency fund ───────────────────────────────────────────────────────────

export type SavingsSource = {
  id: string;
  name: string;
  balance: number;
  startDate: string; // YYYY-MM-DD
  interestRate: number; // % p.a.
};

export const emergencyFundAdapter = createInputsAdapter({
  slug: "emergency-fund",
  inputDefaults: () => ({ monthlyExpenses: 3000, targetMonths: 6 }),
  lists: {
    sources: { key: "emergency-fund:sources", defaults: (): SavingsSource[] => [] },
  },
});

// ─── Budget planner ───────────────────────────────────────────────────────────

export type BudgetCategory =
  | "Insurance"
  | "Utilities"
  | "Food"
  | "Education"
  | "Tuition"
  | "Allowance"
  | "Car"
  | "Home"
  | "Holiday"
  | "Saving"
  | "Investment"
  | "Grocery"
  | "Entertainment"
  | "Tax";

export type BudgetItem = {
  id: string;
  label: string;
  category: BudgetCategory;
  planned: number; // monthly SGD
};

export const budgetAdapter = createInputsAdapter({
  slug: "budget-planner",
  inputDefaults: () => ({ annualSalary: 72000 }),
  lists: {
    items: { key: "budget:items", defaults: (): BudgetItem[] => [] },
  },
});
