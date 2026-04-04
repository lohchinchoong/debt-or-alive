export type ToolCategory = "Property" | "CPF" | "Debt" | "Savings" | "Investment" | "Planning";

export type Tool = {
  slug: string;
  name: string;
  tagline: string;
  category: ToolCategory;
  icon: string; // lucide icon name
  accent?: "primary" | "tertiary";
  comingSoon?: boolean;
};

export const tools: Tool[] = [
  // ── Live tools (shown first) ──────────────────────────────────────────────
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
    category: "CPF",
    icon: "Receipt",
  },
  // ── Coming soon ───────────────────────────────────────────────────────────
  {
    slug: "rent-vs-buy",
    name: "Rent vs Buy",
    tagline: "Is buying really cheaper? Model the true cost over time.",
    category: "Property",
    icon: "Scale",
    comingSoon: true,
  },
  {
    slug: "cpf-oa-to-sa",
    name: "CPF OA → SA Transfer",
    tagline: "Model the long-term effect of transferring OA funds to SA.",
    category: "CPF",
    icon: "ArrowRightLeft",
    comingSoon: true,
  },
  {
    slug: "debt-repayment",
    name: "Debt Repayment Planner",
    tagline: "Avalanche or snowball — find your fastest path to debt-free.",
    category: "Debt",
    icon: "TrendingDown",
    accent: "tertiary",
    comingSoon: true,
  },
  {
    slug: "loan-comparison",
    name: "Loan Comparison",
    tagline: "Compare multiple loan offers side-by-side on total cost.",
    category: "Debt",
    icon: "GitCompare",
    accent: "tertiary",
    comingSoon: true,
  },
  {
    slug: "savings-goal",
    name: "Savings Goal",
    tagline: "Work backwards from a target amount to a monthly savings plan.",
    category: "Savings",
    icon: "Target",
    comingSoon: true,
  },
  {
    slug: "budget-planner",
    name: "Budget Planner",
    tagline: "Allocate income across needs, wants, and savings with clarity.",
    category: "Planning",
    icon: "LayoutList",
    comingSoon: true,
  },
  {
    slug: "net-worth",
    name: "Net Worth Tracker",
    tagline: "Sum your assets and liabilities to find your true financial position.",
    category: "Planning",
    icon: "Wallet",
    comingSoon: true,
  },
];

export const categoryOrder: ToolCategory[] = [
  "Property",
  "CPF",
  "Debt",
  "Savings",
  "Investment",
  "Planning",
];

export const categoryColors: Record<ToolCategory, string> = {
  Property:   "#00351f",
  CPF:        "#1a4d35",
  Debt:       "#4f1b1f",
  Savings:    "#1c3d2c",
  Investment: "#0d3d28",
  Planning:   "#2b3d32",
};
