// Module-level record of which mounted pages have unsaved changes.
// Leave guards read it synchronously, so no React Context provider is needed.

const owners = new Map<string, string>(); // ownerId → tool name, in insertion order

/** Registers `ownerId` as dirty for `toolName`, or clears it when null. */
export function setUnsaved(ownerId: string, toolName: string | null): void {
  if (toolName === null) owners.delete(ownerId);
  else owners.set(ownerId, toolName);
}

/** The first dirty tool name in insertion order, or null when nothing is dirty. */
export function getUnsaved(): string | null {
  for (const name of owners.values()) return name;
  return null;
}

/**
 * True when it is fine to leave: nothing is dirty, or the user confirmed.
 * Uses globalThis.confirm (like the app's existing bare confirm calls) so it
 * can be tested in Node.
 */
export function confirmLeave(): boolean {
  const name = getUnsaved();
  if (name === null) return true;
  return globalThis.confirm(`You have unsaved changes to ${name}. Leave anyway?`);
}
