import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { apiClient } from '@/lib/api-client';
import { Subject } from '@/types/planner';
import { X, BookOpen } from 'lucide-react';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectSaved: (subject: Subject) => void;
}

const COLOR_PRESETS = [
  '#43E58B', // Emerald
  '#8B7CFF', // Violet
  '#38BDF8', // Cyan
  '#FFAD55', // Amber
  '#F43F5E', // Rose
];

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSubjectSaved,
}) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#43E58B');
  const [term, setTerm] = useState('Fall 2024');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const newSubject = await apiClient<Subject>('/subjects', {
        method: 'POST',
        body: JSON.stringify({
          title,
          code: code || undefined,
          color,
          term: term || undefined,
          target_completion_date: targetDate || undefined,
        }),
      });
      onSubjectSaved(newSubject);
      onClose();
      // Reset form
      setTitle('');
      setCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <GlassCard level={3} className="w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary-container/20 border border-primary/30 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 id="subject-modal-title" className="font-headline text-lg font-bold text-on-surface">Add Academic Subject</h2>
            <p className="text-xs text-on-surface-variant">Course details used by the study planner</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/30 border border-error/30 text-error text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <GlassInput
            id="subjTitle"
            label="Subject Title"
            placeholder="e.g. Database Management Systems"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <GlassInput
              id="subjCode"
              label="Course Code (Optional)"
              placeholder="e.g. CS305"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <GlassInput
              id="subjTerm"
              label="Academic Term"
              placeholder="e.g. Fall 2024"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-on-surface mb-2">Subject Theme Color</label>
            <div className="flex items-center gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === preset ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
          </div>

          <GlassInput
            id="targetDate"
            label="Target Completion Date (Optional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-white/5">
            <GlassButton type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" loading={loading}>
              Save Subject
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
