import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Shield, User, Bell } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Account & Study Settings</h1>
        <p className="text-xs text-on-surface-variant mt-1">
          Manage your student profile, study preferences, and security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard level={1} className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-headline text-base font-bold text-on-surface">Profile & Academic Details</h2>
          </div>
          <div className="text-xs text-on-surface-variant space-y-2">
            <div>
              <span className="block text-[11px] text-on-surface-variant/70">Email Address</span>
              <span className="font-mono text-on-surface font-medium">{user?.email || 'elena.vance@university.edu'}</span>
            </div>
            <div>
              <span className="block text-[11px] text-on-surface-variant/70">Authenticated Identity</span>
              <span className="font-mono text-on-surface font-medium">{user?.id || 'demo-user-id'}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard level={1} className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary" />
            <h2 className="font-headline text-base font-bold text-on-surface">Security & Privacy</h2>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            All user data, study schedules, and uploaded files are isolated via Supabase Row Level Security (RLS) and encrypted at rest.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 self-start">
            <Bell className="w-3.5 h-3.5" />
            <span>RLS Active on Profiles</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
