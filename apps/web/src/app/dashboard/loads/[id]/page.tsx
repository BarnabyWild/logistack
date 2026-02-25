'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLoad, useLoads } from '@/lib/hooks/use-loads';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@logistack/ui';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatWeight,
  formatDistanceUnit,
  formatRelativeTime,
} from '@/lib/utils/format';
import type { LoadStatus } from '@/types';

const STATUS_VARIANT: Record<LoadStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default',
  booked: 'secondary',
  in_transit: 'default',
  delivered: 'secondary',
  cancelled: 'destructive',
};

function formatStatus(status: LoadStatus): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEquipmentType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function LoadDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-36 animate-pulse rounded bg-gray-200" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function LoadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: load, isLoading, error, refetch } = useLoad(params.id);
  const { bookLoad, deleteLoad, isBooking, isDeleting } = useLoads();

  const isTrucker = user?.user_type === 'trucker';
  const isBusiness = user?.user_type === 'business';
  const isOwner = isBusiness && load?.business_id === user?.id;
  const canBook = isTrucker && load?.status === 'available';
  const canEdit = isOwner && load?.status === 'available';
  const canDelete = isOwner && (load?.status === 'available' || load?.status === 'cancelled');

  const handleBook = () => {
    if (!load) return;
    bookLoad(load.id, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const handleDelete = () => {
    if (!load) return;
    if (!window.confirm('Are you sure you want to delete this load? This action cannot be undone.')) {
      return;
    }
    deleteLoad(load.id, {
      onSuccess: () => {
        router.push('/dashboard/loads');
      },
    });
  };

  if (isLoading) {
    return <LoadDetailSkeleton />;
  }

  if (error || !load) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-12">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
                <p className="mt-4 text-lg font-medium text-red-900">
                  Failed to load details
                </p>
                <p className="mt-1 text-sm text-red-700">
                  {error instanceof Error ? error.message : 'The load could not be found or an error occurred.'}
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button variant="outline" onClick={() => refetch()}>
                    Try Again
                  </Button>
                  <Link href="/dashboard/loads">
                    <Button variant="ghost">Back to Loads</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/dashboard/loads"
              className="hover:text-gray-700"
            >
              &larr; Back to Loads
            </Link>
          </div>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Load #{load.id.slice(0, 8)}
              </h1>
              <Badge variant={STATUS_VARIANT[load.status]}>
                {formatStatus(load.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {canBook && (
                <Button onClick={handleBook} disabled={isBooking}>
                  {isBooking ? 'Booking...' : 'Book Load'}
                </Button>
              )}
              {canEdit && (
                <Link href={`/dashboard/loads/${load.id}/edit`}>
                  <Button variant="outline">Edit</Button>
                </Link>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Route Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Route</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Origin</p>
                  <p className="mt-1 text-gray-900">{load.origin}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Destination</p>
                  <p className="mt-1 text-gray-900">{load.destination}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Distance</p>
                  <p className="mt-1 text-gray-900">
                    {load.distance ? formatDistanceUnit(load.distance) : '\u2014'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pickup Date</p>
                  <p className="mt-1 text-gray-900">{formatDate(load.pickup_date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Delivery Date</p>
                  <p className="mt-1 text-gray-900">{formatDate(load.delivery_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cargo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cargo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Weight</p>
                  <p className="mt-1 text-gray-900">{formatWeight(load.weight)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Equipment Type</p>
                  <p className="mt-1 text-gray-900">
                    {load.equipment_type ? formatEquipmentType(load.equipment_type) : '\u2014'}
                  </p>
                </div>
                {load.description && (
                  <div className="sm:col-span-3">
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="mt-1 text-gray-900">{load.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Price</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {formatCurrency(load.price)}
                  </p>
                </div>
                {load.distance > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rate per Mile</p>
                    <p className="mt-1 text-gray-900">
                      {formatCurrency(load.price / load.distance)}/mi
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Metadata */}
          <div className="text-sm text-gray-500">
            <p>Created {formatRelativeTime(load.created_at)} ({formatDateTime(load.created_at)})</p>
            <p>Last updated {formatRelativeTime(load.updated_at)} ({formatDateTime(load.updated_at)})</p>
          </div>
        </div>
      </main>
    </div>
  );
}
