'use client';

import * as React from 'react';
import { useAuthStore, useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard layout component with sidebar and header
 * Used for authenticated pages
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-card border-r transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <h2 className="text-lg font-semibold">Logistack</h2>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {/* Navigation items will be added here */}
            <p className="text-sm text-muted-foreground px-3">
              {user?.user_type === 'trucker' ? 'Trucker' : 'Business'} Dashboard
            </p>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center border-b px-6">
          <button
            onClick={toggleSidebar}
            className="mr-4 rounded-md p-2 hover:bg-accent"
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <div className="flex items-center space-x-4">
              {/* User menu will be added here */}
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
