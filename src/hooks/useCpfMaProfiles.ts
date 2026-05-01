"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CpfMaParams = {
  currentBalance:          number;
  monthlyContrib:          number;
  startYear:               number;
  endContribYear:          number;
  birthYear:               number;
  annualMedishieldPremium: number;
};

export type CpfMaProfile = { id: string; name: string } & CpfMaParams;

export const CPF_MA_DEFAULT_PARAMS: CpfMaParams = {
  currentBalance:          10_000,
  monthlyContrib:          300,
  startYear:               new Date().getFullYear(),
  endContribYear:          new Date().getFullYear() + 11,
  birthYear:               1982,
  annualMedishieldPremium: 0,
};

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "cpf-ma:profiles";

function writeProfiles(profiles: CpfMaProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Quota exceeded — fail silently
  }
}

function readProfiles(): CpfMaProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CpfMaProfile[];
  } catch {}
  return [];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type UseCpfMaProfilesReturn = {
  profiles:      CpfMaProfile[];
  addProfile:    () => string;
  removeProfile: (id: string) => void;
  updateProfile: (id: string, changes: Partial<CpfMaProfile>) => void;
};

export function useCpfMaProfiles(): UseCpfMaProfilesReturn {
  const [profiles, setProfiles] = useState<CpfMaProfile[]>(() => readProfiles());

  const addProfile = useCallback((): string => {
    const id = `p_${Date.now()}`;
    setProfiles((prev) => {
      const next = [...prev, { id, name: "New Scenario", ...CPF_MA_DEFAULT_PARAMS }];
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

  const updateProfile = useCallback((id: string, changes: Partial<CpfMaProfile>): void => {
    setProfiles((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...changes } : p));
      writeProfiles(next);
      return next;
    });
  }, []);

  return { profiles, addProfile, removeProfile, updateProfile };
}
