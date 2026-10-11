export interface Citation {
  chunk_id: string;
  document_id: string;
  document_title: string;
  page_or_slide?: number | null;
  quote: string;
  similarity_score: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Citation[];
  retrieval_metadata?: Record<string, any>;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  document_ids?: string[] | null;
  message_count: number;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}
