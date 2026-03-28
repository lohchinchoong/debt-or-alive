# Debt or Alive — Claude Instructions

## Project
**Name:** Debt or Alive
**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui

## Design
- Mobile-first responsive design is a core requirement — always design for small screens first, then scale up.
- Use Tailwind utility classes; avoid custom CSS unless absolutely necessary.
- Use shadcn/ui components where they fit; do not reinvent primitives.

## Code Conventions
- **Named imports only** — no default exports for components.
  ```ts
  // correct
  export function DebtCard() { ... }
  // wrong
  export default function DebtCard() { ... }
  ```
- Prefer functional components and React hooks over class components.
- Keep components small and single-purpose; extract logic to custom hooks.
- Use TypeScript strictly — avoid `any`; prefer explicit types over inference where intent is unclear.
- Co-locate types with the file that owns them unless shared across 3+ files.

## File Structure
- App routes live in `src/app/`
- Shared components in `src/components/`
- Custom hooks in `src/hooks/`
- Utility functions in `src/lib/`

## Commits
- **Never commit automatically.** Only run `git commit` (and `git push`) when explicitly asked.
- When asked to commit, follow conventional commit format:
  - `feat:` new feature
  - `fix:` bug fix
  - `chore:` tooling, deps, config
  - `refactor:` code change with no behavior change
  - `docs:` documentation only
  - `style:` formatting, lint fixes
  - `test:` adding or updating tests

## General
- Do not add libraries without discussing trade-offs first.
- Prefer server components by default; add `"use client"` only when needed.
- Keep this file under 80 lines.
