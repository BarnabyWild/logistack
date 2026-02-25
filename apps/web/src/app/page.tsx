import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900">
          Welcome to{' '}
          <span className="text-blue-600">Logistack</span>
        </h1>

        <p className="mb-8 text-xl text-gray-600">
          Modern logistics management platform connecting truckers with businesses
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login"
            className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg border-2 border-blue-600 px-8 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            Get Started
          </Link>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 text-4xl">🚚</div>
            <h3 className="mb-2 text-lg font-semibold">For Truckers</h3>
            <p className="text-sm text-gray-600">
              Find available loads, manage shipments, and track your routes in real-time
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 text-4xl">🏢</div>
            <h3 className="mb-2 text-lg font-semibold">For Businesses</h3>
            <p className="text-sm text-gray-600">
              Post loads, connect with trusted carriers, and monitor deliveries
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 text-4xl">📍</div>
            <h3 className="mb-2 text-lg font-semibold">Real-Time Tracking</h3>
            <p className="text-sm text-gray-600">
              Live GPS tracking and instant notifications for all shipments
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
