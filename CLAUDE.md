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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
