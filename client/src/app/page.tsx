'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

export default function HomePage() {
  const [status, setStatus] = useState<ConnectionStatus>('checking');

  useEffect(() => {
    api
      .get('/health')
      .then(() => setStatus('connected'))
      .catch(() => setStatus('disconnected'));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900">
          Welcome to <span className="text-blue-600">Logistack</span>
        </h1>

        <p className="mb-4 text-xl text-gray-600">
          Modern logistics management platform connecting truckers with businesses
        </p>

        {/* API Connection Status */}
        <div className="mb-8 flex items-center justify-center gap-2 text-sm">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              status === 'connected'
                ? 'bg-green-500'
                : status === 'disconnected'
                  ? 'bg-red-500'
                  : 'animate-pulse bg-yellow-500'
            }`}
          />
          <span className="text-gray-500">
            {status === 'connected'
              ? 'API Connected'
              : status === 'disconnected'
                ? 'API Disconnected'
                : 'Checking API...'}
          </span>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          <Link
            href="/dashboard/loads"
            className="group rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg"
          >
            <div className="mb-4 text-4xl">📦</div>
            <h3 className="mb-2 text-lg font-semibold group-hover:text-blue-600">
              Loads
            </h3>
            <p className="text-sm text-gray-600">
              Browse, create, and manage freight loads across the platform
            </p>
          </Link>

          <Link
            href="/dashboard/shipments"
            className="group rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg"
          >
            <div className="mb-4 text-4xl">🚚</div>
            <h3 className="mb-2 text-lg font-semibold group-hover:text-blue-600">
              Shipments
            </h3>
            <p className="text-sm text-gray-600">
              Track active shipments and manage delivery schedules
            </p>
          </Link>

          <Link
            href="/dashboard/tracking"
            className="group rounded-lg bg-white p-6 shadow-md transition hover:shadow-lg"
          >
            <div className="mb-4 text-4xl">📍</div>
            <h3 className="mb-2 text-lg font-semibold group-hover:text-blue-600">
              GPS Tracking
            </h3>
            <p className="text-sm text-gray-600">
              Real-time GPS tracking and live location updates for all shipments
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
