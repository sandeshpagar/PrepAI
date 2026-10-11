# PrepAI — Development Progress Tracker

**Rule:** Update this file at the end of every Antigravity phase. Record evidence, not optimism. A feature is “Complete” only when it is implemented, connected to the real backend/data flow, and tested. Keep unverified items as “In progress” or “Blocked”.

## Overall status

- [x] Phase 1 — Foundation, design system, auth, database and API skeleton
- [x] Phase 2 — Subjects, syllabus, tasks, calendar and intelligent planner
- [x] Phase 3 — Private document library, ingestion and embeddings
- [ ] Phase 4 — RAG assistant, conversations, retrieval and citations
- [ ] Phase 5 — Analytics, dashboard completion, notifications, settings and visual polish
- [ ] Phase 6 — Integration, security, testing, setup documentation and release readiness

**Current phase:** Phase 3 Completed (Ready for Phase 4)  
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
- Backend unit tests (`pytest -c backend/pytest.ini backend/tests -v`): 6/6 tests passed.
- Backend dry-run import: `app.main.app.title` loaded successfully ("PrepAI").
- Frontend production build (`npm run build`): TypeScript compiled cleanly, Vite bundled production assets in 6.15s with zero errors.
**Blockers/risks:** Supabase live credentials must be supplied in `.env` for production database operations; local/dev mode gracefully handles unconfigured credentials for visual inspection.  
**Exit criteria:** All Phase 1 exit criteria met.


### Phase 2 — Study planning, tasks and calendar
**Status:** Complete  
**Implemented:**
- **Database Migration (`backend/migrations/00002_create_study_planner_tables.sql`):**
  - Created 6 tables: `subjects`, `syllabus_topics`, `tasks`, `assessments`, `availability_rules`, and `study_sessions`.
  - Full relational integrity: ON DELETE CASCADE foreign keys, check constraints on priority, status, category, difficulty, days of week.
  - Performance indexing on `(user_id, status)` and `(user_id, start_time, end_time)`.
  - Strict Supabase Row Level Security (RLS) enabled on all 6 tables enforcing `auth.uid() = user_id`.
- **FastAPI Schemas & Repository Layer:**
  - `backend/app/schemas/planner.py`: Pydantic models for subjects, topics, tasks, assessments, availability rules, study sessions, and planner request/preview DTOs.
  - `backend/app/repositories/planner_repo.py`: User-isolated data store enforcing ownership scoping across all CRUD operations.
- **Deterministic Scheduling Engine (`backend/app/services/planner/`):**
  - `priority.py`: Deterministic multi-factor scoring formula: `0.5 * Urgency + 0.3 * Importance + 0.2 * Difficulty`.
  - `scheduler.py`: Greedy slot-filling algorithm respecting user availability windows, session duration (default 45m), break intervals (default 15m), and due date deadlines. Generates human-readable reasoning logs and reports unscheduled items when constraints are exceeded.
  - Preserves completed sessions across replanning cycles (`replan_schedule`).
- **RESTful API Endpoints (`/api/v1/`):**
  - `/subjects` and `/subjects/{subject_id}/topics` CRUD.
  - `/tasks` CRUD with status and category filtering.
  - `/assessments` CRUD for midterms, finals, and quizzes.
  - `/availability` (GET, PUT) for recurring weekly study hours.
  - `/sessions` (GET, POST, PUT, DELETE) with status transitions (`planned` -> `in_progress` -> `completed` / `skipped`).
  - `/planner/generate` (preview timetable with decision reasoning & unscheduled warnings).
  - `/planner/apply` (persist proposed sessions).
  - `/planner/replan` (clears future planned sessions while preserving completed ones, re-runs greedy scheduler).
  - `/calendar/events` (aggregates sessions, deadlines, and exams into unified timeline).
  - `/dashboard/summary` (computes live hours, task counts, streak, next exam, today's sessions, and topic completion percentages).
- **Frontend Features & Components (`frontend/src/features/`):**
  - `types/planner.ts`: Complete TypeScript interfaces matching backend models.
  - `features/tasks/TasksPage.tsx`: Interactive task management with status tabs (All, Today, Upcoming, Overdue, Completed), search filter, quick status toggling, and delete actions.
  - `features/tasks/TaskModal.tsx`: Create task modal with priority, duration, category, and due date.
  - `features/subjects/SubjectModal.tsx` & `TopicModal.tsx`: Create subject and topic modals with color picker, difficulty, importance, and duration.
  - `features/planner/PlannerPage.tsx`:
    - Full scheduler control strip (Horizon, Session duration, Break duration).
    - Availability Rules modal for weekly active days and time windows.
    - Plan Preview Modal displaying proposed sessions, priority scores, reasoning log, and unscheduled item warnings.
    - Session list with live status transitions (Start, Complete, Skip, Delete).
    - Replan CTA calling `/planner/replan`.
  - `features/calendar/CalendarPage.tsx`:
    - Synchronized timetable with Week (7-day columns) and Day views.
    - Date navigation (Today, Prev, Next) with `date-fns`.
    - Color-coded badges for study sessions (`#43E58B`), exams (`#8353E2`), and deadlines (`#E59F43`).
    - Selected day agenda drawer with quick Start/Complete session actions.
  - `features/dashboard/DashboardPage.tsx`:
    - Connected to live `/dashboard/summary` API endpoint.
    - Real-time study hours with radial SVG progress ring.
    - Live tasks completed counter, upcoming exam alerts, and streak metrics.
    - Today's live study sessions with interactive status updates.
    - Subject-wise syllabus progress bars derived from real topic completion rates.
    - Empty states with quick action CTAs when no sessions or subjects exist yet.
**Verification evidence:**
- Backend pytest suite (`pytest -c backend/pytest.ini backend/tests -v`): **13/13 passed in 1.20s**:
  - `test_priority_score_urgency_ordering` PASSED
  - `test_priority_score_importance_difficulty` PASSED
  - `test_scheduler_fits_within_availability` PASSED
  - `test_scheduler_handles_impossible_schedule_and_reports_unscheduled` PASSED
  - `test_scheduler_preserves_completed_sessions` PASSED
  - `test_two_user_data_isolation` PASSED (verifies User A vs User B data isolation)
  - `test_full_planner_workflow_api` PASSED (end-to-end CRUD, plan preview, apply, replan, calendar, dashboard)
  - `test_auth_me_*` (4 tests) PASSED
  - `test_health_*` (2 tests) PASSED
- Frontend TypeScript & production build (`npm run build`):
  - Zero TypeScript compilation errors.
  - Vite bundled production build successfully in 12.14s (`dist/index.html`, `dist/assets/index-kLzGdSSY.css`, `dist/assets/index-DjV8abzI.js`).
**Blockers/risks:** None. Phase 2 exit criteria are fully satisfied.  
**Exit criteria:** All Phase 2 exit criteria met. Proceed to Phase 3.

### Phase 3 — Document ingestion and embeddings
**Status:** Complete  
**Implemented:**
- **Database & Migration (`backend/migrations/00003_create_documents_and_vectors.sql`):**
  - Enabled PostgreSQL `vector` extension (`pgvector`).
  - Created `documents` table with check constraints, foreign keys, and RLS (`auth.uid() = user_id`).
  - Created `document_chunks` table with `vector(768)` matching `nomic-embed-text` and an HNSW cosine index (`vector_cosine_ops`).
  - Configured private Supabase Storage bucket `documents` (25MB file size limit) and scoped storage RLS policies.
  - Implemented `match_document_chunks` similarity search RPC function.
- **Multi-Format Parsers (`backend/app/services/documents/parser.py`):**
  - Pure-Python parsers for PDF (`pypdf`), DOCX (`python-docx`), PPTX (`python-pptx`), TXT and Markdown.
  - Preserves exact page numbers (PDF, DOCX) and slide numbers (PPTX) with speaker notes.
  - Rejects empty, corrupted, and non-selectable/scanned documents with clean explanations.
- **Bounded Chunking Service (`backend/app/services/documents/chunker.py`):**
  - Deterministic character chunking (900 chars default, 150 chars overlap).
  - Sentence and paragraph boundary alignment with page/slide metadata tags.
- **Local Ollama Embeddings (`backend/app/services/embeddings/ollama.py`):**
  - Dedicated client generating local 768-dimensional embeddings via `nomic-embed-text`.
  - Batching support, connection offline detection, missing model alerts, and strict dimension validation.
- **Ingestion Pipeline & Repository (`backend/app/repositories/document_repo.py`, `pipeline.py`):**
  - End-to-end user-isolated storage and document lifecycle.
  - Idempotent retries (purging old chunks to prevent duplicates).
  - Safe cascade deletion (chunks, vectors, and storage objects).
- **RESTful Endpoints (`backend/app/api/routes/documents.py`):**
  - `POST /api/v1/documents/upload` (multipart with file validation and size limit of 25MB).
  - `GET /api/v1/documents` (filtering by status, subject, file format, and search).
  - `GET /api/v1/documents/{doc_id}/chunks` (inspect parsed chunks and metadata).
  - `PATCH /api/v1/documents/{doc_id}` (rename, subject re-assignment).
  - `POST /api/v1/documents/{doc_id}/retry` (retry ingestion).
  - `DELETE /api/v1/documents/{doc_id}` (cascade deletion).
- **Frontend Components (`frontend/src/features/documents/`):**
  - `types/document.ts`: TypeScript schemas for documents, chunks, and formats.
  - `UploadModal.tsx`: Drag-and-drop upload modal with format pills and subject assignment.
  - `ChunkPreviewModal.tsx`: Real-time inspector for parsed chunks with page/slide labels.
  - `DocumentsPage.tsx`: Full Stitch Glassmorphism repository with real-time status polling, format filters, search, rename, retry, and delete workflows.
**Verification evidence:**
- Backend test suite (`pytest -c pytest.ini tests -v`): **24/24 passed in 3.36s with zero warnings**:
  - `test_document_parsers.py` (PDF, DOCX, PPTX, TXT/MD, empty, unsupported) PASSED
  - `test_document_chunker.py` (basic, overlap, sliding window) PASSED
  - `test_document_embeddings.py` (dimension assertion, offline handling) PASSED
  - `test_document_api.py` (end-to-end lifecycle, ownership isolation, retry idempotency, deletion, rejections) PASSED
  - All existing Phase 1 & Phase 2 tests (13 tests) PASSED
- Frontend production build (`npm run build`):
  - Zero TypeScript errors.
  - Vite bundled 1,965 modules into production assets in 5.88s.
**Blockers/risks:** None. Phase 3 exit criteria are fully satisfied.  
**Exit criteria:** All Phase 3 exit criteria met. Proceed to Phase 4.

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
