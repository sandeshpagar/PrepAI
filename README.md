# PrepAI — AI-Powered Study Planner & Academic RAG Assistant

PrepAI is a student-focused academic workspace that unifies intelligent study planning with document-grounded question answering (RAG) powered by local Ollama models and hosted Supabase database/storage.

---

## 1. Architecture Overview

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS with custom Glassmorphism design tokens matching Stitch visual reference.
- **Backend:** Python 3.11+, FastAPI modular monolith, Pydantic v2 settings validation.
- **Database & Auth:** Supabase Auth, PostgreSQL with Row Level Security (RLS), private Supabase Storage, and `pgvector`.
- **Local AI & Embeddings:** Locally running Ollama instance (`qwen2.5:7b` chat model and `nomic-embed-text` 768-dimensional embedding model).

---

## 2. Prerequisites

- **Node.js:** v18.0.0 or higher (v22+ recommended)
- **Python:** v3.11 or higher
- **Ollama:** Installed locally from [ollama.com](https://ollama.com)
  ```bash
  ollama pull qwen2.5:7b
  ollama pull nomic-embed-text
  ```
- **Supabase Account:** A Supabase project for Auth, PostgreSQL, and Storage.

---

## 3. Quickstart & Local Setup

### 3.1 Environment Configuration

Copy the root template into both `frontend/` and `backend/`:

```bash
# In backend/
cp .env.example backend/.env

# In frontend/
cp .env.example frontend/.env
```

Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided in `frontend/.env`, and `SUPABASE_JWT_SECRET` is set in `backend/.env`.

---

### 3.2 Backend Setup & Execution

```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
pip install -r requirements.txt

# Run test suite:
pytest tests -v

# Start FastAPI development server:
uvicorn app.main:app --reload --port 8000
```

The Swagger API documentation will be available at: `http://localhost:8000/docs`
Health check endpoint: `http://localhost:8000/health`

---

### 3.3 Frontend Setup & Execution

```bash
cd frontend
npm install

# Typecheck and build:
npm run build

# Start development server:
npm run dev
```

The application will be accessible at: `http://localhost:5173`

---

## 4. Supabase Database Migrations

Initial schema migrations reside in `backend/migrations/`:

- `00001_create_profiles.sql`: Creates `profiles` table linked to `auth.users(id)` with Row Level Security policies and auto-creation trigger on signup.

Apply via the Supabase Dashboard SQL Editor or Supabase CLI.

---

## 5. Security Mandates

- **No client-trusted IDs:** User identity is strictly derived on the backend from verified Supabase JWT access tokens (`Authorization: Bearer <token>`).
- **Zero secrets in frontend:** Supabase service-role keys, database connection strings, and private keys must never exist in browser code or client bundles.
- **Local-first inference:** Uploaded academic documents and vector embeddings are processed strictly through the local Ollama instance on `127.0.0.1:11434` without transmission to third-party cloud LLMs.
