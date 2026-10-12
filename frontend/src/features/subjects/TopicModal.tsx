import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { apiClient } from '@/lib/api-client';
import { Topic } from '@/types/planner';
import { X, ListPlus } from 'lucide-react';

interface TopicModalProps {
  isOpen: boolean;
  subjectId: string;
  subjectTitle: string;
  onClose: () => void;
  onTopicSaved: (topic: Topic) => void;
}

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  subjectId,
  subjectTitle,
  onClose,
  onTopicSaved,
}) => {
  const [title, setTitle] = useState('');
  const [importance, setImportance] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
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
      const newTopic = await apiClient<Topic>(`/subjects/${subjectId}/topics`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          importance,
          difficulty,
          estimated_minutes: estimatedMinutes,
          subject_id: subjectId,
        }),
      });
      onTopicSaved(newTopic);
      onClose();
      setTitle('');
    } catch (err: any) {
      setError(err.message || 'Failed to add topic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <GlassCard level={3} className="w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-secondary-container/20 border border-secondary/30 flex items-center justify-center">
            <ListPlus className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <h2 id="topic-modal-title" className="font-headline text-base font-bold text-on-surface">Add Syllabus Topic</h2>
            <p className="text-xs text-on-surface-variant truncate">To: {subjectTitle}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/30 border border-error/30 text-error text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <GlassInput
            id="topicTitle"
            label="Topic Name"
            placeholder="e.g. B+ Tree Indexing & Query Optimizations"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">
                Importance (1-5)
              </label>
              <select
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                className="w-full bg-surface-container-lowest text-xs text-on-surface rounded-lg p-2.5 border border-white/10 focus:outline-none focus:border-secondary"
              >
                <option value={1}>1 - Low</option>
                <option value={2}>2 - Minor</option>
                <option value={3}>3 - Standard</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Core Exam Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">
                Difficulty (1-5)
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full bg-surface-container-lowest text-xs text-on-surface rounded-lg p-2.5 border border-white/10 focus:outline-none focus:border-secondary"
              >
                <option value={1}>1 - Introductory</option>
                <option value={2}>2 - Easy</option>
                <option value={3}>3 - Moderate</option>
                <option value={4}>4 - Complex</option>
                <option value={5}>5 - Advanced / Heavy</option>
              </select>
            </div>
          </div>

          <GlassInput
            id="estMinutes"
            label="Estimated Study Duration (Minutes)"
            type="number"
            min={15}
            step={15}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            required
          />

          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-white/5">
            <GlassButton type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" loading={loading}>
              Add Topic
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
