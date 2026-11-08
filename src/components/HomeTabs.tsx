"use client";

import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ToolGroup } from "@/lib/tools";

type HomeTabsProps = {
  tracking: ReactNode;
  calculators: ReactNode;
  labels: Record<ToolGroup, { label: string; subtitle: string }>;
};

export function HomeTabs({ tracking, calculators, labels }: HomeTabsProps) {
  const panels: { group: ToolGroup; content: ReactNode }[] = [
    { group: "tracking", content: tracking },
    { group: "calculators", content: calculators },
  ];

  return (
    <Tabs defaultValue="tracking">
      <TabsList aria-label="Tool groups">
        {panels.map(({ group }) => (
          <TabsTrigger key={group} value={group}>
            {labels[group].label}
          </TabsTrigger>
        ))}
      </TabsList>
      {panels.map(({ group, content }) => (
        <TabsContent key={group} value={group} forceMount>
          <p className="text-sm mb-4" style={{ color: "var(--on-surface-sub)" }}>
            {labels[group].subtitle}
          </p>
          {content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
