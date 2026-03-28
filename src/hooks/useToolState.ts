"use client";

/**
 * useToolState — persistent state for finance tools
 *
 * Priority (highest → lowest):
 *   1. URL search params  — shareable / bookmarkable across devices
 *   2. localStorage       — survives page refresh on same browser
 *   3. defaults           — first-ever visit
 *
 * On every change: writes to localStorage immediately and debounces
 * a URL replaceState (no history spam) so the URL stays shareable.
 */

import { useState, useEffect, useRef, useCallback } from "react";

type Primitive = string | number | boolean;
export type StateSchema = Record<string, Primitive>;

// ─── URL helpers ──────────────────────────────────────────────────────────────

function readFromUrl<T extends StateSchema>(defaults: T): Partial<T> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const result: Partial<T> = {};
  for (const key in defaults) {
    const raw = params.get(key);
    if (raw === null) continue;
    const def = defaults[key];
    if (typeof def === "number") {
      const n = parseFloat(raw);
      if (!isNaN(n)) result[key] = n as T[typeof key];
    } else if (typeof def === "boolean") {
      result[key] = (raw === "true") as T[typeof key];
    } else {
      result[key] = raw as T[typeof key];
    }
  }
  return result;
}

function writeToUrl<T extends StateSchema>(state: T): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  for (const key in state) {
    params.set(key, String(state[key]));
  }
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function readFromStorage<T extends StateSchema>(storageKey: string, defaults: T): Partial<T> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Partial<T> = {};
    for (const key in defaults) {
      if (!(key in parsed)) continue;
      const def = defaults[key];
      const val = parsed[key];
      if (typeof def === typeof val) result[key] = val as T[typeof key];
    }
    return result;
  } catch {
    return {};
  }
}

function writeToStorage<T extends StateSchema>(storageKey: string, state: T): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Quota exceeded or storage unavailable — fail silently
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToolState<T extends StateSchema>(
  storageKey: string,
  defaults: T,
): [T, (updates: Partial<T>) => void] {
  // Always start from defaults to avoid SSR/hydration mismatch.
  // Persisted values are applied client-side in the useEffect below.
  const [state, setStateRaw] = useState<T>(defaults);
  const urlDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);

  // After first render: load persisted state and sync URL
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const fromUrl = readFromUrl(defaults);
    const hasUrlParams = Object.keys(fromUrl).length > 0;
    const fromStorage = hasUrlParams ? {} : readFromStorage(storageKey, defaults);

    const resolved: T = { ...defaults, ...fromStorage, ...fromUrl };
    setStateRaw(resolved);
    writeToStorage(storageKey, resolved);
    writeToUrl(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback(
    (updates: Partial<T>) => {
      setStateRaw((prev) => {
        const next = { ...prev, ...updates };
        writeToStorage(storageKey, next);
        if (urlDebounce.current) clearTimeout(urlDebounce.current);
        urlDebounce.current = setTimeout(() => writeToUrl(next), 350);
        return next;
      });
    },
    [storageKey],
  );

  return [state, update];
}
