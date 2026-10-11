# PrepAI — Technology Stack

**Purpose:** Defines the recommended implementation stack and the reason for each major choice. Treat this file as the default implementation contract unless a documented blocker requires a decision change.

## 1. Stack summary

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React + TypeScript | Interactive application UI |
| Frontend build/dev server | Vite | Local development and production build |
| Styling | Tailwind CSS + CSS variables | Design tokens, responsive layout, Glassmorphism styling |
| UI primitives | shadcn/ui or accessible Radix-based primitives | Dialogs, menus, forms, popovers, tabs; customize visually |
| Icons | Lucide React | Consistent professional interface icons |
| Charts | Recharts | Study activity, subject progress, task trends |
| Calendar/date handling | A well-maintained React calendar/date library plus `date-fns` | Calendar controls, formatting, time ranges |
| Client forms and validation | React Hook Form + Zod | Typed, validated forms and consistent error states |
| API access | A small typed `fetch` client or Axios | Bearer token propagation, errors, API types |
| Authentication client | `@supabase/supabase-js` | Supabase Auth session and allowed browser-side Supabase operations |
| Backend API | Python + FastAPI | REST API, authorization, planner, RAG orchestration |
| Backend validation | Pydantic | Request/response schemas and settings validation |
| ASGI server | Uvicorn | Local API server |
| Database and auth | Supabase Postgres + Supabase Auth | User identity and structured application data |
| Vector search | Supabase Postgres `pgvector` | Store and search embeddings for RAG |
| File storage | Supabase Storage, private bucket | User-uploaded study documents |
| Local chat model | Ollama | Local LLM inference; model chosen by environment variable |
| Local embedding model | Ollama embedding endpoint | Create vectors locally; embedding model chosen by environment variable |
| Document parsing | `pypdf` or PyMuPDF, `python-docx`, `python-pptx`, standard text/Markdown parsing | Extract source text and page/slide metadata |
| Chunking and retrieval | Project-owned Python services initially | Predictable chunking, filtering, retrieval, citation mapping; avoid opaque orchestration until needed |
| Database schema changes | Versioned SQL migrations | Reproducible schema, indexes, RLS and vector functions |
| Python tests | pytest + HTTPX TestClient or supported FastAPI testing approach | Unit and API tests |
| Frontend tests | Vitest + React Testing Library | Component and workflow tests |
| Browser end-to-end tests | Playwright | Cross-screen critical path and responsive smoke tests |
| Code quality | Ruff + formatting; ESLint + Prettier | Consistent and maintainable code |
| Configuration | `.env` files excluded from Git; `.env.example` committed | Local setup and safe secret management |

Do not install every option blindly. Select compatible current versions during project setup, pin them in lock/requirements files, and document upgrades.

## 2. Frontend details

- Use React with TypeScript and Vite. Prefer feature-based folders over one giant `App.tsx`.
- Use React Router for routes.
- Use Tailwind and CSS custom properties for color, spacing, radius, and glass material tokens.
- Use reusable components for the sidebar, top bar, glass card, stat card, task row, study session, citation chip, document status, empty state, loading state, and confirmation dialog.
- Use shadcn/ui or accessible Radix primitives where they save time, but restyle them to match PrepAI. Do not let default component styles override the approved design system.
- Use Recharts for data-driven charts. Charts must consume real API data or clearly labelled development fixtures.
- Use Lucide React icons rather than emoji as primary UI icons.
- Use typed API DTOs and a central API client. Do not put business rules, scheduler algorithms, or RAG retrieval in frontend code.

### Suggested frontend dependencies

`react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, `tailwindcss`, `lucide-react`, `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `playwright`.

Add only the packages actually required by the selected Vite/Tailwind version and project configuration.

## 3. Python backend details

Use FastAPI as a modular monolith for the MVP. It is simpler to develop and test than multiple services while still allowing clear service boundaries.

Suggested Python packages:

- `fastapi`, `uvicorn[standard]`, `pydantic-settings`
- `supabase` Python client if it fits the selected access pattern
- `httpx` for local Ollama HTTP calls and test clients
- `PyJWT` or a suitable maintained JWT/JWKS validation approach for verifying Supabase access tokens; follow the active Supabase signing configuration rather than assuming one static algorithm
- `pypdf` or `pymupdf`, `python-docx`, `python-pptx`
- `python-multipart` only if uploads pass through FastAPI; browser-to-Supabase Storage uploads may avoid large-file proxying
- `pytest`, `ruff`

Use `pydantic-settings` for all environment configuration. Keep route handlers thin and move logic into services.

Suggested backend modules:

- `api/routes/` — endpoint declarations
- `api/dependencies/` — authentication and request context
- `schemas/` — request/response DTOs
- `services/planner/` — scheduling, validation, re-planning
- `services/documents/` — storage orchestration, parsing, chunking, status tracking
- `services/embeddings/` — Ollama embedding client and vector dimension checks
- `services/retrieval/` — filtered vector search, ranking, context assembly
- `services/chat/` — prompts, Ollama chat calls, streaming/response formatting, citations
- `services/analytics/` — aggregate calculations
- `repositories/` — database query boundaries where helpful
- `core/config.py` — environment settings
- `core/security.py` — token verification and ownership helpers
- `tests/` — unit, integration, and API tests

## 4. Supabase responsibilities

Use Supabase for:

1. **Auth:** registration, login, refresh, reset flows, and user identity.
2. **Postgres:** profiles, subjects, topics, tasks, assessments, sessions, documents metadata, conversations/messages, notifications, activity, and vector chunks.
3. **Storage:** private academic document objects.
4. **`pgvector`:** embeddings and similarity search.
5. **RLS:** user-level access policies on tables exposed to the browser and private storage objects.

Do not treat Supabase as a substitute for backend business logic. The Python API remains responsible for planning and RAG orchestration.

### Credentials and trust boundaries

- The browser may use the Supabase project URL and the public/anon or publishable key intended for client use, with RLS correctly configured.
- The browser must never receive a service-role key or database password.
- The API must verify the signed-in user's access token and derive the user ID from the verified token, not from a trusted `user_id` supplied in request JSON.
- If a server-side service-role client is necessary, keep it exclusively in backend environment variables, validate user ownership before privileged operations, and avoid broad bypass patterns.
- Enable RLS before exposing user-owned data. Write and test policies for every relevant table and storage operation.

## 5. Local Ollama configuration

Use Ollama for both chat generation and embeddings. Model names must be configurable because model availability, memory usage, output quality, and embedding dimensions depend on the chosen model.

Example local development settings:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_CHAT_MODEL=qwen2.5:7b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_REQUEST_TIMEOUT_SECONDS=120
OLLAMA_CHAT_TEMPERATURE=0.2
RAG_TOP_K=5
RAG_CHUNK_SIZE=900
RAG_CHUNK_OVERLAP=150
RAG_MIN_SIMILARITY=0.0
```

These are initial examples, not guaranteed optimal settings. Confirm that the specified models are installed and available in the local Ollama instance before testing.

Important configuration requirements:

- Download models separately with Ollama; installing the Python package alone does not install model weights.
- Choose the embedding model before finalizing the vector column dimension. Confirm the real vector dimension from the selected model. For example, `nomic-embed-text` commonly returns 768-dimensional embeddings; if a different model/dimension is chosen, update the schema and rebuild embeddings consistently.
- Use the current supported Ollama embedding/chat API for the installed Ollama version. Encapsulate it behind `OllamaClient` so endpoint changes do not leak through business logic.
- Handle unavailable Ollama, model-not-installed errors, timeout, empty response, and cancellation gracefully.
- Do not expose port `11434` directly to the public internet.

## 6. Database access strategy

Choose and document one consistent data-access approach during Phase 1:

- For normal user-scoped data, either use the Supabase client with the verified user's JWT so database policies apply, or use a backend connection approach with explicit ownership enforcement and appropriate Postgres roles.
- Use controlled privileged backend operations only for tasks such as ingestion/vector writes where appropriate. The API must validate ownership before reading/writing.
- Use parameterized queries or safe RPC functions for vector search. Do not concatenate query text into SQL.
- Implement vector search as a versioned SQL function or a well-defined repository query with mandatory user/document filters.
- Avoid opening direct database connections per request without pooling/connection-limit consideration.

## 7. File ingestion and RAG pipeline

1. Validate authenticated owner, MIME type, extension, and size.
2. Upload to a private Supabase Storage bucket and create a `documents` metadata row.
3. Mark the document as queued/processing.
4. Fetch the file in the trusted backend and extract text while preserving PDF page or PPTX slide identifiers where feasible.
5. Normalize whitespace and reject empty/unreadable files with an informative error.
6. Split text into overlapping chunks using configurable chunk size/overlap. Store document ID, owner ID, chunk index, text, and page/slide/source labels.
7. Generate embeddings using the configured local Ollama embedding model.
8. Validate vector dimension and persist the chunk/embedding rows into Supabase `pgvector`.
9. Mark the document indexed only after successful completion.
10. On failure, persist a safe error state; allow retry and prevent duplicate chunks/embeddings on repeat processing.
11. For a question, embed the query locally, run a similarity search filtered by authenticated owner and selected documents, rank the context, and ask the configured chat model for an answer that cites provided chunk IDs.
12. Resolve citations from server-side chunk metadata. Never accept source names/page numbers hallucinated by the LLM as verified metadata.

## 8. Testing and quality gates

- Unit-test planner constraint logic without calling Ollama or Supabase.
- Test token verification and ownership checks.
- Test parsing/chunking for each supported file type with small fixtures.
- Test vector dimensions and query filtering.
- Test citation resolution with known chunk metadata.
- Test the insufficient-evidence case.
- Mock Ollama in normal CI tests; add a separate optional local Ollama smoke test.
- Test the main frontend flows and key pages at representative viewport widths.

## 9. Official documentation

- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase `pgvector`: https://supabase.com/docs/guides/database/extensions/pgvector
- Supabase vector columns: https://supabase.com/docs/guides/ai/vector-columns
- Supabase RAG permissions: https://supabase.com/docs/guides/ai/rag-with-permissions
- FastAPI security/JWT concepts: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
- FastAPI CORS: https://fastapi.tiangolo.com/tutorial/cors/
- Vite guide: https://vite.dev/guide/
- React TypeScript: https://react.dev/learn/typescript
- Ollama documentation: https://docs.ollama.com/

Review current official documentation when setting up library versions, token validation, and Ollama endpoints.
