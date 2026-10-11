-- Migration: 00003_create_documents_and_vectors.sql
-- Description: Creates documents, document_chunks with pgvector (768 dimensions),
--              private storage bucket configuration, and similarity search RPC function.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'pptx', 'txt', 'md')),
    file_size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'indexed', 'failed')),
    error_message TEXT,
    page_count INT,
    chunk_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create document_chunks table with 768-dim vector embeddings (nomic-embed-text)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    page_or_slide INT,
    token_count INT,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON public.documents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_subject ON public.documents(subject_id);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_user ON public.document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_idx ON public.document_chunks(document_id, chunk_index);

-- Vector Cosine Distance Index using HNSW
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
    ON public.document_chunks
    USING hnsw (embedding vector_cosine_ops);

-- 5. Updated_at Trigger for documents
CREATE TRIGGER set_documents_timestamp
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for documents
CREATE POLICY "Users can manage own documents"
    ON public.documents
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 8. RLS Policies for document_chunks
CREATE POLICY "Users can manage own document chunks"
    ON public.document_chunks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 9. Private Storage Bucket Setup for 'documents'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    26214400, -- 25MB in bytes
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/markdown'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 26214400;

-- Storage RLS Policies: scoped to user folder: <user_id>/<doc_id>/<filename>
CREATE POLICY "Users can upload their own documents"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can read their own documents"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own documents"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 10. Vector Similarity Search Function (RPC)
CREATE OR REPLACE FUNCTION match_document_chunks (
    query_embedding vector(768),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 5,
    filter_document_ids uuid[] DEFAULT NULL,
    filter_user_id uuid DEFAULT auth.uid()
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    content text,
    page_or_slide int,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.content,
        dc.page_or_slide,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM public.document_chunks dc
    WHERE dc.user_id = filter_user_id
      AND (filter_document_ids IS NULL OR dc.document_id = ANY(filter_document_ids))
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER TO dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
