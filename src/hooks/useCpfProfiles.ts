"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CpfParams = {
  currentBalance: number;
  monthlyContrib: number;
  startYear:      number;
  endContribYear: number;
  birthYear:      number;
};

export type CpfProfile = { id: string; name: string } & CpfParams;

export const CPF_DEFAULT_PARAMS: CpfParams = {
  currentBalance: 10_000,
  monthlyContrib: 500,
  startYear:      new Date().getFullYear(),
  endContribYear: new Date().getFullYear() + 11,
  birthYear:      1982,
};

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "cpf-sa:profiles";

function writeProfiles(profiles: CpfProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Quota exceeded — fail silently
  }
}

function readProfiles(): CpfProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CpfProfile[];

    // One-time migration: promote old single-profile key to the new array format
    const oldRaw = localStorage.getItem("tool:cpf-sa-calculator");
    if (oldRaw) {
      const old = JSON.parse(oldRaw) as Partial<CpfParams>;
      const migrated: CpfProfile = {
        id:   `p_${Date.now()}`,
        name: "My Scenario",
        ...CPF_DEFAULT_PARAMS,
        ...old,
      };
      writeProfiles([migrated]);
      return [migrated];
    }
  } catch {}
  return [];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type UseCpfProfilesReturn = {
  profiles:      CpfProfile[];
  addProfile:    () => string;
  removeProfile: (id: string) => void;
  updateProfile: (id: string, changes: Partial<CpfProfile>) => void;
};

export function useCpfProfiles(): UseCpfProfilesReturn {
  const [profiles, setProfiles] = useState<CpfProfile[]>(() => readProfiles());

  const addProfile = useCallback((): string => {
    const id = `p_${Date.now()}`;
    setProfiles((prev) => {
      const next = [...prev, { id, name: "New Scenario", ...CPF_DEFAULT_PARAMS }];
      writeProfiles(next);
      return next;
    });
    return id;
  }, []);

  const removeProfile = useCallback((id: string): void => {
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      writeProfiles(next);
      return next;
    });
  }, []);

  const updateProfile = useCallback((id: string, changes: Partial<CpfProfile>): void => {
    setProfiles((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...changes } : p));
      writeProfiles(next);
      return next;
    });
  }, []);

  return { profiles, addProfile, removeProfile, updateProfile };
}
