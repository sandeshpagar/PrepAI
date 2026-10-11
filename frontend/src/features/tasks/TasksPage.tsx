import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { apiClient } from '@/lib/api-client';
import { Task, Subject } from '@/types/planner';
import { TaskModal } from './TaskModal';
import { SubjectModal } from '@/features/subjects/SubjectModal';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  Clock,
  Trash2,
  Check,
  BookOpen,
} from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  const fetchTasksAndSubjects = async () => {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedSubjects] = await Promise.all([
        apiClient<Task[]>('/tasks'),
        apiClient<Subject[]>('/subjects'),
      ]);
      setTasks(fetchedTasks);
      setSubjects(fetchedSubjects);
    } catch (err) {
      console.error('Failed to load tasks and subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndSubjects();
  }, []);

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await apiClient<Task>(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
      // Revert on error
      fetchTasksAndSubjects();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await apiClient(`/tasks/${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete task:', err);
      fetchTasksAndSubjects();
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // Search query filter
    if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (activeTab === 'completed') return t.status === 'completed';
    if (t.status === 'completed') return activeTab === 'all';

    const dueDate = t.due_date ? new Date(t.due_date) : null;

    if (activeTab === 'today') {
      return dueDate ? isToday(dueDate) : false;
    }
    if (activeTab === 'overdue') {
      return dueDate ? isPast(dueDate) && !isToday(dueDate) : false;
    }
    if (activeTab === 'upcoming') {
      return dueDate ? !isPast(dueDate) : true;
    }
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded bg-error/20 text-error text-[10px] font-mono font-bold">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded bg-amber/20 text-amber text-[10px] font-mono font-semibold">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary text-[10px] font-mono">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant text-[10px] font-mono">Low</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">My Tasks & Assessments</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Organize academic deadlines and assignments for automated timetable scheduling.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <GlassButton
            variant="glass"
            size="sm"
            onClick={() => setIsSubjectModalOpen(true)}
            className="text-xs"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1 text-primary" />
            <span>Add Subject</span>
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={() => setIsTaskModalOpen(true)}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>New Task</span>
          </GlassButton>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <GlassCard level={1} className="p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'today', 'upcoming', 'overdue', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-glow-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            placeholder="Search tasks by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-lowest text-xs text-on-surface placeholder:text-on-surface-variant/50 border border-white/5 focus:outline-none focus:border-secondary transition-all"
          />
        </div>
      </GlassCard>

      {/* Task List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-on-surface-variant">Loading academic tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <GlassCard level={1} className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center mb-3">
              <CheckSquare className="w-6 h-6 text-on-surface-variant" />
            </div>
            <h3 className="font-headline text-base font-bold text-on-surface">No tasks found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mt-1 mb-4">
              {activeTab === 'all'
                ? "You haven't created any tasks yet. Add assignments or revision blocks to start scheduling."
                : `No tasks match the '${activeTab}' filter.`}
            </p>
            <GlassButton variant="primary" size="sm" onClick={() => setIsTaskModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Task</span>
            </GlassButton>
          </GlassCard>
        ) : (
          filteredTasks.map((task) => {
            const subject = subjects.find((s) => s.id === task.subject_id);
            const isDone = task.status === 'completed';

            return (
              <GlassCard
                key={task.id}
                level={isDone ? 1 : 2}
                className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-opacity ${
                  isDone ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggleTaskStatus(task)}
                    className={`w-5 h-5 rounded border mt-0.5 sm:mt-0 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isDone
                        ? 'bg-primary-container border-primary-container text-on-primary-container'
                        : 'border-white/20 hover:border-primary text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-medium ${
                          isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'
                        }`}
                      >
                        {task.title}
                      </span>
                      {subject && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-medium"
                          style={{
                            backgroundColor: `${subject.color}20`,
                            color: subject.color,
                          }}
                        >
                          {subject.code || subject.title}
                        </span>
                      )}
                      {getPriorityBadge(task.priority)}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant font-mono">
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due {format(new Date(task.due_date), 'MMM dd, h:mm a')}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{task.estimated_duration_minutes}m</span>
                      </span>
                      <span className="capitalize">{task.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 text-on-surface-variant/60 hover:text-error hover:bg-white/5 rounded-md transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        subjects={subjects}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskSaved={(newTask) => setTasks((prev) => [newTask, ...prev])}
      />

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSubjectSaved={(newSubj) => setSubjects((prev) => [...prev, newSubj])}
      />
    </div>
  );
};
