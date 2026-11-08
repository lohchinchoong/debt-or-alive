import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { groupMeta, tools } from "@/lib/tools";

const bySlug = (slug: string) => tools.find((t) => t.slug === slug);

describe("tools", () => {
  it("has unique slugs", () => {
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has a route folder for every tool", () => {
    for (const tool of tools) {
      const dir = path.join(process.cwd(), "src/app/tools", tool.slug);
      expect(existsSync(dir), `missing folder for ${tool.slug}`).toBe(true);
    }
  });

  it("puts every tool in a known group", () => {
    for (const tool of tools) {
      expect(["tracking", "calculators"]).toContain(tool.group);
    }
  });

  it("does not use the word Calculator in a Tracking Tool name", () => {
    for (const tool of tools.filter((t) => t.group === "tracking")) {
      expect(tool.name, tool.slug).not.toContain("Calculator");
    }
  });

  it("uses the agreed names for the renamed tools", () => {
    expect(bySlug("cpf-sa-calculator")?.name).toBe("CPF Special Account (SA)");
    expect(bySlug("cpf-ma-calculator")?.name).toBe("CPF Medisave Account (MA)");
    expect(bySlug("cpf-oa-annuity-calculator")?.name).toBe("CPF Ordinary Account (OA) Annuity");
    expect(bySlug("fire-calculator")?.name).toBe("FIRE Planner");
    expect(bySlug("dividend-calculator")?.name).toBe("Dividend Planner");
    expect(bySlug("compound-interest")?.name).toBe("Compound Interest Calculator");
  });

  it("has a label and subtitle for both groups", () => {
    for (const group of ["tracking", "calculators"] as const) {
      expect(groupMeta[group].label.length).toBeGreaterThan(0);
      expect(groupMeta[group].subtitle.length).toBeGreaterThan(0);
    }
  });
});
