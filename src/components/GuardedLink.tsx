"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { confirmLeave } from "@/lib/unsavedStore";

/**
 * next/link that asks before leaving a page with unsaved changes.
 * The only module allowed to import next/link.
 */
export function GuardedLink({ onNavigate, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onNavigate={(e) => {
        if (!confirmLeave()) {
          e.preventDefault();
          return;
        }
        onNavigate?.(e);
      }}
    />
  );
}
