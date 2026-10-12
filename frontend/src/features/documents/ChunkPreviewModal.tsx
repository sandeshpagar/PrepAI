import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { apiClient } from '@/lib/api-client';
import { DocumentChunk, DocumentItem } from '@/types/document';
import { Layers, X, Clock, FileText } from 'lucide-react';

interface ChunkPreviewModalProps {
  document: DocumentItem | null;
  onClose: () => void;
}

export const ChunkPreviewModal: React.FC<ChunkPreviewModalProps> = ({
  document,
  onClose,
}) => {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (document) {
      setLoading(true);
      apiClient<DocumentChunk[]>(`/documents/${document.id}/chunks`)
        .then(setChunks)
        .catch((err) => console.error('Failed to load chunks:', err))
        .finally(() => setLoading(false));

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [document, onClose]);

  if (!document) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chunk-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
    >
      <GlassCard level={2} className="w-full max-w-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 id="chunk-preview-title" className="font-headline text-lg font-bold text-on-surface truncate max-w-md">
                {document.title} — Indexed Chunks
              </h3>
              <p className="text-xs text-on-surface-variant font-mono">
                {document.chunk_count} chunks • 768-dim pgvector embeddings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant gap-2">
              <Clock className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-mono">Loading vector chunks...</span>
            </div>
          ) : chunks.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <FileText className="w-8 h-8 text-on-surface-variant/40 mb-2" />
              <span className="text-xs font-semibold text-on-surface">No chunks available</span>
              <span className="text-[11px] text-on-surface-variant mt-1">
                This document has not been chunked or indexed yet.
              </span>
            </div>
          ) : (
            chunks.map((chunk) => (
              <div
                key={chunk.id}
                className="p-3.5 rounded-xl bg-surface-container/60 border border-white/5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary font-mono text-[10px] font-semibold">
                      Chunk #{chunk.chunk_index + 1}
                    </span>
                    {chunk.page_or_slide && (
                      <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-[10px]">
                        {document.file_type === 'pptx' ? `Slide ${chunk.page_or_slide}` : `Page ${chunk.page_or_slide}`}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant">
                    ~{chunk.token_count || 0} tokens
                  </span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap font-sans bg-surface-container-lowest/60 p-2.5 rounded-lg border border-white/5">
                  {chunk.content}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end shrink-0">
          <GlassButton variant="glass" size="md" onClick={onClose}>
            Close
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
