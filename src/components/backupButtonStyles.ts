// One set of button classes for the backup controls and the import dialog.
// They translate the inline styles DataPortability used before.

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity " +
  "cursor-pointer hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60";

export const BUTTON_PRIMARY = `${BASE} bg-[var(--primary)] text-[var(--on-primary)]`;

export const BUTTON_SECONDARY =
  `${BASE} border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-[var(--on-surface)]`;
