import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { apiClient } from '@/lib/api-client';
import { DocumentItem, DocumentFileType } from '@/types/document';
import { Subject } from '@/types/planner';
import { UploadModal } from './UploadModal';
import { ChunkPreviewModal } from './ChunkPreviewModal';
import {
  Upload,
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Layers,
  Edit2,
  FileQuestion,
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<DocumentItem | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Fetch documents and subjects
  const fetchDocuments = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const [docsData, subjsData] = await Promise.all([
        apiClient<DocumentItem[]>('/documents'),
        apiClient<Subject[]>('/subjects'),
      ]);
      setDocuments(docsData);
      setSubjects(subjsData);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(true);
  }, []);

  // Poll while any document is in 'processing' or 'queued' state
  useEffect(() => {
    const hasActiveProcessing = documents.some(
      (d) => d.status === 'processing' || d.status === 'queued'
    );
    if (!hasActiveProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [documents]);

  // Actions
  const handleDeleteDocument = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? All associated vectors will be purged.`)) {
      return;
    }
    try {
      await apiClient(`/documents/${id}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const handleRenameDocument = async (doc: DocumentItem) => {
    const newTitle = window.prompt('Enter new document title:', doc.title);
    if (!newTitle || newTitle.trim() === '' || newTitle === doc.title) return;

    try {
      const updated = await apiClient<DocumentItem>(`/documents/${doc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updated : d)));
    } catch (err: any) {
      setError(err.message || 'Failed to rename document');
    }
  };

  const handleRetryIngestion = async (docId: string) => {
    try {
      setRetryingId(docId);
      const updated = await apiClient<DocumentItem>(`/documents/${docId}/retry`, {
        method: 'POST',
      });
      setDocuments((prev) => prev.map((d) => (d.id === docId ? updated : d)));
    } catch (err: any) {
      setError(err.message || 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  // Helper formatting
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeColor = (type: DocumentFileType) => {
    switch (type) {
      case 'pdf':
        return 'bg-error-container/20 text-error border-error/30';
      case 'docx':
        return 'bg-secondary-container/20 text-secondary border-secondary/30';
      case 'pptx':
        return 'bg-tertiary-container/20 text-tertiary border-tertiary/30';
      default:
        return 'bg-primary-container/20 text-primary border-primary/30';
    }
  };

  // Filtered list
  const filteredDocuments = documents.filter((doc) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!doc.title.toLowerCase().includes(q) && !doc.original_filename.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (subjectFilter !== 'all' && doc.subject_id !== subjectFilter) return false;
    if (typeFilter !== 'all' && doc.file_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">My Academic Documents</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Private document repository with local Ollama 768-dim embeddings & page citations.
          </p>
        </div>
        <GlassButton variant="primary" size="md" onClick={() => setIsUploadOpen(true)}>
          <Upload className="w-4 h-4 mr-1.5" />
          <span>Upload Document</span>
        </GlassButton>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <GlassCard level={1} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-high/80 text-on-surface placeholder:text-on-surface-variant/40 border border-white/5 text-xs focus:outline-none focus:border-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-lg bg-surface-container-highest/60 border border-white/5 text-[11px] font-mono">
            {['all', 'indexed', 'processing', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-glow-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            aria-label="Filter documents by subject"
            className="px-2.5 py-1.5 rounded-lg bg-surface-container-high text-on-surface border border-white/5 font-mono text-[11px] focus:outline-none focus:border-primary"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          {/* Format Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter documents by file format"
            className="px-2.5 py-1.5 rounded-lg bg-surface-container-high text-on-surface border border-white/5 font-mono text-[11px] uppercase focus:outline-none focus:border-primary"
          >
            <option value="all">All Formats</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="pptx">PPTX</option>
            <option value="txt">TXT</option>
            <option value="md">Markdown</option>
          </select>
        </div>
      </GlassCard>

      {/* Main Documents Grid */}
      <GlassCard level={1} className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-headline text-lg font-bold text-on-surface">Knowledge Base Documents</h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-mono text-[10px]">
              {filteredDocuments.length} Documents
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-on-surface-variant gap-2">
            <Clock className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs font-mono">Loading document library...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-surface-container/20">
            <FileQuestion className="w-10 h-10 text-on-surface-variant/30 mb-3" />
            <h3 className="font-headline text-sm font-semibold text-on-surface">No documents found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mt-1 mb-4">
              {documents.length === 0
                ? "Upload lecture slides, textbooks, or course notes to index them for AI citations and study assistance."
                : "No documents match the active filters or search query."}
            </p>
            {documents.length === 0 && (
              <GlassButton variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
                <Upload className="w-3.5 h-3.5 mr-1" />
                <span>Upload First Document</span>
              </GlassButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => {
              const matchedSubject = subjects.find((s) => s.id === doc.subject_id);
              const isRetrying = retryingId === doc.id;

              return (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl bg-surface-container/60 hover:bg-surface-container/80 border border-white/5 transition-all flex flex-col justify-between gap-4 group"
                >
                  {/* Top Details */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      {/* Format Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-bold border ${getTypeColor(
                          doc.file_type
                        )}`}
                      >
                        {doc.file_type}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] flex items-center gap-1.5 ${
                          doc.status === 'indexed'
                            ? 'bg-primary-container/20 text-primary font-semibold'
                            : doc.status === 'processing'
                            ? 'bg-secondary-container/30 text-secondary font-semibold animate-pulse'
                            : doc.status === 'failed'
                            ? 'bg-error/20 text-error font-semibold'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {doc.status === 'indexed' ? (
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                        ) : doc.status === 'processing' ? (
                          <Clock className="w-3 h-3 text-secondary animate-spin" />
                        ) : doc.status === 'failed' ? (
                          <AlertTriangle className="w-3 h-3 text-error" />
                        ) : null}
                        <span className="capitalize">{doc.status}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 className="text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] font-mono text-on-surface-variant truncate mt-0.5">
                        {doc.original_filename}
                      </p>
                    </div>

                    {/* Subject badge */}
                    {matchedSubject && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: matchedSubject.color || '#43E58B' }}
                        />
                        <span className="text-[11px] font-mono text-on-surface truncate">
                          {matchedSubject.title}
                        </span>
                      </div>
                    )}

                    {/* Error banner if failed */}
                    {doc.status === 'failed' && doc.error_message && (
                      <div className="p-2 rounded-lg bg-error/10 border border-error/20 text-error text-[11px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{doc.error_message}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Stats & Actions */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-mono text-[10px] text-on-surface-variant">
                      <span>{formatBytes(doc.file_size_bytes)}</span>
                      <span>•</span>
                      <span>
                        {doc.page_count
                          ? doc.file_type === 'pptx'
                            ? `${doc.page_count} slides`
                            : `${doc.page_count} pages`
                          : '1 page'}
                      </span>
                      <span>•</span>
                      <span>{doc.chunk_count} chunks</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {doc.status === 'indexed' && (
                        <button
                          onClick={() => setSelectedPreviewDoc(doc)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
                          title="Inspect Chunks"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {doc.status === 'failed' && (
                        <button
                          onClick={() => handleRetryIngestion(doc.id)}
                          disabled={isRetrying}
                          className="p-1.5 rounded-lg text-secondary hover:text-secondary-fixed hover:bg-secondary-container/20 transition-colors"
                          title="Retry Ingestion"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                        </button>
                      )}

                      <button
                        onClick={() => handleRenameDocument(doc)}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
                        title="Rename Document"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/15 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => fetchDocuments(false)}
      />

      {/* Chunks Inspection Modal */}
      <ChunkPreviewModal
        document={selectedPreviewDoc}
        onClose={() => setSelectedPreviewDoc(null)}
      />
    </div>
  );
};
