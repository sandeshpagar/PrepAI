import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { apiClient } from '@/lib/api-client';
import { Task, Subject } from '@/types/planner';
import { X, CheckSquare } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  subjects: Subject[];
  onClose: () => void;
  onTaskSaved: (task: Task) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  subjects,
  onClose,
  onTaskSaved,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [category, setCategory] = useState<'assignment' | 'revision' | 'practice' | 'reading' | 'exam_prep'>('assignment');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [dueDate, setDueDate] = useState('');
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
      const newTask = await apiClient<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || undefined,
          subject_id: subjectId || undefined,
          category,
          priority,
          estimated_duration_minutes: durationMinutes,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });
      onTaskSaved(newTask);
      onClose();
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
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
          <div className="w-8 h-8 rounded-lg bg-tertiary-container/20 border border-tertiary/30 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-tertiary" />
          </div>
          <div>
            <h2 id="task-modal-title" className="font-headline text-lg font-bold text-on-surface">Create New Task</h2>
            <p className="text-xs text-on-surface-variant">Add an assignment, revision session, or practice block</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/30 border border-error/30 text-error text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <GlassInput
            id="taskTitle"
            label="Task Title"
            placeholder="e.g. Database Assignment 3 (SQL Triggers)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full bg-surface-container-lowest text-xs text-on-surface rounded-lg p-2.5 border border-white/10 focus:outline-none focus:border-secondary"
              >
                <option value="">No specific subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-surface-container-lowest text-xs text-on-surface rounded-lg p-2.5 border border-white/10 focus:outline-none focus:border-secondary"
              >
                <option value="assignment">Assignment</option>
                <option value="revision">Revision Block</option>
                <option value="practice">Practice Problems</option>
                <option value="reading">Reading Chapter</option>
                <option value="exam_prep">Exam Preparation</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-on-surface mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-surface-container-lowest text-xs text-on-surface rounded-lg p-2.5 border border-white/10 focus:outline-none focus:border-secondary"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent / Critical</option>
              </select>
            </div>

            <GlassInput
              id="duration"
              label="Estimated Duration (Minutes)"
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              required
            />
          </div>

          <GlassInput
            id="dueDateTime"
            label="Due Date & Time (Optional)"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-white/5">
            <GlassButton type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" loading={loading}>
              Save Task
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
