import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Brain, Sparkles, MessageSquare } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';

export const AssistantPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">AI Study Assistant</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Academic RAG copilot grounded strictly in your verified study materials.
          </p>
        </div>
        <GlassButton variant="secondary" size="md">
          <MessageSquare className="w-4 h-4 mr-1.5" />
          <span>New Conversation</span>
        </GlassButton>
      </div>

      <GlassCard level={1} className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-secondary-container/20 border border-secondary/30 flex items-center justify-center mb-4">
          <Brain className="w-6 h-6 text-secondary" />
        </div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
          Academic RAG Intelligence Copilot
        </h2>
        <p className="text-xs text-on-surface-variant max-w-md mb-6 leading-relaxed">
          Retrieves vector-indexed passages from your uploaded documents and answers queries with transparent source citations (Phase 4 feature).
        </p>
        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant bg-surface-container-high/60 px-3 py-1.5 rounded-lg border border-white/5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Ollama Qwen2.5 + nomic-embed-text Integration Configured</span>
        </div>
      </GlassCard>
    </div>
  );
};
