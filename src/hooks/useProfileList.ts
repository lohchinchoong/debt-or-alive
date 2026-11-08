"use client";

import { useCallback, useState } from "react";
import { useIsClient } from "@/hooks/useIsClient";
import { deleteProfile } from "@/lib/persistence/profiles";
import type { ProfileAdapter, ProfileBase, SaveResult } from "@/lib/persistence/types";

export type UseProfileListReturn<P> = {
  status: "loading" | "ready";
  profiles: P[];
  /** Deletes straight away; call only after the user confirms. */
  remove(id: string): SaveResult;
};

/** Read-only list of a tool's profiles, plus confirmed delete. */
export function useProfileList<P extends ProfileBase>(adapter: ProfileAdapter<P>): UseProfileListReturn<P> {
  const isClient = useIsClient();
  const [profiles, setProfiles] = useState<P[]>(() =>
    typeof window === "undefined" ? [] : adapter.readAll(localStorage),
  );

  const remove = useCallback(
    (id: string): SaveResult => {
      const result = deleteProfile(localStorage, adapter, id);
      setProfiles(adapter.readAll(localStorage));
      return result;
    },
    [adapter],
  );

  return { status: isClient ? "ready" : "loading", profiles, remove };
}
