# PrepAI — Six-Phase Development Prompts for Antigravity

Use these prompts sequentially in Antigravity. Complete and verify one phase before moving to the next. All six phases together represent the complete MVP; do not leave core functionality as “future work”. Read `agents.md`, `prd.md`, `techstack.md`, `architecture.md`, and `design.md` before beginning implementation.

## Global instructions — prepend to every phase

> You are implementing PrepAI, an AI-Powered Study Planner & Academic RAG Assistant. Follow all project documents in the repository, especially `prd.md`, `techstack.md`, `architecture.md`, `design.md`, `agents.md`, and `progress.md`. Existing implementation must be inspected before modifying it. Preserve working behavior and avoid destructive rewrites. Use React + TypeScript + Vite for frontend, Python + FastAPI for backend, Supabase for Auth/Postgres/Storage/pgvector, and local Ollama for chat and embeddings. Do not introduce hosted LLM providers. Never expose secrets in client code. Keep user data scoped to the authenticated user, enable/test RLS, and verify JWTs on protected backend routes. Use versioned migrations, typed API schemas, testable service modules, responsive Glassmorphism design, accessible states, and meaningful errors. Do not fake functional backend behavior with hard-coded UI results. For every phase, inspect the repository, state a concise plan, implement the phase, run relevant lint/type/test/build checks, fix failures, update `progress.md`, and report changed files, commands/results, known issues, and exact next steps. Do not proceed to another phase until this phase's exit criteria are met.

---

# Phase 1 — Foundation, Design System, Auth, Database and API Skeleton

## Prompt to Antigravity

Implement Phase 1 only. First inspect the repository and report its current structure, runtime versions, existing frontend/backend setup, and any files that must be preserved. If the repository is empty, scaffold the application according to `techstack.md`. Do not assume existing code is disposable.

### Frontend tasks

1. Set up React + TypeScript + Vite and React Router if they do not exist.
2. Establish a feature-based folder structure, a central typed API client, Supabase browser client, route guards, and application providers.
3. Implement the PrepAI design tokens and Glassmorphism foundation from `design.md`: dark gradient canvas, translucent primary glass panels, reflective borders, restrained shadows, accessible typography, Lucide icons, responsive app shell, sidebar, top bar, buttons, fields, dialogs, toast/feedback patterns, skeletons and empty states.
4. Create routes/placeholders for all required screens: Dashboard, AI Study Planner, My Tasks, Calendar, AI Study Assistant, My Documents, Progress & Analytics, Settings, plus sign-in/register/reset-password.
5. Make the shell responsive at 1440px, 1024px, 768px, and 390px. Use clear active navigation. Do not add fake working features yet.
6. Implement sign-up, sign-in, sign-out, password reset request, session restoration, and protected routes through Supabase Auth. Add loading/error/success states. Never store passwords directly or create a second homemade identity system.
7. Add `.env.example` with safe placeholders and ensure real `.env` files are Git-ignored.

### Backend tasks

1. Scaffold FastAPI with configuration via `pydantic-settings`, versioned API prefix (for example `/api/v1`), route modules, typed schemas, centralized error handling, CORS allowlist, sanitized logging, and `/health`.
2. Implement token verification for Supabase access tokens using the current project signing configuration. Derive user identity from the validated token. Add a reusable authenticated dependency.
3. Implement a clear service/repository boundary, but keep business features for later phases.
4. Create backend `.env.example` for Supabase and Ollama settings, including model names, request timeouts, allowed frontend origins and vector dimension. Do not commit secrets.
5. Add unit tests for configuration validation, missing/invalid token behavior, and protected health/dependency examples where appropriate.

### Supabase tasks

1. Create initial versioned SQL migrations for `profiles` and any required initial enums/helpers only; do not create all final feature tables prematurely without migration planning.
2. Define and test RLS policies and the profile-user relationship.
3. Document Supabase Auth redirect URLs, local frontend origin, API origin, private storage intent, and the later `pgvector` requirement.
4. Ensure the service-role key is backend-only and public key use is paired with RLS.

### Required outputs

- A running frontend with polished PrepAI shell and auth pages.
- A running FastAPI API with health endpoint and verified-user dependency.
- Initial migrations and tested user-owned profile policy.
- Setup instructions and environment examples.
- Updated `progress.md` with Phase 1 evidence and unresolved items.

### Exit criteria

- Frontend install, development server, type check, lint and production build pass.
- Backend install, app startup, tests and lint pass.
- Auth flow can be tested with a configured Supabase project; any missing external credentials are clearly documented and not hidden by fake authentication.
- No service-role key or database secret exists in client files or Git.
- All main routes render within the consistent responsive design system.
- Update `progress.md`; stop after Phase 1.

---

# Phase 2 — Subjects, Syllabus, Tasks, Calendar and Intelligent Planner

## Prompt to Antigravity

Implement Phase 2 only, on top of the validated Phase 1 foundation. Read the current schema and service implementation first. Do not duplicate tables, replace working auth, or bypass repository conventions.

### Database and backend

1. Add migrations for subjects, syllabus topics, tasks, assessments, availability rules, and study sessions, including foreign keys, indexes, validation/check constraints, timestamps, and RLS policies.
2. Ensure every user-owned query is scoped to the verified owner. Add tests proving a user cannot read or mutate another user's records.
3. Implement typed CRUD endpoints for subjects, topics, tasks, assessments, availability and sessions. Add pagination/filters where collections can grow.
4. Implement calendar aggregation for date ranges and dashboard summary endpoints required by the frontend.
5. Implement a deterministic scheduling service using `architecture.md`: candidate work units, explainable priority scoring, availability windows, session-size/break constraints, existing blocked time, deadlines, completed-work preservation, unscheduled-reason reporting, and preview-before-apply.
6. Create a replan operation that is idempotent. Preserve completed sessions, avoid duplicate generated sessions, and require client confirmation before destructive rescheduling. Use transactions or compensating operations for multi-step persistence.
7. Add tests for time windows, same-day deadlines, overdue tasks, no availability, large workload, impossible schedules, time zones, duplicate retry, task completion, and preservation of completed sessions.

### Frontend

1. Complete My Tasks with create/edit/delete/complete/reopen, search, filter, sort, priority, due date, duration, and useful empty/loading/error states.
2. Complete subject and syllabus management so the planner has real data to consume.
3. Complete Calendar month/week/day or a clearly documented supported subset, selected-day agenda, navigation, Today shortcut, and add-event/task flow.
4. Complete AI Study Planner setup for subjects/topics, exam dates, availability, session length, breaks and preferred days.
5. Show generated schedule preview and why items were prioritized. Apply only after confirmation. Enable session start/complete/skip/move/reschedule actions.
6. Connect dashboard summary and today list to backend endpoints; remove mock values from normal authenticated mode.
7. Ensure all controls have clear validation and responsive layouts.

### Exit criteria

- Authenticated CRUD works end-to-end for subjects/topics/tasks/assessments/availability/sessions.
- Generated sessions respect declared availability and preserve completed sessions.
- Replanning returns an understandable preview and does not duplicate sessions.
- Task, planner, calendar and dashboard views agree on persisted data.
- Critical planner and ownership tests pass.
- Update `progress.md`; stop after Phase 2.

---

# Phase 3 — Private Document Library, Ingestion Pipeline and Embeddings

## Prompt to Antigravity

Implement Phase 3 only. Do not build a chat UI that pretends documents are searchable before indexing. Follow the ownership and document-ingestion design in `architecture.md`.

### Supabase and backend

1. Add a private Storage bucket plan and versioned migrations for `documents`, `document_chunks`, and durable `document_jobs` if needed. Enable `pgvector`; use the vector dimension confirmed for the selected Ollama embedding model. Do not guess and silently hard-code a mismatched dimension.
2. Implement RLS/storage policies and enforce owner checks for create/read/rename/subject assignment/retry/delete. Validate the storage object path and document ownership.
3. Implement secure upload orchestration. Decide whether the browser uploads directly to private Supabase Storage or the API proxies uploads; document the chosen path, enforce server-side file type/size checks, and prevent unrestricted public access.
4. Implement parsers for the agreed formats PDF, DOCX, PPTX, TXT and Markdown, preserving page/slide/source labels whenever feasible. Handle scanned PDFs with a clear unsupported/OCR-not-included message unless OCR is deliberately added and tested.
5. Implement normalization, chunking with configurable overlap, stable chunk IDs, source metadata, retry-safe ingestion and cleanup. Avoid duplicate chunks on reprocess.
6. Implement `OllamaClient.embed()` with timeout/error/model-unavailable/dimension validation handling.
7. Generate embeddings locally and store chunk text/metadata/vector in Supabase Postgres. Use a parameterized RPC/repository operation for writes and vector search.
8. Document processing states: queued, processing, indexed, failed. Persist sanitized failure reasons and allow retry.
9. Add delete logic that removes chunks, metadata and Storage object safely; handle partial failure explicitly.

### Frontend

1. Build My Documents upload zone, browse/grid/list, search, subject/type/status filters, document detail/preview when supported, rename/assign subject/retry/delete.
2. Show file validation, upload progress where available, processing status polling or refresh, indexed-ready state, and failure/retry state.
3. Prevent “Ask questions” from acting like a working RAG feature until the document is indexed.
4. Build realistic no-documents, processing, failed, empty extraction and unsupported-file states.

### Tests

- Valid and rejected file type/size.
- Extraction metadata and empty-file errors for each supported parser.
- Chunk boundaries/overlap and page/slide association.
- Embedding vector dimension match.
- User A cannot retrieve or delete User B's documents/chunks.
- Retry does not duplicate embeddings.
- Storage/object deletion and partial failures.

### Exit criteria

- At least one real supported document can be uploaded, parsed, chunked, embedded locally, and indexed in Supabase.
- UI status reflects real ingestion state.
- RLS and ownership tests pass.
- A model-unavailable or parser failure is recoverable and understandable.
- Update `progress.md`; stop after Phase 3.

---

# Phase 4 — RAG Assistant, Conversations, Retrieval and Citations

## Prompt to Antigravity

Implement Phase 4 only, using the indexed document pipeline from Phase 3. All answers about uploaded materials must be grounded in retrieved chunks, and citations must be created from trusted stored metadata rather than invented by the model.

### Backend

1. Add migrations and RLS policies for conversations and chat messages, including user ownership, timestamps, and safe citation metadata.
2. Implement conversation CRUD and message persistence. Validate all linked document IDs and conversation ownership.
3. Implement query embedding with the exact same embedding model as indexing.
4. Implement vector retrieval with mandatory owner filters and optional selected-document filters, top-k configuration, relevance threshold policy and bounded context assembly. Do not fetch all document content and pass it to the model.
5. Implement the local Ollama chat client with configurable model, temperature, timeouts, cancellation, and either tested streaming or a reliable non-streaming fallback.
6. Create a versioned, testable system prompt that tells the model to use supplied context, distinguish unsupported claims, and refer only to context source identifiers it was given.
7. Parse model citations as references to supplied chunk IDs only. Resolve filename and page/slide from database metadata on the server. Discard unknown/fabricated citation IDs.
8. Implement an insufficient-evidence response if retrieval is empty or too weak. Never fabricate citations or claim the content was found in a file when it was not.
9. Persist the user message, assistant answer, citations, model identifier, retrieval metadata needed for debugging, and timestamps without storing secrets. Avoid logging full private context unnecessarily.
10. Add copy/regenerate/feedback/follow-up endpoints where appropriate and protect every conversation/message operation.

### Frontend

1. Complete the AI Study Assistant layout: conversations sidebar, new chat, chat messages, input composer, loading/error/retry state and optional source panel.
2. Support selected documents or search across all indexed documents.
3. Render answer headings, lists, code blocks and tables accessibly.
4. Display citations with filename and page/slide label. Selecting a citation opens a side panel/modal containing the retrieved source passage and metadata.
5. Include copy answer, regenerate, helpful/not helpful, and follow-up UX.
6. Add welcoming prompt examples, empty conversation state, no indexed documents state, no relevant results state, Ollama unavailable state, and timeout/cancel state.
7. On small screens, make the source panel collapsible and keep the composer visible without covering message content.

### Tests and evaluation

- Retrieval returns only the authorized user's chunks.
- Selected document filters are respected.
- Citation metadata matches actual stored chunks/pages.
- Model-generated unknown citation IDs are discarded.
- Insufficient retrieval yields an honest no-evidence answer.
- Test a known-answer set of sample documents and questions; record whether the expected source chunk is retrieved and whether the answer is supported.
- Test Ollama unavailable, timeout, empty response and long response behavior.
- Test conversation isolation between users.

### Exit criteria

- A user can ask a question about a real indexed document and receive a context-grounded response with source citations.
- Selecting a citation reveals its real source passage.
- No-source/weak-source and Ollama error states work.
- Chat history persists and respects user ownership.
- Update `progress.md`; stop after Phase 4.

---

# Phase 5 — Analytics, Dashboard Completion, Notifications, Settings and Visual Polish

## Prompt to Antigravity

Implement Phase 5 only. Integrate the dashboard and all supporting pages with the already built planner and RAG features. Do not fill charts with invented statistics in authenticated mode.

### Backend/data

1. Implement analytics queries/services for actual planned/completed study time, completed sessions, task completion, subject syllabus progress, weekly/monthly consistency, revision activity and upcoming milestones.
2. Add only justified indexes/materialized aggregates after measuring query needs. Prefer correct aggregate queries for MVP scale.
3. Implement recent activity from meaningful persisted events; avoid writing duplicate events on retries.
4. Implement in-app notifications for upcoming/overdue deadlines, session reminders, indexing completion/failure where appropriate. Add user preferences, read/unread, and deduplication keys.
5. Ensure time zones and date-range boundaries are correct and tested.
6. Implement settings/profile updates and availability/study preferences. Use validation and ownership rules.

### Frontend

1. Complete Dashboard with today's sessions, upcoming deadlines, summary cards, weekly study chart, subject progress, PrepAI Insights, quick question entry, and recent activity.
2. Replace placeholder dashboard values with API results; use demo fixtures only in an explicitly labelled demo mode.
3. Complete Progress & Analytics with weekly/monthly filters, clear labels/tooltips, empty states and data summaries.
4. Complete Settings, notification panel, profile menu, theme preference if supported, and in-app reminder preferences.
5. Add useful notification states and navigate from a notification to the relevant task/document/session.
6. Standardize all cards, dialogs, chart colors, badges, date formatting and loading/error states against `design.md`.
7. Refine glass materials without nesting blurs. Use the background gradients behind the UI and preserve text contrast.
8. Perform responsive visual QA at 1440px, 1024px, 768px and 390px. Fix overlap, clipping, sidebar overflow, chart labels and mobile chat behavior.

### Exit criteria

- All main dashboard and analytics numbers derive from stored data.
- Empty states are used where history is absent.
- Notification actions, settings persistence, and profile updates work end-to-end.
- Charts remain readable and layout works at defined viewport widths.
- All nine required screens have a completed core implementation, not just a design placeholder.
- Update `progress.md`; stop after Phase 5.

---

# Phase 6 — Integration, Security, Testing, Setup Documentation and Release Readiness

## Prompt to Antigravity

Implement Phase 6 only: stabilize the complete MVP. Do not add major new features unless necessary to satisfy an acceptance criterion in `prd.md`. Inspect the whole repository and verify cross-feature behavior.

### Integration and functional QA

1. Run the complete new-user journey: signup/login → create subject/topics → set availability and exam date → create tasks → generate plan → complete/reschedule session → upload document → index using local Ollama → ask a grounded question → open citation source → review analytics → sign out/in.
2. Confirm planner, tasks, calendar, dashboard, and analytics use consistent persisted data.
3. Confirm file status, chat and citations remain correct after reload.
4. Check deletion and retry behavior, double submission, refresh during processing, expired sessions and backend restarts.
5. Remove debug-only behavior, abandoned components, dead routes and misleading placeholder buttons.

### Security review

1. Audit all API routes for authentication and ownership enforcement.
2. Review RLS policies and private Storage access with at least two test users.
3. Ensure a client-supplied user ID cannot override the verified identity.
4. Scan frontend bundles and tracked files for service keys, DB passwords, API secrets, or private `.env` values.
5. Test upload validation, vector-search ownership filtering, SQL parameterization, CORS allowlist, safe error handling and rate/size limits where appropriate.
6. Verify Ollama remains local/private and no hosted LLM request is made.
7. Confirm logs exclude tokens and full private document content.

### Quality gates

1. Run frontend lint, typecheck, unit tests, production build and Playwright smoke tests.
2. Run backend lint, unit tests, API integration tests and coverage for the critical logic.
3. Run migration validation from a clean schema where feasible.
4. Run RAG evaluation questions on the sample corpus and record known limitations.
5. Inspect browser console and network requests; resolve uncaught errors and failed requests.
6. Manually check visual consistency, contrast, focus navigation, responsive layouts and reduced motion.

### Delivery documentation

1. Finalize root README with prerequisites, repository structure, setup, environment variables, Supabase project configuration, migration application, RLS/storage setup, Ollama installation/model pulls, run commands, test commands and troubleshooting.
2. Document that local Ollama must be reachable by the Python backend; a deployed client cannot access a user's local Ollama automatically. Never recommend exposing Ollama publicly.
3. Ensure `.env.example` files contain placeholders only and `.gitignore` excludes real environment files, uploaded test data, model weights and local caches.
4. Document supported file types/limits, known limitations, vector dimension, model names, reset/re-index process and database backup/cleanup implications.
5. Update `progress.md` with final verification evidence, unresolved risks, and what is genuinely complete.

### Final exit criteria

- All PRD MVP acceptance criteria pass or any exception is explicit and approved in the final report.
- Critical end-to-end journey succeeds on a configured development machine.
- Two-user security checks show no cross-user records, files, vectors or conversations leak.
- Frontend and backend builds/tests pass with results recorded.
- The RAG assistant returns grounded responses with real citations and acknowledges insufficient evidence.
- Setup documentation enables another developer to reproduce the application.
- Update `progress.md` and stop. Do not declare full completion if a critical test has not been run.
