import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const AppShell: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-surface relative flex">
      {/* Ambient background glows across the whole app */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-secondary-container/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-primary-container/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-tertiary-container/10 rounded-full blur-[128px]" />
      </div>

      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64 relative z-10">
        <TopBar onOpenMobileMenu={() => setMobileOpen(true)} />

        <main className="flex-1 w-full pt-20 lg:pt-24 px-4 sm:px-6 lg:px-8 pb-8 max-w-[1720px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
