# Cloud Run Deployment Design

**Date:** 2026-06-01
**Goal:** Deploy the Spigen DE Amazon Analytics Dashboard (Next.js 16) to Google Cloud Run.

---

## Context

- App: Next.js 16.2.6 App Router, Supabase auth (email/password + magic link), middleware route protection.
- GCP: gcloud CLI authenticated as `dykim@spigen.com`, project `spigen-calude-edu-002` (ACTIVE).
- Decisions made with user:
  - Region: **asia-northeast3 (Seoul)**
  - Deploy method: **manual `gcloud` deploy** (CI/CD deferred)
  - Build method: **Dockerfile with `output: 'standalone'`**

## Architecture

```
local source → gcloud run deploy --source .
                 └→ Cloud Build builds image from Dockerfile
                     └→ Artifact Registry
                         └→ Cloud Run service (asia-northeast3)
```

| Item | Value |
|------|-------|
| Service name | `spigen-dashboard` |
| Region | `asia-northeast3` |
| Access | Public (`--allow-unauthenticated`) — app enforces its own Supabase auth via middleware |
| Scaling | min 0 / max 2 instances (edu project; zero cost when idle) |

## Build Configuration

| File | Change |
|------|--------|
| `next.config.ts` | Add `output: 'standalone'` |
| `Dockerfile` (new) | Multi-stage: deps → build → runner on `node:22-alpine`. Runner copies `.next/standalone`, `.next/static`, `public/`. Starts with `node server.js`, honors `PORT`/`HOSTNAME` (verified valid for Next.js 16 via Context7 docs). |
| `.dockerignore` + `.gcloudignore` (new) | Exclude `node_modules`, `.next`, `data/` (large CSVs), `__MACOSX`, `.git` |

## Environment Variables

All four `NEXT_PUBLIC_*` vars are inlined at **build time**, so they must be present during Cloud Build:

| Var | Source | Note |
|-----|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Public by design |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | Public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Public by design |
| `NEXT_PUBLIC_SITE_URL` | computed | Cloud Run deterministic URL: `https://spigen-dashboard-{PROJECT_NUMBER}.asia-northeast3.run.app` — computed **before** first deploy from project number, avoiding a chicken-and-egg redeploy |

- Injected into the image build via Dockerfile `ARG`/`ENV`.
- Same values also set as runtime env vars (`--set-env-vars`) for server actions.
- Secrets policy: anon/publishable keys ship in the client bundle anyway; no service-role key is used in this app.

## Deployment Sequence

1. Verify billing is enabled; enable APIs: `run.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`.
2. Get project number → compute service URL.
3. Add `output: 'standalone'`, write `Dockerfile`, `.dockerignore`, `.gcloudignore`; verify with local `npm run build`.
4. `gcloud run deploy spigen-dashboard --source . --region asia-northeast3 --allow-unauthenticated` (+ env vars, scaling flags).
5. **Manual post-step (user):** Supabase Dashboard → Auth → URL Configuration — set Site URL / add redirect URL for the Cloud Run domain (required for magic-link login).
6. Verify: open deployed URL, log in, confirm dashboard pages render with Supabase data.

## Error Handling

- Build failure → inspect Cloud Build logs (`gcloud builds log`).
- Billing not enabled → stop and ask the user (requires account decision).
- Runtime 500s → `gcloud run services logs read spigen-dashboard`.

## Out of Scope (future)

- GitHub push → Cloud Build CI/CD trigger
- Custom domain mapping
- SD view-attribution toggle and other PRD V2 items
