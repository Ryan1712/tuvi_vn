# Tử Vi Chart Engine

Deterministic Tử Vi (Vietnamese astrology) chart calculation + a curated, sourced Rule Engine +
an LLM interpretation layer that only synthesizes what the code has already computed. See
`CLAUDE.md` for the project's foundational principles and `TuVi_Build_Spec_v1.md` for the
original build spec.

## Setup

```bash
npm install
cd web && npm install
```

## Environment variables

- `ANTHROPIC_API_KEY` — required for the LLM Overview feature (`POST /charts/overview`).
  Without it, that endpoint returns HTTP 500. All other endpoints (`POST /charts`,
  `POST /charts/rules`) work without it.
- `PORT` — optional, defaults to `3000`.

## Running

```bash
npm start          # Express API server, http://localhost:3000
cd web && npm run dev   # Vite dev server (proxies /api to the Express server), http://localhost:5173
```

## Testing

```bash
npm test            # backend (Vitest)
npm run typecheck   # backend
cd web && npx tsc -b && npx vite build   # frontend typecheck + build (no automated frontend tests yet)
```
