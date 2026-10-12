import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { apiClient } from '@/lib/api-client';
import { Subject } from '@/types/planner';
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLOWED_EXTS = ['pdf', 'docx', 'pptx', 'txt', 'md'];
const MAX_BYTES = 25 * 1024 * 1024; // 25MB

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      apiClient<Subject[]>('/subjects')
        .then(setSubjects)
        .catch((err) => console.error('Failed to load subjects:', err));

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else {
      setSelectedFile(null);
      setTitle('');
      setSubjectId('');
      setError(null);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTS.includes(ext)) {
      setError(`Unsupported file format. Please upload PDF, DOCX, PPTX, TXT, or Markdown.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File size exceeds 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (title.trim()) {
        formData.append('title', title.trim());
      }
      if (subjectId) {
        formData.append('subject_id', subjectId);
      }

      await apiClient('/documents/upload', {
        method: 'POST',
        body: formData,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upload and ingestion failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
    >
      <GlassCard level={2} className="w-full max-w-lg flex flex-col p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h3 id="upload-modal-title" className="font-headline text-lg font-bold text-on-surface">Upload Academic Document</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-error/15 border border-error/30 text-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="flex flex-col gap-4 mt-4">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-primary bg-primary-container/10'
                : selectedFile
                ? 'border-primary/40 bg-surface-container/60'
                : 'border-white/10 hover:border-white/20 bg-surface-container/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx,.txt,.md"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-on-surface truncate max-w-xs">
                  {selectedFile.name}
                </div>
                <div className="text-[11px] font-mono text-on-surface-variant">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-on-surface">
                  Click to select or drag and drop file
                </div>
                <div className="text-[11px] text-on-surface-variant">
                  Supports PDF, DOCX, PPTX, TXT, MD (Max 25MB)
                </div>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-on-surface-variant font-semibold">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CS305 Unit 4 - Distributed Transactions"
              className="px-3 py-2 rounded-xl bg-surface-container-high/80 text-on-surface placeholder:text-on-surface-variant/40 border border-white/5 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          {/* Subject Assignment */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-on-surface-variant font-semibold">
              Assign to Subject (Optional)
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-container-high/80 text-on-surface border border-white/5 text-xs font-mono focus:outline-none focus:border-primary"
            >
              <option value="">No Subject (General)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Format pills */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-on-surface-variant">Supported:</span>
            {['PDF', 'DOCX', 'PPTX', 'TXT', 'MD'].map((fmt) => (
              <span
                key={fmt}
                className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono text-[10px]"
              >
                {fmt}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-end gap-3">
            <GlassButton variant="glass" size="md" type="button" onClick={onClose} disabled={uploading}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              size="md"
              type="submit"
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                  <span>Processing & Indexing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  <span>Upload & Index</span>
                </>
              )}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
