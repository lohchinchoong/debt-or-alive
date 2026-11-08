import { liftColor } from "@/lib/theme";

export type ToolCategory = "Property" | "CPF" | "Savings" | "Investment" | "Planning";

export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  category: ToolCategory;
  icon: string; // lucide icon name
};

export const tools: Tool[] = [
  {
    slug: "compound-interest",
    name: "Compound Interest",
    tagline: "Visualise how time and rate transform your invested capital.",
    category: "Investment",
    icon: "TrendingUp",
  },
  {
    slug: "cpf-sa-calculator",
    name: "CPF Special Account (SA) Calculator",
    tagline: "Project your Special Account balance with tiered interest and annual crediting.",
    category: "CPF",
    icon: "PiggyBank",
  },
  {
    slug: "cpf-ma-calculator",
    name: "CPF Medisave Account (MA) Calculator",
    tagline: "Project your Medisave balance, track the BHS ceiling, and model MediShield Life premiums.",
    category: "CPF",
    icon: "HeartPulse",
  },
  {
    slug: "cpf-oa-annuity-calculator",
    name: "CPF Ordinary Account (OA) Annuity Calculator",
    tagline: "See the constant monthly payout your OA balance can fund from your chosen start age.",
    category: "CPF",
    icon: "Banknote",
  },
  {
    slug: "hysa-tracker",
    name: "High Yield Savings Account Tracker",
    tagline: "Log monthly interest and investment gains across your high-yield savings accounts.",
    category: "Savings",
    icon: "TableProperties",
  },
  {
    slug: "fire-calculator",
    name: "FIRE Calculator",
    tagline: "When can you retire? Project your FIRE number and timeline.",
    category: "Planning",
    icon: "Flame",
  },
  {
    slug: "mortgage-calculator",
    name: "Mortgage Calculator",
    tagline: "Estimate monthly repayments for HDB or private property loans.",
    category: "Property",
    icon: "House",
  },
  {
    slug: "emergency-fund",
    name: "Savings / Emergency Fund",
    tagline: "Track multiple savings sources. See how interest grows your safety net over time.",
    category: "Savings",
    icon: "ShieldCheck",
  },
  {
    slug: "srs-calculator",
    name: "SRS Fund",
    tagline: "Track SRS deposits, investments, and plan your tax-efficient drawdown.",
    category: "Savings",
    icon: "Receipt",
  },
  {
    slug: "dividend-calculator",
    name: "Dividend Calculator",
    tagline: "Track your dividend portfolio. See annual and monthly income from every yield source.",
    category: "Investment",
    icon: "Percent",
  },
  {
    slug: "budget-planner",
    name: "Budget Planner",
    tagline: "Allocate income across needs, wants, and savings with clarity.",
    category: "Planning",
    icon: "LayoutList",
  },
  {
    slug: "savings-goal",
    name: "Savings Goal",
    tagline: "Work backwards from a target amount to a monthly savings plan.",
    category: "Planning",
    icon: "Target",
  },
];

export const categoryColors: Record<ToolCategory, string> = {
  Property:   liftColor("#00351f"),
  CPF:        liftColor("#1a4d35"),
  Savings:    liftColor("#1c3d2c"),
  Investment: liftColor("#0d3d28"),
  Planning:   liftColor("#2b3d32"),
};
