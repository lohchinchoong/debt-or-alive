"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CpfOaParams = {
  balanceAt55:    number;
  birthYear:      number;
  endDrawdownAge: number;
};

export type CpfOaProfile = { id: string; name: string } & CpfOaParams;

export const CPF_OA_DEFAULT_PARAMS: CpfOaParams = {
  balanceAt55:    150_000,
  birthYear:      1982,
  endDrawdownAge: 75,
};

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "cpf-oa:profiles";

function writeProfiles(profiles: CpfOaProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Quota exceeded — fail silently
  }
}

function readProfiles(): CpfOaProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      // Fill in any fields missing from profiles saved under an earlier shape
      return (JSON.parse(raw) as CpfOaProfile[]).map(({ id, name, ...rest }) => ({
        id,
        name,
        balanceAt55:    rest.balanceAt55    ?? CPF_OA_DEFAULT_PARAMS.balanceAt55,
        birthYear:      rest.birthYear      ?? CPF_OA_DEFAULT_PARAMS.birthYear,
        endDrawdownAge: rest.endDrawdownAge ?? CPF_OA_DEFAULT_PARAMS.endDrawdownAge,
      }));
    }
  } catch {}
  return [];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export type UseCpfOaProfilesReturn = {
  profiles:      CpfOaProfile[];
  addProfile:    () => string;
  removeProfile: (id: string) => void;
  updateProfile: (id: string, changes: Partial<CpfOaProfile>) => void;
};

export function useCpfOaProfiles(): UseCpfOaProfilesReturn {
  const [profiles, setProfiles] = useState<CpfOaProfile[]>(() => readProfiles());

  const addProfile = useCallback((): string => {
    const id = `p_${Date.now()}`;
    setProfiles((prev) => {
      const next = [...prev, { id, name: "New Scenario", ...CPF_OA_DEFAULT_PARAMS }];
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

  const updateProfile = useCallback((id: string, changes: Partial<CpfOaProfile>): void => {
    setProfiles((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...changes } : p));
      writeProfiles(next);
      return next;
    });
  }, []);

  return { profiles, addProfile, removeProfile, updateProfile };
}
