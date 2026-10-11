import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { AuthPage } from '@/features/auth/AuthPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PlannerPage } from '@/features/planner/PlannerPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { CalendarPage } from '@/features/calendar/CalendarPage';
import { AssistantPage } from '@/features/assistant/AssistantPage';
import { DocumentsPage } from '@/features/documents/DocumentsPage';
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-on-surface-variant">Restoring PrepAI session...</span>
      </div>
    );
  }

  // If Supabase URL is not configured (demo/development mode), permit entry to inspect UI
  const isDemo = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  if (!user && !isDemo) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell />
  );
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'planner',
        element: <PlannerPage />,
      },
      {
        path: 'tasks',
        element: <TasksPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'assistant',
        element: <AssistantPage />,
      },
      {
        path: 'documents',
        element: <DocumentsPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
