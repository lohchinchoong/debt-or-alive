"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during SSR and hydration, true afterwards — without a setState-in-effect.
 * Pages gate localStorage-backed content on this so the server render and the
 * hydration render match, while state can be lazily initialized from storage.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
