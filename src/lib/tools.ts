import { liftColor } from "@/lib/theme";

export type ToolCategory = "Property" | "CPF" | "Savings" | "Investment" | "Planning";

export type ToolGroup = "tracking" | "calculators";

export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  category: ToolCategory;
  icon: string; // lucide icon name
  group: ToolGroup;
};

export const tools: Tool[] = [
  {
    slug: "compound-interest",
    name: "Compound Interest Calculator",
    tagline: "Visualise how time and rate transform your invested capital.",
    category: "Investment",
    icon: "TrendingUp",
    group: "calculators",
  },
  {
    slug: "cpf-sa-calculator",
    name: "CPF Special Account (SA)",
    tagline: "Project your Special Account balance with tiered interest and annual crediting.",
    category: "CPF",
    icon: "PiggyBank",
    group: "tracking",
  },
  {
    slug: "cpf-ma-calculator",
    name: "CPF Medisave Account (MA)",
    tagline: "Project your Medisave balance, track the BHS ceiling, and model MediShield Life premiums.",
    category: "CPF",
    icon: "HeartPulse",
    group: "tracking",
  },
  {
    slug: "cpf-oa-annuity-calculator",
    name: "CPF Ordinary Account (OA) Annuity",
    tagline: "See the constant monthly payout your OA balance can fund from your chosen start age.",
    category: "CPF",
    icon: "Banknote",
    group: "tracking",
  },
  {
    slug: "hysa-tracker",
    name: "High Yield Savings Account Tracker",
    tagline: "Log monthly interest and investment gains across your high-yield savings accounts.",
    category: "Savings",
    icon: "TableProperties",
    group: "tracking",
  },
  {
    slug: "fire-calculator",
    name: "FIRE Planner",
    tagline: "Financial independence, retire early: find your FIRE number and when you can retire.",
    category: "Planning",
    icon: "Flame",
    group: "tracking",
  },
  {
    slug: "mortgage-calculator",
    name: "Mortgage Calculator",
    tagline: "Estimate monthly repayments for HDB or private property loans.",
    category: "Property",
    icon: "House",
    group: "calculators",
  },
  {
    slug: "emergency-fund",
    name: "Savings / Emergency Fund",
    tagline: "Track multiple savings sources. See how interest grows your safety net over time.",
    category: "Savings",
    icon: "ShieldCheck",
    group: "tracking",
  },
  {
    slug: "srs-calculator",
    name: "SRS Fund",
    tagline: "Track SRS deposits, investments, and plan your tax-efficient drawdown.",
    category: "Savings",
    icon: "Receipt",
    group: "tracking",
  },
  {
    slug: "dividend-calculator",
    name: "Dividend Planner",
    tagline: "Track your dividend portfolio. See annual and monthly income from every yield source.",
    category: "Investment",
    icon: "Percent",
    group: "tracking",
  },
  {
    slug: "budget-planner",
    name: "Budget Planner",
    tagline: "Allocate income across needs, wants, and savings with clarity.",
    category: "Planning",
    icon: "LayoutList",
    group: "tracking",
  },
  {
    slug: "savings-goal",
    name: "Savings Goal",
    tagline: "Work backwards from a target amount to a monthly savings plan.",
    category: "Planning",
    icon: "Target",
    group: "tracking",
  },
];

export const categoryColors: Record<ToolCategory, string> = {
  Property:   liftColor("#00351f"),
  CPF:        liftColor("#1a4d35"),
  Savings:    liftColor("#1c3d2c"),
  Investment: liftColor("#0d3d28"),
  Planning:   liftColor("#2b3d32"),
};

export const groupMeta: Record<ToolGroup, { label: string; subtitle: string }> = {
  tracking: { label: "Tracking Tools", subtitle: "Saved on this device, for your own numbers." },
  calculators: { label: "Calculators", subtitle: "Quick, one-off what-ifs." },
};
