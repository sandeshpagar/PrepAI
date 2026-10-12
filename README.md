# PrepAI — AI-Powered Study Planner & Academic RAG Assistant

PrepAI is an intelligent, multi-tenant academic workspace for students that unifies deterministic study planning with document-grounded question answering (RAG). Powered by local Ollama models (`qwen2.5:7b` + `nomic-embed-text`) and Supabase PostgreSQL with `pgvector` and Row Level Security (RLS).

---

## 1. System Architecture

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS with custom Glassmorphism design system matching Stitch visual guidelines.
- **Backend:** Python 3.11+, FastAPI modular monolith, Pydantic v2 schemas and centralized settings.
- **Database & Auth:** Supabase Auth, PostgreSQL with Row Level Security (RLS), private Supabase Storage, and `pgvector` (768-dim embeddings).
- **Local AI & Embeddings:** Locally hosted Ollama instance (`qwen2.5:7b` chat model and `nomic-embed-text` embedding model). Private documents and vector embeddings are never transmitted to third-party cloud LLM APIs.

---

## 2. Prerequisites

1. **Node.js:** v18.0.0 or higher (v22+ recommended)
2. **Python:** v3.11 or higher (Python 3.12 / 3.13 supported)
3. **Ollama:** Installed and running locally from [ollama.com](https://ollama.com)
   ```bash
   ollama pull qwen2.5:7b
   ollama pull nomic-embed-text
   ```
4. **Supabase Project:** A hosted Supabase project or local Supabase CLI instance for Auth, PostgreSQL, and private Storage.

---

## 3. Quickstart & Local Setup

### 3.1 Clone & Environment Configuration

Copy the root template into both `backend/` and `frontend/`:

```bash
# Backend environment
cp .env.example backend/.env

# Frontend environment
cp .env.example frontend/.env
```

#### Required Environment Variables

**Frontend (`frontend/.env`):**
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**Backend (`backend/.env`):**
```env
PROJECT_NAME="PrepAI"
ENVIRONMENT=development
API_V1_STR=/api/v1
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]

# Supabase Credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Ollama LLM Configuration
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_CHAT_MODEL=qwen2.5:7b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSION=768
OLLAMA_REQUEST_TIMEOUT_SECONDS=120
OLLAMA_CHAT_TEMPERATURE=0.2
OLLAMA_NUM_PREDICT=512

# RAG Retrieval Configuration
RAG_TOP_K=5
RAG_CHUNK_SIZE=900
RAG_CHUNK_OVERLAP=150
```

---

### 3.2 Database Migrations (Supabase)

Execute the 5 migrations in order using the Supabase Dashboard SQL Editor or Supabase CLI:

1. `backend/migrations/00001_create_profiles.sql`: User profile auto-creation trigger & profile table with RLS.
2. `backend/migrations/00002_create_study_planner_tables.sql`: Subjects, syllabus topics, tasks, assessments, availability rules, and study sessions with RLS.
3. `backend/migrations/00003_create_documents_and_vectors.sql`: Documents, document chunks with `vector(768)` pgvector embedding column, and `match_document_chunks` RPC similarity search function.
4. `backend/migrations/00004_create_conversations_and_messages.sql`: Conversations, chat messages, citation schemas, and RLS.
5. `backend/migrations/00005_create_settings_and_notifications.sql`: User settings, in-app notifications with deduplication, and activity events with RLS.

---

### 3.3 Backend Setup & Execution

```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Run the full automated test suite:
pytest -c pytest.ini tests -v

# Start the FastAPI development server:
uvicorn app.main:app --reload --port 8000
```

- API Base: `http://localhost:8000/api/v1`
- Interactive OpenAPI / Swagger Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

---

### 3.4 Frontend Setup & Execution

```bash
cd frontend
npm install

# Typecheck and build:
npm run build

# Start Vite development server:
npm run dev
```

The web application will be accessible at: `http://localhost:5173`

---

## 4. Key Features & Capabilities

1. **Dashboard:** Weekly study target progress, study streak tracking, upcoming exams, pending tasks, recent activity feed, and study trend visualization.
2. **AI Study Planner:** Automated, constraint-driven study plan generation based on syllabus difficulty, assessment weights, deadlines, and user-defined availability windows.
3. **Task & Subject Management:** Track assignments, revision topics, difficulty ratings, and syllabus completion.
4. **Academic Calendar:** Interactive calendar view displaying scheduled study blocks, task deadlines, and exam dates with month/week toggles.
5. **Academic Assistant (RAG):** Document-grounded conversational AI. Generates accurate, cited responses from uploaded lecture slides, textbooks, and notes. Refuses to hallucinate when context is insufficient.
6. **Document Library:** Drag-and-drop ingestion of PDF, DOCX, PPTX, TXT, and Markdown files. Automatic chunking, 768-dim embeddings, and chunk inspection inspector.
7. **Progress & Analytics:** Study time breakdowns by subject, task completion rates, weekly velocity, and subject mastery charts.
8. **Settings & In-App Notifications:** Custom study preferences, exam alert lead times, dark mode toggle, and automated in-app notifications with deduplication.

---

## 5. Security & Isolation Guarantees

- **No Client-Supplied User IDs:** The backend derives authenticated user identity strictly from verified Supabase JWT Bearer tokens. Client payloads cannot spoof or override `user_id`.
- **Multi-Tenant Row Level Security:** Every table enforces strict RLS (`auth.uid() = user_id`). Users cannot read, modify, or infer any other user's documents, vectors, sessions, or tasks.
- **Zero Secrets in Frontend Bundles:** Only public Supabase anon key and API base URL are exposed to client builds. Supabase service-role keys and database passwords reside exclusively on the server.
- **Local-First Document Privacy:** Ingestion, parsing, embeddings, and chat generation execute strictly against local Ollama models. Private study material never leaves the student's infrastructure.
- **Citation Guardrails:** The assistant only emits citations for chunks actually retrieved and verified. Non-existent or hallucinated citation IDs are discarded before presentation.

---

## 6. Troubleshooting & FAQs

### Q: Ollama connection refused or timeout?
- Verify Ollama is running: `curl http://127.0.0.1:11434/api/tags`
- Ensure required models are pulled:
  ```bash
  ollama pull qwen2.5:7b
  ollama pull nomic-embed-text
  ```

### Q: 401 Unauthorized errors in API calls?
- Verify that `SUPABASE_JWT_SECRET` in `backend/.env` matches the **JWT Secret** in your Supabase Project Settings (under API > JWT Settings).

### Q: PDF or DOCX parsing issues?
- Ensure `pypdf`, `python-docx`, and `python-pptx` are installed in the backend virtual environment:
  ```bash
  pip install pypdf python-docx python-pptx
  ```

---

## 7. License

MIT License. Designed and built for academic research and personal study productivity.
