import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import {
  Search,
  Plus,
  Bell,
  Zap,
  HelpCircle,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';

interface TopBarProps {
  onOpenMobileMenu?: () => void;
}

const routeTitles: Record<string, string> = {
  '/': 'Workspace',
  '/planner': 'AI Study Planner',
  '/tasks': 'My Tasks',
  '/calendar': 'Academic Calendar',
  '/assistant': 'AI Study Assistant',
  '/documents': 'Document Library',
  '/analytics': 'Progress & Analytics',
  '/settings': 'System Settings',
};

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const { user } = useAuth();
  const currentTitle = routeTitles[location.pathname] || 'Workspace';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Elena';

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 z-40 bg-surface/75 backdrop-blur-2xl border-b border-white/5 shadow-md">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-mono text-on-surface-variant">
            <span>PrepAI</span>
            <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/60" />
            <span className="text-primary font-semibold">{currentTitle}</span>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              placeholder="Search topics, syllabus, tasks, lecture notes..."
              className="w-full pl-9 pr-12 py-1.5 rounded-lg bg-surface-container-lowest/80 border border-white/5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] font-mono text-on-surface-variant border border-white/10">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <GlassButton
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload / Plan</span>
          </GlassButton>

          <div className="flex items-center gap-1">
            <button
              className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary shadow-glow-primary" />
            </button>

            <button
              className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              title="Focus Mode"
            >
              <Zap className="w-4 h-4" />
            </button>

            <button
              className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              title="Assistant Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* User Avatar */}
          <div className="pl-1">
            <div className="w-7 h-7 rounded-full bg-secondary-container text-secondary-fixed border border-secondary/40 flex items-center justify-center font-bold text-xs ring-2 ring-primary/20">
              {userName.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
