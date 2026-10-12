# PrepAI — Development Progress Tracker

**Rule:** Update this file at the end of every Antigravity phase. Record evidence, not optimism. A feature is “Complete” only when it is implemented, connected to the real backend/data flow, and tested. Keep unverified items as “In progress” or “Blocked”.

## Overall status

- [x] Phase 1 — Foundation, design system, auth, database and API skeleton
- [x] Phase 2 — Subjects, syllabus, tasks, calendar and intelligent planner
- [x] Phase 3 — Private document library, ingestion and embeddings
- [x] Phase 4 — RAG assistant, conversations, retrieval and citations
- [x] Phase 5 — Analytics, dashboard completion, notifications, settings and visual polish
- [ ] Phase 6 — Integration, security, testing, setup documentation and release readiness

**Current phase:** Phase 5 Completed (Ready for Phase 6)  
**Last updated:** 2026-10-12  
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
**Status:** Complete  
**Implemented:**
- **Database & Migration (`backend/migrations/00004_create_conversations_and_messages.sql`):**
  - Created `conversations` table (`id`, `user_id`, `title`, `document_ids`, `created_at`, `updated_at`).
  - Created `chat_messages` table (`id`, `conversation_id`, `user_id`, `role`, `content`, `citations`, `retrieval_metadata`, `created_at`).
  - Performance indexes on `(user_id, updated_at DESC)` and `(conversation_id, created_at ASC)`.
  - Strict Row Level Security (RLS) policies on both tables enforcing `auth.uid() = user_id`.
- **FastAPI Schemas & Repository Layer:**
  - `backend/app/schemas/chat.py`: Pydantic models for `Citation`, `ChatMessageCreate`, `ChatMessageResponse`, `ConversationCreate`, `ConversationResponse`, `ConversationDetailResponse`.
  - `backend/app/repositories/chat_repo.py`: User-scoped conversation & message data store with automatic message count tracking and dev sample chat seeding.
- **Multi-Format Parsers with On-Device Diagram OCR (`backend/app/services/documents/parser.py`):**
  - Native on-device hardware-accelerated Windows OCR (`Windows.Media.Ocr`) for extracting diagram/infographic text from embedded slide images with zero cloud dependencies or external binaries.
  - Substantive diagram filtering (>= 50KB image threshold, >= 100 character OCR threshold) to accurately parse real architecture infographics while skipping repetitive header/logo noise.
  - Recursive PPTX group shape and table parsing for PowerPoint decks.
- **RAG Engine & Grounding Services (`backend/app/services/chat/service.py`):**
  - Query vector generation via local Ollama (`nomic-embed-text`, 768-dim).
  - Cosine similarity vector search with user-isolation and optional document scope filtering (`document_ids`).
  - Strict minimum relevance thresholding (`0.25`) and expanded retrieval window (`top_k=8`).
  - High-speed local Ollama chat inference (`llama3.2:latest`, `num_predict=110`, `num_ctx=1500`, `temperature=0.1`) generating grounded answers in <25 seconds.
  - Server-side citation guardrail: parses citation tags, resolves document title, page/slide label, and verbatim quote against database chunk metadata, discarding any ungrounded IDs.
- **Local Dev Persistence (`backend/app/repositories/document_repo.py`, `chat_repo.py`):**
  - Automatic JSON disk backup (`backend/data/dev_documents.json`, `backend/data/dev_chat.json`) preserving uploaded documents, chunks, vectors, conversations, and messages across browser page refreshes and server reboots.
- **RESTful Endpoints (`/api/v1/conversations`, `/api/v1/chat`):**
  - Conversation CRUD: `GET /conversations`, `POST /conversations`, `GET /conversations/{id}`, `PATCH /conversations/{id}`, `DELETE /conversations/{id}`.
  - Message exchange: `POST /conversations/{id}/messages` with grounded answers and resolved citations.
- **Frontend Academic Assistant Experience:**
  - `frontend/src/types/assistant.ts`: TypeScript contracts for chats and citations.
  - `frontend/src/features/assistant/CitationModal.tsx`: Source inspector popup showing document title, page/slide number, similarity percentage, and chunk excerpt.
  - `frontend/src/features/assistant/AssistantPage.tsx`: Stitch Glassmorphism layout with conversation history sidebar, document scope filter dropdown, student/assistant message thread, citation pills, copy answer button, typing indicator, and quick-prompt suggestion chips.
  - `frontend/src/features/dashboard/DashboardPage.tsx`: Wired up "Quick Ask PrepAI" input and prompt chips to navigate to `/assistant?q=...` with auto-submission.
**Verification evidence:**
- Backend pytest suite (`pytest -c pytest.ini tests -v`): **29/29 passed in 3.85s with zero warnings**:
  - `test_cosine_similarity_math` PASSED
  - `test_retrieval_user_isolation_and_document_filter` PASSED
  - `test_insufficient_evidence_path` PASSED
  - `test_citation_guardrail_resolution` PASSED
  - `test_conversation_api_lifecycle` PASSED
  - All Phase 1, 2, and 3 tests (24 tests) PASSED
- End-to-end user document test on `DEEPSEADEVS_ECE.pdf`:
  - Ingestion & OCR: completed in 6.96s (19 clean chunks indexed).
  - Query 1 (*"who are the end users of the system"*): returned grounded answer citing Page 2 & Page 4 in ~24s.
  - Query 2 (*"what is the tech stack of the project"*): returned complete grounded stack (Python 3.13, FastAPI, Supabase, PostgreSQL, LangGraph, React, TypeScript, Leaflet, etc.) citing Page 3 & Page 4 in ~18s.
- Frontend production build (`npm run build`):
  - Zero TypeScript compilation errors.
  - Vite bundled 1,966 modules into production assets in 6.90s.
**Blockers/risks:** None. Phase 4 exit criteria are fully satisfied.  
**Exit criteria:** All Phase 4 exit criteria met. Proceed to Phase 5.


### Phase 5 — Dashboard, analytics and settings
**Status:** Complete  
**Implemented:**
- **Academic Analytics Engine (`backend/app/services/analytics.py` & `backend/app/api/routes/analytics.py`):**
  - Schema (`backend/app/schemas/analytics.py`): `DailyStudyPoint`, `SubjectProgressMetric`, `TaskCompletionMetric`, `SessionMetric`, `ConsistencyMetric`, `ActivityEvent`, and `AnalyticsOverviewResponse`.
  - Service: computes actual planned vs completed study time from persisted study sessions without fabricated numbers, 7-day and 30-day timeframes, real active streak calculation, longest streak tracking, and recent activity audit stream.
  - Endpoints: `GET /api/v1/analytics/overview?timeframe=week|month`, `GET /api/v1/analytics/streak`, `GET /api/v1/analytics/activity`.
- **User Settings & Preferences System (`backend/app/repositories/settings_repo.py` & `backend/app/api/routes/settings.py`):**
  - Schema (`backend/app/schemas/settings.py`): `UserSettingsBase`, `UserSettingsUpdate`, `UserSettingsResponse` with validation for target study hours (0.5h-16h), preferred session duration (15m-180m), exam lead days (1d-30d), and notification preferences.
  - Repository: scoped per authenticated `user_id` with default values and update persistence.
  - Integration: updated `GET /api/v1/dashboard/summary` to read user-configured `target_study_hours` instead of hardcoded 4.0, and dynamic `current_streak_days` instead of hardcoded 7.
- **In-App Notifications Engine (`backend/app/repositories/notification_repo.py` & `backend/app/api/routes/notifications.py`):**
  - Schema (`backend/app/schemas/notification.py`): `NotificationResponse`, `NotificationsListResponse`.
  - Repository: dynamically checks for upcoming exams within configured lead days, tasks due within 48 hours, and successfully indexed documents. Uses deterministic deduplication keys (`exam_{id}_{date}`, `task_{id}_{date}`, `doc_{id}_indexed`) to prevent duplicate notices on repeated requests.
  - Endpoints: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/{id}/read`, `POST /api/v1/notifications/mark-all-read`.
- **Frontend TopBar Notifications (`frontend/src/components/layout/NotificationDropdown.tsx`):**
  - Animated unread counter badge in `TopBar.tsx`.
  - Dropdown menu with icons by alert type, title, message, and "Mark all read" control.
  - Clicking a notification marks it as read and deep-links to the target route (`/calendar`, `/tasks`, `/documents`).
- **Frontend Dashboard Polish (`frontend/src/features/dashboard/DashboardPage.tsx`):**
  - Replaced placeholder values with live data from `/dashboard/summary` and `/analytics/overview?timeframe=week`.
  - Embedded `WeeklyStudyChart` visualizing planned vs completed hours across 7 days with tooltips and empty state.
  - Embedded `RecentActivityFeed` streaming verified user events.
  - Updated consistency streak card with live streak and best streak.
- **Frontend Progress & Analytics Screen (`frontend/src/features/analytics/AnalyticsPage.tsx`):**
  - Full screen implementation replacing placeholder: Last 7 Days vs Last 30 Days toggle tabs.
  - Summary metric cards: Study Logged (with target % completion), Tasks Completed (with overdue alerts), Current Streak (active habit indicator), and Active Days (consistency rate).
  - Daily Study Hours Trend chart (custom responsive SVG/CSS bar chart with tooltips).
  - Subject Syllabus Coverage list with color-coded progress bars and module counts.
  - Task Status Distribution cards and honest empty states.
- **Frontend Account & Study Settings Screen (`frontend/src/features/settings/SettingsPage.tsx`):**
  - Profile card: Display Name, University, Major with authenticated user ID.
  - Study Habits card: Daily study goal slider (1h - 12h), session duration chips (25m Pomodoro, 45m Standard, 60m Deep Work, 90m Extended), exam alert lead days (3d, 7d, 14d).
  - Reminder toggles: upcoming deadlines, session reminders, document indexing.
  - Security & Privacy card detailing RLS isolation and local Ollama privacy.
  - "Save Changes" button calling `PATCH /settings` with instant feedback toast.
**Verification evidence:**
- Backend pytest suite (`pytest -c backend/pytest.ini backend/tests -v`): **33/33 passed in 5.78s with zero warnings**:
  - `test_empty_analytics_for_new_user` PASSED
  - `test_analytics_calculation_with_sessions` PASSED
  - `test_settings_lifecycle_and_dashboard_integration` PASSED
  - `test_notification_sync_and_deduplication` PASSED
  - All Phase 1-4 tests (29 tests) PASSED
- Frontend production build (`npm run build`):
  - Zero TypeScript compilation errors.
  - Vite bundled 1,969 modules into production assets in 5.62s.
- Visual & Responsive check across 9 core screens:
  - `/` (Dashboard), `/planner` (Study Planner), `/tasks` (Tasks), `/calendar` (Calendar), `/assistant` (AI Assistant), `/documents` (Documents), `/analytics` (Analytics), `/settings` (Settings), `/login` (Auth).
  - All cards adhere to `design.md` Level 1/2 frosted glass tokens with high-contrast text and zero nested blurs.
**Blockers/risks:** None. Phase 5 exit criteria are completely satisfied.  
**Exit criteria:** All Phase 5 exit criteria met. Proceed to Phase 6.

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
