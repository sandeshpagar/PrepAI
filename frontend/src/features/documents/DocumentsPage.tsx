import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { BookOpen, Upload, FileCheck } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';

export const DocumentsPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">My Academic Documents</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Private document repository for PDF, DOCX, PPTX, and lecture notes.
          </p>
        </div>
        <GlassButton variant="primary" size="md">
          <Upload className="w-4 h-4 mr-1.5" />
          <span>Upload Document</span>
        </GlassButton>
      </div>

      <GlassCard level={1} className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-tertiary-container/20 border border-tertiary/30 flex items-center justify-center mb-4">
          <BookOpen className="w-6 h-6 text-tertiary" />
        </div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
          Document Ingestion & pgvector Pipeline
        </h2>
        <p className="text-xs text-on-surface-variant max-w-md mb-6 leading-relaxed">
          Upload syllabi and textbooks to private Supabase Storage, parse chunk text with page numbers, and generate local 768-dim embeddings (Phase 3 feature).
        </p>
        <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant bg-surface-container-high/60 px-3 py-1.5 rounded-lg border border-white/5">
          <FileCheck className="w-3.5 h-3.5 text-primary" />
          <span>Private Bucket RLS & Ingestion Engine Spec Ready</span>
        </div>
      </GlassCard>
    </div>
  );
};
