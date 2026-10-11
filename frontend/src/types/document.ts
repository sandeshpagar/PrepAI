export type DocumentStatus = 'queued' | 'processing' | 'indexed' | 'failed';
export type DocumentFileType = 'pdf' | 'docx' | 'pptx' | 'txt' | 'md';

export interface DocumentItem {
  id: string;
  user_id: string;
  subject_id?: string;
  title: string;
  original_filename: string;
  file_type: DocumentFileType;
  file_size_bytes: number;
  storage_path: string;
  status: DocumentStatus;
  error_message?: string;
  page_count?: number;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  page_or_slide?: number;
  token_count?: number;
  created_at: string;
}
