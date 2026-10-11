import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import {
  LayoutDashboard,
  Sparkles,
  CheckSquare,
  Calendar,
  Brain,
  BookOpen,
  BarChart3,
  Settings,
  Flame,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/planner', label: 'AI Study Planner', icon: Sparkles },
  { path: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/assistant', label: 'AI Study Assistant', icon: Brain },
  { path: '/documents', label: 'My Documents', icon: BookOpen },
  { path: '/analytics', label: 'Progress & Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, signOut } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Elena Vance';
  const userEmail = user?.email || 'elena.vance@university.edu';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest/80 backdrop-blur-2xl z-50 flex flex-col justify-between border-r border-white/5 shadow-2xl transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 pb-2 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-base font-bold text-on-surface leading-tight">PrepAI</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-primary">Academic AI</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {onCloseMobile && (
                <button
                  onClick={onCloseMobile}
                  className="lg:hidden p-1 text-on-surface-variant hover:text-on-surface"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* User Workspace Pill */}
          <div className="px-4 py-3">
            <div className="p-3 rounded-lg bg-surface-container-low/70 border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Workspace
                </span>
                <span className="font-mono text-[10px] text-primary font-medium">Top 5%</span>
              </div>
              <p className="text-xs font-semibold text-on-surface truncate">{userName}'s Workspace</p>
              <p className="text-[11px] text-on-surface-variant truncate">Make every session count.</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-semibold shadow-glow-primary'
                        : 'text-on-surface-variant hover:bg-surface-container-high/80 hover:text-on-surface'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer Metrics & Profile */}
          <div className="p-3 space-y-2 border-t border-white/5">
            {/* Streak Counter */}
            <div className="p-3 rounded-lg bg-surface-container-high/50 border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs font-semibold text-on-surface">7 Days Active</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full bg-primary-container/20 text-primary font-mono text-[9px]">
                  Streak
                </span>
              </div>
              <div className="mt-2 w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full rounded-full w-4/5 shadow-glow-primary" />
              </div>
            </div>

            {/* Profile Bar */}
            <div className="p-2.5 rounded-lg bg-surface-container-low/90 border border-white/5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center font-bold text-xs text-secondary shrink-0">
                  {userName.charAt(0)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-on-surface truncate">{userName}</span>
                  <span className="text-[10px] text-on-surface-variant truncate">{userEmail}</span>
                </div>
              </div>
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-white/5 rounded-md transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
