# PrepAI — Development Progress Tracker

**Rule:** Update this file at the end of every Antigravity phase. Record evidence, not optimism. A feature is “Complete” only when it is implemented, connected to the real backend/data flow, and tested. Keep unverified items as “In progress” or “Blocked”.

## Overall status

- [x] Phase 1 — Foundation, design system, auth, database and API skeleton
- [ ] Phase 2 — Subjects, syllabus, tasks, calendar and intelligent planner
- [ ] Phase 3 — Private document library, ingestion and embeddings
- [ ] Phase 4 — RAG assistant, conversations, retrieval and citations
- [ ] Phase 5 — Analytics, dashboard completion, notifications, settings and visual polish
- [ ] Phase 6 — Integration, security, testing, setup documentation and release readiness

**Current phase:** Phase 1 Completed (Ready for Phase 2)  
**Last updated:** 2026-10-11  
**Repository/branch:** main  
**Development environment:** Python 3.13.7, Node v22.19.0, npm 10.9.3, Vite 6.4.4, FastAPI 0.143.0, Uvicorn 0.54.0

## Phase log

### Phase 1 — Foundation
**Status:** Complete  
**Implemented:**
- Root configuration: `.gitignore`, `.env.example`, `README.md`, Git initialized on `main`.
- Supabase SQL Migration: `backend/migrations/00001_create_profiles.sql` defining `profiles` table linked to `auth.users(id)` with strict Row Level Security (RLS) policies (`auth.uid() = id`) and auto-create profile trigger on signup.
- FastAPI backend modular skeleton:
  - `backend/app/core/config.py`: `pydantic-settings` configuration for Ollama models, Supabase settings, and CORS origins.
  - `backend/app/core/security.py`: cryptographic Supabase JWT verification deriving identity strictly from `sub` claim.
  - `backend/app/api/deps.py`: `get_current_user` dependency extracting and validating Bearer token.
  - `backend/app/api/routes/health.py`: public `/health` and `/api/v1/health` endpoints.
  - `backend/app/api/routes/auth.py`: protected `GET /api/v1/auth/me`.
  - `backend/app/main.py`: application entry point with CORS and error handling.
- React + TypeScript + Vite frontend:
  - Stitch Glassmorphism design tokens in `frontend/src/styles/tokens.css` and `globals.css` (Level 1, 2, 3 glass tiers, specular top edges, ambient cosmic radial glows).
  - Reusable UI primitives: `GlassCard`, `GlassButton`, `GlassInput`.
  - Master responsive layout: `AppShell`, `Sidebar` (fixed desktop, drawer mobile), `TopBar` (breadcrumbs, search `⌘K`, actions, profile).
  - Supabase client (`src/lib/supabase.ts`) and typed API fetch client (`src/lib/api-client.ts`).
  - Auth context and route guards (`AuthContext.tsx`, `ProtectedRoute`).
  - Stitch Screen 1: `AuthPage.tsx` (Sign In / Register tabs, password toggle, right-hand "Cognitive Engine" synthetic citation preview card) and `ResetPasswordPage.tsx`.
  - Stitch Screen 2: `DashboardPage.tsx` (welcome banner, 4 metric cards, smart study schedule, weekly focus chart, subject progress, quick RAG query box, deadlines, activity timeline).
  - Route placeholders for all 8 application screens.
**Verification evidence:**
- Backend unit tests (`pytest -c backend/pytest.ini backend/tests -v`): 6/6 tests passed (health checks, token validation, expired token rejection, missing token handling, valid authentication).
- Backend dry-run import: `app.main.app.title` loaded successfully ("PrepAI").
- Frontend production build (`npm run build`): TypeScript compiled cleanly, Vite bundled production assets (`dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`) in 6.15s with zero errors.
**Blockers/risks:** Supabase live credentials must be supplied in `.env` for production database operations; local/dev mode gracefully handles unconfigured credentials for visual inspection.  
**Exit criteria:** All Phase 1 exit criteria met.


### Phase 2 — Study planning, tasks and calendar
**Status:** Not started  
**Implemented:** —  
**Verification evidence:** —  
**Blockers/risks:** Planner behavior must be tested against impossible and time-zone-sensitive schedules.  
**Exit criteria:** Refer to `phasewiseprompt.md` Phase 2.

### Phase 3 — Document ingestion and embeddings
**Status:** Not started  
**Implemented:** —  
**Verification evidence:** —  
**Blockers/risks:** Finalize the embedding model and actual vector dimension before applying the vector schema; Ollama must be installed and reachable from the backend.  
**Exit criteria:** Refer to `phasewiseprompt.md` Phase 3.

### Phase 4 — Academic RAG assistant
**Status:** Not started  
**Implemented:** —  
**Verification evidence:** —  
**Blockers/risks:** Source citations must map to stored chunk IDs and metadata; retrieval evaluation set is required.  
**Exit criteria:** Refer to `phasewiseprompt.md` Phase 4.

### Phase 5 — Dashboard, analytics and settings
**Status:** Not started  
**Implemented:** —  
**Verification evidence:** —  
**Blockers/risks:** Do not present fixture data as real user analytics.  
**Exit criteria:** Refer to `phasewiseprompt.md` Phase 5.

### Phase 6 — Hardening and release readiness
**Status:** Not started  
**Implemented:** —  
**Verification evidence:** —  
**Blockers/risks:** Complete a two-user security check and run the end-to-end workflow before declaring release readiness.  
**Exit criteria:** Refer to `phasewiseprompt.md` Phase 6.

## Key decisions register

| Decision | Current choice | Rationale / notes |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast interactive SPA with typed components |
| Backend | Python + FastAPI | Owns business logic, planner, ingestion and RAG |
| Auth | Supabase Auth | Shared identity with Supabase database/storage |
| Database | Supabase Postgres | Structured app data |
| Vector store | Supabase `pgvector` | Stores and searches local-model embeddings |
| File storage | Supabase Storage, private bucket | User-owned study documents |
| LLM inference | Local Ollama | No hosted LLM API in the planned MVP |
| Embedding model | `nomic-embed-text` proposed; confirm dimension | Must match vector column and query model |
| Chat model | `qwen2.5:7b` example; verify installed model and hardware | Configurable, not hard-coded |
| Deployment | Local/private backend able to reach Ollama | A public website cannot automatically reach a user's local model |

## Known risks and mitigations

1. **Ollama availability/memory:** model loading can be slow and depend on hardware. Add timeouts, user-visible errors, configurable model names and a local smoke test.
2. **Embedding dimension drift:** changing the embedding model can invalidate vectors. Lock the model/dimension configuration and re-embed documents after an intentional change.
3. **Document parsing variability:** PDFs may be scanned or malformed. Detect empty extraction, communicate the limitation, and do not mark failed ingestion as indexed.
4. **RAG hallucinations:** use retrieved context, source-ID-based citation resolution, an insufficient-evidence path and a small evaluation dataset.
5. **Privacy boundary:** enforce user checks in API and RLS/Storage policies; test with two independent accounts.
6. **Glass UI performance:** avoid nested backdrop filters and keep visual effects restrained on smaller devices.
7. **Reminder behavior:** do not claim reliable OS push/background scheduling unless the deployed infrastructure actually supports it.

## Phase completion template

Copy and complete after every phase:

```text
Phase completed:
Commit/branch:
Implemented features:
Files/modules changed:
Database migrations applied:
Commands run:
Frontend typecheck/lint/build results:
Backend lint/tests results:
E2E/manual tests performed:
Security checks performed:
Known issues/blockers:
Exit criteria passed (yes/no; explain failures):
Next phase allowed (yes/no):
```

## Final release checklist

- [ ] All six phases are complete and evidence is recorded.
- [ ] All PRD acceptance criteria are satisfied or exceptions are documented.
- [ ] Frontend lint, type check, tests and production build pass.
- [ ] Backend lint, tests and API integration checks pass.
- [ ] Planner constraints and re-planning idempotency are tested.
- [ ] At least one PDF or other supported file is successfully indexed by local Ollama embeddings.
- [ ] RAG answer citations map to valid stored sources/pages.
- [ ] Insufficient evidence does not generate fake citations.
- [ ] Two-user cross-account security testing passes.
- [ ] Real secrets are not tracked or exposed to the frontend.
- [ ] Documentation explains setup, migration, models, known limits and recovery.
