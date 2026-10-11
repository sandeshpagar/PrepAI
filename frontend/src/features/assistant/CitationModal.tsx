import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { Citation } from '@/types/assistant';
import { FileText, X, Bookmark, Percent } from 'lucide-react';

interface CitationModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <GlassCard level={2} className="w-full max-w-lg flex flex-col p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-headline text-lg font-bold text-on-surface">Verified Source Citation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Bookmark className="w-4 h-4 text-secondary shrink-0" />
              <span className="font-semibold text-sm text-on-surface truncate">
                {citation.document_title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {citation.page_or_slide && (
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-secondary-fixed text-xs font-mono font-semibold">
                  Page/Slide {citation.page_or_slide}
                </span>
              )}
              {citation.similarity_score > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary text-xs font-mono flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  {Math.round(citation.similarity_score * 100)}% match
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container/60 border border-white/5 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant font-semibold">
              Grounding Excerpt from Stored Chunk
            </span>
            <p className="text-xs text-on-surface leading-relaxed font-mono whitespace-pre-wrap select-text">
              "{citation.quote}"
            </p>
          </div>

          <div className="text-[11px] text-on-surface-variant/70 leading-normal">
            Verified on-device: this citation was matched against local 768-dim vector embeddings (<code className="text-secondary font-mono">nomic-embed-text</code>) and validated server-side against database chunk metadata.
          </div>

          <div className="pt-2 flex justify-end">
            <GlassButton variant="glass" size="sm" onClick={onClose}>
              Close
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
