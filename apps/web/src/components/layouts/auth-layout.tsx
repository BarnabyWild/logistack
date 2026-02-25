import * as React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Authentication layout component
 * Used for login, register, and other auth pages
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Logistack</h1>
          <p className="text-sm text-muted-foreground">
            Connecting truckers with businesses
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
