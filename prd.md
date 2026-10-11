# PrepAI — Product Requirements Document (PRD)

**Product:** PrepAI — AI-Powered Study Planner & Academic RAG Assistant  
**Document status:** Baseline specification for implementation  
**Primary development environment:** Antigravity IDE / agent manager  
**Version:** 1.0

## 1. Product vision

PrepAI is a student-focused academic workspace that unifies two core capabilities:

1. **Intelligent study planning:** turns subjects, syllabus topics, exam dates, assignment deadlines, available hours, difficulty, and study preferences into a realistic, priority-based study schedule that can be adjusted as work is completed or circumstances change.
2. **Academic RAG assistant:** lets students upload their own study material, ask questions about it, and receive answers grounded in retrieved passages with transparent source citations.

Progress tracking, deadlines, revision sessions, reminders, document management, and academic insights connect the two capabilities into one application.

## 2. Problem statement

Students often coordinate their courses, assignments, exams, and revision manually. Their planning tools are separated from the materials they study, so they spend extra time finding answers across PDFs, slides, and notes. PrepAI combines personalized planning with document-grounded question answering to reduce organizational friction and support self-paced learning.

## 3. Product goals

- Generate an understandable study plan from student-supplied academic constraints.
- Let students create and manage subjects, syllabus topics, tasks, deadlines, and study sessions.
- Let students upload supported documents and ask questions based on their own material.
- Show citations that identify the source document and page or chunk where possible.
- Track completion and summarize study activity without fabricating user history.
- Provide a consistent, accessible, responsive Glassmorphism interface.
- Keep model inference local through Ollama while using Supabase for hosted authentication, database, and document storage.

## 4. Non-goals for the first complete release

The initial release does not require automatic LMS synchronization, collaborative study groups, voice conversations, native mobile apps, paid third-party LLM APIs, automatic syllabus extraction without confirmation, or institution-wide administration. These may be future extensions. The core product must work without them.

## 5. Target users and primary journeys

### Primary user
A college or university student managing several subjects, exams, assignments, and digital study resources.

### Key journeys

1. **First-time setup:** sign up → complete profile/preferences → add subjects and syllabus topics → enter exams/deadlines → set availability → generate first study plan.
2. **Daily planning:** open dashboard → view today's sessions and deadlines → complete or reschedule a task/session → see remaining schedule update.
3. **Document-grounded learning:** upload a PDF/slide/notes file → wait for processing/indexing → open Study Assistant → select relevant documents or ask across indexed material → receive answer with citations → inspect source passage.
4. **Progress review:** open analytics → review study hours, completed sessions, task completion, and subject progress → follow an evidence-based recommendation.
5. **Maintenance:** change availability or exam date → request a replan → review proposed changes before applying them.

## 6. Functional requirements

### FR-01 Authentication and profile
- Support sign up, sign in, sign out, password reset, and authenticated sessions using Supabase Auth.
- Store a student profile tied to the Supabase Auth user ID.
- Provide profile, academic details, preferred study hours, time zone, session length, break length, theme, and notification preferences.
- Protect every user-owned record and file from access by another user.

### FR-02 Dashboard
- Display a personalized greeting, date, study streak where sufficient history exists, and quick actions.
- Show summary cards for today's planned/completed study time, tasks completed, upcoming assessments, and study streak.
- Show today's sessions, upcoming deadlines, weekly study activity, subject progress, recent activity, and AI study insights.
- Provide a quick entry point to ask PrepAI about study material.
- Use actual database-derived values after setup; clearly label demo/sample values in demo mode.
- Provide empty states when no subjects, tasks, sessions, documents, or historical activity exist.

### FR-03 Subjects and syllabus
- Create, view, edit, archive, and delete subjects.
- Track subject title, optional code/color, term, target completion date, and notes.
- Add, edit, reorder, and complete syllabus topics under a subject.
- Track topic importance, estimated learning duration, difficulty, status, and optional prerequisites.
- Aggregate topic completion into subject progress.

### FR-04 Tasks and assessments
- Create, view, edit, complete, reopen, filter, sort, and delete tasks.
- Task fields include title, description, subject, category, priority, estimated duration, due date, status, and optional linked syllabus topic.
- Support task categories including assignment, revision, practice, reading, and exam preparation.
- Store exams/assessments with subject, date/time, title, and optional notes.
- Surface overdue tasks without silently changing their status.

### FR-05 Study planner
- Collect daily availability, preferred study windows, session length, break length, study days, deadlines, topic priority/difficulty, estimated duration, and completed work.
- Generate day-wise study sessions using a transparent, deterministic scheduling algorithm before adding any optional LLM explanations.
- Prioritize upcoming exams/deadlines, high-importance or difficult unfinished topics, task urgency, and available time. Explain that the result is a recommended plan, not a guarantee of optimal learning.
- Avoid scheduling sessions outside declared availability or over existing blocked time.
- Support viewing sessions in day/week formats and navigating date ranges.
- Allow a student to start, complete, skip, move, and reschedule sessions.
- Replan remaining sessions when requested after task completion, changed deadlines, or changed availability. Preview material changes and require confirmation before applying them.
- Preserve completed sessions when replanning. Do not duplicate tasks or sessions on repeated requests.
- Include explicit empty/error states when there is insufficient schedule information.

### FR-06 Calendar
- Provide month, week, and day views, date navigation, and a “Today” shortcut.
- Display study sessions, assignments, exams, and revision blocks using consistent categories.
- Show an agenda for the selected date.
- Allow creating an event/task and navigating from calendar items to their details.
- Use local time-zone-aware display and store timestamps consistently.

### FR-07 Document library
- Upload supported academic files to a private Supabase Storage bucket.
- Initial supported types: PDF, DOCX, PPTX, TXT, and Markdown. Any format not implemented must be explicitly rejected with an explanation.
- Enforce file-size and file-type limits on both client and backend. Make the configured maximum visible in the UI or help text.
- Store metadata including owner, file name, MIME type, size, subject (optional), upload time, processing status, page/slide count when available, and processing error details safe for display.
- Show upload, queued/processing, indexed, and failed states.
- Allow rename, subject assignment, retry processing, preview where supported, and delete.
- Deletion must remove or queue removal of chunks and embeddings as well as file metadata/storage, with failure handling that avoids orphaned data.
- A document must not be marked indexed until text extraction, chunking, embedding, and storage succeed.

### FR-08 Academic RAG assistant
- Maintain chat conversations and messages per authenticated user.
- Allow a user to ask a question across all indexed documents or a selected subset.
- Process text using a chunking pipeline that keeps document ID, owner ID, page/slide/page-label metadata, chunk index, and source text.
- Generate embeddings using a local Ollama embedding model and store vectors in Supabase Postgres with `pgvector`.
- Retrieve relevant chunks with similarity search and metadata/owner filtering.
- Send only retrieved context plus the question and system instructions to the configured local Ollama chat model.
- Display a grounded answer and citations associated with source names and page/slide references when available.
- If evidence is insufficient, say so rather than inventing a citation or presenting unsupported content as sourced.
- Provide loading/error/retry states, copy answer, regenerate response, feedback, follow-up questions, and source inspection.
- Keep model name, retrieval count, chunk size/overlap, similarity threshold, and timeout configurable.
- Clearly distinguish source-grounded statements from optional general knowledge if such a mode is added. Default mode is document-grounded.
- Do not send document text to an external hosted LLM provider.

### FR-09 Progress and analytics
- Calculate planned and completed study time from persisted study sessions.
- Show weekly/monthly trends, completed sessions, task completion rate, revision activity, subject-wise topic completion, and upcoming milestones.
- Offer useful time filters.
- Use consistent chart labels, tooltips, legends, and responsive behavior.
- Never fabricate usage history. Show an explanatory empty state if data is insufficient.
- Recommendations must be derived from available data and should be framed as suggestions, not guarantees.

### FR-10 Notifications and reminders
- Show in-app notifications for upcoming/overdue tasks, scheduled sessions, processing failures, and successful document indexing where supported.
- Provide notification preferences and mark-as-read behavior.
- For the local-first MVP, reminders should work while the application/service is active or through explicit in-app notifications; do not promise operating-system push notifications unless implemented and verified.
- Avoid generating duplicate reminders on repeated background checks.

### FR-11 Settings and accessibility
- Support profile, academic preferences, availability, notification settings, appearance, and account actions.
- Support desktop, tablet, and mobile layouts.
- Provide keyboard-visible focus, semantic labels, accessible dialogs, useful error messages, and adequate contrast.
- Follow the design rules in `design.md`.

## 7. Non-functional requirements

### Security and privacy
- Supabase Auth is the identity provider.
- Frontend sends the user's Supabase access token as a Bearer token to the Python API.
- The API verifies tokens and authorizes the current user on every user-owned operation.
- Enable Row Level Security (RLS) on exposed user-owned tables and private Storage objects.
- Never expose Supabase service-role credentials, database passwords, or other server secrets to the browser.
- The backend service key, if used for a narrowly scoped server operation, must stay in server environment variables and must not be treated as a replacement for per-user authorization.
- Do not log passwords, access tokens, full uploaded document contents, or private prompts unnecessarily.
- Limit upload types and sizes; handle parser errors and malformed files safely.

### Reliability
- Use migrations for schema changes.
- Add tests for scheduling constraints, ownership checks, parsing, retrieval, citations, and key API endpoints.
- Use clear processing statuses and recoverable failures.
- Avoid silent data loss during delete/replan operations.

### Performance
- Paginate or limit large task, message, activity, and document queries.
- Keep file parsing and embedding work out of long-running request handlers when feasible; expose processing status and use a database-backed job/status mechanism appropriate to the MVP.
- Stream chat output if the chosen Ollama client path and frontend implementation support it reliably; otherwise show a well-designed loading state.
- Do not use heavy blur on every nested UI element.

### Maintainability
- Type the frontend with TypeScript.
- Keep business logic out of UI components.
- Separate API routes, schemas, services, repositories, and shared configuration in the Python backend.
- Keep prompts, model configuration, chunking policy, and retrieval logic versioned and testable.

## 8. Core data entities

- `profiles`: user profile and academic preferences.
- `subjects`: user-owned courses/subjects.
- `syllabus_topics`: topics under a subject.
- `tasks`: assignments, revision tasks, and other work.
- `assessments`: exams and other dated assessments.
- `study_sessions`: planned and completed study blocks.
- `availability_rules`: recurring availability and blocked periods.
- `documents`: uploaded file metadata and processing status.
- `document_chunks`: chunk text, source metadata, and embedding vector.
- `conversations`: chat threads.
- `chat_messages`: user and assistant messages, with safe metadata for citations.
- `notifications`: in-app reminders/alerts.
- `activity_events`: user-visible recent activity and analytics events where justified.

The SQL schema, foreign keys, indexes, RLS policies, and vector dimension must be implemented and reviewed in migrations. Avoid storing duplicate computed values unless there is a clear performance reason.

## 9. Acceptance criteria for a complete MVP

The release is accepted only when all of the following are demonstrated end-to-end:

1. A student can register, sign in, sign out, and maintain a user-specific session.
2. A student's records and private documents are not accessible to a different user.
3. The student can configure subjects, syllabus topics, availability, tasks, and exam dates.
4. The planner generates valid study sessions within available time and explains priorities.
5. Completing or moving a session updates relevant dashboard and analytics values.
6. The calendar, tasks, and planner show consistent persisted data.
7. A student can upload an allowed file and see processing/indexing status.
8. Extracted text is chunked, embedded locally through Ollama, and searchable through Supabase `pgvector`.
9. The assistant answers a question using retrieved chunks and displays verifiable source citations.
10. The assistant states when source evidence is insufficient and does not fabricate citations.
11. Progress and analytics are computed from persisted data and have meaningful empty states.
12. Error/loading/success states are implemented for core workflows.
13. The interface follows the Glassmorphism design requirements and works at desktop, tablet, and mobile breakpoints.
14. Automated tests cover critical scheduling, security, parsing, retrieval, and API behavior.
15. A new developer can set up the project using the documented environment files, migrations, Ollama models, and run commands.

## 10. Product decisions and assumptions

- The initial release is single-user-per-account; collaborative workspaces are out of scope.
- Ollama is local to the machine or trusted private host running the Python backend. A hosted frontend/backend cannot call a student's local Ollama implicitly without a secure connectivity design.
- Supabase is used for hosted Auth, Postgres, Storage, and `pgvector`; the Python backend owns scheduling logic, document ingestion, embedding calls, retrieval orchestration, and chat generation.
- Use a deterministic scheduling algorithm for the first working planner. LLM text may explain suggestions but must not be the sole mechanism enforcing time and deadline constraints.
- Support only explicitly implemented document formats and label file-processing limitations clearly.
- Keep model identifiers configurable rather than hard-coded in business logic.

## 11. Out of scope and future enhancements

Potential future items include LMS integration, shared study groups, voice interactions, multi-language experience, native mobile app, syllabus import from institutional systems, advanced spaced-repetition algorithms, and optional cloud inference. None is allowed to delay the complete MVP described above.
