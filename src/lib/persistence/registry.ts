import { cpfSaAdapter } from "./adapters/cpf-sa";
import type { ProfileAdapter, ProfileBase, ToolAdapter } from "./types";

// Each rollout stage registers its own tools' adapters here.
// Adapters must never import this module.

export const TOOL_ADAPTERS: readonly ToolAdapter<unknown>[] = [];

export const PROFILE_ADAPTERS: readonly ProfileAdapter<ProfileBase>[] = [cpfSaAdapter];

/** Every storage key owned by a registered adapter, without duplicates. */
export const REGISTERED_KEYS: readonly string[] = Array.from(
  new Set([...TOOL_ADAPTERS.flatMap((a) => a.keys), ...PROFILE_ADAPTERS.map((a) => a.key)]),
);
