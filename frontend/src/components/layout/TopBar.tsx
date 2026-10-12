import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import {
  Search,
  Plus,
  Zap,
  HelpCircle,
  Menu,
  ChevronRight,
  Upload,
  Sparkles,
  CheckSquare,
} from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { UploadModal } from '@/features/documents/UploadModal';
import { NotificationDropdown } from './NotificationDropdown';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentTitle = routeTitles[location.pathname] || 'Workspace';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Elena';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 z-40 bg-surface/75 backdrop-blur-2xl border-b border-white/5 shadow-md">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={onOpenMobileMenu}
              aria-label="Open navigation menu"
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
                ref={searchInputRef}
                type="text"
                aria-label="Search study workspace"
                placeholder="Search topics, syllabus, tasks, lecture notes..."
                className="w-full pl-9 pr-12 py-1.5 rounded-lg bg-surface-container-lowest/80 border border-white/5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] font-mono text-on-surface-variant border border-white/10">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0 relative">
            {/* Upload / Plan Dropdown Trigger */}
            <div className="relative">
              <GlassButton
                variant="primary"
                size="sm"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
                className="hidden sm:inline-flex text-xs font-semibold"
                onClick={() => setIsMenuOpen((prev) => !prev)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload / Plan</span>
              </GlassButton>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-surface-container-high/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-1.5 z-50 flex flex-col gap-1 animate-fade-in">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsUploadOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold leading-tight">Upload Document</div>
                        <div className="text-[10px] text-on-surface-variant truncate mt-0.5">PDF, DOCX, PPTX notes</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/planner');
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-secondary-container/20 text-secondary flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold leading-tight">Generate Study Plan</div>
                        <div className="text-[10px] text-on-surface-variant truncate mt-0.5">Automated timetable</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/tasks');
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-tertiary-container/20 text-tertiary flex items-center justify-center shrink-0">
                        <CheckSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold leading-tight">Create Task</div>
                        <div className="text-[10px] text-on-surface-variant truncate mt-0.5">Assignments & revisions</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              <NotificationDropdown />

              <button
                onClick={() => setIsFocusMode((prev) => !prev)}
                aria-label="Toggle focus mode"
                aria-pressed={isFocusMode}
                className={`p-2 rounded-lg transition-colors ${
                  isFocusMode
                    ? 'text-primary bg-primary/20 ring-1 ring-primary/40'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
                title={isFocusMode ? 'Focus Mode Active (Click to exit)' : 'Toggle Focus Mode'}
              >
                <Zap className="w-4 h-4" />
              </button>

              <button
                className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                title="AI Study Assistant"
                aria-label="Open AI Study Assistant"
                onClick={() => navigate('/assistant')}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* User Avatar */}
            <div className="pl-1">
              <div className="w-7 h-7 rounded-full bg-secondary-container text-secondary-fixed border border-secondary/40 flex items-center justify-center font-bold text-xs ring-2 ring-primary/20">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Upload Modal triggered from TopBar */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          if (location.pathname === '/documents') {
            window.location.reload();
          } else {
            navigate('/documents');
          }
        }}
      />
    </>
  );
};
