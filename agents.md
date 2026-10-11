# PrepAI — Agent Operating Rules

These instructions are for Antigravity agents and any coding assistant working in this repository. They are subordinate to security, correctness, and the current phase's exit criteria.

## 1. Required source-of-truth files

Before coding, read:

1. `prd.md` — what the product must do.
2. `techstack.md` — approved technology choices.
3. `architecture.md` — trust boundaries, modules and data flows.
4. `design.md` — visual design and accessibility rules.
5. `phasewiseprompt.md` — the current phase's bounded work and exit criteria.
6. `progress.md` — completed work, evidence and blockers.

When two files appear to conflict, do not silently invent a resolution. Stop and report the conflict. Prefer security and data-integrity requirements over convenience.

## 2. Core engineering rules

- Inspect existing code, package manifests, migrations and Git status before modifying anything.
- Make incremental changes and preserve working behavior. Do not rewrite the whole app without an explicit reason.
- Work only on the phase requested. Do not build Phase 4 features while Phase 1's auth and data boundaries remain unverified.
- Use React + TypeScript on the frontend and Python + FastAPI on the backend.
- Use Supabase for Auth, Postgres, private Storage and `pgvector`.
- Use local Ollama for chat and embedding inference. Do not silently add a cloud LLM provider or transmit uploaded study documents to an external model service.
- Keep business logic and data validation outside frontend presentation components.
- Use typed request/response schemas, centralized config, predictable error handling and reusable service modules.
- Prefer simple, testable solutions over unnecessary frameworks or abstractions.
- Pin versions/lock dependencies and document any stack changes.
- Never create fake API responses to make a feature appear complete in normal app mode.
- Never mark a feature complete merely because a page exists. It must be connected and tested.

## 3. Security rules — mandatory

- Never write secret values into source code, documentation, screenshots, tests, commits or frontend environment variables.
- Never expose Supabase service-role keys, database passwords or server secrets to the browser.
- Never trust a client-supplied `user_id`; derive identity from a verified Supabase access token.
- Authenticate and authorize every protected API route.
- Scope every record, document, conversation and vector query to the authenticated user or an explicit permission relationship.
- Enable and test Supabase RLS and private Storage policies for user-owned data.
- Do not assume UI hiding provides security.
- Use parameterized queries/RPC for vector search and database writes.
- Never expose Ollama's unauthenticated local port publicly.
- Restrict CORS to configured frontend origins, not a permissive production wildcard.
- Validate file size, file type, extension, ownership, parser output and storage paths on the server.
- Do not log access tokens, passwords, complete private documents or unnecessary prompt contents.
- For document-grounded answers, citations must resolve against database metadata; do not trust arbitrary filename/page labels produced by the LLM.

## 4. RAG-specific rules

- The indexing and question embedding models must be identical or intentionally compatible; use the same configured embedding model for both.
- Confirm and validate vector dimensions at runtime/ingestion.
- Store document owner, document ID, chunk ID, and source page/slide metadata with each chunk.
- Always apply ownership and selected-document filters during retrieval.
- Limit retrieved context to a configured top-k and token/character budget.
- Require the model to answer from supplied context and to acknowledge insufficient evidence.
- Only resolve citations from IDs actually present in retrieved chunks.
- Handle no-document, not-indexed, empty-extraction, model-missing, timeout, and retrieval-failure cases.
- Avoid duplicate chunks on retries; ingestion must be idempotent or cleanly replace the earlier index.
- On document deletion, remove or queue removal of its chunk embeddings and storage object safely.
- Maintain a small question/source evaluation set and run it after meaningful retrieval/prompt changes.

## 5. Planner-specific rules

- Use a deterministic, testable algorithm for time and deadline constraints.
- LLM output must not be the authority for schedule validity.
- Do not schedule outside availability or on blocked times.
- Preserve completed sessions during replanning.
- Preview important changes and ask for confirmation before applying them.
- Ensure retries do not duplicate sessions.
- Report work that could not be scheduled and why; never imply that impossible constraints were satisfied.
- Keep priority factors/weights documented and configurable.

## 6. UI/UX rules

- Follow `design.md`; use the user-provided Task Master reference only for its Glassmorphism composition and style cues, not its branding/content.
- Use the rich gradient canvas and frosted-glass card formula consistently.
- Avoid nested `backdrop-filter` effects. Use flat translucent surfaces for controls inside glass cards.
- Do not animate blur radius.
- Maintain readable contrast, visible focus states, semantic labels, keyboard behavior and reduced-motion support.
- Use Lucide icons; do not use emoji as primary interface icons.
- Include loading, empty, error, success, validation, disabled and destructive-confirmation states for important flows.
- Use real API data outside explicitly labelled demo mode.
- Keep alignment and spacing consistent across pages. Avoid arbitrary one-off card styles.
- Check 1440px, 1024px, 768px and 390px viewports.

## 7. Database/migration rules

- Do not manually edit a live database schema without a corresponding versioned migration.
- Make migrations ordered, reproducible, and safe to review.
- Add foreign keys, useful indexes, check constraints and owner policies.
- Test RLS behavior with separate users, not only with a service-role client.
- Vector column dimension must match the configured embedding model; document dimension changes and re-index procedures.
- Be careful with destructive changes. Back up or propose a migration plan before dropping data/tables.

## 8. Quality assurance rules

For each phase:

1. Inspect current code and identify files likely to change.
2. State a short implementation plan before major edits.
3. Implement incrementally with clear module boundaries.
4. Add/update unit tests for business logic and regression behavior.
5. Run frontend lint, typecheck and build as applicable.
6. Run backend lint and tests as applicable.
7. Test failure paths, not only successful flows.
8. Review browser console, server logs and network behavior for errors.
9. Update `progress.md` with verifiable commands/results, blockers and next steps.
10. Stop at phase exit criteria; do not continue by assuming success.

Never write “all tests passed” unless the commands were actually run and the results confirmed. If environment credentials, Ollama models, or Supabase setup are unavailable, state exactly which test was blocked and provide a safe local verification path.

## 9. Agent roles and boundaries

When multiple agents are available, delegate narrow, non-overlapping work:

- **Architect/Coordinator:** owns phase scope, source-of-truth docs, interface contracts and conflict resolution. Avoids parallel edits to the same files.
- **Frontend Agent:** UI components, route/page behavior, accessibility, responsive Glassmorphism and frontend tests. Must not implement authorization as UI-only logic.
- **Backend Agent:** FastAPI routes, schemas, services, validation, API tests and error handling.
- **Supabase/Data Agent:** migrations, tables, RLS, Storage policies, vector search SQL/RPC and data integrity tests.
- **RAG Agent:** Ollama client, parsing/chunking, embeddings, retrieval, prompting, citations and evaluation. Must coordinate schema and auth contracts first.
- **QA/Security Agent:** tests critical workflows, two-user isolation, error handling, build quality, secrets and responsive UI. Reports evidence, not assumptions.

If only one agent is available, follow the same responsibilities sequentially. Do not have multiple agents create competing schemas or rewrite shared configuration concurrently.

## 10. Definition of done

A task is complete only when:

- The implementation matches the relevant PRD requirements.
- The design follows `design.md`.
- Authentication/ownership and data integrity are enforced where applicable.
- Loading, empty, success, and failure states are implemented for the main workflow.
- Tests are added/updated and relevant checks have been run.
- Documentation and `progress.md` reflect the true status.
- Known limitations are recorded explicitly.
