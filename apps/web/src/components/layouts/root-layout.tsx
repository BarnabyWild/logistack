import * as React from 'react';

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Root layout component that wraps the entire application
 * Provides basic HTML structure and global providers
 */
export function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background font-sans antialiased">
      {children}
    </div>
  );
}
